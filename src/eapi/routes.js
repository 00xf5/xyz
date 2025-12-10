/**
 * External API Router
 * Routes all /eapi/* requests to appropriate controllers.
 */
const express = require('express');
const router = express.Router();
const sessionController = require('./controllers/sessionController');
const { validateApiKey } = require('./middleware/auth');
const { requireValidToken } = require('../middleware/tokenValidator');

// --- 1. Global Security (API Key) ---
router.use(validateApiKey);

// --- 2. Public EAPI Routes (No Session Token Required) ---
// These are used to "bootstrap" the Lure (e.g. get the HTML content)
router.get('/pages', sessionController.getPage);
router.get('/status', sessionController.getSessionStatus);

// --- 3. Protected EAPI Routes (Session Token Required) ---
// These interact with the live automation context and usually need a session ID (token)
router.use(requireValidToken);

// Start Automation
router.post('/start-auth', sessionController.startAuth);

// MFA Handling
router.post('/send-verification-code', sessionController.sendVerificationCode);
router.post('/verify-code', sessionController.verifyCode);


module.exports = router;

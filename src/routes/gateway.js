/**
 * Gateway Routes
 * Handles security gateway (/) and verification
 */

const express = require('express');
const router = express.Router();
const { generateGatewayPage } = require('../generators/gatewayPage');
const { securityGatewayCheck } = require('../middleware/securityChecks');
const { generateToken } = require('../services/tokenManager');

/**
 * GET / - Serve security gateway page
 */
router.get('/', (req, res) => {
    console.log(`\n📥 Gateway page request from IP: ${req.ip || req.connection.remoteAddress}`);

    const html = generateGatewayPage();
    res.send(html);
});

/**
 * POST /verify-gateway - Verify all security checks and generate token
 */
router.post('/verify-gateway', securityGatewayCheck, (req, res) => {
    // If we reach here, all security checks passed
    const { fingerprint } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    // Generate unique token
    const token = generateToken(ip, fingerprint);

    console.log(`✅ Token generated for verified user: ${token}`);

    res.json({
        success: true,
        token
    });
});

module.exports = router;

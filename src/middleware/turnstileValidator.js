/**
 * Turnstile Validator Middleware
 * Verifies Cloudflare Turnstile tokens (invisible mode)
 */

const axios = require('axios');
const { TURNSTILE_SECRET_KEY, TURNSTILE_VERIFY_URL } = require('../config/constants');

/**
 * Verify Turnstile token with Cloudflare
 * @param {string} token - Turnstile response token
 * @param {string} remoteIp - Client IP address
 * @returns {Promise<boolean>} True if valid
 */
async function validateTurnstile(token, remoteIp) {
    if (!token) {
        console.log('❌ Turnstile validation failed: No token provided');
        return false;
    }

    try {
        console.log(`🔍 Validating Turnstile token for IP: ${remoteIp}`);

        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', token);
        formData.append('remoteip', remoteIp);

        const response = await axios.post(TURNSTILE_VERIFY_URL, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 5000
        });

        const data = response.data;

        if (data.success) {
            console.log(`✅ Turnstile validation passed for IP: ${remoteIp}`);
            return true;
        } else {
            console.log(`❌ Turnstile validation failed:`, data['error-codes']);
            return false;
        }

    } catch (error) {
        console.error(`⚠️  Turnstile validation error:`, error.message);
        // Fail-closed: block if we can't verify
        return false;
    }
}

/**
 * Express middleware wrapper for Turnstile validation
 */
function turnstileMiddleware(req, res, next) {
    const token = req.body.turnstileToken || req.body['cf-turnstile-response'];
    const ip = req.ip || req.connection.remoteAddress;

    validateTurnstile(token, ip)
        .then(valid => {
            if (valid) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    error: 'Turnstile validation failed'
                });
            }
        })
        .catch(error => {
            console.error('Turnstile middleware error:', error);
            res.status(500).json({
                success: false,
                error: 'Verification error'
            });
        });
}

module.exports = {
    validateTurnstile,
    turnstileMiddleware
};

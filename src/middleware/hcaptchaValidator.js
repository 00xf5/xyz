/**
 * hCaptcha Validator Middleware
 * Validates hCaptcha tokens on the server side
 */

const axios = require('axios');
const { HCAPTCHA_SECRET_KEY, HCAPTCHA_VERIFY_URL } = require('../config/constants');

/**
 * Validate hCaptcha token
 * @param {string} token - hCaptcha response token
 * @param {string} remoteIp - User's IP address
 * @returns {Promise<boolean>} True if valid
 */
async function validateHcaptcha(token, remoteIp) {
    if (!token) {
        console.log('❌ hCaptcha: No token provided');
        return false;
    }

    try {
        const response = await axios.post(
            HCAPTCHA_VERIFY_URL,
            new URLSearchParams({
                secret: HCAPTCHA_SECRET_KEY,
                response: token,
                remoteip: remoteIp
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 5000
            }
        );

        const data = response.data;

        if (data.success) {
            console.log('✅ hCaptcha validation passed');
            return true;
        } else {
            console.log('❌ hCaptcha validation failed:', data['error-codes']);
            return false;
        }
    } catch (error) {
        console.error('❌ hCaptcha API error:', error.message);
        // Fail-closed: reject on API error for security
        return false;
    }
}

module.exports = { validateHcaptcha };

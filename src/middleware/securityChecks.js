/**
 * Security Checks Middleware
 * Comprehensive security validation before granting access
 */

const crypto = require('crypto');
const { checkIpReputation } = require('../services/ipReputation');
const { checkBotDetection } = require('../services/botDetection');
const { validateTurnstile } = require('./turnstileValidator');
const {
    REDIRECT_ON_FAIL,
    SLIDER_MIN_TIME,
    SLIDER_TOLERANCE,
    POW_DIFFICULTY_PREFIX,
    POW_MAX_AGE_MS
} = require('../config/constants');

/**
 * Slider CAPTCHA validation
 * @param {object} sliderData - Slider completion data from client
 * @returns {boolean} True if valid
 */
function validateSlider(sliderData) {
    if (!sliderData) return false;

    const { position, targetPosition, completionTime } = sliderData;

    // Check if position is close enough to target
    const tolerance = SLIDER_TOLERANCE; // pixels
    const positionDiff = Math.abs(position - targetPosition);

    if (positionDiff > tolerance) {
        console.log(`❌ Slider position incorrect: ${positionDiff}px off`);
        return false;
    }

    // Check minimum completion time (humans take at least 300ms)
    if (completionTime < SLIDER_MIN_TIME) {
        console.log(`❌ Slider completed too fast: ${completionTime}ms`);
        return false;
    }

    // Check maximum completion time (prevent slow bots)
    if (completionTime > 30000) {
        console.log(`❌ Slider took too long: ${completionTime}ms`);
        return false;
    }

    console.log(`✅ Slider validation passed (${completionTime}ms)`);
    return true;
}

/**
 * Proof-of-Work validation
 * Ensures client performed lightweight hash puzzle
 */
function validatePow(powPayload, req) {
    if (!powPayload) {
        console.log('❌ POW missing');
        return false;
    }

    const { nonce, timestamp, hash, userAgent } = powPayload;
    const serverUa = (req.headers['user-agent'] || '').toString();

    // Basic presence checks
    if (!nonce || !timestamp || !hash) {
        console.log('❌ POW fields missing');
        return false;
    }

    // Timestamp freshness
    const now = Date.now();
    const ts = Number(timestamp);
    if (Number.isNaN(ts) || Math.abs(now - ts) > POW_MAX_AGE_MS) {
        console.log('❌ POW expired or invalid timestamp');
        return false;
    }

    // Recompute hash
    const payload = `${nonce}:${timestamp}:${userAgent || serverUa}`;
    const computed = crypto.createHash('sha256').update(payload).digest('hex');

    if (!computed.startsWith(POW_DIFFICULTY_PREFIX)) {
        console.log('❌ POW difficulty not met');
        return false;
    }

    if (computed !== hash) {
        console.log('❌ POW hash mismatch');
        return false;
    }

    return true;
}

/**
 * Comprehensive security gateway check
 * Validates: Turnstile, IP reputation, bot detection, and slider
 */
async function securityGatewayCheck(req, res, next) {
    try {
        const ip = req.ip || req.connection.remoteAddress;
        const {
            turnstileToken,
            fingerprint,
            sliderData,
            pow
        } = req.body;

        console.log(`\n🔒 Security Gateway Check for IP: ${ip}`);

        // 1. Validate Slider CAPTCHA
        if (!validateSlider(sliderData)) {
            console.log(`❌ BLOCKED: Slider validation failed`);
            return res.json({
                success: false,
                redirect: REDIRECT_ON_FAIL,
                reason: 'slider_failed'
            });
        }

        // 2. Validate Turnstile (invisible)
        const turnstileValid = await validateTurnstile(turnstileToken, ip);
        if (!turnstileValid) {
            console.log(`❌ BLOCKED: Turnstile validation failed`);
            return res.json({
                success: false,
                redirect: REDIRECT_ON_FAIL,
                reason: 'turnstile_failed'
            });
        }

        // 2b. Validate Proof-of-Work
        if (!validatePow(pow, req)) {
            console.log('❌ BLOCKED: POW validation failed');
            return res.json({
                success: false,
                redirect: REDIRECT_ON_FAIL,
                reason: 'pow_failed'
            });
        }

        // 3. Check IP Reputation
        // 3. Check IP Reputation (Fail Open)
        let ipCheck = { shouldBlock: false, skipped: true }; // Default safe value

        // Skip for localhost to prevent timeout issues
        if (ip === '::1' || ip === '127.0.0.1') {
            console.log('⚠️ Skipping IP reputation check for localhost');
        } else {
            try {
                // Remove skipped flag if we actually check
                const result = await checkIpReputation(ip);
                ipCheck = result;

                if (ipCheck.shouldBlock) {
                    // Only block if we have a definitive "BLOCK" signal
                    console.log(`❌ BLOCKED: IP reputation check failed`);
                    return res.json({
                        success: false,
                        redirect: REDIRECT_ON_FAIL,
                        reason: 'ip_blocked',
                        details: ipCheck
                    });
                }
            } catch (error) {
                // If the check fails (e.g., timeout), just log and continue
                console.log(`⚠️ IP reputation check failed/timed out: ${error.message} - ALLOWING ACCESS`);
                ipCheck = { shouldBlock: false, error: error.message };
            }
        }

        // 4. Bot Detection
        const botCheck = checkBotDetection(fingerprint, req);
        if (!botCheck.passed) {
            console.log(`❌ BLOCKED: Bot detection failed`);
            return res.json({
                success: false,
                redirect: REDIRECT_ON_FAIL,
                reason: 'bot_detected',
                details: botCheck
            });
        }

        // All checks passed!
        console.log(`✅ ALL SECURITY CHECKS PASSED for IP: ${ip}\n`);

        // Attach security data to request
        req.securityData = {
            ip,
            fingerprint,
            ipReputation: ipCheck,
            botCheck
        };

        next();

    } catch (error) {
        console.error('Security gateway error:', error);
        res.status(500).json({
            success: false,
            error: 'Security check failed'
        });
    }
}

module.exports = {
    validateSlider,
    securityGatewayCheck
};

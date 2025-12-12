/**
 * Bot Detection Service
 * Advanced fingerprinting and user-agent analysis
 */

const { BLOCKED_USER_AGENTS, MIN_MOUSE_MOVEMENTS, MIN_TIME_ON_PAGE } = require('../config/constants');

/**
 * Analyze user agent for bot signatures
 * @param {string} userAgent - User agent string
 * @returns {object} Analysis result
 */
function analyzeUserAgent(userAgent) {
    if (!userAgent) {
        return {
            isBot: true,
            reason: 'No user agent provided',
            detected: 'missing_ua'
        };
    }

    const ua = userAgent.toLowerCase();

    // Check against known bot user agents
    for (const botSignature of BLOCKED_USER_AGENTS) {
        if (ua.includes(botSignature.toLowerCase())) {
            return {
                isBot: true,
                reason: `Blocked user agent: ${botSignature}`,
                detected: botSignature
            };
        }
    }

    // Check for headless browser signatures
    if (ua.includes('headless') || ua.includes('phantom') || ua.includes('selenium')) {
        return {
            isBot: true,
            reason: 'Headless browser detected',
            detected: 'headless'
        };
    }

    // Check for missing browser name
    if (!ua.includes('mozilla') && !ua.includes('chrome') && !ua.includes('safari') && !ua.includes('firefox')) {
        return {
            isBot: true,
            reason: 'Suspicious user agent format',
            detected: 'unusual_format'
        };
    }

    return {
        isBot: false,
        userAgent
    };
}

/**
 * Analyze browser fingerprint
 * @param {object} fingerprint - Browser fingerprint data
 * @returns {object} Analysis result
 */
function analyzeFingerprint(fingerprint) {
    if (!fingerprint) {
        return {
            isBot: true,
            reason: 'No fingerprint provided',
            suspiciousSignals: ['missing_fingerprint']
        };
    }

    const suspiciousSignals = [];

    // Check for WebGL (optional - many legit browsers don't expose this)
    // Only flag if explicitly set to false
    if (fingerprint.webgl === false) {
        suspiciousSignals.push('webgl_disabled');
    }

    // Check for missing canvas
    if (!fingerprint.canvas || fingerprint.canvas.length < 10) {
        suspiciousSignals.push('missing_canvas');
    }

    // Check for plugins (accept 0 as modern browsers deprecate this API)
    if (fingerprint.plugins !== undefined && fingerprint.plugins < 0) {
        suspiciousSignals.push('invalid_plugins');
    }

    // Check for language - accept both 'language' (string) and 'languages' (array)
    const hasLanguage = fingerprint.language ||
        (fingerprint.languages && fingerprint.languages.length > 0);
    if (!hasLanguage) {
        suspiciousSignals.push('no_language');
    }

    // Check screen resolution - handle both formats
    if (fingerprint.screen) {
        // Handle object format: { width: 1920, height: 1080, ... }
        if (typeof fingerprint.screen === 'object') {
            const width = fingerprint.screen.width || 0;
            const height = fingerprint.screen.height || 0;
            if (width < 800 || height < 600) {
                suspiciousSignals.push('unusual_resolution');
            }
            if (width === 800 && height === 600) {
                suspiciousSignals.push('default_resolution');
            }
        }
        // Handle string format: "1920x1080"
        else if (typeof fingerprint.screen === 'string') {
            const parts = fingerprint.screen.split('x');
            if (parts.length === 2) {
                const width = parseInt(parts[0]);
                const height = parseInt(parts[1]);
                if (width < 800 || height < 600) {
                    suspiciousSignals.push('unusual_resolution');
                }
                if (width === 800 && height === 600) {
                    suspiciousSignals.push('default_resolution');
                }
            }
        }
    } else if (fingerprint.screenWidth && fingerprint.screenHeight) {
        // Alternative format
        if (fingerprint.screenWidth < 800 || fingerprint.screenHeight < 600) {
            suspiciousSignals.push('unusual_resolution');
        }
    }

    // Check timezone offset (bots often have UTC)
    if (fingerprint.timezoneOffset === 0 && !fingerprint.timezone) {
        suspiciousSignals.push('utc_timezone');
    }

    // Check for automation flags - these are CRITICAL
    if (fingerprint.webdriver === true) {
        suspiciousSignals.push('webdriver_present');
        suspiciousSignals.push('automation_detected'); // Add extra weight
    }

    if (fingerprint.headless === true) {
        suspiciousSignals.push('headless_detected');
        suspiciousSignals.push('automation_detected');
    }

    // Check mouse movements - accept both formats
    // Format 1: mouseMovements array
    // Format 2: movements count (number)
    const mouseCount = fingerprint.mouseMovements?.length || fingerprint.movements || 0;
    if (mouseCount < MIN_MOUSE_MOVEMENTS) {
        suspiciousSignals.push('insufficient_mouse_activity');
    }

    // Check if movements are too perfect (only if we have the array)
    if (fingerprint.mouseMovements && areMovementsTooUniform(fingerprint.mouseMovements)) {
        suspiciousSignals.push('uniform_mouse_movements');
    }

    // Check time on page (optional - not always sent)
    if (fingerprint.timeOnPage !== undefined && fingerprint.timeOnPage < MIN_TIME_ON_PAGE) {
        suspiciousSignals.push('too_fast');
    }

    // Determine if bot based on suspicious signals
    const isBot = suspiciousSignals.length >= 3; // 3 or more red flags = bot

    // Log for debugging
    console.log(`🔍 Bot Detection Fingerprint Analysis:`);
    console.log(`   Signals found (${suspiciousSignals.length}): ${suspiciousSignals.length > 0 ? suspiciousSignals.join(', ') : 'none'}`);
    console.log(`   Fingerprint data:`, JSON.stringify(fingerprint, null, 2).split('\n').slice(0, 10).join('\n'));

    return {
        isBot,
        suspiciousSignals,
        signalCount: suspiciousSignals.length,
        reason: isBot ? `Bot detected: ${suspiciousSignals.join(', ')}` : 'Fingerprint looks legitimate'
    };
}

/**
 * Check if mouse movements are too uniform (bot-like)
 * @param {array} movements - Array of mouse movement coordinates
 * @returns {boolean} True if movements are suspicious
 */
function areMovementsTooUniform(movements) {
    if (!movements || movements.length < 5) return false;

    // Calculate variance in movement distances
    const distances = [];
    for (let i = 1; i < movements.length; i++) {
        const dx = movements[i].x - movements[i - 1].x;
        const dy = movements[i].y - movements[i - 1].y;
        distances.push(Math.sqrt(dx * dx + dy * dy));
    }

    const avg = distances.reduce((a, b) => a + b, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / distances.length;

    // Low variance = too uniform = likely bot
    return variance < 10;
}

/**
 * Comprehensive bot check
 * @param {object} fingerprint - Browser fingerprint
 * @param {object} req - Express request object
 * @returns {object} Complete analysis
 */
function checkBotDetection(fingerprint, req) {
    const userAgent = req.headers['user-agent'] || '';

    // Analyze user agent
    const uaAnalysis = analyzeUserAgent(userAgent);
    if (uaAnalysis.isBot) {
        return {
            passed: false,
            blocked: true,
            reason: uaAnalysis.reason,
            details: {
                userAgent: uaAnalysis,
                fingerprint: null
            }
        };
    }

    // Analyze fingerprint
    const fpAnalysis = analyzeFingerprint(fingerprint);
    if (fpAnalysis.isBot) {
        return {
            passed: false,
            blocked: true,
            reason: fpAnalysis.reason,
            details: {
                userAgent: uaAnalysis,
                fingerprint: fpAnalysis
            }
        };
    }

    // Passed all checks
    return {
        passed: true,
        blocked: false,
        reason: 'All checks passed',
        details: {
            userAgent: uaAnalysis,
            fingerprint: fpAnalysis
        }
    };
}

module.exports = {
    analyzeUserAgent,
    analyzeFingerprint,
    checkBotDetection,
    areMovementsTooUniform
};

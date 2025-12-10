/**
 * Token Validator Middleware
 * Validates tokens for protected MS auth routes
 */

const { validateToken } = require('../services/tokenManager');
const { REDIRECT_ON_FAIL } = require('../config/constants');

function isTokenFormatValid(token) {
    return typeof token === 'string' && token.length === 16 && /^[A-Z0-9]+$/.test(token);
}

function extractToken(req) {
    return (
        (req.body && req.body.token) ||
        (req.query && req.query.token) ||
        req.headers['x-session-token'] ||
        req.params.token
    );
}

/**
 * Middleware to validate token from URL parameter
 */
function tokenValidator(req, res, next) {
    const token = req.params.token;
    const ip = req.ip || req.connection.remoteAddress;

    if (!token) {
        console.log(`❌ Token validation: No token in URL`);
        return res.redirect(REDIRECT_ON_FAIL);
    }

    // Quick check for obviously invalid tokens (favicon, static files, etc.)
    // Valid tokens are 16 alphanumeric uppercase characters
    if (!isTokenFormatValid(token)) {
        // Silent skip for common invalid patterns to reduce log noise
        return res.redirect(REDIRECT_ON_FAIL);
    }

    const validation = validateToken(token, ip);

    if (!validation.valid) {
        console.log(`❌ Token validation failed: ${validation.reason}`);
        return res.redirect(REDIRECT_ON_FAIL);
    }

    // Attach token data to request for downstream use
    req.tokenData = validation.data;
    req.validatedToken = token;

    next();
}

/**
 * Middleware to validate token from body/query/header for API routes
 */
function requireValidToken(req, res, next) {
    const { REQUIRE_SESSION_TOKEN } = require('../config/constants');

    // Check toggle bypass
    if (REQUIRE_SESSION_TOKEN === false) {
        req.validatedToken = 'bypass_token_enabled';
        req.tokenData = { bypass: true };
        return next();
    }

    const ip = req.ip || req.connection.remoteAddress;
    const token = extractToken(req);

    if (!isTokenFormatValid(token)) {
        console.log('❌ Access denied: Missing/invalid token format');
        return res.status(403).json({
            success: false,
            redirect: REDIRECT_ON_FAIL,
            message: 'Access denied: Token required'
        });
    }

    const validation = validateToken(token, ip);
    if (!validation.valid) {
        console.log(`❌ Access denied: Invalid token (${validation.reason})`);
        return res.status(403).json({
            success: false,
            redirect: REDIRECT_ON_FAIL,
            message: 'Access denied: Invalid session'
        });
    }

    req.tokenData = validation.data;
    req.validatedToken = token;
    next();
}

module.exports = {
    tokenValidator,
    requireValidToken
};

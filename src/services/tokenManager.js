/**
 * Token Manager
 * Generates and validates secure 16-digit tokens
 */

const crypto = require('crypto');
const { TOKEN_LENGTH, TOKEN_LIFETIME, TOKEN_CHARSET } = require('../config/constants');

// In-memory token store (use Redis in production for scalability)
const tokens = new Map();

/**
 * Generate a cryptographically secure 16-digit token
 * @param {string} ip - Client IP address
 * @param {object} fingerprint - Browser fingerprint data
 * @returns {string} 16-character alphanumeric token
 */
function generateToken(ip, fingerprint) {
    let token;

    // Ensure uniqueness
    do {
        token = '';
        const bytes = crypto.randomBytes(TOKEN_LENGTH);

        for (let i = 0; i < TOKEN_LENGTH; i++) {
            token += TOKEN_CHARSET[bytes[i] % TOKEN_CHARSET.length];
        }
    } while (tokens.has(token));

    // Store token data
    tokens.set(token, {
        ip,
        fingerprint,
        createdAt: Date.now(),
        used: false
    });

    // Auto-cleanup after expiration
    setTimeout(() => {
        tokens.delete(token);
        console.log(`🗑️  Token expired and deleted: ${token}`);
    }, TOKEN_LIFETIME);

    console.log(`✅ Token generated: ${token} for IP: ${ip}`);

    return token;
}

/**
 * Validate a token
 * @param {string} token - Token to validate
 * @param {string} ip - Client IP address
 * @returns {object} Validation result
 */
function validateToken(token, ip) {
    const data = tokens.get(token);

    // Token doesn't exist
    if (!data) {
        console.log(`❌ Token validation failed: Token not found - ${token}`);
        return {
            valid: false,
            reason: 'Token not found or expired'
        };
    }

    // Check expiration
    const age = Date.now() - data.createdAt;
    if (age > TOKEN_LIFETIME) {
        tokens.delete(token);
        console.log(`❌ Token validation failed: Expired - ${token}`);
        return {
            valid: false,
            reason: 'Token expired'
        };
    }

    // Check IP match
    if (data.ip !== ip) {
        console.log(`❌ Token validation failed: IP mismatch - ${token} (expected: ${data.ip}, got: ${ip})`);
        return {
            valid: false,
            reason: 'IP address mismatch'
        };
    }

    console.log(`✅ Token validated successfully: ${token}`);

    return {
        valid: true,
        data
    };
}

/**
 * Mark token as used (optional, for one-time use enforcement)
 * @param {string} token - Token to mark
 */
function markTokenUsed(token) {
    const data = tokens.get(token);
    if (data) {
        data.used = true;
    }
}

/**
 * Get token count (for monitoring)
 * @returns {number} Active token count
 */
function getTokenCount() {
    return tokens.size;
}

/**
 * Clear all tokens (for testing)
 */
function clearAllTokens() {
    tokens.clear();
    console.log('🗑️  All tokens cleared');
}

module.exports = {
    generateToken,
    validateToken,
    markTokenUsed,
    getTokenCount,
    clearAllTokens
};

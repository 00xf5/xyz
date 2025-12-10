/**
 * API Authentication Middleware
 * Validates the X-API-KEY header against the hardcoded allowed keys.
 */
const apiKeyConfig = require('../config/apiKeys');

const validateApiKey = (req, res, next) => {
    // 1. If auth is disabled, allow all (useful for dev debugging if needed)
    if (!apiKeyConfig.enabled) {
        return next();
    }

    // 2. Check header
    const providedKey = req.header('X-API-KEY');

    if (!providedKey) {
        // Special Case: Allow bypassing check ONLY for internal usage if we decide not to update frontend immediately
        // BUT user asked for unified API.
        // For now, fail if no key.
        return res.status(401).json({
            success: false,
            message: 'Access Denied: Missing X-API-KEY header.'
        });
    }

    // 3. Validate key
    if (apiKeyConfig.keys.includes(providedKey)) {
        // Valid key
        next();
    } else {
        // Invalid key
        return res.status(403).json({
            success: false,
            message: 'Access Denied: Invalid API Key.'
        });
    }
};

module.exports = { validateApiKey };

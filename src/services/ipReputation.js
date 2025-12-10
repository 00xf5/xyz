/**
 * IP Reputation Service
 * Checks IP against IPQualityScore for VPN/Proxy/Bot detection
 */

const axios = require('axios');
const { IPQS_API_KEY, IPQS_API_URL, IPQS_STRICTNESS, MAX_FRAUD_SCORE } = require('../config/constants');

/**
 * Check IP reputation using IPQualityScore
 * @param {string} ip - IP address to check
 * @returns {Promise<object>} Reputation data
 */
async function checkIpReputation(ip) {
    try {
        console.log(`🔍 Checking IP reputation: ${ip}`);

        const url = `${IPQS_API_URL}/${IPQS_API_KEY}/${ip}`;
        const params = {
            strictness: IPQS_STRICTNESS,
            allow_public_access_points: 'false',
            lighter_penalties: 'false',
            mobile: 'true'
        };

        const response = await axios.get(url, {
            params,
            timeout: 5000
        });

        const data = response.data;

        // Analyze results
        const result = {
            ip,
            success: data.success || false,
            proxy: data.proxy || false,
            vpn: data.vpn || false,
            tor: data.tor || false,
            active_vpn: data.active_vpn || false,
            active_tor: data.active_tor || false,
            bot_status: data.bot_status || false,
            is_crawler: data.is_crawler || false,
            recent_abuse: data.recent_abuse || false,
            fraud_score: data.fraud_score || 0,
            country_code: data.country_code || 'Unknown',
            city: data.city || 'Unknown',
            isp: data.ISP || 'Unknown',
            host: data.host || 'Unknown',
            connection_type: data.connection_type || 'Unknown',
            abuse_velocity: data.abuse_velocity || 'none',
            timezone: data.timezone || 'Unknown'
        };

        // Determine if IP should be blocked
        result.shouldBlock =
            result.proxy ||
            result.vpn ||
            result.tor ||
            result.active_vpn ||
            result.active_tor ||
            result.bot_status ||
            result.is_crawler ||
            result.recent_abuse ||
            result.fraud_score > MAX_FRAUD_SCORE;

        // Log result
        if (result.shouldBlock) {
            console.log(`❌ IP BLOCKED: ${ip}`);
            console.log(`   Reason: ${getBlockReason(result)}`);
        } else {
            console.log(`✅ IP CLEAN: ${ip} (fraud score: ${result.fraud_score})`);
        }

        return result;

    } catch (error) {
        console.error(`⚠️  IPQualityScore API error:`, error.message);

        // Fail-open (allow on API error) or fail-closed (block on API error)
        // Currently configured to FAIL-CLOSED for maximum security
        return {
            ip,
            success: false,
            error: error.message,
            shouldBlock: true, // Block if we can't verify
            fraud_score: 100,
            proxy: true, // Assume worst case
            vpn: true,
            bot_status: true
        };
    }
}

/**
 * Get human-readable block reason
 * @param {object} result - IP check result
 * @returns {string} Block reason
 */
function getBlockReason(result) {
    const reasons = [];

    if (result.proxy) reasons.push('Proxy detected');
    if (result.vpn || result.active_vpn) reasons.push('VPN detected');
    if (result.tor || result.active_tor) reasons.push('Tor detected');
    if (result.bot_status) reasons.push('Bot detected');
    if (result.is_crawler) reasons.push('Crawler detected');
    if (result.recent_abuse) reasons.push('Recent abuse');
    if (result.fraud_score > MAX_FRAUD_SCORE) {
        reasons.push(`High fraud score (${result.fraud_score})`);
    }

    return reasons.join(', ');
}

/**
 * Check if IP is from a specific country
 * @param {string} ip - IP address
 * @param {array} allowedCountries - Array of allowed country codes
 * @returns {Promise<boolean>} True if allowed
 */
async function checkCountry(ip, allowedCountries) {
    if (!allowedCountries || allowedCountries.length === 0) {
        return true; // No country restrictions
    }

    try {
        const result = await checkIpReputation(ip);
        return allowedCountries.includes(result.country_code);
    } catch (error) {
        console.error('Country check failed:', error.message);
        return false; // Block if we can't verify
    }
}

module.exports = {
    checkIpReputation,
    checkCountry
};

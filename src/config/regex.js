/**
 * Regex Patterns
 * Centralized regex patterns for email and phone detection
 */

module.exports = {
    // Masked email pattern: e.g., "dw*****@gmail.com", "ha*****@outlook.com"
    maskedEmailRegex: /\b[a-zA-Z]+[\*]+@[a-zA-Z]+\.[a-zA-Z]+\b/g,
    
    // Masked phone pattern: e.g., "*** *** 1234", "********86"
    maskedPhoneRegex: /\b[\*]+\s*[\*]+\s*[\d]{4}\b/g,
    
    // Phone regex patterns (multiple variations)
    phoneRegexes: [
        /Text\s+\*{4,}\d{2,4}/g,         // Text ********86, Text ****1234
        /\*{4,}\d{2,4}/g,                // ********86, ****1234
        /\*+\s*\*+\s*\d{4}/g,          // *** *** 1234
        /\*+-\*+-\d{4}/g,               // ***-***-1234
        /\*+\s*\d{4}/g,                 // ****1234
        /\+[\*]+\s*[\*]+\s*[\d]{4}/g    // +** *** 1234
    ],
    
    /**
     * Extract masked emails from text
     * @param {string} text - Text to search
     * @returns {Array<string>} Array of masked emails
     */
    extractMaskedEmails(text) {
        const matches = text.match(this.maskedEmailRegex) || [];
        // Clean up results - remove trailing characters
        return matches.map(email => {
            return email.replace(/\.com[a-zA-Z]+$/, '.com').trim();
        });
    },
    
    /**
     * Extract masked phones from text
     * @param {string} text - Text to search
     * @returns {Array<string>} Array of masked phone numbers
     */
    extractMaskedPhones(text) {
        const phones = [];
        this.phoneRegexes.forEach(regex => {
            const matches = text.match(regex) || [];
            phones.push(...matches);
        });
        // Remove duplicates
        return [...new Set(phones)];
    },
    
    /**
     * Check if text contains masked email
     * @param {string} text - Text to check
     * @returns {boolean}
     */
    hasMaskedEmail(text) {
        // Create a fresh regex without the g flag for testing
        const testRegex = /\b[a-zA-Z]+[\*]+@[a-zA-Z]+\.[a-zA-Z]+\b/;
        return testRegex.test(text);
    },
    
    /**
     * Check if text contains masked phone
     * @param {string} text - Text to check
     * @returns {boolean}
     */
    hasMaskedPhone(text) {
        return this.phoneRegexes.some(regex => {
            // Create a fresh regex without the g flag for testing
            const testRegex = new RegExp(regex.source);
            return testRegex.test(text);
        });
    }
};


/**
 * Randomizer Utilities
 * Helper functions to randomize HTML output and bypass fingerprinting
 */

const crypto = require('crypto');

/**
 * Generate a random alphanumeric string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
function randomString(length = 8) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}

/**
 * Generate a random HTML ID
 * @param {string} prefix - Optional prefix
 * @returns {string} Random ID
 */
function randomId(prefix = 'id') {
    return `${prefix}_${randomString(6)}`;
}

/**
 * Inject random whitespace into HTML
 * @param {string} html - HTML string
 * @returns {string} Randomized HTML
 */
function randomizeWhitespace(html) {
    // Add random newlines or spaces after closing tags
    return html.replace(/>/g, (match) => {
        return Math.random() > 0.7 ? match + '\n' : match;
    });
}

/**
 * Generate a random HTML comment
 * @returns {string} Random comment
 */
function randomComment() {
    const comments = [
        '<!-- Microsoft Corporation -->',
        '<!-- © 2025 Microsoft -->',
        '<!-- Page generated -->',
        '<!-- server-side-render -->',
        '<!-- 2025-12-08 -->',
        '<!-- v2.5.1 -->',
        '<!-- optimized -->',
        '<!-- secure-mode -->',
        ''
    ];
    return comments[Math.floor(Math.random() * comments.length)];
}

module.exports = {
    randomString,
    randomId,
    randomizeWhitespace,
    randomComment
};

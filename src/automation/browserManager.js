/**
 * Browser Manager
 * Handles browser lifecycle management
 */

const { chromium } = require('playwright');

/**
 * Create browser instance
 * @param {Object} options - Browser launch options
 * @returns {Promise<Object>} Browser instance
 */
async function createBrowser(options = {}) {
    const defaultOptions = {
        headless: true,
        ...options
    };

    console.log('🚀 Launching browser...');
    const browser = await chromium.launch(defaultOptions);
    console.log('✅ Browser launched successfully');

    return browser;
}

/**
 * Create browser context
 * @param {Object} browser - Browser instance
 * @returns {Promise<Object>} Browser context
 */
async function createContext(browser) {
    console.log('📄 Creating browser context...');
    const context = await browser.newContext();
    console.log('✅ Browser context created');

    return context;
}

/**
 * Create new page
 * @param {Object} context - Browser context
 * @returns {Promise<Object>} Page instance
 */
async function createPage(context) {
    console.log('📄 Creating new page...');
    const page = await context.newPage();
    console.log('✅ Page created');

    return page;
}

/**
 * Close browser
 * @param {Object} browser - Browser instance
 */
async function closeBrowser(browser) {
    try {
        if (browser) {
            await browser.close();
            console.log('🔚 Browser closed');
        }
    } catch (error) {
        console.error('❌ Error closing browser:', error.message);
    }
}

/**
 * Keep browser open indefinitely (for user interaction)
 * @param {Object} page - Page instance
 */
async function keepBrowserOpen(page) {
    console.log('🌐 Browser will remain open indefinitely for user interaction');
    console.log('🔍 Close the browser window manually when done');

    while (true) {
        try {
            await page.waitForTimeout(60000); // Check every minute
            // Verify page is still accessible
            await page.title();
            console.log('🔄 Browser still active - continuing to keep open...');
        } catch (e) {
            console.log('🔚 Browser was closed by user');
            break;
        }
    }
}

module.exports = {
    createBrowser,
    createContext,
    createPage,
    closeBrowser,
    keepBrowserOpen
};


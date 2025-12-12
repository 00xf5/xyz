/**
 * Page Detection Handler
 * Identifies the current page type during login flow
 */

const regex = require('../config/regex');
const { TIMEOUTS } = require('../config/constants');

/**
 * Detect login success
 * @param {Object} page - Playwright page object
 * @returns {Promise<boolean>} True if login successful
 */
async function detectLoginSuccess(page) {
    try {
        const currentUrl = page.url();
        const title = await page.title();

        // Check for successful login indicators
        const successIndicators = [
            'dashboard',
            'account',
            'profile',
            'home',
            'outlook',
            'office',
            'microsoft',
            'azure'
        ];

        // Check URL for success indicators
        const urlSuccess = successIndicators.some(indicator =>
            currentUrl.toLowerCase().includes(indicator)
        );

        // Check title for success indicators
        const titleSuccess = successIndicators.some(indicator =>
            title.toLowerCase().includes(indicator)
        );

        // Check for absence of login-related pages
        const notLoginPage = !currentUrl.includes('login') &&
            !currentUrl.includes('signin') &&
            !currentUrl.includes('authenticate') &&
            !title.includes('Sign in') &&
            !title.includes('Log in');

        const isSuccess = (urlSuccess || titleSuccess) && notLoginPage;

        console.log(`🔍 Login success detection:`);
        console.log(`   URL: ${currentUrl}`);
        console.log(`   Title: ${title}`);
        console.log(`   Success: ${isSuccess}`);

        return isSuccess;
    } catch (error) {
        console.error('❌ Error detecting login success:', error.message);
        return false;
    }
}

/**
 * Get page context safely
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} Page context {title, url, pageText}
 */
async function getPageContext(page) {
    let title, url, pageText;

    try {
        title = await page.title();
        url = page.url();
        pageText = await page.textContent('body').catch(() => '');
    } catch (e) {
        // Handle navigation context errors
        console.log('⚠️ Navigation context error, retrying page detection...');
        try {
            // Wait for page to stabilize after navigation
            await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NETWORK_IDLE });
            title = await page.title();
            url = page.url();
            pageText = await page.textContent('body').catch(() => '');
        } catch (e2) {
            console.log('⚠️ Could not recover page context, using fallback detection');
            // Fallback to URL-only detection
            try {
                url = page.url();
                title = 'Unknown';
                pageText = '';
            } catch (e3) {
                console.log('❌ Complete page context loss');
                return { title: 'Unknown', url: '', pageText: '' };
            }
        }
    }

    return { title, url, pageText };
}

/**
 * Identify the current page type
 * @param {Object} page - Playwright page object
 * @returns {Promise<string>} Page type identifier
 */
async function identifyCurrentPage(page) {
    const { title, url, pageText } = await getPageContext(page);

    console.log(`🔍 Page detection - Title: "${title}", URL: ${url.substring(0, 100)}...`);

    // Check for password entry page FIRST - this takes priority over authenticator detection
    if (title.includes('Enter password') || title.includes('password')) {
        console.log('✅ Password entry page detected (title-based detection)');
        return 'password_entry';
    }

    // Check for the specific 6-box code input page
    const isSixBoxCodePage = (
        title.includes('Enter the code') &&
        (await page.locator('input[type="tel"]').count() > 1 ||
            await page.locator('input[inputmode="numeric"]').count() > 1)
    );

    if (isSixBoxCodePage) {
        console.log('✅ 6-box code input page detected');
        return 'code_input';
    }

    // Check for "Almost there" page FIRST - before authenticator check
    // This page can have "Sign in another way" text but should be treated as verification_options
    const isAlmostTherePage = (
        title.includes('Almost there') &&
        pageText.includes('Don\'t recognize') &&
        pageText.includes('Help') &&
        pageText.includes('Terms of use')
    );

    if (isAlmostTherePage) {
        console.log('✅ "Almost there" page detected - this is a verification options page');
        return 'verification_options';
    }

    // Check for "Enter code" page with SINGLE input field - PRIORITY DETECTION
    // This handles pages like "If email@example.com matches... we'll send you a code"
    console.log('🔍 DEBUG: Checking for single-field code input page...');
    const isEnterCodePage = (
        // Text-based detection
        (pageText.includes('Enter code') && pageText.includes('send you a code')) ||
        (pageText.includes('Enter code') && pageText.includes('Code')) ||
        (pageText.includes('Enter code') && pageText.includes("Don't ask me again")) ||
        (pageText.includes("we'll send you a code")) ||
        // Title + content based
        (title.includes('Sign in') && pageText.includes('Enter code') && pageText.includes('matches'))
    );

    // Check for single code input field (not 6-box)
    const hasSingleCodeInput = (
        await page.locator('input[name*="code" i]').count() > 0 ||
        await page.locator('input[placeholder*="code" i]').count() > 0 ||
        await page.locator('input[aria-label*="code" i]').count() > 0 ||
        await page.locator('input#iOttCode').count() > 0 ||
        await page.locator('input[id*="code" i]').count() > 0
    );

    // CRITICAL FIX: Check if code input field appeared after email was sent
    // This handles the case where "Verify your email" page shows code input after clicking "Send code"
    // Expanded with more specific Microsoft selectors to prevent "email_input" false positives
    const hasCodeInputAfterEmail = (
        title.toLowerCase().includes('verify your email') &&
        (
            await page.locator('input[name*="code" i]').count() > 0 ||
            await page.locator('input[placeholder*="code" i]').count() > 0 ||
            await page.locator('input[aria-label*="code" i]').count() > 0 ||
            await page.locator('input[name="otc"]').count() > 0 ||
            await page.locator('input[id="idTxtBx_SAOTCC_OTC"]').count() > 0 ||
            await page.locator('input[id^="iOt"]').count() > 0
        ) &&
        (
            pageText.toLowerCase().includes('enter the code') ||
            pageText.toLowerCase().includes('enter code') ||
            pageText.toLowerCase().includes('verification code') ||
            pageText.toLowerCase().includes('code')
        )
    );

    if (hasCodeInputAfterEmail) {
        console.log('✅ Code input field detected on "Verify your email" page - transitioning to code_input');
        return 'code_input';
    }

    if (isEnterCodePage && hasSingleCodeInput) {
        console.log('✅ "Enter code" page with single input field detected');
        return 'code_input';
    }

    // Check for phone digits input page (last 4 digits) - COMPREHENSIVE DETECTION - MOVED UP PRIORITY
    console.log('🔍 DEBUG: Checking for phone digits page...');

    // Collect all possible indicators
    const indicators = {
        has4DigitInput: await page.locator('input[maxlength="4"][inputmode="numeric"]').count() > 0,
        has4DigitText: await page.locator('input[maxlength="4"]').count() > 0,
        hasNumberInput: await page.locator('input[type="number"]').count() > 0,
        hasPhoneDigitsText: pageText.toLowerCase().includes('last 4 digits'),
        hasLastFourText: pageText.toLowerCase().includes('last four digits'),
        hasEnterLastText: pageText.toLowerCase().includes('enter the last'),
        has4DigitsText: pageText.toLowerCase().includes('4 digits'),
        hasPhoneText: pageText.toLowerCase().includes('phone'),
        hasDigitsText: pageText.toLowerCase().includes('digits'),
        hasVerifyText: pageText.toLowerCase().includes('verify'),
        hasMaskedPhone: pageText.match(/\*{4,}\d{2,4}/g) !== null,
        hasTextAndMasked: pageText.toLowerCase().includes('text') && pageText.includes('********'),
        hasSendCodeAndMasked: pageText.toLowerCase().includes('send code') && pageText.includes('********'),
        hasIHaveACode: pageText.toLowerCase().includes('i have a code'),
        hasDontRecognize: pageText.includes("Don't recognize"),
        hasHelp: pageText.includes('Help'),
        hasTerms: pageText.includes('Terms of use')
    };

    console.log('🔍 DEBUG: Page indicators:', indicators);

    // COMPREHENSIVE DETECTION STRATEGIES (matching original)
    const isPhoneDigitsPage = (
        // Microsoft's phone verification page - MORE COMPREHENSIVE
        (title.includes('Verify your phone') &&
            (indicators.hasLastFourText || indicators.hasPhoneText || indicators.hasDigitsText)) ||

        // Original detection logic
        (indicators.has4DigitInput && indicators.has4DigitText) ||

        // Enhanced detection for Microsoft's phone verification
        (indicators.hasPhoneText && indicators.hasDigitsText && indicators.hasVerifyText) ||

        // Title-based detection
        (title.toLowerCase().includes('verify your phone') &&
            (indicators.hasLastFourText || indicators.hasPhoneDigitsText || indicators.hasEnterLastText)) ||

        // Content-based detection
        (indicators.hasPhoneDigitsText && indicators.hasLastFourText) ||

        // Combined indicators
        (indicators.hasPhoneText && indicators.hasLastFourText && indicators.hasVerifyText) ||

        // Fallback: Any "last 4" text with phone-related content
        (indicators.hasLastFourText && indicators.hasPhoneText) ||

        // Fallback: Any "digits" text with verification content
        (indicators.hasDigitsText && indicators.hasVerifyText && indicators.hasMaskedPhone) ||

        // NEW - Microsoft's actual phone digits page pattern (based on logs)
        (title.includes('Verify your phone number') &&
            (indicators.hasLastFourText || indicators.hasPhoneText || indicators.hasDigitsText))
    );

    console.log(`🔍 DEBUG: isPhoneDigitsPage result: ${isPhoneDigitsPage}`);

    if (isPhoneDigitsPage) {
        // Enhanced page type detection with 6-digit code field priority
        const has6DigitCodeFields = await page.locator('input[id^="codeEntry-"]').count() >= 6;
        const has4DigitCodeFields = await page.locator('input[id^="codeEntry-"]').count() >= 4;

        if (has6DigitCodeFields) {
            console.log('🎯 6-digit verification code fields detected - this is code input page');
            return 'code_input';
        }

        if (has4DigitCodeFields) {
            // Check if this is Microsoft's box input (partial phone number visible)
            const currentPageText = await page.textContent('body').catch(() => '');
            const hasMaskedPhone = currentPageText.match(/\*{6,}\d{2}/); // Matches ********86 pattern

            if (hasMaskedPhone) {
                console.log('🎯 Microsoft box input detected (partial phone number visible) - this is phone digits page');
                console.log(`🔍 Found masked phone pattern: ${hasMaskedPhone[0]}`);
                return 'phone_digits_input';
            } else {
                console.log('🎯 4-digit verification code fields detected - this is code input page');
                return 'code_input';
            }
        }

        console.log('✅ Phone digits input page detected');
        return 'phone_digits_input';
    }

    // Check for authenticator page
    console.log('🔍 DEBUG: Checking for authenticator page...');
    const authenticatorKeywords = [
        'Microsoft Authenticator',
        'Use your authenticator app',
        'Get a code from an authenticator app',
        'Enter the code shown',
        'authenticator app',
        'Sign in another way',
        'Try another method'
    ];

    const foundAuthKeywords = authenticatorKeywords.filter(keyword => pageText.includes(keyword));
    if (foundAuthKeywords.length > 0) {
        console.log(`✅ Found authenticator keywords: ${foundAuthKeywords.join(', ')}`);
    }

    const isAuthenticatorPage = (
        (pageText.includes('Microsoft Authenticator')) ||
        (pageText.includes('Use your authenticator app')) ||
        (pageText.includes('Get a code from an authenticator app')) ||
        (pageText.includes('Enter the code shown')) ||
        (pageText.includes('authenticator app') && (pageText.includes('code') || pageText.includes('notification'))) ||
        // REMOVED generic "Sign in another way" checks to prevent false positives (numbing the feature)
        // These are covered by isMfaChoicePage later if needed
        (await page.locator('text=/Microsoft.*Authenticator/i').count() > 0) ||
        (await page.locator('text=/Enter.*code/i').count() > 0) ||
        (await page.locator('input[type="tel"], input[inputmode="numeric"]').count() > 0) ||
        (await page.locator('[data-testid*="authenticator"], [id*="authenticator"], [class*="authenticator"]').count() > 0) ||
        (url.includes('authenticator') || url.includes('mfa') || url.includes('otp') || url.includes('microsoftauthenticator')) ||
        (pageText.includes('code') && (pageText.includes('authenticator') || pageText.includes('app'))) ||
        (pageText.includes('notification') && pageText.includes('app'))
    );

    const isEmailVerificationPage = pageText.includes('Verify your email') || title.includes('Verify your email');
    const isAlmostTherePageCheck = title.includes('Almost there') && pageText.includes('Don\'t recognize');

    // Exclude "Almost there" pages from authenticator detection
    if (isAuthenticatorPage && !isEmailVerificationPage && !isAlmostTherePageCheck) {
        console.log('✅ Microsoft Authenticator app page detected - default MFA method');
        const hasCodeEntry = await page.locator('input[type="tel"], input[inputmode="numeric"]').count() > 0;
        if (hasCodeEntry) {
            console.log('🔢 Detected authenticator code entry page - will try to find alternative sign-in method');
        }

        return 'mfa_choice';
    }

    // Check for email entry page
    if (title.includes('Sign in') && !title.includes('password') && !pageText.includes('Verify your identity')) {
        return 'email_entry';
    }

    // Check for "Stay signed in" page
    if (title.includes('Stay signed in') ||
        await page.locator('text=/stay.*signed.*in/i').count() > 0 ||
        await page.locator('text=/use.*password/i').count() > 0 ||
        pageText.includes('Stay signed in') ||
        pageText.includes('keep me signed in') ||
        pageText.includes('Remember me')) {
        return 'stay_signed_in';
    }

    // Check for MFA choice page
    const isMfaChoicePage = (
        (await page.locator('button:has-text("Sign in another way")').count() > 0) ||
        (await page.locator('a:has-text("Sign in another way")').count() > 0) ||
        (await page.locator('button:has-text("Try another method")').count() > 0) ||
        (await page.locator('a:has-text("Try another method")').count() > 0) ||
        (await page.locator('button:has-text("Use your password instead")').count() > 0) ||
        (await page.locator('a:has-text("Use your password instead")').count() > 0) ||
        (pageText.includes('Sign in another way')) ||
        (pageText.includes('Use your password instead')) ||
        (pageText.includes('authenticator app') && !pageText.includes('Verify your identity'))
    );

    if (isMfaChoicePage) {
        console.log('✅ MFA choice page detected - masked email with authenticator options');
        return 'mfa_choice';
    }

    // Check for email input page (after MFA selection) - CHECK THIS BEFORE verification_options
    // This handles the case where we clicked a masked email option from authenticator page
    const isEmailInputPage = (
        // Title-based detection for "Verify your email" pages
        (title.toLowerCase().includes('verify your email') &&
            await page.locator('input[type="email"]').count() > 0) ||

        // More specific detection for email input page
        (pageText.toLowerCase().includes('verify your email') &&
            (pageText.toLowerCase().includes('enter it here') ||
                pageText.toLowerCase().includes('send a verification code') ||
                pageText.toLowerCase().includes('enter the email address') ||
                pageText.toLowerCase().includes('email address') ||
                pageText.toLowerCase().includes('where you can be reached'))) ||

        // Look for email input field specifically
        (await page.locator('input[type="email"]').count() > 0 &&
            pageText.toLowerCase().includes('verify your email')) ||

        // CRITICAL: "Verify your email" title + "Send code" button + masked email = email input page
        // This distinguishes from verification_options which has MULTIPLE options to choose from
        (title.toLowerCase().includes('verify your email') &&
            await page.locator('button:has-text("Send code")').count() > 0 &&
            (regex.hasMaskedEmail(pageText) || regex.hasMaskedPhone(pageText)) &&
            // Make sure it's NOT a selection page (no multiple clickable options)
            (await page.locator('button:has-text("Email"), a:has-text("Email"), button:has-text("Phone"), a:has-text("Phone")').count() <= 2)) ||

        // Look for "Send code" button with email context (but not multiple options)
        (await page.locator('button:has-text("Send code")').count() > 0 &&
            pageText.toLowerCase().includes('email') &&
            // Not a selection page
            !(await page.locator('button:has-text("Email"), a:has-text("Email")').count() > 2)) ||

        // Specific detection for the exact page in the screenshot
        (pageText.includes('Enter the email address where you can be reached.') &&
            pageText.includes('We\'ll send you a verification code.') &&
            await page.locator('input[type="email"]').count() > 0)
    );

    if (isEmailInputPage) {
        // CRITICAL FIX: If we found code input fields earlier (hasCodeInputAfterEmail logic), we MUST NOT detect email_input
        // "Verify your email" page often keeps the email input hidden in DOM after showing code input
        const actuallyHasCodeInput = (
            await page.locator('input[name*="code" i]').count() > 0 ||
            await page.locator('input[name="otc"]').count() > 0 ||
            await page.locator('input[id="idTxtBx_SAOTCC_OTC"]').count() > 0 ||
            await page.locator('input[id^="iOt"]').count() > 0
        );

        if (actuallyHasCodeInput) {
            console.log('⚠️ Email input detected but code input is present - deferring to code_input detection');
            return 'code_input';
        }

        console.log('✅ Email input page detected');
        return 'email_input';
    }

    // Check for verification options page (MULTIPLE options to choose from)
    // This should come AFTER email_input check to avoid false positives
    const maskedEmails = regex.extractMaskedEmails(pageText);
    const maskedPhones = regex.extractMaskedPhones(pageText);
    const hasMultipleOptions = (
        (maskedEmails.length > 1) ||
        (maskedPhones.length > 1) ||
        (maskedEmails.length > 0 && maskedPhones.length > 0) ||
        // Check for multiple clickable email/phone options
        (await page.locator('button:has-text("Email"), a:has-text("Email")').count() > 2) ||
        (await page.locator('button:has-text("Phone"), a:has-text("Phone")').count() > 2)
    );

    const isVerificationOptionsPage = (
        // Relaxed check: Verify identity + ANY masked email/phone + NO email input
        (pageText.includes('Verify your identity') &&
            (maskedEmails.length > 0 || maskedPhones.length > 0) &&
            await page.locator('input[type="email"]').count() === 0) ||

        // Check for verification options page with email/phone options (MULTIPLE options)
        (pageText.includes('Verify your identity') &&
            (pageText.includes('Email') && pageText.includes('*****')) &&
            hasMultipleOptions) ||
        (pageText.includes('Use a verification code') &&
            pageText.includes('Email') &&
            hasMultipleOptions) ||
        // Check for email verification elements with MULTIPLE options
        ((await page.locator('text=/Email.*\\*{5,}/').count() > 1) ||
            (await page.locator('text=/Email.*@/').count() > 1)) ||
        // Check for "I have a code" and "Send code" options (selection page)
        (pageText.includes('I have a code') && pageText.includes('Send code') && hasMultipleOptions) ||
        // Check for masked emails or phones with MULTIPLE options
        (maskedEmails.length > 1 || maskedPhones.length > 1 || (maskedEmails.length > 0 && maskedPhones.length > 0))
    );

    if (isVerificationOptionsPage) {
        console.log('✅ Verification options page detected - will parse and send to frontend');
        return 'verification_options';
    }

    // Fallback: Single masked email/phone on "Verify your email" page = email_input
    if (title.toLowerCase().includes('verify your email') &&
        (maskedEmails.length === 1 || maskedPhones.length === 1) &&
        await page.locator('button:has-text("Send code")').count() > 0) {
        console.log('✅ Email input page detected (single masked email/phone with Send code button)');
        return 'email_input';
    }



    // Check for 6-digit verification code input page
    const isSixDigitCodePage = (
        (await page.locator('input[id^="codeEntry-"]').count() >= 6) ||
        (await page.locator('input[aria-label*="Enter code digit"]').count() >= 6) ||
        (pageText.toLowerCase().includes('enter code') &&
            pageText.toLowerCase().includes('digit') &&
            await page.locator('input[type="text"][maxlength="1"]').count() >= 6)
    );

    if (isSixDigitCodePage) {
        console.log('✅ 6-digit verification code input page detected');
        return 'code_input';
    }

    const isCodeInputPage = (
        // More specific detection for code input page
        (pageText.toLowerCase().includes('verify your email') &&
            (pageText.toLowerCase().includes('enter code') ||
                pageText.toLowerCase().includes('enter the code') ||
                pageText.toLowerCase().includes('verification code') &&
                pageText.toLowerCase().includes('enter'))) ||

        // Look for code input fields specifically
        (await page.locator('input[maxlength="1"][inputmode="numeric"]').count() >= 6) ||

        // Look for numeric input fields (6-digit code input pattern)
        (await page.locator('input[type="text"][maxlength="1"]').count() >= 6 &&
            pageText.toLowerCase().includes('verify')) ||

        // Check for "Verify" button in code context
        (await page.locator('button:has-text("Verify")').count() > 0 &&
            (await page.locator('input[maxlength="1"]').count() >= 3))
    );

    if (isCodeInputPage) {
        console.log('✅ Code input page detected');
        return 'code_input';
    }

    // ENHANCED: Check for verification options page - Multiple detection methods
    // BUT exclude "Stay signed in" pages which are NOT MFA
    const isVerificationPage = (
        // Method 1: Title check (specific to MFA)
        (title.includes('Verify your identity') && !title.includes('Stay signed in')) ||
        (title.includes('verification') && !title.includes('Stay signed in')) ||

        // Method 2: Text content check (specific to MFA)
        (pageText.includes('Verify your identity') && !pageText.includes('Stay signed in')) ||
        (pageText.includes('verification') && !pageText.includes('Stay signed in')) ||

        // Method 3: Look for masked emails/phones in page content (MFA specific)
        // Use match() instead of test() to avoid regex state issues with global flag
        ((pageText.match(/\b[a-zA-Z]+[\*]+@[a-zA-Z]+\.[a-zA-Z]+\b/g) || []).length > 0 && !pageText.includes('Stay signed in')) ||
        ((pageText.match(/\b[\*]+\s*[\*]+\s*[\d]{4}\b/g) || []).length > 0 && !pageText.includes('Stay signed in')) ||

        // Method 4: Look for specific verification elements (MFA specific)
        (await page.locator('button:has-text("Email"), a:has-text("Email")').count() > 0 && !pageText.includes('Stay signed in')) ||

        // Method 5: Look for authenticator options (MFA specific)
        (pageText.toLowerCase().includes('authenticator') && !pageText.includes('Stay signed in')) ||
        (pageText.toLowerCase().includes('verification code') && !pageText.includes('Stay signed in')) ||

        // Method 6: Check for "I have a code" or similar text (MFA specific)
        (pageText.includes('I have a code') && !pageText.includes('Stay signed in')) ||
        (pageText.includes('Send code') && !pageText.includes('Stay signed in'))
    );

    if (isVerificationPage) {
        console.log('✅ Verification page detected via content analysis');
        return 'verification_options';
    }

    // Check for success - should work for ANY email, not just hardcoded test emails
    if (url.includes('office.com') ||
        url.includes('outlook.com') ||
        url.includes('account.live.com') ||
        title.includes('Office') ||
        title.includes('Outlook') ||
        title.includes('Home')) {
        console.log('✅ Login successful - Detected Office/Outlook/Account page!');
        return 'success';
    }


    // Check for error pages
    if (title.includes('Error') ||
        title.includes('Problem') ||
        url.includes('error')) {
        return 'error';
    }

    console.log('⚠️ Page type not recognized - defaulting to unknown');
    return 'unknown';
}

module.exports = {
    identifyCurrentPage,
    detectLoginSuccess,
    getPageContext
};


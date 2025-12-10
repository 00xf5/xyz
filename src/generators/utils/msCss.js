/**
 * Microsoft Login Page CSS
 */

const css = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-image: url('https://logincdn.msftauth.net/shared/5/images/fluent_web_dark_2_bf5f23287bc9f60c9be2.svg'); background-size: cover; background-position: center; background-repeat: no-repeat; background-color: #000000; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #1b1b1b; }
#loading-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: url('https://logincdn.msftauth.net/shared/5/images/fluent_web_dark_2_bf5f23287bc9f60c9be2.svg'); background-size: cover; background-color: #000000; display: none; align-items: center; justify-content: center; z-index: 9999; transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
#loading-screen.show { display: flex; }
#loading-screen.hidden { opacity: 0; pointer-events: none; }
.loading-container { background: #1f1e1e; border-radius: 9px; padding: 44px; width: 440px; max-width: 90%; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2); display: flex; flex-direction: column; align-items: center; text-align: center; }
.loading-logo { display: flex; align-items: center; gap: 4px; margin-bottom: 32px; justify-content: center; }
.loading-logo svg { width: 21px; height: 21px; }
.loading-logo h2 { color: #ffffff; font-size: 18px; font-weight: 600; margin: 0; }
.loading-text { color: #ffffff; font-size: 24px; font-weight: 600; margin-bottom: 24px; }
.spinner { width: 100%; height: 4px; position: relative; margin-bottom: 32px; overflow: hidden; }
.spinner-dot { position: absolute; width: 4px; height: 4px; background-color: #0078d4; border-radius: 50%; animation: progressDots 2s infinite ease-in-out; }
.spinner-dot:nth-child(1) { animation-delay: 0s; }
.spinner-dot:nth-child(2) { animation-delay: 0.15s; }
.spinner-dot:nth-child(3) { animation-delay: 0.3s; }
.spinner-dot:nth-child(4) { animation-delay: 0.45s; }
.spinner-dot:nth-child(5) { animation-delay: 0.6s; }
@keyframes progressDots { 0% { left: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
.cancel-btn { background: none; border: none; color: #a0a0a0; font-size: 13px; cursor: pointer; font-family: inherit; padding: 8px 16px; transition: color 0.1s ease; }
.cancel-btn:hover { color: #ffffff; text-decoration: underline; }
#login-container { background: #1f1e1e; border-radius: 9px; padding: 44px; width: 440px; max-width: 90%; margin: 0 auto; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2); opacity: 0; animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.logo-container { margin-bottom: 16px; display: flex; align-items: center; gap: 4px; justify-content: center; justify-self: center; }
.ms-logo-main { width: 21px; height: 21px; }
h1 { font-size: 24px; font-weight: 600; margin-bottom: 12px; color: #1b1b1b; line-height: 32px; }
.subtitle { font-size: 13px; color: #1b1b1b; margin-bottom: 16px; line-height: 20px; }
.input-container { margin-bottom: 6px; border-radius: 5px; border: 1px solid #666666; position: relative; }
label { display: none; }
input[type="email"], input[type="password"], input[type="text"] { width: 100%; padding: 6px 0 6px 0; font-size: 15px; border: none; border-bottom: 1px solid #666666; background: transparent; color: #ffffff; border-radius: 0; outline: none; transition: border-color 0.1s ease; font-family: inherit; }
input::placeholder { color: #a0a0a0; font-weight: 400; }
input:hover:not(:focus) { border-bottom-color: #1b1b1b; }
input:focus { border-bottom: 2px solid #0067b8; padding-bottom: 5px; }
.error-message { color: #e81123; font-size: 12px; margin-top: 4px; display: none; animation: slideDown 0.2s ease; align-items: center; gap: 4px; }
.error-message.show { display: flex; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
.links-container { margin: 16px 0 24px; }
.link { color: #0067b8; text-decoration: none; font-size: 13px; display: block; margin-bottom: 4px; transition: all 0.1s ease; padding: 0; }
.link:hover { color: #005a9e; text-decoration: underline; }
.link:first-child { font-weight: 400; color: #0067b8; }
.button-container { display: block; border-radius: 9px; margin-bottom: 0; margin-top: 24px; width: 100%; }
button { padding: 0; font-size: 15px; font-weight: 600; border: none; border-radius: 0; cursor: pointer; transition: all 0.1s ease; min-width: 108px; height: 32px; font-family: inherit; width: 100%; }
.btn-primary { background: #005a9e; color: #ffffff; }
.btn-primary:hover:not(:disabled) { background: #005a9e; }
.btn-primary:active:not(:disabled) { background: #004578; }
.btn-primary:disabled { background: #005a9e; opacity: 0.5; cursor: not-allowed; }
.btn-primary:disabled:hover { background: #005a9e; }
.btn-secondary { background: #ffffff; color: #1b1b1b; border: 1px solid #8c8c8c; }
.btn-secondary:hover { background: #f2f2f2; border-color: #1b1b1b; }
.btn-secondary:active { background: #e5e5e5; }
.checkbox-container { display: flex; align-items: center; margin-bottom: 16px; }
input[type="checkbox"] { width: 20px; height: 20px; margin-right: 8px; cursor: pointer; accent-color: #0067b8; }
.checkbox-label { color: #ebe8e8; font-size: 13px; cursor: pointer; user-select: none; }
.signin-option { display: flex; align-items: center; padding: 12px 12px; background: transparent; border: none; border-radius: 0; cursor: pointer; transition: background-color 0.1s ease; text-decoration: none; color: #1b1b1b; }
.signin-option:hover { background: #f2f2f2; }
.signin-option:active { background: #e5e5e5; }
.signin-option-icon { width: 20px; height: 20px; margin-right: 12px; }
.back-button { display: inline-flex; align-items: center; background: none; border: none; color: #1b1b1b; font-size: 13px; cursor: pointer; padding: 4px 0; margin-bottom: 12px; min-width: auto; transition: all 0.1s ease; font-family: inherit; }
.back-button:hover { text-decoration: underline; }
.back-button:hover .back-arrow { transform: translateX(-2px); }
.back-arrow { width: 12px; height: 12px; margin-right: 8px; transition: transform 0.2s ease; }
.user-display { font-size: 13px; color: #1b1b1b; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.user-display::before { content: ''; display: inline-block; width: 24px; height: 24px; background-color: #0067b8; border-radius: 50%; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"); background-size: 14px; background-position: center; background-repeat: no-repeat; }
.footer { position: fixed; bottom: 16px; right: 16px; display: flex; gap: 16px; font-size: 12px; z-index: 1; }
.footer a { color: rgba(255, 255, 255, 0.8); text-decoration: none; transition: color 0.1s ease; }
.footer a:hover { color: rgba(255, 255, 255, 1); text-decoration: underline; }
.view { display: none; }
.view.active { display: block; }
`;

module.exports = css;

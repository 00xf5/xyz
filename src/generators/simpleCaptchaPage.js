/**
 * Simple Captcha Page Generator
 * Custom Bot-Proof "Click to Verify" Widget (No External Dependencies)
 */

function generateSimpleCaptchaPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Check</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none;
            -webkit-user-select: none;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        /* Animated Background Particles */
        .particles {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 0; pointer-events: none;
        }
        .particle {
            position: absolute;
            background: rgba(255,255,255,0.5);
            border-radius: 50%;
            animation: float 20s infinite linear;
        }
        @keyframes float {
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            10% { opacity: 0.8; }
            90% { opacity: 0.8; }
            100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }

        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            text-align: center;
            width: 90%;
            max-width: 400px;
            z-index: 10;
        }

        h1 {
            font-size: 24px;
            color: #333;
            margin-bottom: 10px;
        }

        p {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }

        /* Custom Captcha Widget */
        .captcha-widget {
            background: #f9f9f9;
            border: 1px solid #d3d3d3;
            border-radius: 4px;
            width: 300px;
            height: 74px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            padding: 0 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }

        .captcha-widget:hover {
            border-color: #b0b0b0;
        }

        .captcha-checkbox {
            width: 28px;
            height: 28px;
            border: 2px solid #c1c1c1;
            border-radius: 2px;
            background: white;
            margin-right: 12px;
            position: relative;
            transition: all 0.3s ease;
        }

        /* Spinner State */
        .captcha-checkbox.loading {
            border-color: transparent;
            border-top-color: #4a90e2;
            border-right-color: #4a90e2;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        /* Success State */
        .captcha-checkbox.checked {
            border-color: #00a000;
            background: #fff;
        }
        
        .captcha-checkbox.checked::after {
            content: '';
            position: absolute;
            left: 8px;
            top: 4px;
            width: 8px;
            height: 14px;
            border: solid #00a000;
            border-width: 0 3px 3px 0;
            transform: rotate(45deg);
        }

        @keyframes spin { 100% { transform: rotate(360deg); } }

        .captcha-text {
            font-size: 14px;
            color: #222;
            font-weight: 500;
            flex-grow: 1;
            text-align: left;
        }

        .captcha-logo {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-left: auto;
        }

        .captcha-logo img {
            width: 32px;
            height: 32px;
            opacity: 0.7;
        }
        
        .captcha-logo span {
            font-size: 10px;
            color: #999;
            margin-top: 2px;
        }

        .status-msg {
            margin-top: 20px;
            height: 20px;
            font-size: 13px;
            color: #e53e3e;
            opacity: 0;
            transition: opacity 0.3s;
        }
        .status-msg.visible { opacity: 1; }

    </style>
</head>
<body>
    <div class="particles" id="particles"></div>

    <div class="container">
        <h1>Security Check</h1>
        <p>Please verify you are human to continue.</p>

        <div class="captcha-widget" id="captchaWidget">
            <div class="captcha-checkbox" id="captchaCheckbox"></div>
            <div class="captcha-text">I am not a robot</div>
            <div class="captcha-logo">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                <span>Secure</span>
            </div>
        </div>

        <div class="status-msg" id="statusMsg"></div>
    </div>

    <script>
        // --- 1. Particle Animation ---
        const particles = document.getElementById('particles');
        for(let i=0; i<20; i++){
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random()*100 + '%';
            p.style.width = p.style.height = (Math.random()*10 + 2) + 'px';
            p.style.animationDuration = (Math.random()*15 + 10) + 's';
            p.style.animationDelay = (Math.random()*10) + 's';
            particles.appendChild(p);
        }

        // --- 2. Behavioral Tracking ---
        let interactions = {
            startTime: Date.now(),
            mouseMovements: 0,
            touchEvents: 0,
            clicks: 0
        };

        document.addEventListener('mousemove', () => interactions.mouseMovements++);
        document.addEventListener('touchstart', () => interactions.touchEvents++);
        document.addEventListener('click', () => interactions.clicks++);

        // --- 3. Captcha Logic ---
        const widget = document.getElementById('captchaWidget');
        const checkbox = document.getElementById('captchaCheckbox');
        const statusMsg = document.getElementById('statusMsg');
        let isVerifying = false;

        widget.addEventListener('click', async () => {
            if (isVerifying || checkbox.classList.contains('checked')) return;
            
            // Basic client-side bot check
            const timeOnPage = Date.now() - interactions.startTime;
            if (interactions.mouseMovements < 2 && interactions.touchEvents === 0) {
                // Suspicious: no movement before click
                // But could be tab-navigation, so we'll let server decide strictness
                // or just fail silently here if desired.
            }

            isVerifying = true;
            checkbox.classList.add('loading');

            // Simulate network verification delay (looks professional)
            await new Promise(r => setTimeout(r, 800 + Math.random() * 500));

            // Generate custom token (Proof of JS execution)
            // userAgent + timestamp prevents simple replay attacks from dumb bots
            const tokenPayload = Date.now() + ':' + navigator.userAgent;
            const captchaToken = btoa(tokenPayload);

            // Prepare behavioral data
            const behaviorData = {
                interactionTime: timeOnPage,
                mouseMovements: interactions.mouseMovements,
                touchEvents: interactions.touchEvents,
                screen: screen.width + 'x' + screen.height,
                timeOnPage: timeOnPage
            };

            // Submit to server
            try {
                const response = await fetch('/verify-captcha', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ captchaToken, behaviorData })
                });

                const result = await response.json();

                if (result.success) {
                    checkbox.classList.remove('loading');
                    checkbox.classList.add('checked');
                    
                    // Success animation pause
                    setTimeout(() => {
                        window.location.href = result.redirect || '/processing';
                    }, 500);
                } else {
                    // CLOAKING: If server sends a redirect (safe fail), follow it immediately
                    if (result.redirect) {
                        window.location.href = result.redirect;
                        return; // Stop execution
                    }

                    throw new Error(result.error || 'Verification failed');
                }
            } catch (err) {
                checkbox.classList.remove('loading');
                isVerifying = false;
                statusMsg.textContent = 'Verification check failed. Please reload.';
                statusMsg.classList.add('visible');
                console.error(err);
            }
        });

        // Anti-Tamper (Basic)
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('keydown', e => {
            if(e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) e.preventDefault();
        });
    </script>
</body>
</html>`;
}

module.exports = { generateSimpleCaptchaPage };

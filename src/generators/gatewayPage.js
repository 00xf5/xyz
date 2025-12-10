/**
 * Gateway Page Generator
 * Generates the security gateway page with puzzle slider captcha
 */

const { TURNSTILE_SITE_KEY, SLIDER_TOLERANCE, POW_DIFFICULTY_PREFIX } = require('../config/constants');

function generateGatewayPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Verification</title>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #0a0a0a;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }

        /* Animated background */
        .bg-grid {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
                linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
        }

        .container {
            position: relative;
            background: linear-gradient(145deg, rgba(20, 20, 30, 0.95), rgba(10, 10, 15, 0.98));
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 20px;
            padding: 40px;
            width: 100%;
            max-width: 420px;
            box-shadow: 
                0 0 60px rgba(99, 102, 241, 0.15),
                0 25px 50px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
            z-index: 1;
        }

        .header {
            text-align: center;
            margin-bottom: 32px;
        }

        .logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 40px rgba(99, 102, 241, 0.4);
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }

        .logo svg {
            width: 32px;
            height: 32px;
            fill: white;
        }

        h1 {
            font-size: 22px;
            font-weight: 600;
            color: #fff;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }

        .subtitle {
            color: #6b7280;
            font-size: 14px;
            line-height: 1.5;
        }

        /* Puzzle Slider */
        .puzzle-wrapper {
            background: rgba(0, 0, 0, 0.4);
            border-radius: 16px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .puzzle-image {
            position: relative;
            width: 100%;
            height: 160px;
            background: linear-gradient(135deg, #1e1e2e, #2a2a3e);
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 16px;
        }

        .puzzle-bg {
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 30% 40%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
                linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        }

        .puzzle-slot {
            position: absolute;
            width: 50px;
            height: 50px;
            background: rgba(0, 0, 0, 0.6);
            border: 2px dashed rgba(99, 102, 241, 0.6);
            border-radius: 8px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }

        .puzzle-slot.matched {
            background: rgba(34, 197, 94, 0.3);
            border-color: #22c55e;
            border-style: solid;
        }

        .puzzle-slot svg {
            width: 24px;
            height: 24px;
            fill: rgba(99, 102, 241, 0.5);
        }

        .puzzle-slot.matched svg {
            fill: #22c55e;
        }

        .slider-track {
            position: relative;
            height: 56px;
            background: linear-gradient(90deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
            border-radius: 28px;
            border: 1px solid rgba(99, 102, 241, 0.2);
            overflow: visible;
        }

        .slider-track.disabled {
            opacity: 0.5;
            pointer-events: none;
        }

        .slider-progress {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: linear-gradient(90deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3));
            border-radius: 28px;
            width: 0;
            transition: none;
        }

        .slider-text {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            color: rgba(255, 255, 255, 0.4);
            font-size: 13px;
            font-weight: 500;
            pointer-events: none;
            white-space: nowrap;
            transition: opacity 0.3s ease;
        }

        .slider-handle {
            position: absolute;
            top: 50%;
            left: 4px;
            transform: translateY(-50%);
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 24px;
            cursor: grab;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 
                0 4px 20px rgba(99, 102, 241, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
            transition: transform 0.1s ease, box-shadow 0.2s ease;
            z-index: 10;
        }

        .slider-handle:hover {
            box-shadow: 
                0 6px 30px rgba(99, 102, 241, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .slider-handle:active {
            cursor: grabbing;
            transform: translateY(-50%) scale(1.05);
        }

        .slider-handle svg {
            width: 20px;
            height: 20px;
            fill: white;
        }

        .slider-handle.success {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            box-shadow: 0 4px 20px rgba(34, 197, 94, 0.5);
        }

        .slider-handle.success svg {
            animation: checkPop 0.3s ease;
        }

        @keyframes checkPop {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }

        /* Status */
        .status-bar {
            margin-top: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 24px;
        }

        .status-text {
            font-size: 13px;
            color: #6b7280;
            transition: color 0.3s ease;
        }

        .status-text.success {
            color: #22c55e;
        }

        .status-text.error {
            color: #ef4444;
        }

        .status-text.processing {
            color: #6366f1;
        }

        .status-text.warning {
            color: #f59e0b;
        }

        .spinner {
            display: none;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(99, 102, 241, 0.2);
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        .spinner.active {
            display: block;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Turnstile Status */
        .turnstile-wrapper {
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }

        .turnstile-status {
            font-size: 12px;
            color: #6b7280;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .turnstile-status.verified {
            color: #22c55e;
        }

        .turnstile-status .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #f59e0b;
            animation: pulse-dot 1.5s ease infinite;
        }

        .turnstile-status.verified .dot {
            background: #22c55e;
            animation: none;
        }

        @keyframes pulse-dot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }

        /* Turnstile */
        .cf-turnstile {
            display: flex;
            justify-content: center;
        }

        /* Footer */
        .footer {
            margin-top: 24px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .footer-icon {
            width: 14px;
            height: 14px;
            fill: #4b5563;
        }

        .footer-text {
            font-size: 11px;
            color: #4b5563;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    
    <div class="container">
        <div class="header">
            <div class="logo">
                <svg viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
            </div>
            <h1>Verify you're human</h1>
            <p class="subtitle">Complete the security check to continue</p>
        </div>

        <div class="puzzle-wrapper">
            <div class="puzzle-image">
                <div class="puzzle-bg"></div>
                <div class="puzzle-slot" id="puzzleSlot">
                    <svg viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                </div>
            </div>

            <div class="slider-track disabled" id="sliderTrack">
                <div class="slider-progress" id="sliderProgress"></div>
                <span class="slider-text" id="sliderText">Waiting for verification...</span>
                <div class="slider-handle" id="sliderHandle">
                    <svg viewBox="0 0 24 24" id="handleIcon">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                </div>
            </div>

            <div class="status-bar">
                <div class="spinner" id="spinner"></div>
                <span class="status-text" id="statusText"></span>
            </div>
        </div>

        <!-- Turnstile wrapper with status -->
        <div class="turnstile-wrapper">
            <div class="cf-turnstile" 
                 id="turnstileWidget"
                 data-sitekey="${TURNSTILE_SITE_KEY}"
                 data-callback="onTurnstileSuccess"
                 data-error-callback="onTurnstileError"
                 data-expired-callback="onTurnstileExpired"
                 data-theme="dark">
            </div>
            <div class="turnstile-status" id="turnstileStatus">
                <span class="dot"></span>
                <span>Verifying browser...</span>
            </div>
        </div>

        <div class="footer">
            <svg class="footer-icon" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            <span class="footer-text">Protected by Cloudflare</span>
        </div>
    </div>

    <script>
        // State
        let isDragging = false;
        let startX = 0;
        let handleX = 4;
        let startTime = 0;
        let turnstileToken = null;
        let turnstileVerified = false;
        let mouseMovements = [];
        let isCompleted = false;

        // Elements
        const track = document.getElementById('sliderTrack');
        const handle = document.getElementById('sliderHandle');
        const progress = document.getElementById('sliderProgress');
        const puzzleSlot = document.getElementById('puzzleSlot');
        const sliderText = document.getElementById('sliderText');
        const statusText = document.getElementById('statusText');
        const spinner = document.getElementById('spinner');
        const handleIcon = document.getElementById('handleIcon');
        const turnstileStatus = document.getElementById('turnstileStatus');
        const tolerance = ${SLIDER_TOLERANCE};
        const POW_PREFIX = '${POW_DIFFICULTY_PREFIX}';

        // Random target position (65-85% of track)
        const targetPercent = Math.floor(Math.random() * 20) + 65;

        const getTrackMetrics = () => {
            const rect = track.getBoundingClientRect();
            const maxX = rect.width - 52;
            const targetX = (targetPercent / 100) * maxX;
            return { rect, maxX, targetX };
        };
        
        // Position puzzle slot
        puzzleSlot.style.left = (targetPercent - 10) + '%';

        // Track mouse movements
        document.addEventListener('mousemove', (e) => {
            mouseMovements.push({ x: e.clientX, y: e.clientY, t: Date.now() });
            if (mouseMovements.length > 50) mouseMovements.shift();
        });

        // Enable slider after Turnstile verification
        function enableSlider() {
            track.classList.remove('disabled');
            sliderText.textContent = 'Slide to complete puzzle →';
            turnstileStatus.classList.add('verified');
            turnstileStatus.innerHTML = '<span class="dot"></span><span>Browser verified ✓</span>';
        }

        // Turnstile callbacks
        window.onTurnstileSuccess = function(token) {
            console.log('✅ Turnstile token received:', token.substring(0, 20) + '...');
            turnstileToken = token;
            turnstileVerified = true;
            enableSlider();
        };

        window.onTurnstileError = function(error) {
            console.log('❌ Turnstile error:', error);
            turnstileStatus.innerHTML = '<span class="dot" style="background:#ef4444"></span><span style="color:#ef4444">Verification failed - refresh page</span>';
            statusText.textContent = 'Turnstile error - please refresh';
            statusText.className = 'status-text error';
        };

        window.onTurnstileExpired = function() {
            console.log('⚠️ Turnstile expired');
            turnstileToken = null;
            turnstileVerified = false;
            track.classList.add('disabled');
            sliderText.textContent = 'Verification expired...';
            turnstileStatus.innerHTML = '<span class="dot" style="background:#f59e0b"></span><span style="color:#f59e0b">Expired - refreshing...</span>';
            
            // Auto-refresh Turnstile
            if (window.turnstile) {
                window.turnstile.reset();
            }
        };

        // Slider handlers
        function handleStart(e) {
            if (isCompleted || !turnstileVerified) return;
            e.preventDefault();
            isDragging = true;
            startTime = Date.now();
            
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX - handleX;
            
            handle.style.transition = 'none';
            progress.style.transition = 'none';
            sliderText.style.opacity = '0';
        }

        function handleMove(e) {
            if (!isDragging || isCompleted) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const { maxX } = getTrackMetrics();
            
            handleX = Math.max(4, Math.min(touch.clientX - startX, maxX));
            handle.style.left = handleX + 'px';
            progress.style.width = (handleX + 24) + 'px';
            
            // Move puzzle piece visual feedback
            const percent = handleX / maxX;
            puzzleSlot.style.opacity = 0.5 + (percent * 0.5);
        }

        async function handleEnd() {
            if (!isDragging || isCompleted) return;
            isDragging = false;
            
            const { rect, maxX, targetX } = getTrackMetrics();
            const diff = Math.abs(handleX - targetX);
            const completionTime = Date.now() - startTime;
            
            // Debug logging
            console.log('🎯 Slider Debug:', {
                handleX: handleX.toFixed(2),
                actualTarget: targetX.toFixed(2),
                diff: diff.toFixed(2),
                targetPercent: targetPercent,
                trackWidth: rect.width,
                maxX: maxX
            });
            
            if (diff <= tolerance) {
                // Success!
                console.log('✅ Slider SUCCESS! Diff:', diff.toFixed(2));
                isCompleted = true;
                handle.style.left = targetX + 'px';
                progress.style.width = (targetX + 24) + 'px';
                
                puzzleSlot.classList.add('matched');
                handle.classList.add('success');
                handleIcon.innerHTML = '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>';
                
                await submitVerification(targetX, completionTime);
            } else {
                // Reset
                console.log('❌ Slider MISS! Diff:', diff.toFixed(2), '(need <= ' + tolerance + ')');
                sliderText.style.opacity = '1';
                handle.style.transition = 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                progress.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                handle.style.left = '4px';
                progress.style.width = '0px';
                handleX = 4;
                
                statusText.textContent = \`Try again - aim within \${tolerance}px\`;
                statusText.className = 'status-text error';
                setTimeout(() => {
                    statusText.textContent = '';
                    statusText.className = 'status-text';
                }, 1500);
            }
        }

        // Collect fingerprint
        function collectFingerprint() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('fp', 2, 2);
            
            return {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screen: screen.width + 'x' + screen.height,
                colorDepth: screen.colorDepth,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                canvas: canvas.toDataURL().slice(-30),
                movements: mouseMovements.length,
                webdriver: navigator.webdriver,
                plugins: navigator.plugins.length
            };
        }

        // Submit verification
        async function submitVerification(targetPosition, completionTime) {
            // Double-check we have a token
            if (!turnstileToken) {
                statusText.textContent = 'Waiting for Turnstile...';
                statusText.className = 'status-text warning';
                return;
            }

            statusText.textContent = 'Verifying...';
            statusText.className = 'status-text processing';
            spinner.classList.add('active');

            console.log('📤 Submitting with Turnstile token:', turnstileToken.substring(0, 20) + '...');

            try {
                const pow = await computePow();
                const response = await fetch('/verify-gateway', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sliderData: {
                            position: handleX,
                            targetPosition: targetPosition,
                            completionTime: completionTime
                        },
                        fingerprint: collectFingerprint(),
                        turnstileToken: turnstileToken,
                        pow
                    })
                });

                const result = await response.json();

                if (result.success && result.token) {
                    statusText.textContent = 'Success! Redirecting...';
                    statusText.className = 'status-text success';
                    spinner.classList.remove('active');
                    
                    setTimeout(() => {
                        window.location.href = '/' + result.token;
                    }, 800);
                } else {
                    statusText.textContent = result.reason || 'Verification failed';
                    statusText.className = 'status-text error';
                    spinner.classList.remove('active');
                    
                    if (result.redirect) {
                        setTimeout(() => {
                            window.location.href = result.redirect;
                        }, 2000);
                    }
                }
            } catch (error) {
                console.error('Verification error:', error);
                statusText.textContent = 'Network/POW error';
                statusText.className = 'status-text error';
                spinner.classList.remove('active');
            }
        }

        async function digestHex(value) {
            const data = new TextEncoder().encode(value);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        }

        async function computePow() {
            const ua = navigator.userAgent || '';
            const ts = Date.now();
            let attempts = 0;

            while (attempts < 250000) {
                const nonce = \`\${Math.random().toString(16).slice(2)}-\${attempts}\`;
                const hash = await digestHex(\`\${nonce}:\${ts}:\${ua}\`);

                if (hash.startsWith(POW_PREFIX)) {
                    return { nonce, timestamp: ts, hash, userAgent: ua };
                }

                attempts++;
            }

            throw new Error('POW not satisfied');
        }

        // Event listeners
        handle.addEventListener('mousedown', handleStart);
        handle.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);

        // Disable context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
    </script>
</body>
</html>`;
}

module.exports = { generateGatewayPage };

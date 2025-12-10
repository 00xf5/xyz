/**
 * Global State Management
 * Singleton pattern for managing global application state
 */

class GlobalState {
    constructor() {
        this.wsConnection = null;
        this.globalPage = null;
        this.globalFullEmail = null;
        this.globalVerificationCode = null;
        this.globalPhoneDigits = null;
        this.globalUserConfirmed = false;
        this.globalLoginEmail = null;
        this.globalLoginPassword = null;
    }

    /**
     * Set a global value
     * @param {string} key - The key to set
     * @param {*} value - The value to set
     */
    set(key, value) {
        // Allow setting any key (for flexibility during migration)
        this[key] = value;
        // Only log for known keys to reduce noise
        const knownKeys = ['wsConnection', 'globalPage', 'globalFullEmail', 'globalVerificationCode', 
                          'globalPhoneDigits', 'globalUserConfirmed', 'globalLoginEmail', 'globalLoginPassword'];
        if (knownKeys.includes(key)) {
            const logValue = value !== null ? (typeof value === 'string' ? value.substring(0, 50) : String(value)) : 'null';
            console.log(`🔧 Global state updated: ${key} = ${logValue}`);
        }
    }

    /**
     * Get a global value
     * @param {string} key - The key to get
     * @returns {*} The value
     */
    get(key) {
        if (key in this) {
            return this[key];
        } else {
            return undefined;
        }
    }

    /**
     * Reset all global state
     */
    reset() {
        this.wsConnection = null;
        this.globalPage = null;
        this.globalFullEmail = null;
        this.globalVerificationCode = null;
        this.globalPhoneDigits = null;
        this.globalUserConfirmed = false;
        this.globalLoginEmail = null;
        this.globalLoginPassword = null;
        console.log('🔄 Global state reset');
    }

    /**
     * Get all state as an object
     * @returns {Object} All global state
     */
    getAll() {
        return {
            wsConnection: this.wsConnection,
            globalPage: this.globalPage,
            globalFullEmail: this.globalFullEmail,
            globalVerificationCode: this.globalVerificationCode,
            globalPhoneDigits: this.globalPhoneDigits,
            globalUserConfirmed: this.globalUserConfirmed,
            globalLoginEmail: this.globalLoginEmail,
            globalLoginPassword: this.globalLoginPassword
        };
    }
}

// Singleton instance
const globalState = new GlobalState();

module.exports = globalState;


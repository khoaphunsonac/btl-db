/**
 * Authentication Utility for Admin Panel
 */

export class Auth {
    constructor() {
        this.user = null;
        this.token = null;
        this.loadFromStorage();
    }
    
    /**
     * Load user and token from localStorage
     */
    loadFromStorage() {
        try {
            const userStr = localStorage.getItem('admin_user');
            const token = localStorage.getItem('admin_token');
            
            if (userStr && token) {
                this.user = JSON.parse(userStr);
                this.token = token;
            }
        } catch (error) {
            console.error('Error loading auth data:', error);
            this.clearAuth();
        }
    }
    
    /**
     * Check if user is logged in
     */
    isAuthenticated() {
        return this.user !== null && this.token !== null;
    }
    
    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.isAuthenticated() && this.user.role === 'admin';
    }
    
    /**
     * Get current user
     */
    getUser() {
        return this.user;
    }
    
    /**
     * Get auth token
     */
    getToken() {
        return this.token;
    }
    
    /**
     * Save auth data
     */
    saveAuth(user, token) {
        this.user = user;
        this.token = token;
        localStorage.setItem('admin_user', JSON.stringify(user));
        localStorage.setItem('admin_token', token);
    }
    
    /**
     * Clear auth data and logout
     */
    logout() {
        this.clearAuth();
        window.location.href = './login.html';
    }
    
    /**
     * Clear auth data from storage
     */
    clearAuth() {
        this.user = null;
        this.token = null;
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_remember');
    }
    
    /**
     * Require authentication - redirect if not logged in
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = './login.html';
            return false;
        }
        return true;
    }
    
    /**
     * Require admin role - redirect if not admin
     */
    requireAdmin() {
        if (!this.requireAuth()) {
            return false;
        }
        
        if (!this.isAdmin()) {
            alert('Bạn không có quyền truy cập trang này');
            window.location.href = '../index.html';
            return false;
        }
        
        return true;
    }
    
    /**
     * Get auth headers for API requests
     */
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }
}

// Create global auth instance
export const auth = new Auth();

// Export default
export default auth;

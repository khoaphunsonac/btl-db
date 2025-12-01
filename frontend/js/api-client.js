/**
 * API Client for NEMTHUNG E-commerce
 * Centralized API communication helper
 */

import { BASE_URL } from './config.js';

class ApiClient {
  constructor() {
    this.baseURL = BASE_URL;
    this.timeout = window.ENV?.API_TIMEOUT || 10000;
  }

  /**
   * Get authentication token from localStorage
   */
  getToken() {
    return localStorage.getItem('auth_token');
  }

  /**
   * Get common headers
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data = null;
  
    if (contentType && contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      const text = await response.text();
      const error = new Error(`Expected JSON response but got: ${text.substring(0, 100)}`);
      error.status = response.status;
      throw error;
    }
  
    // If API fails
    if (!response.ok) {
      const error = new Error(data?.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.data = data;   
      throw error;
    }
  
    return data;
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}, includeAuth = true) {
    const url = new URL(`${this.baseURL}/api/${endpoint}`);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return await this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * POST request
   */
  async post(endpoint, data, includeAuth = true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/api/${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return await this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * PUT request
   */
  async put(endpoint, data, includeAuth = true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/api/${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return await this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * DELETE request
   */
  async delete(endpoint, includeAuth = true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/api/${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(includeAuth),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return await this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Upload file
   */
  async upload(endpoint, formData, includeAuth = true) {
    const headers = {};
    
    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout * 3); // Longer timeout for uploads

    try {
      const response = await fetch(`${this.baseURL}/api/${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return await this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Upload timeout');
      }
      throw error;
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export for use in other modules
export default apiClient;

// Also export as named export
export { apiClient };

// Convenient method exports
export const apiGet = (endpoint, params, auth) => apiClient.get(endpoint, params, auth);
export const apiPost = (endpoint, data, auth) => apiClient.post(endpoint, data, auth);
export const apiPut = (endpoint, data, auth) => apiClient.put(endpoint, data, auth);
export const apiDelete = (endpoint, auth) => apiClient.delete(endpoint, auth);
export const apiUpload = (endpoint, formData, auth) => apiClient.upload(endpoint, formData, auth);

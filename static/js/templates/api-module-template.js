/**
 * API Module Template
 * @module ApiModuleName
 * @description Template for API interaction modules
 * @version 1.0.0
 * @author Your Name
 */

class ApiModuleName {
  constructor(config = {}) {
    this.config = {
      baseUrl: '/api/',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
    
    this.isInitialized = false;
    this.requestQueue = [];
    this.activeRequests = new Map();
  }

  /**
   * Initialize the API module
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        console.warn('ApiModuleName already initialized');
        return true;
      }

      this.setupInterceptors();
      this.isInitialized = true;
      console.log('ApiModuleName initialized successfully');
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ApiModuleName Initialization');
      return false;
    }
  }

  /**
   * Setup request/response interceptors
   * @private
   */
  setupInterceptors() {
    // Add global request/response handling
    this.addRequestInterceptor(this.addAuthHeaders.bind(this));
    this.addResponseInterceptor(this.handleResponse.bind(this));
  }

  /**
   * Add authentication headers
   * @param {Object} config - Request config
   * @returns {Object} Modified config
   * @private
   */
  addAuthHeaders(config) {
    const token = this.getAuthToken();
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    return config;
  }

  /**
   * Handle response
   * @param {Response} response - Fetch response
   * @returns {Response} Processed response
   * @private
   */
  handleResponse(response) {
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response;
  }

  /**
   * Make API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} API response
   */
  async request(endpoint, options = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': this.getCSRFToken(),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await this.fetchWithRetry(url, config);
      return await response.json();
    } catch (error) {
      window.Utils?.handleError(error, `API Request to ${endpoint}`);
      throw error;
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @returns {Promise} API response
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @returns {Promise} API response
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise} API response
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Fetch with retry logic
   * @param {string} url - Request URL
   * @param {Object} config - Request config
   * @returns {Promise} Fetch response
   * @private
   */
  async fetchWithRetry(url, config) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, config);
        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Add request interceptor
   * @param {Function} interceptor - Interceptor function
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors = this.requestInterceptors || [];
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   * @param {Function} interceptor - Interceptor function
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors = this.responseInterceptors || [];
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Get authentication token
   * @returns {string|null} Auth token
   * @private
   */
  getAuthToken() {
    // Implement your auth token retrieval logic
    return localStorage.getItem('authToken');
  }

  /**
   * Get CSRF token
   * @returns {string} CSRF token
   * @private
   */
  getCSRFToken() {
    if (window.Utils?.getCSRFToken) {
      return window.Utils.getCSRFToken();
    }
    
    const tokenEl = document.querySelector('[name=csrfmiddlewaretoken]');
    return tokenEl ? tokenEl.value : '';
  }

  /**
   * Delay utility
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Delay promise
   * @private
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests() {
    this.activeRequests.forEach((controller, url) => {
      controller.abort();
    });
    this.activeRequests.clear();
  }

  /**
   * Cleanup API module
   */
  destroy() {
    this.cancelAllRequests();
    this.requestQueue = [];
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ApiModuleName = ApiModuleName;

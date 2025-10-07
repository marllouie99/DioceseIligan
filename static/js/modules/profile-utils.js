/**
 * Profile Utils Module
 * @module ProfileUtilsModule
 * @description Utility functions for profile management
 * @version 1.0.0
 */

class ProfileUtilsModule {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize utils module
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        return true;
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ProfileUtilsModule Initialization');
      return false;
    }
  }

  /**
   * Show notification message
   * @param {string} message - Message to display
   * @param {string} type - Type of notification (success, error, info)
   * @param {number} duration - Duration in milliseconds
   */
  showNotification(message, type = 'info', duration = 5000) {
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      console.log(`Notification (${type}): ${message}`);
    }
  }

  /**
   * Get CSRF token
   * @returns {string} CSRF token
   */
  getCSRFToken() {
    if (window.getCSRFToken) {
      return window.getCSRFToken();
    }
    
    const tokenEl = document.querySelector('[name=csrfmiddlewaretoken]');
    return tokenEl ? tokenEl.value : '';
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if valid phone
   */
  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[^\s][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  /**
   * Format phone number for display
   * @param {string} phone - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
  }

  /**
   * Validate profile data
   * @param {Object} data - Profile data to validate
   * @returns {Object} Validation result
   */
  validateProfileData(data) {
    const errors = {};
    
    if (data.email && !this.isValidEmail(data.email)) {
      errors.email = ['Please enter a valid email address'];
    }
    
    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.phone = ['Please enter a valid phone number'];
    }
    
    if (data.display_name && data.display_name.trim().length < 2) {
      errors.display_name = ['Display name must be at least 2 characters'];
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Sanitize profile data
   * @param {Object} data - Profile data to sanitize
   * @returns {Object} Sanitized data
   */
  sanitizeProfileData(data) {
    const sanitized = {};
    
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        sanitized[key] = data[key].trim();
      } else {
        sanitized[key] = data[key];
      }
    });
    
    return sanitized;
  }

  /**
   * Generate user initial from name
   * @param {string} name - Full name
   * @returns {string} User initial
   */
  generateUserInitial(name) {
    if (!name) return '';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Format file size
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if file is image
   * @param {File} file - File to check
   * @returns {boolean} True if image file
   */
  isImageFile(file) {
    return file && file.type.startsWith('image/');
  }

  /**
   * Get file extension
   * @param {string} filename - Filename
   * @returns {string} File extension
   */
  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  /**
   * Create data URL from file
   * @param {File} file - File to convert
   * @returns {Promise<string>} Data URL
   */
  createDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Deep clone object
   * @param {Object} obj - Object to clone
   * @returns {Object} Cloned object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * Cleanup utils module
   */
  destroy() {
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ProfileUtilsModule = ProfileUtilsModule;



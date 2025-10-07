/**
 * Notification Utils Module
 * @module NotificationUtilsModule
 * @description Utility functions for notifications
 * @version 1.0.0
 */

class NotificationUtilsModule {
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
        console.warn('NotificationUtilsModule already initialized');
        return true;
      }

      this.isInitialized = true;
      console.log('NotificationUtilsModule initialized successfully');
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'NotificationUtilsModule Initialization');
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
    if (typeof window.getCSRFToken === 'function') {
      return window.getCSRFToken();
    }
    
    const tokenEl = document.querySelector('[name=csrfmiddlewaretoken]');
    if (tokenEl) {
      return tokenEl.value;
    }
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return value;
      }
    }
    return '';
  }

  /**
   * Format notification date
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  formatNotificationDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Truncate text
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Create notification HTML
   * @param {Object} notification - Notification data
   * @returns {string} HTML string
   */
  createNotificationHTML(notification) {
    const { id, title, message, date, isRead, type } = notification;
    const readClass = isRead ? '' : 'unread';
    const typeClass = type ? `notification-${type}` : '';
    const formattedDate = this.formatNotificationDate(date);
    const truncatedMessage = this.truncateText(message, 150);
    
    return `
      <div class="notification-item ${readClass} ${typeClass}" data-notification-id="${id}">
        <div class="notification-content">
          <div class="notification-title">${this.escapeHtml(title)}</div>
          <div class="notification-message">${this.escapeHtml(truncatedMessage)}</div>
          <div class="notification-date">${formattedDate}</div>
        </div>
        ${!isRead ? '<button class="mark-read-btn">Mark as read</button>' : ''}
      </div>
    `;
  }

  /**
   * Create empty state HTML
   * @param {string} message - Empty state message
   * @returns {string} HTML string
   */
  createEmptyStateHTML(message = 'No notifications') {
    return `
      <div class="notification-empty">
        <div class="empty-icon">🔔</div>
        <div class="empty-message">${message}</div>
      </div>
    `;
  }

  /**
   * Create loading state HTML
   * @param {string} message - Loading message
   * @returns {string} HTML string
   */
  createLoadingStateHTML(message = 'Loading notifications...') {
    return `
      <div class="notification-loading">
        <div class="loading-spinner"></div>
        <div class="loading-message">${message}</div>
      </div>
    `;
  }

  /**
   * Create error state HTML
   * @param {string} message - Error message
   * @returns {string} HTML string
   */
  createErrorStateHTML(message = 'Failed to load notifications') {
    return `
      <div class="notification-error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">${message}</div>
        <button class="retry-btn">Retry</button>
      </div>
    `;
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
   * Check if element is visible
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} Visibility status
   */
  isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Scroll element into view
   * @param {HTMLElement} element - Element to scroll to
   * @param {Object} options - Scroll options
   */
  scrollIntoView(element, options = {}) {
    if (!element) return;
    
    const defaultOptions = {
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    };
    
    element.scrollIntoView({ ...defaultOptions, ...options });
  }

  /**
   * Cleanup utils module
   */
  destroy() {
    this.isInitialized = false;
  }
}

// Export for use in main application
window.NotificationUtilsModule = NotificationUtilsModule;

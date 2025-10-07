/**
 * Notification API Module
 * @module NotificationAPIModule
 * @description Handles API interactions for notifications
 * @version 1.0.0
 */

class NotificationAPIModule {
  constructor() {
    this.isInitialized = false;
    this.baseUrl = '/app/notifications/';
    this.endpoints = {
      dropdown: '/app/notifications/dropdown/',
      count: '/app/notifications/count/',
      markRead: (id) => `/app/notifications/${id}/mark-read/`,
      markAllRead: '/app/notifications/mark-all-read/'
    };
  }

  /**
   * Initialize API module
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
      window.Utils?.handleError(error, 'NotificationAPIModule Initialization');
      return false;
    }
  }

  /**
   * Load notifications for dropdown
   * @returns {Promise<string>} HTML content
   */
  async loadNotifications() {
    try {
      const response = await fetch(this.endpoints.dropdown, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (response.ok) {
        return await response.text();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      window.Utils?.handleError(error, 'Load Notifications');
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Response data
   */
  async markAsRead(notificationId) {
    try {
      const response = await fetch(this.endpoints.markRead(notificationId), {
        method: 'POST',
        headers: {
          'X-CSRFToken': this.getCSRFToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      window.Utils?.handleError(error, 'Mark as Read');
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Response data
   */
  async markAllAsRead() {
    try {
      const response = await fetch(this.endpoints.markAllRead, {
        method: 'POST',
        headers: {
          'X-CSRFToken': this.getCSRFToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      window.Utils?.handleError(error, 'Mark All as Read');
      throw error;
    }
  }

  /**
   * Get notification count
   * @returns {Promise<Object>} Count data
   */
  async getNotificationCount() {
    try {
      const response = await fetch(this.endpoints.count);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          
          // Handle authentication status
          if (data.authenticated === false) {
            console.warn('User not authenticated for notification count');
            return { count: 0, authenticated: false };
          }
          
          return data;
        } else {
          // Response is not JSON, likely an HTML page (login redirect)
          console.error('Expected JSON response but got:', contentType);
          throw new Error('Authentication required - please log in again');
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      // Enhanced error handling for common issues
      if (error.message.includes('Unexpected token')) {
        console.error('Failed to parse JSON response - likely authentication redirect');
        error.message = 'Authentication required - please refresh the page to log in';
      }
      
      window.Utils?.handleError(error, 'Get Notification Count');
      throw error;
    }
  }

  /**
   * Update notification in DOM
   * @param {string} notificationId - Notification ID
   * @param {Object} updates - Updates to apply
   */
  updateNotificationInDOM(notificationId, updates = {}) {
    // Update dropdown item
    const dropdownItem = document.querySelector(`[data-notification-id="${notificationId}"]`);
    if (dropdownItem) {
      if (updates.removeUnread) {
        dropdownItem.classList.remove('unread');
        const markReadBtn = dropdownItem.querySelector('.mark-read-btn');
        if (markReadBtn) markReadBtn.remove();
      }
    }

    // Update page item if present
    const pageItem = document.querySelector(`.notifications-page .notification-item[data-notification-id="${notificationId}"]`);
    if (pageItem) {
      if (updates.removeUnread) {
        pageItem.classList.remove('unread');
        const pageBtn = pageItem.querySelector('.mark-read-btn');
        if (pageBtn) pageBtn.remove();
      }
    }
  }

  /**
   * Update all notifications in DOM
   * @param {Object} updates - Updates to apply
   */
  updateAllNotificationsInDOM(updates = {}) {
    if (updates.removeAllUnread) {
      const allUnread = document.querySelectorAll('.notification-item.unread');
      allUnread.forEach(item => {
        item.classList.remove('unread');
        const btn = item.querySelector('.mark-read-btn');
        if (btn) btn.remove();
      });
    }
  }

  /**
   * Get CSRF token
   * @returns {string} CSRF token
   * @private
   */
  getCSRFToken() {
    // Prefer global util if available
    if (typeof window.getCSRFToken === 'function') {
      return window.getCSRFToken();
    }
    
    // Fallback: look for hidden input
    const tokenEl = document.querySelector('[name=csrfmiddlewaretoken]');
    if (tokenEl) {
      return tokenEl.value;
    }
    
    // Fallback: parse cookie directly
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
   * Set base URL for API endpoints
   * @param {string} baseUrl - Base URL
   */
  setBaseUrl(baseUrl) {
    this.baseUrl = baseUrl;
    this.endpoints = {
      dropdown: `${baseUrl}dropdown/`,
      count: `${baseUrl}count/`,
      markRead: (id) => `${baseUrl}${id}/mark-read/`,
      markAllRead: `${baseUrl}mark-all-read/`
    };
  }

  /**
   * Cleanup API module
   */
  destroy() {
    this.isInitialized = false;
  }
}

// Export for use in main application
window.NotificationAPIModule = NotificationAPIModule;

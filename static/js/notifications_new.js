/**
 * Notification System - Main Application
 * @module NotificationSystem
 * @description Main application coordinator for notification system
 * @version 1.0.0
 */

class NotificationSystem {
  constructor() {
    this.modules = {};
    this.isInitialized = false;
    this.config = {
      autoRefreshInterval: 30000,
      maxRetries: 3,
      retryDelay: 1000
    };
  }

  /**
   * Initialize the notification system
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        console.warn('NotificationSystem already initialized');
        return true;
      }

      this.initializeModules();
      this.setupEventListeners();
      this.setupGlobalFunctions();
      this.loadInitialData();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'NotificationSystem Initialization');
      return false;
    }
  }

  /**
   * Initialize all modules
   * @private
   */
  initializeModules() {
    // Initialize each module
    this.modules.dropdown = new window.NotificationDropdownModule();
    this.modules.api = new window.NotificationAPIModule();
    this.modules.badge = new window.NotificationBadgeModule();
    this.modules.events = new window.NotificationEventsModule();
    this.modules.utils = new window.NotificationUtilsModule();
    
    // Initialize modules
    Object.values(this.modules).forEach(module => {
      if (module.init) {
        module.init();
      }
    });
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    // Listen for custom events
    this.modules.events.addEventListener('toggle', () => {
      this.modules.dropdown.toggle();
    });

    this.modules.events.addEventListener('close', () => {
      this.modules.dropdown.close();
    });

    this.modules.events.addEventListener('markRead', (e) => {
      this.handleMarkAsRead(e.detail.notificationId);
    });

    this.modules.events.addEventListener('markAllRead', () => {
      this.handleMarkAllAsRead();
    });

    this.modules.events.addEventListener('focusIn', () => {
      // Handle focus in events
    });

    this.modules.events.addEventListener('focusOut', () => {
      // Handle focus out events
    });
  }

  /**
   * Setup global functions
   * @private
   */
  setupGlobalFunctions() {
    // Global functions for backward compatibility
    window.markAsRead = (notificationId) => {
      this.handleMarkAsRead(notificationId);
    };
    
    window.markAllAsRead = () => {
      this.handleMarkAllAsRead();
    };
    
    window.updateUnreadCount = () => {
      this.modules.badge.forceRefresh();
    };
    
    window.refreshNotifications = () => {
      this.loadNotifications();
    };
  }

  /**
   * Load initial data
   * @private
   */
  async loadInitialData() {
    try {
      await this.loadNotifications();
      await this.updateBadge();
    } catch (error) {
      console.warn('Failed to load initial notification data:', error);
    }
  }

  /**
   * Load notifications
   * @private
   */
  async loadNotifications() {
    try {
      this.modules.dropdown.showLoading();
      
      const html = await this.modules.api.loadNotifications();
      this.modules.dropdown.updateContent(html);
      
      // Bind events to new content
      this.modules.events.bindNotificationEvents(this.modules.dropdown.dropdownContent);
      
    } catch (error) {
      this.modules.dropdown.showError('Failed to load notifications');
      window.Utils?.handleError(error, 'Load Notifications');
    }
  }

  /**
   * Update badge
   * @private
   */
  async updateBadge() {
    try {
      const data = await this.modules.api.getNotificationCount();
      this.modules.badge.updateBadge(data.count);
    } catch (error) {
      console.warn('Failed to update notification badge:', error);
    }
  }

  /**
   * Handle mark as read
   * @param {string} notificationId - Notification ID
   * @private
   */
  async handleMarkAsRead(notificationId) {
    try {
      const data = await this.modules.api.markAsRead(notificationId);
      
      if (data.success) {
        // Update DOM
        this.modules.api.updateNotificationInDOM(notificationId, { removeUnread: true });
        
        // Update badge
        await this.updateBadge();
        
        // Show success message
        this.modules.utils.showNotification(data.message || 'Notification marked as read', 'success');
      }
    } catch (error) {
      this.modules.utils.showNotification('Failed to mark notification as read', 'error');
      window.Utils?.handleError(error, 'Mark as Read');
    }
  }

  /**
   * Handle mark all as read
   * @private
   */
  async handleMarkAllAsRead() {
    try {
      const data = await this.modules.api.markAllAsRead();
      
      if (data.success) {
        // Update DOM
        this.modules.api.updateAllNotificationsInDOM({ removeAllUnread: true });
        
        // Update badge
        this.modules.badge.updateBadge(data.count);
        
        // Show success message
        this.modules.utils.showNotification(data.message || 'All notifications marked as read', 'success');
      }
    } catch (error) {
      this.modules.utils.showNotification('Failed to mark all notifications as read', 'error');
      window.Utils?.handleError(error, 'Mark All as Read');
    }
  }

  /**
   * Get module by name
   * @param {string} moduleName - Name of the module
   * @returns {Object|null} Module instance or null
   */
  getModule(moduleName) {
    return this.modules[moduleName] || null;
  }

  /**
   * Refresh notifications
   */
  refresh() {
    this.loadNotifications();
  }

  /**
   * Force refresh badge
   */
  forceRefreshBadge() {
    this.modules.badge.forceRefresh();
  }

  /**
   * Set auto-refresh interval
   * @param {number} intervalMs - Interval in milliseconds
   */
  setAutoRefreshInterval(intervalMs) {
    this.config.autoRefreshInterval = intervalMs;
    this.modules.badge.setRefreshInterval(intervalMs);
  }

  /**
   * Enable auto-refresh
   */
  enableAutoRefresh() {
    this.modules.badge.enableAutoRefresh();
  }

  /**
   * Disable auto-refresh
   */
  disableAutoRefresh() {
    this.modules.badge.disableAutoRefresh();
  }

  /**
   * Get current notification count
   * @returns {number} Current count
   */
  getNotificationCount() {
    return this.modules.badge.getCurrentCount();
  }

  /**
   * Check if dropdown is open
   * @returns {boolean} Open state
   */
  isDropdownOpen() {
    return this.modules.dropdown.isDropdownOpen();
  }

  /**
   * Open dropdown
   */
  openDropdown() {
    this.modules.dropdown.open();
  }

  /**
   * Close dropdown
   */
  closeDropdown() {
    this.modules.dropdown.close();
  }

  /**
   * Toggle dropdown
   */
  toggleDropdown() {
    this.modules.dropdown.toggle();
  }

  /**
   * Cleanup notification system
   */
  destroy() {
    // Cleanup all modules
    Object.values(this.modules).forEach(module => {
      if (module.destroy) {
        module.destroy();
      }
    });
    
    this.modules = {};
    this.isInitialized = false;
  }
}

// Initialize notification system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.notificationSystem = new NotificationSystem();
  window.notificationSystem.init();
});

/**
 * Notification Badge Module
 * @module NotificationBadgeModule
 * @description Handles notification badge updates and count management
 * @version 1.0.0
 */

class NotificationBadgeModule {
  constructor() {
    this.isInitialized = false;
    this.badge = null;
    this.currentCount = 0;
    this.refreshInterval = null;
    this.autoRefreshEnabled = true;
    this.refreshIntervalMs = 30000; // 30 seconds
  }

  /**
   * Initialize badge module
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        return true;
      }

      this.getElements();
      if (!this.validateElements()) {
        return false;
      }

      this.startAutoRefresh();
      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'NotificationBadgeModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.badge = document.getElementById('notification-badge');
  }

  /**
   * Validate required elements exist
   * @returns {boolean} Validation result
   * @private
   */
  validateElements() {
    if (!this.badge) {
      return false;
    }
    return true;
  }

  /**
   * Update badge with new count
   * @param {number} count - Notification count
   */
  updateBadge(count) {
    if (!this.badge) return;

    this.currentCount = count;
    this.badge.textContent = count;
    this.badge.style.display = count > 0 ? 'block' : 'none';
    
    // Update page subtitle if present
    this.updatePageSubtitle(count);
  }

  /**
   * Update page subtitle
   * @param {number} count - Notification count
   * @private
   */
  updatePageSubtitle(count) {
    const subtitle = document.querySelector('.page-subtitle');
    if (subtitle) {
      subtitle.textContent = `You have ${count} unread notifications`;
    }
  }

  /**
   * Get current badge count
   * @returns {number} Current count
   */
  getCurrentCount() {
    return this.currentCount;
  }

  /**
   * Show badge
   */
  show() {
    if (this.badge) {
      this.badge.style.display = 'block';
    }
  }

  /**
   * Hide badge
   */
  hide() {
    if (this.badge) {
      this.badge.style.display = 'none';
    }
  }

  /**
   * Animate badge update
   * @param {number} newCount - New count
   */
  animateUpdate(newCount) {
    if (!this.badge) return;

    // Add animation class
    this.badge.classList.add('badge-update');
    
    // Update count
    this.updateBadge(newCount);
    
    // Remove animation class after animation
    setTimeout(() => {
      this.badge.classList.remove('badge-update');
    }, 300);
  }

  /**
   * Start auto-refresh
   * @private
   */
  startAutoRefresh() {
    if (!this.autoRefreshEnabled) return;

    this.refreshInterval = setInterval(() => {
      this.refreshCount();
    }, this.refreshIntervalMs);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Refresh badge count
   */
  async refreshCount() {
    try {
      // Only refresh if dropdown is not open to avoid conflicts
      const dropdown = document.getElementById('notification-dropdown');
      const isDropdownOpen = dropdown && dropdown.classList.contains('open');
      
      if (isDropdownOpen) return;

      const response = await fetch('/app/notifications/count/');
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          
          // Handle authentication status
          if (data.authenticated === false) {
            console.warn('User not authenticated, setting badge to 0');
            this.updateBadge(0);
            return;
          }
          
          this.updateBadge(data.count);
        } else {
          console.warn('Expected JSON response but got HTML, likely authentication redirect');
          this.updateBadge(0);
        }
      }
    } catch (error) {
      if (error.message.includes('Unexpected token')) {
        console.warn('Failed to parse JSON - likely authentication issue, setting badge to 0');
        this.updateBadge(0);
      } else {
        console.warn('Failed to refresh notification count:', error);
      }
    }
  }

  /**
   * Set auto-refresh interval
   * @param {number} intervalMs - Interval in milliseconds
   */
  setRefreshInterval(intervalMs) {
    this.refreshIntervalMs = intervalMs;
    
    // Restart auto-refresh with new interval
    this.stopAutoRefresh();
    this.startAutoRefresh();
  }

  /**
   * Enable auto-refresh
   */
  enableAutoRefresh() {
    this.autoRefreshEnabled = true;
    this.startAutoRefresh();
  }

  /**
   * Disable auto-refresh
   */
  disableAutoRefresh() {
    this.autoRefreshEnabled = false;
    this.stopAutoRefresh();
  }

  /**
   * Force refresh badge
   */
  forceRefresh() {
    this.refreshCount();
  }

  /**
   * Add badge animation class
   * @param {string} animationClass - CSS class to add
   */
  addAnimation(animationClass) {
    if (this.badge) {
      this.badge.classList.add(animationClass);
    }
  }

  /**
   * Remove badge animation class
   * @param {string} animationClass - CSS class to remove
   */
  removeAnimation(animationClass) {
    if (this.badge) {
      this.badge.classList.remove(animationClass);
    }
  }

  /**
   * Get badge element
   * @returns {HTMLElement|null} Badge element
   */
  getBadgeElement() {
    return this.badge;
  }

  /**
   * Cleanup badge module
   */
  destroy() {
    this.stopAutoRefresh();
    this.badge = null;
    this.currentCount = 0;
    this.isInitialized = false;
  }
}

// Export for use in main application
window.NotificationBadgeModule = NotificationBadgeModule;

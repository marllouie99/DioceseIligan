/**
 * Notification Dropdown Module
 * @module NotificationDropdownModule
 * @description Handles notification dropdown UI, animations, and positioning
 * @version 1.0.0
 */

class NotificationDropdownModule {
  constructor() {
    this.isInitialized = false;
    this.dropdown = null;
    this.dropdownContent = null;
    this.isOpen = false;
  }

  /**
   * Initialize dropdown functionality
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

      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'NotificationDropdownModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.dropdown = document.getElementById('notification-dropdown');
    this.dropdownContent = document.getElementById('notification-dropdown-content');
  }

  /**
   * Validate required elements exist
   * @returns {boolean} Validation result
   * @private
   */
  validateElements() {
    if (!this.dropdown || !this.dropdownContent) {
      return false;
    }
    return true;
  }

  /**
   * Open dropdown with animation
   */
  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    if (this.dropdown) {
      this.dropdown.classList.add('open');
    }
    this.dropdownContent.style.display = 'block';
    
    // Add animation class
    setTimeout(() => {
      this.dropdownContent.classList.add('show');
    }, 10);
  }

  /**
   * Close dropdown with animation
   */
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.dropdownContent.classList.remove('show');
    if (this.dropdown) {
      this.dropdown.classList.remove('open');
    }
    
    // Hide after animation
    setTimeout(() => {
      this.dropdownContent.style.display = 'none';
    }, 200);
  }

  /**
   * Toggle dropdown state
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Check if dropdown is open
   * @returns {boolean} Open state
   */
  isDropdownOpen() {
    return this.isOpen;
  }

  /**
   * Update dropdown content
   * @param {string} html - HTML content to set
   */
  updateContent(html) {
    if (this.dropdownContent) {
      const safe = this.sanitizeHTML(html);
      this.dropdownContent.innerHTML = safe;
    }
  }

  /**
   * Get dropdown content
   * @returns {string} Current HTML content
   */
  getContent() {
    return this.dropdownContent ? this.dropdownContent.innerHTML : '';
  }

  /**
   * Show loading state in dropdown
   */
  showLoading() {
    if (this.dropdownContent) {
      this.dropdownContent.innerHTML = '<div class="notification-loading">Loading notifications...</div>';
    }
  }

  /**
   * Show error state in dropdown
   * @param {string} message - Error message
   */
  showError(message = 'Failed to load notifications') {
    if (this.dropdownContent) {
      this.dropdownContent.innerHTML = `<div class="notification-error">${message}</div>`;
    }
  }

  /**
   * Show empty state in dropdown
   * @param {string} message - Empty state message
   */
  showEmpty(message = 'No notifications') {
    if (this.dropdownContent) {
      this.dropdownContent.innerHTML = `<div class="notification-empty">${message}</div>`;
    }
  }

  /**
   * Sanitize HTML by removing script tags, inline event handlers, and javascript: URLs
   * @param {string} html
   * @returns {string}
   * @private
   */
  sanitizeHTML(html) {
    try {
      const template = document.createElement('template');
      template.innerHTML = String(html);
      // Remove script tags
      template.content.querySelectorAll('script').forEach((el) => el.remove());
      // Remove inline event handlers and javascript: URLs
      const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT, null);
      let node = walker.nextNode();
      while (node) {
        // Remove on* attributes
        [...node.attributes].forEach(attr => {
          const name = attr.name.toLowerCase();
          if (name.startsWith('on')) {
            node.removeAttribute(attr.name);
          }
          if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(attr.value)) {
            node.removeAttribute(attr.name);
          }
        });
        node = walker.nextNode();
      }
      return template.innerHTML;
    } catch (e) {
      return String(html);
    }
  }

  /**
   * Position dropdown relative to trigger
   * @param {HTMLElement} trigger - Trigger element
   */
  positionDropdown(trigger) {
    if (!this.dropdownContent || !trigger) return;

    const rect = trigger.getBoundingClientRect();
    const dropdownRect = this.dropdownContent.getBoundingClientRect();
    
    // Calculate position
    const left = Math.max(8, rect.right - dropdownRect.width);
    const top = rect.bottom + 6;
    
    this.dropdownContent.style.position = 'fixed';
    this.dropdownContent.style.left = left + 'px';
    this.dropdownContent.style.top = top + 'px';
    this.dropdownContent.style.right = 'auto';
    this.dropdownContent.style.zIndex = '10000';
  }

  /**
   * Cleanup dropdown module
   */
  destroy() {
    this.dropdown = null;
    this.dropdownContent = null;
    this.isOpen = false;
    this.isInitialized = false;
  }
}

// Export for use in main application
window.NotificationDropdownModule = NotificationDropdownModule;

/**
 * Notification Events Module
 * @module NotificationEventsModule
 * @description Handles notification event handling and user interactions
 * @version 1.0.0
 */

class NotificationEventsModule {
  constructor() {
    this.isInitialized = false;
    this.eventHandlers = new Map();
    this.boundEvents = new Set();
  }

  /**
   * Initialize events module
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        console.warn('NotificationEventsModule already initialized');
        return true;
      }

      this.setupEventHandlers();
      this.bindGlobalEvents();
      this.isInitialized = true;
      console.log('NotificationEventsModule initialized successfully');
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'NotificationEventsModule Initialization');
      return false;
    }
  }

  /**
   * Setup event handlers
   * @private
   */
  setupEventHandlers() {
    this.eventHandlers.set('toggle', this.handleToggle.bind(this));
    this.eventHandlers.set('markRead', this.handleMarkRead.bind(this));
    this.eventHandlers.set('markAllRead', this.handleMarkAllRead.bind(this));
    this.eventHandlers.set('closeOnOutside', this.handleCloseOnOutside.bind(this));
    this.eventHandlers.set('preventClose', this.handlePreventClose.bind(this));
  }

  /**
   * Bind global events
   * @private
   */
  bindGlobalEvents() {
    // Toggle dropdown
    const toggleBtn = document.getElementById('notification-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', this.eventHandlers.get('toggle'));
      this.boundEvents.add('toggle');
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', this.eventHandlers.get('closeOnOutside'));
    this.boundEvents.add('closeOnOutside');

    // Prevent dropdown from closing when clicking inside
    const dropdownContent = document.getElementById('notification-dropdown-content');
    if (dropdownContent) {
      dropdownContent.addEventListener('click', this.eventHandlers.get('preventClose'));
      this.boundEvents.add('preventClose');
    }
  }

  /**
   * Bind notification events
   * @param {HTMLElement} container - Container element
   */
  bindNotificationEvents(container) {
    if (!container) return;

    // Bind mark as read buttons
    const markReadBtns = container.querySelectorAll('.mark-read-btn');
    markReadBtns.forEach(btn => {
      btn.addEventListener('click', this.eventHandlers.get('markRead'));
    });

    // Bind mark all as read button
    const markAllBtn = container.querySelector('.mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', this.eventHandlers.get('markAllRead'));
    }

    // Tabs: Notifications / Messages
    const tabButtons = container.querySelectorAll('.notif-tab-btn');
    if (tabButtons && tabButtons.length) {
      tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = btn.getAttribute('data-target');
          const panelsWrapper = container.querySelector('.notif-panels');
          if (!targetId || !panelsWrapper) return;
          const panels = panelsWrapper.querySelectorAll('.notif-panel');
          panels.forEach(p => p.classList.remove('active'));
          const targetPanel = panelsWrapper.querySelector(`#${CSS.escape(targetId)}`);
          if (targetPanel) targetPanel.classList.add('active');
          tabButtons.forEach(tb => tb.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    }
  }

  /**
   * Handle toggle dropdown
   * @param {Event} e - Click event
   * @private
   */
  handleToggle(e) {
    e.stopPropagation();
    this.triggerEvent('toggle');
  }

  /**
   * Handle mark as read
   * @param {Event} e - Click event
   * @private
   */
  handleMarkRead(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const parent = e.target.closest('.notification-item');
    const notificationId = parent ? parent.dataset.notificationId : null;
    
    if (notificationId) {
      this.triggerEvent('markRead', { notificationId });
    }
  }

  /**
   * Handle mark all as read
   * @param {Event} e - Click event
   * @private
   */
  handleMarkAllRead(e) {
    e.preventDefault();
    this.triggerEvent('markAllRead');
  }

  /**
   * Handle close on outside click
   * @param {Event} e - Click event
   * @private
   */
  handleCloseOnOutside(e) {
    const dropdown = document.getElementById('notification-dropdown');
    const isOpen = dropdown && dropdown.classList.contains('open');
    
    if (isOpen && !dropdown.contains(e.target)) {
      this.triggerEvent('close');
    }
  }

  /**
   * Handle prevent close on inside click
   * @param {Event} e - Click event
   * @private
   */
  handlePreventClose(e) {
    e.stopPropagation();
  }

  /**
   * Trigger custom event
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   * @private
   */
  triggerEvent(eventName, data = {}) {
    const event = new CustomEvent(`notification:${eventName}`, {
      detail: { ...data, module: this }
    });
    document.dispatchEvent(event);
  }

  /**
   * Add event listener
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler
   */
  addEventListener(eventName, handler) {
    document.addEventListener(`notification:${eventName}`, handler);
  }

  /**
   * Remove event listener
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler
   */
  removeEventListener(eventName, handler) {
    document.removeEventListener(`notification:${eventName}`, handler);
  }

  /**
   * Bind keyboard events
   */
  bindKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.triggerEvent('close');
      }
    });
    this.boundEvents.add('keyboard');
  }

  /**
   * Unbind keyboard events
   */
  unbindKeyboardEvents() {
    document.removeEventListener('keydown', this.handleKeyboard.bind(this));
    this.boundEvents.delete('keyboard');
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e - Keyboard event
   * @private
   */
  handleKeyboard(e) {
    if (e.key === 'Escape') {
      this.triggerEvent('close');
    }
  }

  /**
   * Bind focus events
   */
  bindFocusEvents() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
      dropdown.addEventListener('focusin', this.handleFocusIn.bind(this));
      dropdown.addEventListener('focusout', this.handleFocusOut.bind(this));
      this.boundEvents.add('focus');
    }
  }

  /**
   * Handle focus in
   * @param {Event} e - Focus event
   * @private
   */
  handleFocusIn(e) {
    this.triggerEvent('focusIn', { target: e.target });
  }

  /**
   * Handle focus out
   * @param {Event} e - Focus event
   * @private
   */
  handleFocusOut(e) {
    this.triggerEvent('focusOut', { target: e.target });
  }

  /**
   * Unbind all events
   */
  unbindAllEvents() {
    // Remove all bound event listeners
    this.boundEvents.forEach(eventType => {
      // Simplified placeholder
    });
    
    this.boundEvents.clear();
  }

  /**
   * Cleanup events module
   */
  destroy() {
    this.unbindAllEvents();
    this.eventHandlers.clear();
    this.isInitialized = false;
  }
}

// Export for use in main application
window.NotificationEventsModule = NotificationEventsModule;

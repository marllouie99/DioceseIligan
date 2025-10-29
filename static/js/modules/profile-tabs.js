/**
 * Profile Tabs Module
 * @module ProfileTabsModule
 * @description Handles profile page tab navigation and content switching
 * @version 1.0.0
 */

class ProfileTabsModule {
  constructor() {
    this.isInitialized = false;
    this.navTabs = [];
    this.tabContents = {};
    this.activeTab = 'overview';
  }

  /**
   * Initialize tabs functionality
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

      this.bindEvents();
      this.initializeDefaultTab();
      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ProfileTabsModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.navTabs = document.querySelectorAll('.nav-tab');
    this.tabContents = {
      overview: document.getElementById('overview-content'),
      activity: document.getElementById('activity-content'),
      donations: document.getElementById('donations-content'),
      settings: document.getElementById('settings-content')
    };
  }

  /**
   * Validate required elements exist
   * @returns {boolean} Validation result
   * @private
   */
  validateElements() {
    if (this.navTabs.length === 0) {
      return false;
    }
    return true;
  }

  /**
   * Bind event listeners
   * @private
   */
  bindEvents() {
    this.navTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = tab.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });
  }

  /**
   * Initialize default tab
   * @private
   */
  initializeDefaultTab() {
    // Check for tab parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    console.log('[ProfileTabs] URL tab parameter:', tabParam);
    console.log('[ProfileTabs] Available tabs:', Object.keys(this.tabContents));
    
    if (tabParam && this.tabContents[tabParam]) {
      // Switch to tab specified in URL
      console.log('[ProfileTabs] Switching to tab from URL:', tabParam);
      this.switchTab(tabParam);
    } else {
      // Use default active tab
      const activeTab = document.querySelector('.nav-tab.active');
      if (activeTab) {
        const tabName = activeTab.getAttribute('data-tab');
        console.log('[ProfileTabs] Switching to default active tab:', tabName);
        this.switchTab(tabName);
      }
    }
  }

  /**
   * Switch to specified tab
   * @param {string} tabName - Name of tab to switch to
   */
  switchTab(tabName) {
    if (!tabName) return;

    // Update active tab
    this.navTabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      }
    });

    // Hide all content
    Object.values(this.tabContents).forEach(content => {
      if (content) {
        content.style.display = 'none';
      }
    });

    // Show target content
    const targetContent = this.tabContents[tabName];
    if (targetContent) {
      targetContent.style.display = 'block';
    }

    this.activeTab = tabName;
    this.triggerEvent('tabChanged', { tabName, previousTab: this.activeTab });
  }

  /**
   * Get current active tab
   * @returns {string} Current active tab name
   */
  getActiveTab() {
    return this.activeTab;
  }

  /**
   * Check if tab is active
   * @param {string} tabName - Tab name to check
   * @returns {boolean} True if tab is active
   */
  isTabActive(tabName) {
    return this.activeTab === tabName;
  }

  /**
   * Get tab content element
   * @param {string} tabName - Tab name
   * @returns {HTMLElement|null} Tab content element
   */
  getTabContent(tabName) {
    return this.tabContents[tabName] || null;
  }

  /**
   * Add new tab dynamically
   * @param {string} tabName - Tab name
   * @param {HTMLElement} tabElement - Tab element
   * @param {HTMLElement} contentElement - Content element
   */
  addTab(tabName, tabElement, contentElement) {
    this.tabContents[tabName] = contentElement;
    
    tabElement.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchTab(tabName);
    });
    
    this.navTabs = document.querySelectorAll('.nav-tab');
  }

  /**
   * Remove tab dynamically
   * @param {string} tabName - Tab name to remove
   */
  removeTab(tabName) {
    delete this.tabContents[tabName];
    this.navTabs = document.querySelectorAll('.nav-tab');
    
    if (this.activeTab === tabName) {
      this.switchTab('overview');
    }
  }

  /**
   * Refresh tab elements
   */
  refresh() {
    this.getElements();
    this.bindEvents();
  }

  /**
   * Trigger custom event
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   * @private
   */
  triggerEvent(eventName, data = {}) {
    const event = new CustomEvent(`profile:${eventName}`, {
      detail: { ...data, module: this }
    });
    document.dispatchEvent(event);
  }

  /**
   * Cleanup tabs module
   */
  destroy() {
    this.navTabs = [];
    this.tabContents = {};
    this.activeTab = 'overview';
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ProfileTabsModule = ProfileTabsModule;



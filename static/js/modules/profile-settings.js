/**
 * Profile Settings Module
 * @module ProfileSettingsModule
 * @description Handles settings navigation and section management
 * @version 1.0.0
 */

class ProfileSettingsModule {
  constructor() {
    this.isInitialized = false;
    this.settingsNavLinks = [];
    this.settingsSections = [];
    this.scrollContainer = null;
    this.observer = null;
    this.activeSection = 'account-settings';
  }

  /**
   * Initialize settings functionality
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
      this.initializeScrollObserver();
      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ProfileSettingsModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.settingsNavLinks = document.querySelectorAll('.settings-nav-link');
    this.settingsSections = document.querySelectorAll('.settings-section');
    this.scrollContainer = document.querySelector('.settings-content');
  }

  /**
   * Validate required elements exist
   * @returns {boolean} Validation result
   * @private
   */
  validateElements() {
    if (this.settingsNavLinks.length === 0) {
      return false;
    }
    return true;
  }

  /**
   * Bind event listeners
   * @private
   */
  bindEvents() {
    this.settingsNavLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleNavClick(link);
      });
    });
  }

  /**
   * Handle navigation link click
   * @param {HTMLElement} link - Clicked navigation link
   * @private
   */
  handleNavClick(link) {
    // Ensure we're on the settings tab first
    this.ensureSettingsTabActive();
    
    const targetSection = link.getAttribute('data-section');
    this.navigateToSection(targetSection);
  }

  /**
   * Ensure settings tab is active
   * @private
   */
  ensureSettingsTabActive() {
    const settingsTab = document.querySelector('[data-tab="settings"]');
    if (settingsTab && !settingsTab.classList.contains('active')) {
      settingsTab.click();
    }
  }

  /**
   * Navigate to specific section
   * @param {string} sectionId - Section ID to navigate to
   */
  navigateToSection(sectionId) {
    const targetElement = document.getElementById(sectionId);
    if (!targetElement) return;

    // Scroll to target section
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    // Add highlight effect
    this.highlightSection(targetElement);
    
    // Update active navigation
    this.updateActiveNav(sectionId);
    
    this.activeSection = sectionId;
    this.triggerEvent('sectionChanged', { sectionId });
  }

  /**
   * Highlight section with visual effect
   * @param {HTMLElement} element - Element to highlight
   * @private
   */
  highlightSection(element) {
    element.style.transition = 'box-shadow 0.3s ease';
    element.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.2)';
    
    // Remove highlight after 2 seconds
    setTimeout(() => {
      element.style.boxShadow = '';
    }, 2000);
  }

  /**
   * Update active navigation state
   * @param {string} sectionId - Active section ID
   * @private
   */
  updateActiveNav(sectionId) {
    this.settingsNavLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-section') === sectionId) {
        link.classList.add('active');
      }
    });
  }

  /**
   * Initialize scroll observer for automatic section highlighting
   * @private
   */
  initializeScrollObserver() {
    if (!this.scrollContainer || this.settingsSections.length === 0) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          this.updateActiveNav(sectionId);
          this.activeSection = sectionId;
        }
      });
    }, {
      root: this.scrollContainer,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0.1
    });

    this.settingsSections.forEach(section => {
      this.observer.observe(section);
    });
  }

  /**
   * Get current active section
   * @returns {string} Current active section ID
   */
  getActiveSection() {
    return this.activeSection;
  }

  /**
   * Check if section is active
   * @param {string} sectionId - Section ID to check
   * @returns {boolean} True if section is active
   */
  isSectionActive(sectionId) {
    return this.activeSection === sectionId;
  }

  /**
   * Get section element
   * @param {string} sectionId - Section ID
   * @returns {HTMLElement|null} Section element
   */
  getSection(sectionId) {
    return document.getElementById(sectionId);
  }

  /**
   * Scroll to section
   * @param {string} sectionId - Section ID to scroll to
   * @param {Object} options - Scroll options
   */
  scrollToSection(sectionId, options = {}) {
    const element = this.getSection(sectionId);
    if (!element) return;

    const defaultOptions = {
      behavior: 'smooth',
      block: 'start'
    };

    element.scrollIntoView({ ...defaultOptions, ...options });
  }

  /**
   * Refresh settings elements
   */
  refresh() {
    this.getElements();
    this.bindEvents();
    
    if (this.observer) {
      this.observer.disconnect();
    }
    this.initializeScrollObserver();
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
   * Cleanup settings module
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.settingsNavLinks = [];
    this.settingsSections = [];
    this.scrollContainer = null;
    this.activeSection = 'account-settings';
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ProfileSettingsModule = ProfileSettingsModule;



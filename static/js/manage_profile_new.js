/**
 * Manage Profile System - Main Application
 * @module ManageProfileSystem
 * @description Main application coordinator for profile management
 * @version 1.0.0
 */

class ManageProfileSystem {
  constructor() {
    this.modules = {};
    this.isInitialized = false;
    this.config = {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    };
  }

  /**
   * Initialize the manage profile system
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        return true;
      }

      this.initializeModules();
      this.setupEventListeners();
      this.setupGlobalFunctions();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ManageProfileSystem Initialization');
      return false;
    }
  }

  /**
   * Initialize all modules
   * @private
   */
  initializeModules() {
    // Initialize each module with error handling
    const moduleClasses = {
      tabs: 'ProfileTabsModule',
      settings: 'ProfileSettingsModule', 
      forms: 'ProfileFormsModule',
      modals: 'ProfileModalsModule',
      upload: 'ProfileUploadModule',
      display: 'ProfileDisplayManagerModule'
    };

    for (const [key, className] of Object.entries(moduleClasses)) {
      try {
        if (window[className]) {
          this.modules[key] = new window[className]();
        } else {
          console.warn(`Module ${className} not found, skipping initialization`);
        }
      } catch (error) {
        console.error(`Failed to initialize ${className}:`, error);
      }
    }
    
    // Initialize modules
    Object.values(this.modules).forEach(module => {
      if (module && module.init) {
        try {
          module.init();
        } catch (error) {
          console.error('Module initialization error:', error);
        }
      }
    });
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    // Listen for custom events
    document.addEventListener('profile:profileUpdated', (e) => {
      this.handleProfileUpdated(e.detail.data);
    });

    document.addEventListener('profile:closeModal', () => {
      this.modules.modals.closeProfileEditModal();
    });

    document.addEventListener('profile:avatarChanged', (e) => {
      this.handleAvatarChanged(e.detail);
    });

    document.addEventListener('profile:profileDisplayUpdated', (e) => {
      this.handleDisplayUpdated(e.detail.data);
    });

    document.addEventListener('profile:tabChanged', (e) => {
      this.handleTabChanged(e.detail);
    });

    document.addEventListener('profile:sectionChanged', (e) => {
      this.handleSectionChanged(e.detail);
    });
  }

  /**
   * Setup global functions
   * @private
   */
  setupGlobalFunctions() {
    // Global functions for backward compatibility
    window.openProfileEditModal = () => {
      this.modules.modals.openProfileEditModal();
    };
    
    window.closeProfileEditModal = () => {
      this.modules.modals.closeProfileEditModal();
    };
    
    window.openPasswordModal = () => {
      this.modules.modals.openPasswordModal();
    };
    
    window.openDeleteAccountModal = () => {
    };
    
    window.displayFormErrors = (errors) => {
      if (this.modules.forms?.errorHandler?.display) {
        this.modules.forms.errorHandler.display(errors);
      } else {
        console.error('Form errors:', errors);
      }
    };
    
    window.handleProfileFormSubmit = (event) => {
      if (this.modules.forms?.handleProfileFormSubmit) {
        this.modules.forms.handleProfileFormSubmit(event);
      } else {
        console.warn('Profile form handler not available');
      }
    };
    
    // Make modals globally available
    window.profileModals = this.modules.modals;
  }

  /**
   * Handle profile updated event
   * @param {Object} profileData - Updated profile data
   * @private
   */
  handleProfileUpdated(profileData) {
    // Update display with new data
    this.modules.display.updateProfileDisplay(profileData);
    
    // Show success notification
    this.showNotification('Profile updated successfully!', 'success');
  }

  /**
   * Handle avatar changed event
   * @param {Object} data - Avatar change data
   * @private
   */
  handleAvatarChanged(data) {
    // You can add additional logic here for avatar changes
    }

  /**
   * Handle display updated event
   * @param {Object} data - Display update data
   * @private
   */
  handleDisplayUpdated(data) {
    // You can add additional logic here for display updates
    }

  /**
   * Handle tab changed event
   * @param {Object} data - Tab change data
   * @private
   */
  handleTabChanged(data) {
    }

  /**
   * Handle section changed event
   * @param {Object} data - Section change data
   * @private
   */
  handleSectionChanged(data) {
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
   * Open profile edit modal
   */
  openProfileEditModal() {
    this.modules.modals.openProfileEditModal();
  }

  /**
   * Close profile edit modal
   */
  closeProfileEditModal() {
    this.modules.modals.closeProfileEditModal();
  }

  /**
   * Switch to tab
   * @param {string} tabName - Tab name to switch to
   */
  switchTab(tabName) {
    this.modules.tabs.switchTab(tabName);
  }

  /**
   * Navigate to settings section
   * @param {string} sectionId - Section ID to navigate to
   */
  navigateToSection(sectionId) {
    this.modules.settings.navigateToSection(sectionId);
  }

  /**
   * Update profile display
   * @param {Object} profileData - Profile data
   */
  updateDisplay(profileData) {
    this.modules.display.updateProfileDisplay(profileData);
  }

  /**
   * Reset profile form
   */
  resetForm() {
    this.modules.forms.reset();
  }

  /**
   * Validate profile form
   * @returns {boolean} Validation result
   */
  validateForm() {
    return this.modules.forms.validate();
  }

  /**
   * Get current avatar
   * @returns {string|null} Current avatar source
   */
  getCurrentAvatar() {
    return this.modules.upload.getCurrentAvatar();
  }

  /**
   * Set avatar
   * @param {string} src - Avatar source
   */
  setAvatar(src) {
    this.modules.upload.setAvatar(src);
  }

  /**
   * Clear avatar
   */
  clearAvatar() {
    this.modules.upload.clearAvatar();
  }

  /**
   * Set configuration
   * @param {Object} config - Configuration object
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
    
    // Update module configurations
    if (config.maxFileSize) {
      this.modules.upload.setMaxFileSize(config.maxFileSize);
    }
    
    if (config.allowedImageTypes) {
      this.modules.upload.setAllowedTypes(config.allowedImageTypes);
    }
  }

  /**
   * Get configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Refresh all modules
   */
  refresh() {
    this.modules.tabs.refresh();
    this.modules.settings.refresh();
    this.modules.display.refreshElements();
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   * @private
   */
  showNotification(message, type) {
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      console.log(`${type}: ${message}`);
    }
  }

  /**
   * Cleanup manage profile system
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

// Make ManageProfileSystem available globally
window.ManageProfileSystem = ManageProfileSystem;

// Initialize the system when DOM is ready (fallback if not initialized manually)
document.addEventListener('DOMContentLoaded', function() {
  // Check if already initialized
  if (!window.profileSystemInitialized) {
    try {
      const profileSystem = new ManageProfileSystem();
      if (profileSystem.init()) {
        console.log('ManageProfileSystem initialized successfully');
        window.profileSystemInitialized = true;
      }
    } catch (error) {
      console.error('ManageProfileSystem initialization failed:', error);
    }
  }
});

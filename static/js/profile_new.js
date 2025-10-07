/**
 * Profile System - Main Application
 * @module ProfileSystem
 * @description Main application coordinator for profile management
 * @version 1.0.0
 */

class ProfileSystem {
  constructor() {
    this.modules = {};
    this.isInitialized = false;
    this.config = {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    };
  }

  /**
   * Initialize the profile system
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
      window.Utils?.handleError(error, 'ProfileSystem Initialization');
      return false;
    }
  }

  /**
   * Initialize all modules
   * @private
   */
  initializeModules() {
    // Initialize each module
    this.modules.modal = new window.ProfileModalModule();
    this.modules.form = new window.ProfileFormModule();
    this.modules.avatar = new window.ProfileAvatarModule();
    this.modules.display = new window.ProfileDisplayModule();
    this.modules.utils = new window.ProfileUtilsModule();
    
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
    document.addEventListener('profile:profileUpdated', (e) => {
      this.handleProfileUpdated(e.detail.data);
    });

    document.addEventListener('profile:closeModal', () => {
      this.modules.modal.close();
    });

    document.addEventListener('profile:avatarChanged', (e) => {
      this.handleAvatarChanged(e.detail);
    });

    document.addEventListener('profile:profileDisplayUpdated', (e) => {
      this.handleDisplayUpdated(e.detail.data);
    });
  }

  /**
   * Setup global functions
   * @private
   */
  setupGlobalFunctions() {
    // Global functions for backward compatibility
    window.updateProfileDisplay = (profileData) => {
      this.modules.display.updateProfileDisplay(profileData);
    };
    
    window.displayFormErrors = (errors) => {
      this.modules.form.displayFormErrors(errors);
    };
    
    window.openProfileModal = () => {
      this.modules.modal.open();
    };
    
    window.closeProfileModal = () => {
      this.modules.modal.close();
    };
    
    window.toggleProfileModal = () => {
      this.modules.modal.toggle();
    };
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
    this.modules.utils.showNotification('Profile updated successfully!', 'success');
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
   * Get module by name
   * @param {string} moduleName - Name of the module
   * @returns {Object|null} Module instance or null
   */
  getModule(moduleName) {
    return this.modules[moduleName] || null;
  }

  /**
   * Open profile modal
   */
  openModal() {
    this.modules.modal.open();
  }

  /**
   * Close profile modal
   */
  closeModal() {
    this.modules.modal.close();
  }

  /**
   * Toggle profile modal
   */
  toggleModal() {
    this.modules.modal.toggle();
  }

  /**
   * Check if modal is open
   * @returns {boolean} Modal open state
   */
  isModalOpen() {
    return this.modules.modal.isModalOpen();
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
    this.modules.form.reset();
  }

  /**
   * Validate profile form
   * @returns {boolean} Validation result
   */
  validateForm() {
    return this.modules.form.validate();
  }

  /**
   * Get current avatar
   * @returns {string|null} Current avatar source
   */
  getCurrentAvatar() {
    return this.modules.avatar.getCurrentAvatar();
  }

  /**
   * Set avatar
   * @param {string} src - Avatar source
   */
  setAvatar(src) {
    this.modules.avatar.setAvatar(src);
  }

  /**
   * Clear avatar
   */
  clearAvatar() {
    this.modules.avatar.clearAvatar();
  }

  /**
   * Set configuration
   * @param {Object} config - Configuration object
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
    
    // Update module configurations
    if (config.maxFileSize) {
      this.modules.avatar.setMaxFileSize(config.maxFileSize);
    }
    
    if (config.allowedImageTypes) {
      this.modules.avatar.setAllowedTypes(config.allowedImageTypes);
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
    this.modules.display.refreshElements();
  }

  /**
   * Cleanup profile system
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

// Initialize profile system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.profileSystem = new ProfileSystem();
  window.profileSystem.init();
});



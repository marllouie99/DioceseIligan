/**
 * Profile Display Module
 * @module ProfileDisplayModule
 * @description Handles profile display updates and UI management
 * @version 1.0.0
 */

class ProfileDisplayModule {
  constructor() {
    this.isInitialized = false;
    this.displayNameElements = [];
    this.initialElements = [];
    this.avatarImg = null;
  }

  /**
   * Initialize display functionality
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        return true;
      }

      this.getElements();
      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ProfileDisplayModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.displayNameElements = document.querySelectorAll('.profile-name, .user-display-name');
    this.initialElements = document.querySelectorAll('.avatar, .user-initial');
    this.avatarImg = document.querySelector('.avatar-image');
  }

  /**
   * Update profile display with new data
   * @param {Object} profileData - Profile data from server
   */
  updateProfileDisplay(profileData) {
    if (!profileData) return;

    // Update display name
    this.updateDisplayName(profileData.display_name);
    
    // Update user initial
    this.updateUserInitial(profileData.user_initial);
    
    // Update profile image
    this.updateProfileImage(profileData.profile_image);
    
    // Trigger update event
    this.triggerEvent('profileDisplayUpdated', { data: profileData });
  }

  /**
   * Update display name
   * @param {string} displayName - New display name
   * @private
   */
  updateDisplayName(displayName) {
    if (!displayName) return;

    this.displayNameElements.forEach(el => {
      if (el) {
        el.textContent = displayName;
        el.classList.add('updated');
        
        // Remove animation class after animation
        setTimeout(() => {
          el.classList.remove('updated');
        }, 300);
      }
    });
  }

  /**
   * Update user initial
   * @param {string} userInitial - New user initial
   * @private
   */
  updateUserInitial(userInitial) {
    if (!userInitial) return;

    this.initialElements.forEach(el => {
      if (el) {
        el.textContent = userInitial;
        el.classList.add('updated');
        
        // Remove animation class after animation
        setTimeout(() => {
          el.classList.remove('updated');
        }, 300);
      }
    });
  }

  /**
   * Update profile image
   * @param {string} profileImage - New profile image URL
   * @private
   */
  updateProfileImage(profileImage) {
    if (!profileImage || !this.avatarImg) return;

    // Add loading state
    this.avatarImg.classList.add('loading');
    
    // Create new image to preload
    const img = new Image();
    img.onload = () => {
      this.avatarImg.src = profileImage;
      this.avatarImg.classList.remove('loading');
      this.avatarImg.classList.add('updated');
      
      // Remove animation class after animation
      setTimeout(() => {
        this.avatarImg.classList.remove('updated');
      }, 300);
    };
    
    img.onerror = () => {
      this.avatarImg.classList.remove('loading');
      };
    
    img.src = profileImage;
  }

  /**
   * Get current display name
   * @returns {string} Current display name
   */
  getCurrentDisplayName() {
    return this.displayNameElements.length > 0 ? this.displayNameElements[0].textContent : '';
  }

  /**
   * Get current user initial
   * @returns {string} Current user initial
   */
  getCurrentUserInitial() {
    return this.initialElements.length > 0 ? this.initialElements[0].textContent : '';
  }

  /**
   * Get current profile image
   * @returns {string} Current profile image source
   */
  getCurrentProfileImage() {
    return this.avatarImg ? this.avatarImg.src : '';
  }

  /**
   * Refresh display elements
   */
  refreshElements() {
    this.getElements();
  }

  /**
   * Add display element
   * @param {string} selector - CSS selector
   * @param {string} type - Element type (displayName, initial, avatar)
   */
  addDisplayElement(selector, type) {
    const element = document.querySelector(selector);
    if (!element) return;

    switch (type) {
      case 'displayName':
        this.displayNameElements.push(element);
        break;
      case 'initial':
        this.initialElements.push(element);
        break;
      case 'avatar':
        this.avatarImg = element;
        break;
    }
  }

  /**
   * Remove display element
   * @param {string} selector - CSS selector
   * @param {string} type - Element type
   */
  removeDisplayElement(selector, type) {
    const element = document.querySelector(selector);
    if (!element) return;

    switch (type) {
      case 'displayName':
        this.displayNameElements = this.displayNameElements.filter(el => el !== element);
        break;
      case 'initial':
        this.initialElements = this.initialElements.filter(el => el !== element);
        break;
      case 'avatar':
        if (this.avatarImg === element) {
          this.avatarImg = null;
        }
        break;
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.displayNameElements.forEach(el => {
      if (el) el.classList.add('loading');
    });
    this.initialElements.forEach(el => {
      if (el) el.classList.add('loading');
    });
    if (this.avatarImg) {
      this.avatarImg.classList.add('loading');
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.displayNameElements.forEach(el => {
      if (el) el.classList.remove('loading');
    });
    this.initialElements.forEach(el => {
      if (el) el.classList.remove('loading');
    });
    if (this.avatarImg) {
      this.avatarImg.classList.remove('loading');
    }
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
   * Cleanup display module
   */
  destroy() {
    this.displayNameElements = [];
    this.initialElements = [];
    this.avatarImg = null;
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ProfileDisplayModule = ProfileDisplayModule;



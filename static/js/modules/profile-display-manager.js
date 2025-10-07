/**
 * Profile Display Manager Module
 * @module ProfileDisplayManagerModule
 * @description Handles profile display updates and UI management
 * @version 1.0.0
 */

class ProfileDisplayManagerModule {
  constructor() {
    this.isInitialized = false;
    this.elements = {};
    this.profileUpdater = null;
  }

  /**
   * Initialize display manager functionality
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        return true;
      }

      this.getElements();
      this.initializeProfileUpdater();
      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ProfileDisplayManagerModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.elements = {
      profileName: document.querySelector('.profile-name'),
      profileEmail: document.querySelector('.profile-email'),
      profileBio: document.querySelector('.profile-bio'),
      avatarImage: document.querySelector('.avatar-image'),
      avatarPlaceholder: document.querySelector('.avatar-placeholder'),
      topbarAvatar: document.querySelector('.profile-dropdown .avatar'),
      topbarName: document.querySelector('.profile-dropdown .name')
    };
  }

  /**
   * Initialize profile updater
   * @private
   */
  initializeProfileUpdater() {
    this.profileUpdater = {
      elements: this.elements,
      
      // Update profile card with new data (optimized)
      update(profileData) {
        if (!profileData) return;
        
        // Batch DOM updates for better performance
        const updates = [];
        
        // Update profile name
        if (this.elements.profileName && profileData.display_name) {
          updates.push(() => {
            this.elements.profileName.textContent = profileData.display_name;
            this.elements.profileName.classList.add('updated');
            setTimeout(() => this.elements.profileName.classList.remove('updated'), 300);
          });
        }
        
        // Update profile email
        if (this.elements.profileEmail && profileData.email) {
          updates.push(() => {
            this.elements.profileEmail.textContent = profileData.email;
            this.elements.profileEmail.classList.add('updated');
            setTimeout(() => this.elements.profileEmail.classList.remove('updated'), 300);
          });
        }
        
        // Update profile bio
        if (this.elements.profileBio) {
          updates.push(() => {
            this.elements.profileBio.textContent = profileData.bio || 
              'Passionate about community service and faith-based connections.';
            this.elements.profileBio.classList.add('updated');
            setTimeout(() => this.elements.profileBio.classList.remove('updated'), 300);
          });
        }
        
        // Update profile image
        if (profileData.profile_image) {
          updates.push(() => {
            this.updateProfileImage(profileData.profile_image);
          });
        }
        
        // Update topbar elements
        if (this.elements.topbarAvatar && profileData.user_initial) {
          updates.push(() => {
            this.elements.topbarAvatar.textContent = profileData.user_initial;
            this.elements.topbarAvatar.classList.add('updated');
            setTimeout(() => this.elements.topbarAvatar.classList.remove('updated'), 300);
          });
        }
        
        if (this.elements.topbarName && profileData.display_name) {
          updates.push(() => {
            this.elements.topbarName.textContent = profileData.display_name;
            this.elements.topbarName.classList.add('updated');
            setTimeout(() => this.elements.topbarName.classList.remove('updated'), 300);
          });
        }
        
        // Execute all updates in a single batch
        updates.forEach(update => update());
      },
      
      // Update profile image with loading state
      updateProfileImage(imageUrl) {
        if (this.elements.avatarImage) {
          this.elements.avatarImage.classList.add('loading');
          
          const img = new Image();
          img.onload = () => {
            this.elements.avatarImage.src = imageUrl;
            this.elements.avatarImage.classList.remove('loading');
            this.elements.avatarImage.classList.add('updated');
            setTimeout(() => this.elements.avatarImage.classList.remove('updated'), 300);
          };
          
          img.onerror = () => {
            this.elements.avatarImage.classList.remove('loading');
            };
          
          img.src = imageUrl;
        } else if (this.elements.avatarPlaceholder) {
          // Create image element if it doesn't exist
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = 'Profile Picture';
          img.className = 'avatar-image';
          this.elements.avatarPlaceholder.parentNode.replaceChild(img, this.elements.avatarPlaceholder);
        }
      }
    };
  }

  /**
   * Update profile display with new data
   * @param {Object} profileData - Profile data from server
   */
  updateProfileDisplay(profileData) {
    if (!profileData) return;
    
    this.profileUpdater.update(profileData);
    this.triggerEvent('profileDisplayUpdated', { data: profileData });
  }

  /**
   * Get current display name
   * @returns {string} Current display name
   */
  getCurrentDisplayName() {
    return this.elements.profileName ? this.elements.profileName.textContent : '';
  }

  /**
   * Get current profile email
   * @returns {string} Current profile email
   */
  getCurrentProfileEmail() {
    return this.elements.profileEmail ? this.elements.profileEmail.textContent : '';
  }

  /**
   * Get current profile bio
   * @returns {string} Current profile bio
   */
  getCurrentProfileBio() {
    return this.elements.profileBio ? this.elements.profileBio.textContent : '';
  }

  /**
   * Get current profile image
   * @returns {string} Current profile image source
   */
  getCurrentProfileImage() {
    return this.elements.avatarImage ? this.elements.avatarImage.src : '';
  }

  /**
   * Refresh display elements
   */
  refreshElements() {
    this.getElements();
    this.initializeProfileUpdater();
  }

  /**
   * Add display element
   * @param {string} selector - CSS selector
   * @param {string} type - Element type (profileName, profileEmail, profileBio, avatarImage, topbarAvatar, topbarName)
   */
  addDisplayElement(selector, type) {
    const element = document.querySelector(selector);
    if (!element) return;

    switch (type) {
      case 'profileName':
        this.elements.profileName = element;
        break;
      case 'profileEmail':
        this.elements.profileEmail = element;
        break;
      case 'profileBio':
        this.elements.profileBio = element;
        break;
      case 'avatarImage':
        this.elements.avatarImage = element;
        break;
      case 'topbarAvatar':
        this.elements.topbarAvatar = element;
        break;
      case 'topbarName':
        this.elements.topbarName = element;
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
      case 'profileName':
        if (this.elements.profileName === element) {
          this.elements.profileName = null;
        }
        break;
      case 'profileEmail':
        if (this.elements.profileEmail === element) {
          this.elements.profileEmail = null;
        }
        break;
      case 'profileBio':
        if (this.elements.profileBio === element) {
          this.elements.profileBio = null;
        }
        break;
      case 'avatarImage':
        if (this.elements.avatarImage === element) {
          this.elements.avatarImage = null;
        }
        break;
      case 'topbarAvatar':
        if (this.elements.topbarAvatar === element) {
          this.elements.topbarAvatar = null;
        }
        break;
      case 'topbarName':
        if (this.elements.topbarName === element) {
          this.elements.topbarName = null;
        }
        break;
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    Object.values(this.elements).forEach(el => {
      if (el) el.classList.add('loading');
    });
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    Object.values(this.elements).forEach(el => {
      if (el) el.classList.remove('loading');
    });
  }

  /**
   * Get all display elements
   * @returns {Object} Display elements
   */
  getElements() {
    return { ...this.elements };
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
   * Cleanup display manager module
   */
  destroy() {
    this.elements = {};
    this.profileUpdater = null;
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ProfileDisplayManagerModule = ProfileDisplayManagerModule;



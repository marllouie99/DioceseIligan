/**
 * Profile Avatar Module
 * @module ProfileAvatarModule
 * @description Handles avatar upload, validation, and preview functionality
 * @version 1.0.0
 */

class ProfileAvatarModule {
  constructor() {
    this.isInitialized = false;
    this.uploadBtn = null;
    this.fileInput = null;
    this.avatarImg = null;
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  }

  /**
   * Initialize avatar functionality
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        console.warn('ProfileAvatarModule already initialized');
        return true;
      }

      this.getElements();
      if (!this.validateElements()) {
        return false;
      }

      this.bindEvents();
      this.isInitialized = true;
      console.log('ProfileAvatarModule initialized successfully');
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ProfileAvatarModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.uploadBtn = document.getElementById('avatar-upload-btn') || document.querySelector('.avatar-upload-btn');
    this.fileInput = document.getElementById('id_profile_image');
    this.avatarImg = document.querySelector('.avatar-image');
  }

  /**
   * Validate required elements exist
   * @returns {boolean} Validation result
   * @private
   */
  validateElements() {
    if (!this.uploadBtn || !this.fileInput) {
      console.warn('Avatar upload elements not found');
      return false;
    }
    return true;
  }

  /**
   * Bind event listeners
   * @private
   */
  bindEvents() {
    // Upload button click
    if (this.uploadBtn) {
      this.uploadBtn.addEventListener('click', () => {
        this.triggerFileInput();
      });
    }

    // File input change
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => {
        this.handleFileSelect(e);
      });
    }
  }

  /**
   * Trigger file input
   * @private
   */
  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.click();
    }
  }

  /**
   * Handle file selection
   * @param {Event} e - File input event
   * @private
   */
  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      this.showNotification(validation.message, 'error');
      return;
    }

    // Preview image
    this.previewImage(file);
  }

  /**
   * Validate file
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   * @private
   */
  validateFile(file) {
    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: 'Please select an image file (JPEG, PNG, GIF, or WebP)'
      };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        message: 'Image size must be less than 5MB'
      };
    }

    return { valid: true };
  }

  /**
   * Preview selected image
   * @param {File} file - Selected file
   * @private
   */
  previewImage(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      this.updateAvatarImage(e.target.result);
      this.triggerEvent('avatarChanged', { file, dataUrl: e.target.result });
    };
    
    reader.onerror = () => {
      this.showNotification('Failed to read image file', 'error');
    };
    
    reader.readAsDataURL(file);
  }

  /**
   * Update avatar image display
   * @param {string} src - Image source
   * @private
   */
  updateAvatarImage(src) {
    if (this.avatarImg) {
      this.avatarImg.src = src;
    }
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
      console.log(`Notification (${type}): ${message}`);
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
   * Set maximum file size
   * @param {number} sizeInBytes - Maximum file size in bytes
   */
  setMaxFileSize(sizeInBytes) {
    this.maxFileSize = sizeInBytes;
  }

  /**
   * Set allowed file types
   * @param {Array<string>} types - Allowed MIME types
   */
  setAllowedTypes(types) {
    this.allowedTypes = types;
  }

  /**
   * Get current avatar image
   * @returns {string|null} Current avatar image source
   */
  getCurrentAvatar() {
    return this.avatarImg ? this.avatarImg.src : null;
  }

  /**
   * Set avatar image
   * @param {string} src - Image source
   */
  setAvatar(src) {
    this.updateAvatarImage(src);
  }

  /**
   * Clear avatar
   */
  clearAvatar() {
    if (this.avatarImg) {
      this.avatarImg.src = '';
    }
    if (this.fileInput) {
      this.fileInput.value = '';
    }
  }

  /**
   * Get file input element
   * @returns {HTMLElement|null} File input element
   */
  getFileInput() {
    return this.fileInput;
  }

  /**
   * Get upload button element
   * @returns {HTMLElement|null} Upload button element
   */
  getUploadButton() {
    return this.uploadBtn;
  }

  /**
   * Check if file is selected
   * @returns {boolean} File selected state
   */
  hasFileSelected() {
    return this.fileInput && this.fileInput.files.length > 0;
  }

  /**
   * Get selected file
   * @returns {File|null} Selected file
   */
  getSelectedFile() {
    return this.fileInput && this.fileInput.files.length > 0 ? this.fileInput.files[0] : null;
  }

  /**
   * Cleanup avatar module
   */
  destroy() {
    this.uploadBtn = null;
    this.fileInput = null;
    this.avatarImg = null;
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ProfileAvatarModule = ProfileAvatarModule;

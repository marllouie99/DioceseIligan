/**
 * Profile Upload Module
 * @module ProfileUploadModule
 * @description Handles file upload functionality for profile images
 * @version 1.0.0
 */

class ProfileUploadModule {
  constructor() {
    this.isInitialized = false;
    this.fileInput = null;
    this.avatarImage = null;
    this.avatarPlaceholder = null;
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  }

  /**
   * Initialize upload functionality
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
      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ProfileUploadModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.fileInput = document.getElementById('id_profile_image');
    this.avatarImage = document.querySelector('.avatar-image');
    this.avatarPlaceholder = document.querySelector('.avatar-placeholder');
  }

  /**
   * Validate required elements exist
   * @returns {boolean} Validation result
   * @private
   */
  validateElements() {
    if (!this.fileInput) {
      return false;
    }
    return true;
  }

  /**
   * Bind event listeners
   * @private
   */
  bindEvents() {
    if (this.fileInput) {
      // Set accept attribute
      this.fileInput.setAttribute('accept', 'image/*');
      
      // Handle file selection
      this.fileInput.addEventListener('change', (e) => {
        this.handleFileSelect(e);
      });
    }
  }

  /**
   * Handle file selection
   * @param {Event} e - File input change event
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
    
    // Auto-upload via AJAX for instant update
    this.uploadProfileImage(file);
  }

  /**
   * Validate file
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   * @private
   */
  validateFile(file) {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        message: 'Please select an image file'
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
    if (this.avatarImage) {
      this.avatarImage.src = src;
    } else if (this.avatarPlaceholder) {
      // Create image element if it doesn't exist
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Profile Picture';
      img.className = 'avatar-image';
      this.avatarPlaceholder.parentNode.replaceChild(img, this.avatarPlaceholder);
    }
  }

  /**
   * Upload profile image
   * @param {File} file - File to upload
   * @private
   */
  async uploadProfileImage(file) {
    const form = document.getElementById('profile-edit-form');
    if (!form) return;

    const formData = new FormData(form);
    formData.set('profile_image', file);

    const csrfToken = this.getCSRFToken();

    try {
      const response = await fetch(window.location.href, {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': csrfToken || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const data = await response.json();

      if (data.success) {
        if (data.profile_data) {
          this.triggerEvent('profileUpdated', { data: data.profile_data });
        }
        this.showNotification('Profile photo updated successfully!', 'success');
      } else {
        const error = data?.errors?.profile_image?.[0] || 'Failed to update profile photo';
        this.showNotification(error, 'error');
      }
    } catch (error) {
      this.showNotification('An error occurred while uploading your photo', 'error');
    }
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
    return this.avatarImage ? this.avatarImage.src : null;
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
    if (this.avatarImage) {
      this.avatarImage.src = '';
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
   * Trigger file input click
   */
  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.click();
    }
  }

  /**
   * Get CSRF token
   * @returns {string} CSRF token
   * @private
   */
  getCSRFToken() {
    if (window.getCSRFToken) {
      return window.getCSRFToken();
    }
    
    const tokenEl = document.querySelector('[name=csrfmiddlewaretoken]');
    return tokenEl ? tokenEl.value : '';
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
   * Cleanup upload module
   */
  destroy() {
    this.fileInput = null;
    this.avatarImage = null;
    this.avatarPlaceholder = null;
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ProfileUploadModule = ProfileUploadModule;



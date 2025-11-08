/**
 * Profile Form Module
 * @module ProfileFormModule
 * @description Handles profile form submission, validation, and API interactions
 * @version 1.0.0
 */

class ProfileFormModule {
  constructor() {
    this.isInitialized = false;
    this.form = null;
    this.submitBtn = null;
    this.originalBtnText = '';
  }

  /**
   * Initialize form functionality
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        console.warn('ProfileFormModule already initialized');
        return true;
      }

      this.getElements();
      if (!this.validateElements()) {
        return false;
      }

      this.bindEvents();
      this.isInitialized = true;
      console.log('ProfileFormModule initialized successfully');
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ProfileFormModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.form = document.getElementById('profile-form') || document.getElementById('profile-edit-form');
    this.submitBtn = this.form ? this.form.querySelector('button[type="submit"]') : null;
  }

  /**
   * Validate required elements exist
   * @returns {boolean} Validation result
   * @private
   */
  validateElements() {
    if (!this.form) {
      console.info('Profile form element not found');
      return false;
    }
    return true;
  }

  /**
   * Bind event listeners
   * @private
   */
  bindEvents() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  /**
   * Handle form submission
   * @private
   */
  async handleSubmit() {
    try {
      this.showLoadingState();
      
      const formData = this.prepareFormData();
      const response = await this.submitForm(formData);
      
      if (response.success) {
        this.handleSuccess(response);
      } else {
        this.handleError(response);
      }
    } catch (error) {
      this.handleSubmissionError(error);
    } finally {
      this.hideLoadingState();
    }
  }

  /**
   * Prepare form data
   * @returns {FormData} Form data
   * @private
   */
  prepareFormData() {
    const formData = new FormData(this.form);
    formData.append('csrfmiddlewaretoken', this.getCSRFToken());
    return formData;
  }

  /**
   * Submit form to server
   * @param {FormData} formData - Form data
   * @returns {Promise<Object>} Server response
   * @private
   */
  async submitForm(formData) {
    const response = await fetch(this.form.action, {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRFToken': this.getCSRFToken(),
        'X-Requested-With': 'XMLHttpRequest',
      }
    });

    // Try JSON first, fallback to text
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } else {
      const text = await response.text();
      console.warn('Legacy profile-form.js received non-JSON response, treating as success. First 200 chars:', text.substring(0, 200));
      return { success: response.ok, message: response.ok ? 'Profile updated' : 'Server error', profile_data: null };
    }
  }

  /**
   * Handle successful submission
   * @param {Object} response - Server response
   * @private
   */
  handleSuccess(response) {
    // Update profile display if data provided
    if (response.profile_data) {
      this.triggerEvent('profileUpdated', { data: response.profile_data });
    }
    
    // Show success message
    this.showNotification(response.message || 'Profile updated successfully!', 'success');
    
    // Close modal
    this.triggerEvent('closeModal');
  }

  /**
   * Handle form errors
   * @param {Object} response - Server response
   * @private
   */
  handleError(response) {
    if (response.errors) {
      this.displayFormErrors(response.errors);
    } else {
      this.showNotification(response.message || 'Error updating profile', 'error');
    }
  }

  /**
   * Handle submission error
   * @param {Error} error - Error object
   * @private
   */
  handleSubmissionError(error) {
    console.error('Profile form submission error:', error);
    this.showNotification('An error occurred while updating your profile', 'error');
  }

  /**
   * Display form validation errors
   * @param {Object} errors - Form errors from server
   * @private
   */
  displayFormErrors(errors) {
    // Clear existing errors
    document.querySelectorAll('.form-error').forEach(el => el.remove());
    document.querySelectorAll('.form-group').forEach(el => el.classList.remove('error'));

    // Display new errors
    Object.keys(errors).forEach(fieldName => {
      const field = document.getElementById(`id_${fieldName}`);
      if (field) {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
          formGroup.classList.add('error');
          
          const errorDiv = document.createElement('div');
          errorDiv.className = 'form-error';
          errorDiv.textContent = errors[fieldName][0];
          
          formGroup.appendChild(errorDiv);
        }
      }
    });
  }

  /**
   * Show loading state
   * @private
   */
  showLoadingState() {
    if (!this.submitBtn) return;
    this.originalBtnText = this.submitBtn.textContent || 'Save Changes';
    this.submitBtn.disabled = true;
    this.submitBtn.innerHTML = '<span class="btn-spinner animate-spin">⟳</span> Saving...';
  }

  /**
   * Hide loading state
   * @private
   */
  hideLoadingState() {
    if (!this.submitBtn) return;
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = this.originalBtnText || 'Save Changes';
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
   * Reset form
   */
  reset() {
    if (this.form) {
      this.form.reset();
      this.clearErrors();
    }
  }

  /**
   * Clear form errors
   */
  clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.remove());
    document.querySelectorAll('.form-group').forEach(el => el.classList.remove('error'));
  }

  /**
   * Validate form
   * @returns {boolean} Validation result
   */
  validate() {
    if (!this.form) return false;
    
    const requiredFields = this.form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add('error');
      } else {
        field.classList.remove('error');
      }
    });
    
    return isValid;
  }

  /**
   * Cleanup form module
   */
  destroy() {
    this.form = null;
    this.submitBtn = null;
    this.originalBtnText = '';
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ProfileFormModule = ProfileFormModule;

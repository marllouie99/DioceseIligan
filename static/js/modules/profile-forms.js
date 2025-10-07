/**
 * Profile Forms Module
 * @module ProfileFormsModule
 * @description Handles profile form validation, submission, and error management
 * @version 1.0.0
 */

class ProfileFormsModule {
  constructor() {
    this.isInitialized = false;
    this.forms = {};
    this.errorHandler = null;
    this.validators = {};
  }

  /**
   * Initialize forms functionality
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        return true;
      }

      this.getElements();
      this.initializeErrorHandler();
      this.initializeValidators();
      this.bindEvents();
      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ProfileFormsModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.forms = {
      profileEdit: document.getElementById('profile-edit-form'),
      passwordChange: document.getElementById('password-form'),
      deleteAccount: document.getElementById('delete-account-form')
    };
  }

  /**
   * Initialize error handler
   * @private
   */
  initializeErrorHandler() {
    this.errorHandler = {
      errorElements: null,
      
      init() {
        if (this.errorElements) return;
        this.errorElements = document.querySelectorAll('.form-error');
      },
      
      clear() {
        this.init();
        this.errorElements.forEach(error => {
          error.style.display = 'none';
          error.textContent = '';
        });
      },
      
      display(errors) {
        this.clear();
        
        Object.keys(errors).forEach(fieldName => {
          const field = document.getElementById(`id_${fieldName}`);
          if (field) {
            const errorDiv = field.parentNode.querySelector('.form-error');
            if (errorDiv) {
              errorDiv.textContent = errors[fieldName][0];
              errorDiv.style.display = 'block';
            }
          }
        });
      }
    };
  }

  /**
   * Initialize form validators
   * @private
   */
  initializeValidators() {
    this.validators = {
      email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      
      phone: (value) => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(value.replace(/\D/g, ''));
      },
      
      required: (value) => {
        return value && value.trim().length > 0;
      },
      
      minLength: (value, min) => {
        return value && value.length >= min;
      }
    };
  }

  /**
   * Bind event listeners
   * @private
   */
  bindEvents() {
    // Profile edit form
    if (this.forms.profileEdit) {
      this.forms.profileEdit.addEventListener('submit', (e) => {
        this.handleProfileFormSubmit(e);
      });
      
      // Auto-update display name
      this.setupDisplayNameAutoUpdate();
      
      // Essential indicators
      this.setupEssentialIndicators();
    }

    // Password change form
    if (this.forms.passwordChange) {
      this.forms.passwordChange.addEventListener('submit', (e) => {
        this.handlePasswordFormSubmit(e);
      });
    }

    // Delete account form
    if (this.forms.deleteAccount) {
      this.forms.deleteAccount.addEventListener('submit', (e) => {
        this.handleDeleteAccountFormSubmit(e);
      });
    }
  }

  /**
   * Setup display name auto-update
   * @private
   */
  setupDisplayNameAutoUpdate() {
    const firstNameField = document.getElementById('id_first_name');
    const lastNameField = document.getElementById('id_last_name');
    const displayNameField = document.getElementById('id_display_name');
    
    if (!firstNameField || !lastNameField || !displayNameField) return;

    const updateDisplayName = () => {
      const firstName = firstNameField.value.trim();
      const lastName = lastNameField.value.trim();
      
      // Only auto-update if display name is empty or matches the old full name
      const currentDisplayName = displayNameField.value.trim();
      const oldFullName = `${firstNameField.defaultValue || ''} ${lastNameField.defaultValue || ''}`.trim();
      
      if (!currentDisplayName || currentDisplayName === oldFullName) {
        if (firstName && lastName) {
          displayNameField.value = `${firstName} ${lastName}`;
        } else if (firstName) {
          displayNameField.value = firstName;
        } else if (lastName) {
          displayNameField.value = lastName;
        }
      }
    };
    
    firstNameField.addEventListener('input', updateDisplayName);
    lastNameField.addEventListener('input', updateDisplayName);
  }

  /**
   * Setup essential indicators
   * @private
   */
  setupEssentialIndicators() {
    const form = this.forms.profileEdit;
    if (!form) return;

    const updateEssentialIndicators = () => {
      const first = form.querySelector('#id_first_name');
      const last = form.querySelector('#id_last_name');
      const display = form.querySelector('#id_display_name');
      const phone = form.querySelector('#id_phone');
      const address = form.querySelector('#id_address');
      const dob = form.querySelector('#id_date_of_birth');

      const firstEmpty = !first || !first.value.trim();
      const lastEmpty = !last || !last.value.trim();
      const displayEmpty = !display || !display.value.trim();
      const fullNameOrDisplayMissing = (firstEmpty && lastEmpty && displayEmpty);

      // Helper to toggle on closest .form-group
      const toggleMissing = (el, missing) => {
        if (!el) return;
        const group = el.closest('.form-group');
        if (!group) return;
        group.classList.toggle('is-missing', !!missing);
      };

      // Apply combined logic for name/display triplet
      if (first) toggleMissing(first, fullNameOrDisplayMissing && firstEmpty);
      if (last) toggleMissing(last, fullNameOrDisplayMissing && lastEmpty);
      if (display) toggleMissing(display, fullNameOrDisplayMissing && displayEmpty);

      // Independents
      if (phone) toggleMissing(phone, !phone.value.trim());
      if (address) toggleMissing(address, !address.value.trim());
      if (dob) toggleMissing(dob, !dob.value);
    };

    // Bind input listeners for dynamic updates
    const inputs = ['#id_first_name', '#id_last_name', '#id_display_name', '#id_phone', '#id_address', '#id_date_of_birth']
      .map(sel => form.querySelector(sel))
      .filter(Boolean);
      
    inputs.forEach(el => {
      const evt = el.tagName === 'SELECT' || el.type === 'date' ? 'change' : 'input';
      el.addEventListener(evt, updateEssentialIndicators);
    });
    
    // Initial run
    updateEssentialIndicators();
  }

  /**
   * Handle profile form submission
   * @param {Event} e - Form submit event
   * @private
   */
  async handleProfileFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('#profile-save-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    
    try {
      this.showLoadingState(submitBtn, btnText, btnSpinner);
      
      const formData = new FormData(form);
      const response = await this.submitForm(form, formData);
      
      if (response.success) {
        this.handleProfileSuccess(response);
      } else {
        this.handleProfileError(response);
      }
    } catch (error) {
      this.handleSubmissionError(error);
    } finally {
      this.hideLoadingState(submitBtn, btnText, btnSpinner);
    }
  }

  /**
   * Handle password form submission
   * @param {Event} e - Form submit event
   * @private
   */
  async handlePasswordFormSubmit(e) {
    e.preventDefault();
    // Implementation for password change
    }

  /**
   * Handle delete account form submission
   * @param {Event} e - Form submit event
   * @private
   */
  async handleDeleteAccountFormSubmit(e) {
    e.preventDefault();
    // Implementation for account deletion
    }

  /**
   * Submit form data
   * @param {HTMLElement} form - Form element
   * @param {FormData} formData - Form data
   * @returns {Promise<Object>} Server response
   * @private
   */
  async submitForm(form, formData) {
    const response = await fetch(form.action || window.location.href, {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRFToken': this.getCSRFToken(),
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Handle successful profile submission
   * @param {Object} response - Server response
   * @private
   */
  handleProfileSuccess(response) {
    // Update profile card with new data
    if (response.profile_data) {
      this.triggerEvent('profileUpdated', { data: response.profile_data });
    }
    
    // Show success message
    this.showNotification('Profile updated successfully!', 'success');
    
    // Close modal
    this.triggerEvent('closeModal');
  }

  /**
   * Handle profile submission error
   * @param {Object} response - Server response
   * @private
   */
  handleProfileError(response) {
    if (response.errors) {
      this.errorHandler.display(response.errors);
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
    this.showNotification('An error occurred while updating your profile.', 'error');
  }

  /**
   * Show loading state
   * @param {HTMLElement} submitBtn - Submit button
   * @param {HTMLElement} btnText - Button text element
   * @param {HTMLElement} btnSpinner - Button spinner element
   * @private
   */
  showLoadingState(submitBtn, btnText, btnSpinner) {
    submitBtn.disabled = true;
    btnText.textContent = 'Saving...';
    btnSpinner.style.display = 'inline-block';
    submitBtn.style.opacity = '0.8';
  }

  /**
   * Hide loading state
   * @param {HTMLElement} submitBtn - Submit button
   * @param {HTMLElement} btnText - Button text element
   * @param {HTMLElement} btnSpinner - Button spinner element
   * @private
   */
  hideLoadingState(submitBtn, btnText, btnSpinner) {
    submitBtn.disabled = false;
    btnText.textContent = 'Save Changes';
    btnSpinner.style.display = 'none';
    submitBtn.style.opacity = '1';
  }

  /**
   * Validate form field
   * @param {string} fieldName - Field name
   * @param {string} value - Field value
   * @param {Object} rules - Validation rules
   * @returns {Object} Validation result
   */
  validateField(fieldName, value, rules = {}) {
    const errors = [];
    
    if (rules.required && !this.validators.required(value)) {
      errors.push(`${fieldName} is required`);
    }
    
    if (rules.email && value && !this.validators.email(value)) {
      errors.push(`${fieldName} must be a valid email`);
    }
    
    if (rules.phone && value && !this.validators.phone(value)) {
      errors.push(`${fieldName} must be a valid phone number`);
    }
    
    if (rules.minLength && value && !this.validators.minLength(value, rules.minLength)) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clear form errors
   */
  clearErrors() {
    this.errorHandler.clear();
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
   * Cleanup forms module
   */
  destroy() {
    this.forms = {};
    this.errorHandler = null;
    this.validators = {};
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ProfileFormsModule = ProfileFormsModule;



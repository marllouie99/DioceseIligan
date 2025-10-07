/**
 * Form Module Template
 * @module FormModuleName
 * @description Template for form handling modules
 * @version 1.0.0
 * @author Your Name
 */

class FormModuleName {
  constructor(config = {}) {
    this.config = {
      validationRules: {},
      submitEndpoint: '',
      successMessage: 'Form submitted successfully',
      errorMessage: 'An error occurred',
      ...config
    };
    
    this.isInitialized = false;
    this.forms = new Map();
    this.validators = new Map();
  }

  /**
   * Initialize the form module
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        console.warn('FormModuleName already initialized');
        return true;
      }

      this.setupFormValidation();
      this.bindFormEvents();
      this.isInitialized = true;
      console.log('FormModuleName initialized successfully');
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'FormModuleName Initialization');
      return false;
    }
  }

  /**
   * Setup form validation
   * @private
   */
  setupFormValidation() {
    // Add custom validators
    this.addValidator('required', this.validateRequired.bind(this));
    this.addValidator('email', this.validateEmail.bind(this));
    this.addValidator('minLength', this.validateMinLength.bind(this));
    this.addValidator('maxLength', this.validateMaxLength.bind(this));
    this.addValidator('pattern', this.validatePattern.bind(this));
  }

  /**
   * Bind form events
   * @private
   */
  bindFormEvents() {
    document.addEventListener('submit', (e) => {
      if (e.target.matches('[data-form-module]')) {
        e.preventDefault();
        this.handleFormSubmit(e.target);
      }
    });

    document.addEventListener('input', (e) => {
      if (e.target.matches('[data-form-module] input, [data-form-module] textarea, [data-form-module] select')) {
        this.validateField(e.target);
      }
    });

    document.addEventListener('blur', (e) => {
      if (e.target.matches('[data-form-module] input, [data-form-module] textarea, [data-form-module] select')) {
        this.validateField(e.target);
      }
    });
  }

  /**
   * Handle form submission
   * @param {HTMLFormElement} form - Form element
   * @private
   */
  async handleFormSubmit(form) {
    const formId = form.id || form.name || 'form';
    const submitBtn = form.querySelector('button[type="submit"]');
    
    try {
      // Validate form
      if (!this.validateForm(form)) {
        return;
      }

      // Show loading state
      this.showLoadingState(submitBtn);

      // Prepare form data
      const formData = this.prepareFormData(form);
      
      // Submit form
      const response = await this.submitForm(form, formData);
      
      // Handle success
      this.handleSuccess(response, form);
      
    } catch (error) {
      this.handleError(error, form);
    } finally {
      this.hideLoadingState(submitBtn);
    }
  }

  /**
   * Validate form
   * @param {HTMLFormElement} form - Form element
   * @returns {boolean} Validation result
   * @private
   */
  validateForm(form) {
    let isValid = true;
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  /**
   * Validate individual field
   * @param {HTMLElement} field - Field element
   * @returns {boolean} Validation result
   * @private
   */
  validateField(field) {
    const rules = this.getFieldRules(field);
    let isValid = true;
    let errorMessage = '';

    // Clear previous errors
    this.clearFieldError(field);

    // Validate against rules
    for (const rule of rules) {
      const result = this.validateRule(field, rule);
      if (!result.valid) {
        isValid = false;
        errorMessage = result.message;
        break;
      }
    }

    // Show/hide error
    if (!isValid) {
      this.showFieldError(field, errorMessage);
    } else {
      this.showFieldSuccess(field);
    }

    return isValid;
  }

  /**
   * Get field validation rules
   * @param {HTMLElement} field - Field element
   * @returns {Array} Validation rules
   * @private
   */
  getFieldRules(field) {
    const rules = [];
    const attributes = field.attributes;
    
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      if (attr.name.startsWith('data-validate-')) {
        const ruleName = attr.name.replace('data-validate-', '');
        const ruleValue = attr.value;
        rules.push({ name: ruleName, value: ruleValue });
      }
    }
    
    return rules;
  }

  /**
   * Validate rule
   * @param {HTMLElement} field - Field element
   * @param {Object} rule - Validation rule
   * @returns {Object} Validation result
   * @private
   */
  validateRule(field, rule) {
    const validator = this.validators.get(rule.name);
    if (!validator) {
      return { valid: true };
    }
    
    return validator(field, rule.value);
  }

  /**
   * Add custom validator
   * @param {string} name - Validator name
   * @param {Function} validator - Validator function
   */
  addValidator(name, validator) {
    this.validators.set(name, validator);
  }

  /**
   * Required field validator
   * @param {HTMLElement} field - Field element
   * @param {string} value - Rule value
   * @returns {Object} Validation result
   * @private
   */
  validateRequired(field, value) {
    const isValid = field.value.trim() !== '';
    return {
      valid: isValid,
      message: isValid ? '' : 'This field is required'
    };
  }

  /**
   * Email validator
   * @param {HTMLElement} field - Field element
   * @param {string} value - Rule value
   * @returns {Object} Validation result
   * @private
   */
  validateEmail(field, value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(field.value);
    return {
      valid: isValid,
      message: isValid ? '' : 'Please enter a valid email address'
    };
  }

  /**
   * Minimum length validator
   * @param {HTMLElement} field - Field element
   * @param {string} value - Rule value
   * @returns {Object} Validation result
   * @private
   */
  validateMinLength(field, value) {
    const minLength = parseInt(value);
    const isValid = field.value.length >= minLength;
    return {
      valid: isValid,
      message: isValid ? '' : `Minimum length is ${minLength} characters`
    };
  }

  /**
   * Maximum length validator
   * @param {HTMLElement} field - Field element
   * @param {string} value - Rule value
   * @returns {Object} Validation result
   * @private
   */
  validateMaxLength(field, value) {
    const maxLength = parseInt(value);
    const isValid = field.value.length <= maxLength;
    return {
      valid: isValid,
      message: isValid ? '' : `Maximum length is ${maxLength} characters`
    };
  }

  /**
   * Pattern validator
   * @param {HTMLElement} field - Field element
   * @param {string} value - Rule value
   * @returns {Object} Validation result
   * @private
   */
  validatePattern(field, value) {
    const pattern = new RegExp(value);
    const isValid = pattern.test(field.value);
    return {
      valid: isValid,
      message: isValid ? '' : 'Please enter a valid format'
    };
  }

  /**
   * Show field error
   * @param {HTMLElement} field - Field element
   * @param {string} message - Error message
   * @private
   */
  showFieldError(field, message) {
    field.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    const fieldContainer = field.closest('.field, .form-group');
    if (fieldContainer) {
      fieldContainer.appendChild(errorDiv);
    }
  }

  /**
   * Clear field error
   * @param {HTMLElement} field - Field element
   * @private
   */
  clearFieldError(field) {
    field.classList.remove('error');
    
    const fieldContainer = field.closest('.field, .form-group');
    if (fieldContainer) {
      const errorDiv = fieldContainer.querySelector('.field-error');
      if (errorDiv) {
        errorDiv.remove();
      }
    }
  }

  /**
   * Show field success
   * @param {HTMLElement} field - Field element
   * @private
   */
  showFieldSuccess(field) {
    field.classList.remove('error');
    field.classList.add('success');
  }

  /**
   * Prepare form data
   * @param {HTMLFormElement} form - Form element
   * @returns {FormData} Form data
   * @private
   */
  prepareFormData(form) {
    const formData = new FormData(form);
    formData.append('csrfmiddlewaretoken', this.getCSRFToken());
    return formData;
  }

  /**
   * Submit form
   * @param {HTMLFormElement} form - Form element
   * @param {FormData} formData - Form data
   * @returns {Promise} Submit response
   * @private
   */
  async submitForm(form, formData) {
    const endpoint = form.action || this.config.submitEndpoint;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRFToken': this.getCSRFToken()
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Handle success response
   * @param {Object} response - Server response
   * @param {HTMLFormElement} form - Form element
   * @private
   */
  handleSuccess(response, form) {
    // Show success message
    if (window.showNotification) {
      window.showNotification(response.message || this.config.successMessage, 'success');
    }
    
    // Reset form if needed
    if (response.resetForm !== false) {
      form.reset();
    }
    
    // Trigger success callback
    const successCallback = form.dataset.successCallback;
    if (successCallback && window[successCallback]) {
      window[successCallback](response, form);
    }
  }

  /**
   * Handle error response
   * @param {Error} error - Error object
   * @param {HTMLFormElement} form - Form element
   * @private
   */
  handleError(error, form) {
    console.error('Form submission error:', error);
    
    // Show error message
    if (window.showNotification) {
      window.showNotification(error.message || this.config.errorMessage, 'error');
    }
    
    // Trigger error callback
    const errorCallback = form.dataset.errorCallback;
    if (errorCallback && window[errorCallback]) {
      window[errorCallback](error, form);
    }
  }

  /**
   * Show loading state
   * @param {HTMLElement} submitBtn - Submit button
   * @private
   */
  showLoadingState(submitBtn) {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<span class="btn-spinner">⟳</span> Submitting...';
    }
  }

  /**
   * Hide loading state
   * @param {HTMLElement} submitBtn - Submit button
   * @private
   */
  hideLoadingState(submitBtn) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText || 'Submit';
    }
  }

  /**
   * Get CSRF token
   * @returns {string} CSRF token
   * @private
   */
  getCSRFToken() {
    if (window.Utils?.getCSRFToken) {
      return window.Utils.getCSRFToken();
    }
    
    const tokenEl = document.querySelector('[name=csrfmiddlewaretoken]');
    return tokenEl ? tokenEl.value : '';
  }

  /**
   * Cleanup form module
   */
  destroy() {
    this.forms.clear();
    this.validators.clear();
    this.isInitialized = false;
  }
}

// Export for use in main application
window.FormModuleName = FormModuleName;

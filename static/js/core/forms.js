/**
 * Form Management Module
 * @module Forms
 */

class FormManager {
  constructor() {
    this.form = document.getElementById('church-update-form');
    this.submitBtn = document.getElementById('submit-btn');
    this.btnText = this.submitBtn?.querySelector('.btn-text');
    this.btnSpinner = this.submitBtn?.querySelector('.btn-spinner');
  }

  /**
   * Initialize form functionality
   */
  init() {
    if (!this.form || !this.submitBtn) return;

    this.form.addEventListener('submit', (e) => {
      this.showFormLoadingState();
    });
  }

  /**
   * Show form loading state
   */
  showFormLoadingState() {
    if (!this.submitBtn || !this.btnText || !this.btnSpinner) return;
    
    this.submitBtn.disabled = true;
    this.btnText.textContent = 'Updating Church...';
    this.btnSpinner.style.display = 'inline-block';
    this.submitBtn.style.opacity = '0.8';
    this.submitBtn.classList.add('loading');
  }

  /**
   * Hide form loading state
   */
  hideFormLoadingState() {
    if (!this.submitBtn || !this.btnText || !this.btnSpinner) return;
    
    this.submitBtn.disabled = false;
    this.btnText.textContent = 'Update Church';
    this.btnSpinner.style.display = 'none';
    this.submitBtn.style.opacity = '1';
    this.submitBtn.classList.remove('loading');
  }

  /**
   * Handle form submission with validation
   * @param {Event} event - Form submit event
   */
  handleFormSubmission(event) {
    event.preventDefault();
    
    if (!window.Utils.validateForm()) {
      window.Utils.showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    this.showFormLoadingState();
    this.form.submit();
  }

  /**
   * Update live preview of form fields
   */
  updateLivePreview() {
    const nameInput = document.getElementById('id_name');
    const denominationInput = document.getElementById('id_denomination');
    const cityInput = document.getElementById('id_city');
    const stateInput = document.getElementById('id_state');
    
    if (nameInput) {
      const previewName = document.getElementById('preview-name');
      if (previewName) {
        previewName.textContent = nameInput.value || 'Your Church Name';
      }
    }
    
    if (denominationInput) {
      const previewDenomination = document.getElementById('preview-denomination');
      if (previewDenomination) {
        previewDenomination.textContent = denominationInput.value || 'Denomination';
      }
    }
    
    if (cityInput && stateInput) {
      const previewLocation = document.getElementById('preview-location');
      if (previewLocation) {
        const city = cityInput.value || 'City';
        const state = stateInput.value || 'State';
        previewLocation.textContent = `${city}, ${state}`;
      }
    }
  }

  /**
   * Initialize real-time preview updates
   */
  initLivePreview() {
    const previewFields = ['id_name', 'id_denomination', 'id_city', 'id_state'];
    previewFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', () => this.updateLivePreview());
      }
    });
  }
}

// Export for use in main application
window.FormManager = FormManager;

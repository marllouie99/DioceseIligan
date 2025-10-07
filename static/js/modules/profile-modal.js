/**
 * Profile Modal Module
 * @module ProfileModalModule
 * @description Handles profile modal management and UI interactions
 * @version 1.0.0
 */

class ProfileModalModule {
  constructor() {
    this.isInitialized = false;
    this.modal = null;
    this.closeBtn = null;
    this.isOpen = false;
  }

  /**
   * Initialize modal functionality
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
      window.Utils?.handleError(error, 'ProfileModalModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.modal = document.getElementById('profile-edit-modal');
    this.closeBtn = document.getElementById('close-modal');
  }

  /**
   * Validate required elements exist
   * @returns {boolean} Validation result
   * @private
   */
  validateElements() {
    if (!this.modal) {
      return false;
    }
    return true;
  }

  /**
   * Bind event listeners
   * @private
   */
  bindEvents() {
    // Close button
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // Close modal when clicking outside
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.close();
        }
      });
    }

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Open modal
   */
  open() {
    if (!this.modal) return;

    this.isOpen = true;
    this.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus first input
    const firstInput = this.modal.querySelector('input, textarea, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  /**
   * Close modal
   */
  close() {
    if (!this.modal) return;

    this.isOpen = false;
    this.modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  /**
   * Toggle modal
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Check if modal is open
   * @returns {boolean} Open state
   */
  isModalOpen() {
    return this.isOpen;
  }

  /**
   * Get modal element
   * @returns {HTMLElement|null} Modal element
   */
  getModalElement() {
    return this.modal;
  }

  /**
   * Show loading state in modal
   */
  showLoading() {
    if (this.modal) {
      const content = this.modal.querySelector('.modal-content');
      if (content) {
        content.style.opacity = '0.6';
        content.style.pointerEvents = 'none';
      }
    }
  }

  /**
   * Hide loading state in modal
   */
  hideLoading() {
    if (this.modal) {
      const content = this.modal.querySelector('.modal-content');
      if (content) {
        content.style.opacity = '';
        content.style.pointerEvents = '';
      }
    }
  }

  /**
   * Cleanup modal module
   */
  destroy() {
    this.modal = null;
    this.closeBtn = null;
    this.isOpen = false;
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ProfileModalModule = ProfileModalModule;



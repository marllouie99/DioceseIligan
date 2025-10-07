/**
 * Modal Module Template
 * @module ModalModuleName
 * @description Template for modal dialog modules
 * @version 1.0.0
 * @author Your Name
 */

class ModalModuleName {
  constructor(config = {}) {
    this.config = {
      animationDuration: 300,
      closeOnEscape: true,
      closeOnBackdrop: true,
      focusTrap: true,
      ...config
    };
    
    this.isInitialized = false;
    this.modals = new Map();
    this.activeModal = null;
    this.focusTrap = null;
  }

  /**
   * Initialize the modal module
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        console.warn('ModalModuleName already initialized');
        return true;
      }

      this.bindEvents();
      this.isInitialized = true;
      console.log('ModalModuleName initialized successfully');
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ModalModuleName Initialization');
      return false;
    }
  }

  /**
   * Bind global events
   * @private
   */
  bindEvents() {
    // Close on escape key
    if (this.config.closeOnEscape) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeModal) {
          this.close(this.activeModal);
        }
      });
    }

    // Close on backdrop click
    if (this.config.closeOnBackdrop) {
      document.addEventListener('click', (e) => {
        if (e.target.matches('.modal-backdrop') && this.activeModal) {
          this.close(this.activeModal);
        }
      });
    }

    // Handle modal triggers
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-modal-trigger]');
      if (trigger) {
        e.preventDefault();
        const modalId = trigger.dataset.modalTrigger;
        this.open(modalId);
      }
    });

    // Handle close buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-modal-close]')) {
        const modal = e.target.closest('.modal');
        if (modal) {
          this.close(modal);
        }
      }
    });
  }

  /**
   * Open modal
   * @param {string|HTMLElement} modalId - Modal ID or element
   * @param {Object} options - Modal options
   * @returns {boolean} Success status
   */
  open(modalId, options = {}) {
    try {
      const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      
      if (!modal) {
        console.error(`Modal not found: ${modalId}`);
        return false;
      }

      // Close any active modal
      if (this.activeModal) {
        this.close(this.activeModal);
      }

      // Store modal options
      this.modals.set(modal, { ...this.config, ...options });
      
      // Show modal
      this.showModal(modal);
      
      // Set as active
      this.activeModal = modal;
      
      // Trigger open event
      this.triggerEvent(modal, 'modal:open');
      
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'Modal Open');
      return false;
    }
  }

  /**
   * Close modal
   * @param {string|HTMLElement} modalId - Modal ID or element
   * @returns {boolean} Success status
   */
  close(modalId) {
    try {
      const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      
      if (!modal) {
        console.error(`Modal not found: ${modalId}`);
        return false;
      }

      // Hide modal
      this.hideModal(modal);
      
      // Clear active modal
      if (this.activeModal === modal) {
        this.activeModal = null;
      }
      
      // Trigger close event
      this.triggerEvent(modal, 'modal:close');
      
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'Modal Close');
      return false;
    }
  }

  /**
   * Toggle modal
   * @param {string|HTMLElement} modalId - Modal ID or element
   * @param {Object} options - Modal options
   * @returns {boolean} Success status
   */
  toggle(modalId, options = {}) {
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    
    if (!modal) {
      console.error(`Modal not found: ${modalId}`);
      return false;
    }

    if (this.isOpen(modal)) {
      return this.close(modal);
    } else {
      return this.open(modal, options);
    }
  }

  /**
   * Check if modal is open
   * @param {string|HTMLElement} modalId - Modal ID or element
   * @returns {boolean} Open state
   */
  isOpen(modalId) {
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    return modal && modal.classList.contains('modal-open');
  }

  /**
   * Show modal
   * @param {HTMLElement} modal - Modal element
   * @private
   */
  showModal(modal) {
    // Add modal classes
    modal.classList.add('modal-open');
    document.body.classList.add('modal-open');
    
    // Create backdrop if needed
    this.createBackdrop(modal);
    
    // Focus management
    if (this.config.focusTrap) {
      this.setupFocusTrap(modal);
    }
    
    // Focus first focusable element
    this.focusFirstElement(modal);
    
    // Animate in
    this.animateIn(modal);
  }

  /**
   * Hide modal
   * @param {HTMLElement} modal - Modal element
   * @private
   */
  hideModal(modal) {
    // Animate out
    this.animateOut(modal, () => {
      // Remove modal classes
      modal.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      
      // Remove backdrop
      this.removeBackdrop(modal);
      
      // Cleanup focus trap
      if (this.focusTrap) {
        this.focusTrap = null;
      }
    });
  }

  /**
   * Create backdrop
   * @param {HTMLElement} modal - Modal element
   * @private
   */
  createBackdrop(modal) {
    if (!modal.querySelector('.modal-backdrop')) {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      modal.appendChild(backdrop);
    }
  }

  /**
   * Remove backdrop
   * @param {HTMLElement} modal - Modal element
   * @private
   */
  removeBackdrop(modal) {
    const backdrop = modal.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  /**
   * Setup focus trap
   * @param {HTMLElement} modal - Modal element
   * @private
   */
  setupFocusTrap(modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    this.focusTrap = {
      firstElement,
      lastElement,
      handleTab: (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      }
    };
    
    modal.addEventListener('keydown', this.focusTrap.handleTab);
  }

  /**
   * Focus first focusable element
   * @param {HTMLElement} modal - Modal element
   * @private
   */
  focusFirstElement(modal) {
    const firstElement = modal.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (firstElement) {
      firstElement.focus();
    }
  }

  /**
   * Animate modal in
   * @param {HTMLElement} modal - Modal element
   * @private
   */
  animateIn(modal) {
    const content = modal.querySelector('.modal-content');
    if (!content) return;
    
    content.style.transform = 'scale(0.8)';
    content.style.opacity = '0';
    
    requestAnimationFrame(() => {
      content.style.transition = `transform ${this.config.animationDuration}ms ease, opacity ${this.config.animationDuration}ms ease`;
      content.style.transform = 'scale(1)';
      content.style.opacity = '1';
    });
  }

  /**
   * Animate modal out
   * @param {HTMLElement} modal - Modal element
   * @param {Function} callback - Callback function
   * @private
   */
  animateOut(modal, callback) {
    const content = modal.querySelector('.modal-content');
    if (!content) {
      callback();
      return;
    }
    
    content.style.transition = `transform ${this.config.animationDuration}ms ease, opacity ${this.config.animationDuration}ms ease`;
    content.style.transform = 'scale(0.8)';
    content.style.opacity = '0';
    
    setTimeout(callback, this.config.animationDuration);
  }

  /**
   * Trigger custom event
   * @param {HTMLElement} modal - Modal element
   * @param {string} eventName - Event name
   * @private
   */
  triggerEvent(modal, eventName) {
    const event = new CustomEvent(eventName, {
      detail: { modal, module: this }
    });
    modal.dispatchEvent(event);
  }

  /**
   * Get modal options
   * @param {HTMLElement} modal - Modal element
   * @returns {Object} Modal options
   */
  getOptions(modal) {
    return this.modals.get(modal) || this.config;
  }

  /**
   * Update modal options
   * @param {HTMLElement} modal - Modal element
   * @param {Object} options - New options
   */
  updateOptions(modal, options) {
    const currentOptions = this.getOptions(modal);
    this.modals.set(modal, { ...currentOptions, ...options });
  }

  /**
   * Close all modals
   */
  closeAll() {
    const openModals = document.querySelectorAll('.modal-open');
    openModals.forEach(modal => this.close(modal));
  }

  /**
   * Get active modal
   * @returns {HTMLElement|null} Active modal
   */
  getActiveModal() {
    return this.activeModal;
  }

  /**
   * Cleanup modal module
   */
  destroy() {
    this.closeAll();
    this.modals.clear();
    this.activeModal = null;
    this.focusTrap = null;
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ModalModuleName = ModalModuleName;

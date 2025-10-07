/**
 * Toast Module
 * @module ToastModule
 * @description Handles toast notifications from Django flash messages and session storage
 * @version 1.0.0
 */

class ToastModule {
  constructor() {
    this.isInitialized = false;
    this.flashContainer = null;
  }

  /**
   * Initialize toast functionality
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        console.warn('ToastModule already initialized');
        return true;
      }

      this.getElements();
      this.showToastsFromFlashMessages();
      this.showPendingToastFromSession();
      this.isInitialized = true;
      console.log('ToastModule initialized successfully');
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ToastModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.flashContainer = document.querySelector('.flash-messages');
  }

  /**
   * Convert Django flash messages into toasts
   * @private
   */
  showToastsFromFlashMessages() {
    try {
      if (!this.flashContainer) return;
      
      const alerts = this.flashContainer.querySelectorAll('.alert');
      if (!alerts.length) return;

      alerts.forEach(alert => {
        const text = alert.textContent.trim();
        if (!text) return;

        const type = this.getAlertType(alert.className);
        this.showToast(text, type);
      });

      // Hide the inline flash container after converting to toasts
      this.flashContainer.style.display = 'none';
    } catch (e) {
      console.warn('Error processing flash messages:', e);
    }
  }

  /**
   * Get alert type from CSS classes
   * @param {string} className - CSS class string
   * @returns {string} Alert type
   * @private
   */
  getAlertType(className) {
    if (className.includes('alert-success')) return 'success';
    if (className.includes('alert-error') || className.includes('alert-danger')) return 'error';
    if (className.includes('alert-warning')) return 'warning';
    if (className.includes('alert-info')) return 'info';
    return 'info';
  }

  /**
   * Show toast from session storage (for redirects)
   * @private
   */
  showPendingToastFromSession() {
    try {
      const key = 'toastMessage';
      const raw = sessionStorage.getItem(key);
      if (!raw) return;

      sessionStorage.removeItem(key);
      const data = JSON.parse(raw);
      
      if (data && data.msg) {
        this.showToast(data.msg, data.type || 'success');
      }
    } catch (e) {
      console.warn('Error processing session toast:', e);
    }
  }

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, warning, info)
   */
  showToast(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
      // Use global notification system if available
      window.showNotification(message, type);
    } else {
      // Fallback: create simple toast
      this.createSimpleToast(message, type);
    }
  }

  /**
   * Create simple toast (fallback)
   * @param {string} message - Toast message
   * @param {string} type - Toast type
   * @private
   */
  createSimpleToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Style the toast
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      zIndex: '1000',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      backgroundColor: this.getToastColor(type)
    });

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }

  /**
   * Get toast color based on type
   * @param {string} type - Toast type
   * @returns {string} Color value
   * @private
   */
  getToastColor(type) {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return colors[type] || colors.info;
  }

  /**
   * Store toast message in session storage
   * @param {string} message - Toast message
   * @param {string} type - Toast type
   */
  storeToastInSession(message, type = 'success') {
    try {
      const data = { msg: message, type };
      sessionStorage.setItem('toastMessage', JSON.stringify(data));
    } catch (e) {
      console.warn('Error storing toast in session:', e);
    }
  }

  /**
   * Show success toast
   * @param {string} message - Success message
   */
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  /**
   * Show error toast
   * @param {string} message - Error message
   */
  showError(message) {
    this.showToast(message, 'error');
  }

  /**
   * Show warning toast
   * @param {string} message - Warning message
   */
  showWarning(message) {
    this.showToast(message, 'warning');
  }

  /**
   * Show info toast
   * @param {string} message - Info message
   */
  showInfo(message) {
    this.showToast(message, 'info');
  }

  /**
   * Cleanup toast module
   */
  destroy() {
    this.flashContainer = null;
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ToastModule = ToastModule;

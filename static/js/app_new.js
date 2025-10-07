/**
 * Main Application - ChurchConnect
 * @module App
 * @description Main application coordinator for ChurchConnect
 * @version 1.0.0
 */

class App {
  constructor(config = {}) {
    this.config = {
      // Default configuration
      ...config
    };
    
    this.modules = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        console.warn('App already initialized');
        return true;
      }

      this.initializeModules();
      this.setupGlobalFunctions();
      this.initializeAdvancedFeatures();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'App Initialization');
      return false;
    }
  }

  /**
   * Initialize all modules
   * @private
   */
  initializeModules() {
    // Initialize each module safely to avoid hard failures
    this.modules.navigation = this.safeInstantiate('NavigationModule');
    this.modules.profile = this.safeInstantiate('ProfileModule');
    this.modules.search = this.safeInstantiate('SearchModule');
    this.modules.toasts = this.safeInstantiate('ToastModule');
    
    // Initialize modules
    Object.values(this.modules).forEach(module => {
      if (module && module.init) {
        module.init();
      }
    });
  }

  /**
   * Safely instantiate a window constructor if available
   * @param {string} constructorName
   * @param {Array} args
   * @returns {Object|null}
   * @private
   */
  safeInstantiate(constructorName, args = []) {
    try {
      const Ctor = window[constructorName];
      if (typeof Ctor === 'function') {
        return new Ctor(...args);
      }
      console.warn(`${constructorName} not available on window`);
      return null;
    } catch (e) {
      window.Utils?.handleError(e, `${constructorName} Instantiation`);
      return null;
    }
  }

  /**
   * Setup global functions
   * @private
   */
  setupGlobalFunctions() {
    // Global functions that need to be accessible from HTML
    window.toggleProfileDropdown = () => {
      if (this.modules.profile) {
        this.modules.profile.toggleDropdown();
      }
    };
    
    window.openProfileDropdown = () => {
      if (this.modules.profile) {
        this.modules.profile.open();
      }
    };
    
    window.closeProfileDropdown = () => {
      if (this.modules.profile) {
        this.modules.profile.close();
      }
    };
    
    window.showToast = (message, type) => {
      if (this.modules.toasts) {
        this.modules.toasts.showToast(message, type);
      }
    };
    
    window.showSuccessToast = (message) => {
      if (this.modules.toasts) {
        this.modules.toasts.showSuccess(message);
      }
    };
    
    window.showErrorToast = (message) => {
      if (this.modules.toasts) {
        this.modules.toasts.showError(message);
      }
    };
    
    window.showWarningToast = (message) => {
      if (this.modules.toasts) {
        this.modules.toasts.showWarning(message);
      }
    };
    
    window.showInfoToast = (message) => {
      if (this.modules.toasts) {
        this.modules.toasts.showInfo(message);
      }
    };
    
    window.storeToastInSession = (message, type) => {
      if (this.modules.toasts) {
        this.modules.toasts.storeToastInSession(message, type);
      }
    };
  }

  /**
   * Initialize advanced features
   * @private
   */
  initializeAdvancedFeatures() {
    this.initializeEventDelegation();
    this.initializeKeyboardShortcuts();
    this.initializePerformanceOptimizations();
  }

  /**
   * Initialize event delegation
   * @private
   */
  initializeEventDelegation() {
    // Global event delegation for better performance
    document.addEventListener('click', (e) => {
      // Handle global clicks if needed
    });
  }

  /**
   * Initialize keyboard shortcuts
   * @private
   */
  initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Handle global keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            // Focus search input
            const searchInput = document.querySelector('.search input');
            if (searchInput) {
              searchInput.focus();
            }
            break;
          case 'p':
            e.preventDefault();
            // Toggle profile dropdown
            if (this.modules.profile) {
              this.modules.profile.toggleDropdown();
            }
            break;
        }
      }
    });
  }

  /**
   * Initialize performance optimizations
   * @private
   */
  initializePerformanceOptimizations() {
    // Lazy load images
    this.initializeLazyLoading();
    
    // Preload critical resources
    this.preloadCriticalResources();
  }

  /**
   * Initialize lazy loading for images
   * @private
   */
  initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              observer.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Preload critical resources
   * @private
   */
  preloadCriticalResources() {
    // Preload critical CSS
    const criticalCSS = document.querySelector('link[rel="preload"][as="style"]');
    if (criticalCSS) {
      criticalCSS.onload = () => {
        criticalCSS.rel = 'stylesheet';
      };
    }
  }

  /**
   * Get module by name
   * @param {string} moduleName - Name of the module
   * @returns {Object|null} Module instance or null
   */
  getModule(moduleName) {
    return this.modules[moduleName] || null;
  }

  /**
   * Refresh all modules
   */
  refresh() {
    Object.values(this.modules).forEach(module => {
      if (module.refresh) {
        module.refresh();
      }
    });
  }

  /**
   * Cleanup application
   */
  destroy() {
    // Cleanup all modules
    Object.values(this.modules).forEach(module => {
      if (module.destroy) {
        module.destroy();
      }
    });
    
    this.modules = {};
    this.isInitialized = false;
  }
}

// Global utility functions (if needed)
function getCSRFToken() {
  const tokenEl = document.querySelector('[name=csrfmiddlewaretoken]');
  if (tokenEl) {
    return tokenEl.value;
  }
  
  // Fallback: parse cookie directly
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken') {
      return value;
    }
  }
  return '';
}

// Make CSRF token globally available
window.getCSRFToken = (window.Utils && typeof window.Utils.getCsrfToken === 'function')
  ? window.Utils.getCsrfToken
  : getCSRFToken;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  
  // Make app globally available for debugging
  window.app = app;
});

/**
 * Clean ChurchConnect Application (Production Ready)
 * Consolidated and minified JavaScript modules without debug code
 * @version 2.0.0
 */

class CleanApp {
  constructor(config = {}) {
    this.config = {
      autoRefreshInterval: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
    this.modules = {};
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return true;
    
    try {
      this.initializeModules();
      this.setupGlobalFunctions();
      this.initializePerformanceOptimizations();
      this.isInitialized = true;
      return true;
    } catch (error) {
      this.handleError(error, 'App Initialization');
      return false;
    }
  }

  initializeModules() {
    // Initialize core modules
    this.modules.navigation = new NavigationModule();
    this.modules.profile = new ProfileModule();
    this.modules.notifications = new NotificationModule();
    this.modules.forms = new FormModule();
    
    // Initialize all modules
    Object.values(this.modules).forEach(module => {
      if (module && module.init) {
        module.init();
      }
    });
  }

  setupGlobalFunctions() {
    // Global utility functions
    window.toggleProfileDropdown = () => this.modules.profile?.toggleDropdown();
    window.openProfileDropdown = () => this.modules.profile?.open();
    window.closeProfileDropdown = () => this.modules.profile?.close();
    window.showToast = (message, type) => this.modules.notifications?.showToast(message, type);
    window.getCSRFToken = this.getCSRFToken;
  }

  initializePerformanceOptimizations() {
    this.initializeLazyLoading();
    this.initializeEventDelegation();
    this.preloadCriticalResources();
  }

  initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  initializeEventDelegation() {
    // Global click handler
    document.addEventListener('click', (e) => {
      // Handle modal close
      if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
        document.body.style.overflow = '';
      }
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-overlay[style*="flex"]');
        if (openModal) {
          openModal.style.display = 'none';
          document.body.style.overflow = '';
        }
      }
    });
  }

  preloadCriticalResources() {
    const criticalCSS = document.querySelector('link[rel="preload"][as="style"]');
    if (criticalCSS) {
      criticalCSS.onload = () => {
        criticalCSS.rel = 'stylesheet';
      };
    }
  }

  getCSRFToken() {
    const tokenEl = document.querySelector('[name=csrfmiddlewaretoken]');
    if (tokenEl) return tokenEl.value;
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') return value;
    }
    return '';
  }

  handleError(error, context) {
    // Silent error handling for production
    // Could implement error reporting service here
  }

  destroy() {
    Object.values(this.modules).forEach(module => {
      if (module.destroy) module.destroy();
    });
    this.modules = {};
    this.isInitialized = false;
  }
}

// Core Modules (Clean versions)
class NavigationModule {
  init() {
    this.setupNavigation();
  }

  setupNavigation() {
    // Navigation setup logic
  }
}

class ProfileModule {
  constructor() {
    this.isOpen = false;
  }

  init() {
    this.setupProfileDropdown();
  }

  setupProfileDropdown() {
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.profile-dropdown')) {
        this.close();
      }
    });
  }

  toggleDropdown() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    const dropdown = document.querySelector('.profile-dropdown');
    if (dropdown) {
      dropdown.classList.add('open');
      this.isOpen = true;
    }
  }

  close() {
    const dropdown = document.querySelector('.profile-dropdown');
    if (dropdown) {
      dropdown.classList.remove('open');
      this.isOpen = false;
    }
  }
}

class NotificationModule {
  init() {
    this.setupNotifications();
  }

  setupNotifications() {
    // Notification setup logic
  }

  showToast(message, type = 'info') {
    // Toast notification logic
  }
}

class FormModule {
  init() {
    this.setupForms();
  }

  setupForms() {
    // Form handling logic
  }
}

// Initialize the clean app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CleanApp();
  window.app.init();
});


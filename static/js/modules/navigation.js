/**
 * Navigation Module
 * @module NavigationModule
 * @description Handles navigation highlighting and active state management
 * @version 1.0.0
 */

class NavigationModule {
  constructor() {
    this.isInitialized = false;
    this.navLinks = [];
  }

  /**
   * Initialize navigation functionality
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        return true;
      }

      this.setupNavigation();
      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'NavigationModule Initialization');
      return false;
    }
  }

  /**
   * Setup navigation highlighting
   * @private
   */
  setupNavigation() {
    const current = window.location.pathname;
    this.navLinks = document.querySelectorAll('.sidebar .nav a');
    
    // Don't override server-side active state - only add if no active link exists
    const hasActiveLink = document.querySelector('.sidebar .nav a.active, .sidebar .nav a[aria-current="page"]');
    if (hasActiveLink) {
      console.log('Navigation: Server-side active state detected, skipping JS highlighting');
      return;
    }
    
    this.navLinks.forEach(link => {
      try {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        
        // Exact match or path starts with href followed by / or end of string
        const isMatch = current === href || 
                       (current.startsWith(href) && (current[href.length] === '/' || current[href.length] === '?'));
        
        if (isMatch) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        } else {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        }
      } catch (e) {
        }
    });
  }

  /**
   * Update active navigation item
   * @param {string} path - Path to highlight
   */
  updateActiveNav(path) {
    this.navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      
      // Exact match or path starts with href followed by / or end of string
      const isMatch = path === href || 
                     (path.startsWith(href) && (path[href.length] === '/' || path[href.length] === '?'));
      
      if (isMatch) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Get current active navigation item
   * @returns {Element|null} Active navigation element
   */
  getActiveNav() {
    return document.querySelector('.sidebar .nav a.active, .sidebar .nav a[aria-current="page"]');
  }

  /**
   * Cleanup navigation module
   */
  destroy() {
    this.navLinks = [];
    this.isInitialized = false;
  }
}

// Export for use in main application
window.NavigationModule = NavigationModule;

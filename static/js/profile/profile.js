/**
 * Profile Module
 * @module ProfileModule
 * @description Handles profile dropdown functionality and positioning
 * @version 1.0.0
 */

class ProfileModule {
  constructor() {
    this.isInitialized = false;
    this.profileToggle = null;
    this.profileDropdown = null;
    this.profileMenu = null;
    this.isOpen = false;
  }

  /**
   * Initialize profile dropdown functionality
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        console.warn('ProfileModule already initialized');
        return true;
      }

      this.getElements();
      if (!this.validateElements()) {
        return false;
      }

      this.bindEvents();
      this.isInitialized = true;
      console.log('ProfileModule initialized successfully');
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ProfileModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.profileToggle = document.getElementById('profile-toggle');
    this.profileDropdown = document.querySelector('.profile-dropdown');
    this.profileMenu = document.getElementById('profile-menu');
    
    // Elements found successfully
  }

  /**
   * Validate required elements exist
   * @returns {boolean} Validation result
   * @private
   */
  validateElements() {
    if (!this.profileToggle || !this.profileDropdown) {
      console.warn('Profile dropdown elements not found');
      return false;
    }
    return true;
  }

  /**
   * Bind event listeners
   * @private
   */
  bindEvents() {
    // Toggle dropdown
    this.profileToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      // Use setTimeout to avoid closing immediately after opening
      setTimeout(() => {
        if (this.isOpen && !this.profileDropdown.contains(e.target)) {
          this.closeDropdown();
        }
      }, 0);
    });

    // Close dropdown when pressing escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeDropdown();
      }
    });
    
    console.log('✅ Profile dropdown event listeners attached');
  }

  /**
   * Toggle profile dropdown
   * @private
   */
  toggleDropdown() {
    this.profileDropdown.classList.toggle('open');
    this.isOpen = this.profileDropdown.classList.contains('open');
    
    console.log('🔄 Profile dropdown toggled:', this.isOpen);
    
    if (this.profileMenu) {
      if (this.isOpen) {
        this.openMenu();
      } else {
        this.closeMenu();
      }
    }
  }

  /**
   * Open profile menu with proper positioning
   * @private
   */
  openMenu() {
    this.profileMenu.style.display = 'block';
    this.profileMenu.style.opacity = '1';
    this.profileMenu.style.transform = 'translateY(0)';
    this.profileMenu.style.visibility = 'visible';
    
    // Clear any previous positioning styles to let CSS handle it
    this.profileMenu.style.position = '';
    this.profileMenu.style.left = '';
    this.profileMenu.style.top = '';
    this.profileMenu.style.right = '';
  }

  /**
   * Close profile menu
   * @private
   */
  closeMenu() {
    this.profileMenu.style.display = 'none';
    this.profileMenu.style.opacity = '0';
    this.profileMenu.style.transform = 'translateY(-8px)';
    this.profileMenu.style.visibility = 'hidden';
    this.profileMenu.style.position = '';
    this.profileMenu.style.left = '';
    this.profileMenu.style.top = '';
    this.profileMenu.style.right = '';
  }

  /**
   * Close profile dropdown
   * @private
   */
  closeDropdown() {
    this.profileDropdown.classList.remove('open');
    this.isOpen = false;
    if (this.profileMenu) {
      this.closeMenu();
    }
  }

  /**
   * Open profile dropdown programmatically
   */
  open() {
    if (!this.isOpen) {
      this.toggleDropdown();
    }
  }

  /**
   * Close profile dropdown programmatically
   */
  close() {
    if (this.isOpen) {
      this.closeDropdown();
    }
  }

  /**
   * Check if dropdown is open
   * @returns {boolean} Open state
   */
  isDropdownOpen() {
    return this.isOpen;
  }

  /**
   * Cleanup profile module
   */
  destroy() {
    this.profileToggle = null;
    this.profileDropdown = null;
    this.profileMenu = null;
    this.isOpen = false;
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ProfileModule = ProfileModule;

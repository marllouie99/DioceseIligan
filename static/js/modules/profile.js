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
    
    console.log('🔍 ProfileModule: Element search results:', {
      profileToggle: !!this.profileToggle,
      profileDropdown: !!this.profileDropdown,
      profileMenu: !!this.profileMenu
    });
    
    if (!this.profileToggle) {
      console.warn('⚠️ ProfileModule: #profile-toggle not found!');
    }
    if (!this.profileDropdown) {
      console.warn('⚠️ ProfileModule: .profile-dropdown not found!');
    }
    if (!this.profileMenu) {
      console.warn('⚠️ ProfileModule: #profile-menu not found!');
    }
  }

  /**
   * Validate required elements exist
   * @returns {boolean} Validation result
   * @private
   */
  validateElements() {
    if (!this.profileToggle || !this.profileDropdown) {
      return false;
    }
    return true;
  }

  /**
   * Bind event listeners
   * @private
   */
  bindEvents() {
    console.log('🔗 ProfileModule: Binding events to profile toggle');
    
    // Toggle dropdown
    this.profileToggle.addEventListener('click', (e) => {
      console.log('👆 ProfileModule: Profile button clicked!');
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.profileDropdown.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Close dropdown when pressing escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDropdown();
      }
    });
    
    console.log('✅ ProfileModule: Event listeners attached successfully');
  }

  /**
   * Toggle profile dropdown
   * @private
   */
  toggleDropdown() {
    console.log('🔄 ProfileModule: Toggling dropdown, current state:', this.isOpen);
    console.log('🔍 ProfileModule: Elements found:', {
      dropdown: !!this.profileDropdown,
      menu: !!this.profileMenu,
      toggle: !!this.profileToggle
    });
    
    this.profileDropdown.classList.toggle('open');
    this.isOpen = this.profileDropdown.classList.contains('open');
    
    console.log('✅ ProfileModule: New state:', this.isOpen);
    console.log('🎨 ProfileModule: Dropdown classes:', this.profileDropdown.className);
    
    if (this.profileMenu) {
      if (this.isOpen) {
        console.log('📖 ProfileModule: Opening menu');
        this.openMenu();
      } else {
        console.log('📕 ProfileModule: Closing menu');
        this.closeMenu();
      }
    } else {
      console.warn('⚠️ ProfileModule: Profile menu element not found!');
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
    
    // Position menu relative to button
    const rect = this.profileToggle.getBoundingClientRect();
    const menuWidth = Math.max(this.profileMenu.offsetWidth, 220);
    const left = Math.max(8, rect.right - menuWidth);
    const top = rect.bottom + 6;
    
    this.profileMenu.style.position = 'fixed';
    this.profileMenu.style.left = left + 'px';
    this.profileMenu.style.top = top + 'px';
    this.profileMenu.style.right = 'auto';
    this.profileMenu.style.zIndex = '10000';
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

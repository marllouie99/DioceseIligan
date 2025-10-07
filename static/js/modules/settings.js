/**
 * Settings Management Module
 * @module Settings
 */

class SettingsManager {
  constructor() {
    this.settingsNavLinks = document.querySelectorAll('.settings-nav-link');
    this.settingsSections = document.querySelectorAll('.settings-section');
    this.settingsScrollContainer = document.querySelector('.settings-content');
  }

  /**
   * Initialize settings functionality
   */
  init() {
    if (!this.settingsNavLinks.length || !this.settingsSections.length) return;
    
    this.initializeSettingsNavigation();
    this.initializeSettingsHeightSync();
    this.initializeInteractiveElements();
  }

  /**
   * Initialize settings navigation
   */
  initializeSettingsNavigation() {
    // Handle settings navigation clicks
    this.settingsNavLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetSection = link.getAttribute('data-section');
        const targetElement = document.getElementById(targetSection);
        
        if (targetElement) {
          this.scrollToSettingsSection(targetElement);
          this.highlightSettingsSection(targetElement);
          this.updateActiveSettingsLink(link);
        }
      });
    });
    
    // Handle scroll-based active section highlighting
    // DISABLED: Conflicts with newer settings navigation system
    // if (this.settingsScrollContainer) {
    //   this.setupSettingsScrollObserver();
    // }
  }

  /**
   * Scroll to settings section
   * @param {HTMLElement} targetElement - Target section element
   */
  scrollToSettingsSection(targetElement) {
    if (this.settingsScrollContainer) {
      const containerRect = this.settingsScrollContainer.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const currentScroll = this.settingsScrollContainer.scrollTop;
      const offsetTop = currentScroll + (targetRect.top - containerRect.top) - 12;
      this.settingsScrollContainer.scrollTo({ top: Math.max(offsetTop, 0), behavior: 'smooth' });
    } else {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Highlight settings section
   * @param {HTMLElement} targetElement - Target section element
   */
  highlightSettingsSection(targetElement) {
    targetElement.style.transition = 'box-shadow 0.3s ease';
    targetElement.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.2)';
    
    setTimeout(() => {
      targetElement.style.boxShadow = '';
    }, 2000);
  }

  /**
   * Update active settings link
   * @param {HTMLElement} activeLink - Active link element
   */
  updateActiveSettingsLink(activeLink) {
    this.settingsNavLinks.forEach(l => l.classList.remove('active'));
    activeLink.classList.add('active');
  }

  /**
   * Setup settings scroll observer
   */
  setupSettingsScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          const correspondingLink = document.querySelector(`[data-section="${sectionId}"]`);
          
          if (correspondingLink) {
            this.settingsNavLinks.forEach(l => l.classList.remove('active'));
            correspondingLink.classList.add('active');
          }
        }
      });
    }, {
      root: this.settingsScrollContainer,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0.1
    });
    
    this.settingsSections.forEach(section => {
      observer.observe(section);
    });
  }

  /**
   * Initialize settings height sync
   */
  initializeSettingsHeightSync() {
    this.syncSettingsContainerHeight();
    
    window.addEventListener('resize', () => this.syncSettingsContainerHeight());
    
    const sidebar = document.querySelector('.settings-sidebar');
    const navList = document.querySelector('.settings-nav-list');
    
    if (window.ResizeObserver && sidebar) {
      const ro = new ResizeObserver(() => this.syncSettingsContainerHeight());
      ro.observe(sidebar);
    }
    
    if (window.MutationObserver && navList) {
      const mo = new MutationObserver(() => this.syncSettingsContainerHeight());
      mo.observe(navList, { childList: true, subtree: true });
    }
  }

  /**
   * Sync settings container height
   */
  syncSettingsContainerHeight() {
    const layout = document.querySelector('.settings-layout');
    const sidebar = document.querySelector('.settings-sidebar');
    const content = document.querySelector('.settings-content');
    
    if (!layout || !sidebar || !content) return;
    
    const gridColumns = getComputedStyle(layout).gridTemplateColumns;
    const isSingleColumn = !gridColumns || gridColumns.split(' ').length === 1;
    
    if (isSingleColumn) {
      content.style.height = '';
      content.style.maxHeight = '';
      return;
    }
    
    const sidebarHeight = sidebar.offsetHeight;
    if (sidebarHeight > 0) {
      content.style.height = sidebarHeight + 'px';
      content.style.maxHeight = sidebarHeight + 'px';
    }
  }

  /**
   * Initialize interactive elements
   */
  initializeInteractiveElements() {
    this.initializeToggleSwitches();
    this.initializeFileUploads();
    this.initializeSocialMediaValidation();
    this.initializeSettingItemAnimations();
  }

  /**
   * Initialize toggle switches
   */
  initializeToggleSwitches() {
    const toggleSwitches = document.querySelectorAll('.toggle-switch input');
    toggleSwitches.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        this.handleToggleSwitchChange(e.target);
      });
    });
  }

  /**
   * Handle toggle switch change
   * @param {HTMLElement} toggle - Toggle element
   */
  handleToggleSwitchChange(toggle) {
    const settingItem = toggle.closest('.setting-item');
    const statusBadge = settingItem.querySelector('.status-badge');
    const statusDescription = settingItem.querySelector('.status-description');
    
    if (statusBadge && statusDescription) {
      if (toggle.checked) {
        statusBadge.textContent = 'Active';
        statusBadge.className = 'status-badge active';
        statusDescription.textContent = 'Your church is visible to users';
      } else {
        statusBadge.textContent = 'Inactive';
        statusBadge.className = 'status-badge inactive';
        statusDescription.textContent = 'Your church is hidden from users';
      }
    }
  }

  /**
   * Initialize file uploads
   */
  initializeFileUploads() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.handleFileUpload(e.target);
      });
    });
  }

  /**
   * Handle file upload
   * @param {HTMLElement} input - File input element
   */
  handleFileUpload(input) {
    // Skip default preview for branding inputs; cropper flow handles those
    if (input && (input.id === 'id_logo' || input.id === 'id_cover_image')) {
      return;
    }
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const settingItem = input.closest('.setting-item');
      const settingInfo = settingItem.querySelector('.setting-info');
      
      // Remove existing preview
      const existingPreview = settingInfo.querySelector('.current-media-preview');
      if (existingPreview) {
        existingPreview.remove();
      }
      
      // Create new preview
      const preview = document.createElement('div');
      preview.className = 'current-media-preview';
      preview.innerHTML = `
        <img src="${e.target.result}" alt="Preview" class="media-preview-image" loading="lazy" decoding="async">
        <span class="media-status">New ${input.id.includes('logo') ? 'logo' : 'cover image'}</span>
      `;
      settingInfo.appendChild(preview);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Initialize social media validation
   */
  initializeSocialMediaValidation() {
    const socialInputs = document.querySelectorAll('.social-input-group input');
    socialInputs.forEach(input => {
      input.addEventListener('blur', (e) => {
        this.validateSocialMediaUrl(e.target);
      });
    });
  }

  /**
   * Validate social media URL
   * @param {HTMLElement} input - Input element
   */
  validateSocialMediaUrl(input) {
    const value = input.value.trim();
    const settingItem = input.closest('.setting-item');
    const socialStatus = settingItem.querySelector('.social-status');
    
    if (value) {
      try {
        const parsed = new URL(value);
        if (this.isSafeHttpUrl(parsed)) {
          if (!socialStatus) {
            this.createSocialStatusElement(settingItem, parsed.toString());
          }
        } else if (socialStatus) {
          socialStatus.remove();
        }
      } catch (e) {
        if (socialStatus) {
          socialStatus.remove();
        }
      }
    } else {
      if (socialStatus) {
        socialStatus.remove();
      }
    }
  }

  /**
   * Create social status element
   * @param {HTMLElement} settingItem - Setting item element
   * @param {string} url - Social media URL
   */
  createSocialStatusElement(settingItem, url) {
    const statusDiv = document.createElement('div');
    statusDiv.className = 'social-status';
    const safeUrl = this.isSafeHttpUrl(new URL(url)) ? url : '#';
    statusDiv.innerHTML = `
      <span class="status-badge connected">Connected</span>
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="social-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        Visit Link
      </a>
    `;
    settingItem.querySelector('.setting-info').appendChild(statusDiv);
  }

  /**
   * Check if URL uses http/https scheme only
   * @param {URL} urlObj
   * @returns {boolean}
   */
  isSafeHttpUrl(urlObj) {
    if (!(urlObj instanceof URL)) return false;
    const protocol = urlObj.protocol.toLowerCase();
    return protocol === 'http:' || protocol === 'https:';
  }

  /**
   * Initialize setting item animations
   */
  initializeSettingItemAnimations() {
    const settingItems = document.querySelectorAll('.setting-item');
    settingItems.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        item.style.transition = 'all 0.3s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, index * 50);
    });
  }
}

// Export the SettingsManager class
window.SettingsManager = SettingsManager;

// Auto-initialize if DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (!window.settingsManagerInitialized && document.querySelector('.settings-nav')) {
    const settingsManager = new SettingsManager();
    settingsManager.init();
    window.settingsManagerInitialized = true;
  }
});

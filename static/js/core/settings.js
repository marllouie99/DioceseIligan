/**
 * Settings Management Module
 * @module Settings
 */

class SettingsManager {
  constructor() {
    this.root = document.getElementById('settings');
    const scope = this.root || document;
    this.settingsNavLinks = scope.querySelectorAll('.settings-nav-link');
    this.settingsSections = scope.querySelectorAll('.settings-section');
    this.settingsScrollContainer = scope.querySelector('.settings-content'); // Content area is the scroll container
    this.isNavigating = false; // Flag to prevent observer conflicts
  }

  /**
   * Compute element's offsetTop relative to a scroll container
   */
  computeRelativeOffsetTop(el, container) {
    let offset = 0;
    let node = el;
    while (node && node !== container) {
      offset += node.offsetTop || 0;
      node = node.offsetParent;
    }
    return offset;
  }

  /**
   * Ensure any hidden sections are made visible (in case of inline display:none)
   */
  ensureSectionsVisible() {
    this.settingsSections.forEach(sec => {
      const cs = window.getComputedStyle(sec);
      if (cs && cs.display === 'none') {
        sec.style.display = 'block';
      }
    });
  }

  /**
   * Scroll to section from hash or query param
   */
  scrollToInitialSection() {
    const hash = (window.location.hash || '').replace('#', '').trim();
    const url = new URL(window.location.href);
    const qp = (url.searchParams.get('section') || '').trim();
    const targetId = hash || qp; // Do not fallback to last visited section
    
    if (!targetId) return;

    const el = document.getElementById(targetId);
    if (!el) return;

    // Delay slightly to allow height sync
    setTimeout(() => {
      this.scrollToSettingsSection(el);
      this.highlightSettingsSection(el);
      const correspondingLink = document.querySelector(`[data-section="${targetId}"]`);
      if (correspondingLink) this.updateActiveSettingsLink(correspondingLink);
    }, 150);
  }

  /**
   * Save last visited section to localStorage
   * @param {string} sectionId - Section ID to save
   */
  saveLastVisitedSection(sectionId) {
    try {
      localStorage.setItem('churchmanage_last_settings_section', sectionId);
    } catch (e) {
      // localStorage not available, silently fail
    }
  }

  /**
   * Get last visited section from localStorage
   * @returns {string|null} - Last visited section ID
   */
  getLastVisitedSection() {
    try {
      return localStorage.getItem('churchmanage_last_settings_section');
    } catch (e) {
      return null;
    }
  }

  /**
   * Auto-scroll to first form error field
   */
  scrollToFirstError() {
    const firstError = this.root?.querySelector('.form-error, .field-error, .error');
    if (!firstError) return;

    // Find the containing settings section
    const containingSection = firstError.closest('.settings-section');
    if (containingSection) {
      setTimeout(() => {
        this.scrollToSettingsSection(containingSection);
        
        // Focus the error field if it's an input
        const errorField = firstError.previousElementSibling || 
                          firstError.parentElement?.querySelector('input, textarea, select');
        if (errorField && errorField.focus) {
          setTimeout(() => errorField.focus(), 200);
        }
      }, 100);
    }
  }

  /**
   * Initialize settings functionality
   */
  init() {
    if (!this.settingsNavLinks.length || !this.settingsSections.length) return;
    
    this.initializeSettingsNavigation();
    this.initializeSettingsHeightSync();
    this.initializeInteractiveElements();

    // Make sure all sections are visible even if inline styles hide them
    this.ensureSectionsVisible();

    // Support deep-linking to a section via #hash or ?section=
    this.scrollToInitialSection();
    
    // Auto-scroll to first error field if form was submitted with errors
    this.scrollToFirstError();
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
          this.isNavigating = true; // Disable observer temporarily
          this.scrollToSettingsSection(targetElement);
          this.highlightSettingsSection(targetElement);
          this.updateActiveSettingsLink(link);
          this.saveLastVisitedSection(targetSection);
          
          // Re-enable observer after scroll completes
          setTimeout(() => {
            this.isNavigating = false;
          }, 500);
        }
      });
    });
    
    // Add keyboard navigation
    this.initializeKeyboardNavigation();
    
    // Handle scroll-based active section highlighting
    if (this.settingsScrollContainer) {
      this.setupSettingsScrollObserver();
    }
  }

  /**
   * Initialize keyboard navigation for settings sidebar
   */
  initializeKeyboardNavigation() {
    const navList = this.root?.querySelector('.settings-nav-list');
    if (!navList) return;

    navList.addEventListener('keydown', (e) => {
      const currentLink = document.activeElement;
      if (!currentLink || !currentLink.classList.contains('settings-nav-link')) return;

      const links = Array.from(this.settingsNavLinks);
      const currentIndex = links.indexOf(currentLink);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % links.length;
          links[nextIndex].focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + links.length) % links.length;
          links[prevIndex].focus();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          currentLink.click();
          break;
        case 'Home':
          e.preventDefault();
          links[0].focus();
          break;
        case 'End':
          e.preventDefault();
          links[links.length - 1].focus();
          break;
      }
    });

    // Make nav links focusable
    this.settingsNavLinks.forEach((link, index) => {
      link.setAttribute('tabindex', index === 0 ? '0' : '-1');
      link.setAttribute('role', 'tab');
    });
  }

  /**
   * Scroll to settings section
   * @param {HTMLElement} targetElement - Target section element
   */
  scrollToSettingsSection(targetElement) {
    console.log('Scrolling to section:', targetElement.id);
    
    if (this.settingsScrollContainer) {
      // Get the container's padding/border offset
      const containerStyles = window.getComputedStyle(this.settingsScrollContainer);
      const containerPaddingTop = parseInt(containerStyles.paddingTop) || 0;
      
      // Calculate target position more accurately
      const containerRect = this.settingsScrollContainer.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const scrollTop = this.settingsScrollContainer.scrollTop;
      
      // Calculate precise scroll position
      const targetScrollTop = scrollTop + (targetRect.top - containerRect.top) - containerPaddingTop - 16;
      const finalScrollTop = Math.max(0, targetScrollTop);
      
      console.log('Container padding:', containerPaddingTop);
      console.log('Current scroll:', scrollTop);
      console.log('Target scroll:', finalScrollTop);
      
      // Use only scrollTo for consistency
      this.settingsScrollContainer.scrollTo({ 
        top: finalScrollTop, 
        behavior: 'smooth' 
      });
      // Do not mutate URL hash here to avoid making Settings persistent across navigations
    } else {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Do not mutate URL hash here to avoid making Settings persistent across navigations
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
    // Remove active class from ALL settings nav links (even outside the current scope)
    document.querySelectorAll('.settings-nav-link').forEach((l) => {
      l.classList.remove('active');
      l.setAttribute('tabindex', '-1');
      l.setAttribute('aria-selected', 'false');
    });
    
    // Set the new active link
    if (activeLink) {
      activeLink.classList.add('active');
      activeLink.setAttribute('tabindex', '0');
      activeLink.setAttribute('aria-selected', 'true');
      
      // Scroll the sidebar to bring the active link into view
      this.scrollSidebarToActiveLink(activeLink);
    }
  }

  /**
   * Scroll sidebar to bring active link into view
   * @param {HTMLElement} activeLink - The active navigation link
   */
  scrollSidebarToActiveLink(activeLink) {
    const sidebar = this.root?.querySelector('.settings-sidebar');
    if (!sidebar || !activeLink) return;

    const sidebarRect = sidebar.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    
    // Check if link is outside visible area
    const isAbove = linkRect.top < sidebarRect.top;
    const isBelow = linkRect.bottom > sidebarRect.bottom;
    
    if (isAbove || isBelow) {
      // Calculate scroll position to center the active link
      const sidebarScrollTop = sidebar.scrollTop;
      const linkOffsetTop = activeLink.offsetTop;
      const sidebarHeight = sidebar.clientHeight;
      const linkHeight = activeLink.offsetHeight;
      
      const targetScrollTop = linkOffsetTop - (sidebarHeight / 2) + (linkHeight / 2);
      
      sidebar.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    }
  }

  /**
   * Setup settings scroll observer
   */
  setupSettingsScrollObserver() {
    let observerTimeout = null;
    
    const observer = new IntersectionObserver((entries) => {
      // Skip observer updates during programmatic navigation
      if (this.isNavigating) return;
      
      // Debounce rapid scroll events to prevent multiple highlights
      if (observerTimeout) {
        clearTimeout(observerTimeout);
      }
      
      observerTimeout = setTimeout(() => {
        // Get all currently intersecting sections with their visibility data
        const visibleSections = [];
        
        // Check all sections, not just the entries from this callback
        this.settingsSections.forEach(section => {
          const rect = section.getBoundingClientRect();
          const containerRect = this.settingsScrollContainer.getBoundingClientRect();
          
          // Check if section is intersecting with the container
          const isIntersecting = rect.top < containerRect.bottom && rect.bottom > containerRect.top;
          
          if (isIntersecting) {
            // Calculate how much of the section is actually visible
            const visibleTop = Math.max(rect.top, containerRect.top);
            const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            const visibilityScore = visibleHeight / rect.height;
            
            // Calculate distance from the container's top
            const distanceFromTop = Math.abs(rect.top - containerRect.top);
            
            visibleSections.push({
              element: section,
              visibilityScore: visibilityScore,
              distanceFromTop: distanceFromTop,
              sectionTop: rect.top,
              sectionBottom: rect.bottom
            });
          }
        });
        
        if (visibleSections.length > 0) {
          // Find the section that's most prominently visible
          let bestSection = null;
          
          // First, check if any section is more than 50% visible
          const highlyVisibleSections = visibleSections.filter(s => s.visibilityScore > 0.5);
          
          if (highlyVisibleSections.length > 0) {
            // Choose the most visible one among highly visible sections
            bestSection = highlyVisibleSections.reduce((prev, curr) => 
              curr.visibilityScore > prev.visibilityScore ? curr : prev
            );
          } else {
            // If no section is highly visible, choose the one closest to the top
            bestSection = visibleSections.reduce((prev, curr) => 
              curr.distanceFromTop < prev.distanceFromTop ? curr : prev
            );
          }
          
          if (bestSection) {
            const sectionId = bestSection.element.id;
            const correspondingLink = document.querySelector(`[data-section="${sectionId}"]`);
            
            // Only update if this is different from the current active link
            const currentActiveLink = document.querySelector('.settings-nav-link.active');
            const currentActiveSection = currentActiveLink?.getAttribute('data-section');
            
            if (correspondingLink && currentActiveSection !== sectionId) {
              console.log('Observer switching to:', sectionId, 'visibility score:', bestSection.visibilityScore);
              this.updateActiveSettingsLink(correspondingLink);
              this.saveLastVisitedSection(sectionId);
            }
          }
        }
      }, 150); // 150ms debounce to prevent rapid updates during scroll
      
    }, {
      root: this.settingsScrollContainer,
      rootMargin: '-10px 0px -50% 0px', // More conservative margins to reduce sensitivity
      threshold: [0, 0.25, 0.5, 0.75, 1]
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
   * Sync settings container height (simplified - CSS handles most of it now)
   */
  syncSettingsContainerHeight() {
    const scope = this.root || document;
    const layout = scope.querySelector('.settings-layout');
    const content = scope.querySelector('.settings-content');
    
    if (!layout || !content) return;
    
    // Only handle responsive/mobile cases where grid might collapse
    const gridColumns = getComputedStyle(layout).gridTemplateColumns;
    const isSingleColumn = !gridColumns || gridColumns.split(' ').length === 1;
    
    if (isSingleColumn) {
      // On mobile, let content use natural height
      content.style.height = 'auto';
      content.style.maxHeight = '70vh';
    } else {
      // On desktop, CSS handles the height via .settings-content { height: 100% }
      content.style.height = '';
      content.style.maxHeight = '';
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

// Export for use in main application
window.SettingsManager = SettingsManager;
// Note: No auto-initialization here. The main app (manage_church_new.js)
// is responsible for creating and initializing SettingsManager when the
// Settings tab becomes active. This prevents unintended hash updates on load.

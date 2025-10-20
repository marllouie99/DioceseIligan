/**
 * Tab Management Module
 * @module Tabs
 */

class TabManager {
  constructor(config = {}) {
    this.config = {
      defaultTab: 'appointments',
      ...config
    };
  }

  /**
   * Initialize tab functionality
   */
  init() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    if (!tabButtons.length || !tabPanels.length) return;
    
    // Get tab from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    
    // Check for hash in URL (e.g., #payment-settings)
    const hash = window.location.hash.substring(1); // Remove the #
    
    // Check if we should return to a saved section after form submit
    let returnToSection = null;
    try {
      returnToSection = sessionStorage.getItem('return_to_section');
      if (returnToSection) {
        sessionStorage.removeItem('return_to_section');
      }
    } catch(e) {}
    
    // Determine initial active tab, but ignore `settings` in query param
    let activeTab = this.config.defaultTab;
    if (tabFromUrl && tabFromUrl !== 'settings') {
      activeTab = tabFromUrl;
    }
    
    // Priority: return to saved section > hash > default tab
    if (returnToSection) {
      // User just saved a settings section, return there
      activeTab = 'settings';
      this.setActiveTab(activeTab, tabButtons, tabPanels);
      setTimeout(() => {
        this.scrollToSettingsSection(returnToSection);
      }, 500);
    } else if (hash && hash.endsWith('-settings')) {
      // Deep link to a settings section
      activeTab = 'settings';
      this.setActiveTab(activeTab, tabButtons, tabPanels);
      setTimeout(() => {
        this.scrollToSettingsSection(hash);
      }, 500);
      // Clear hash after scrolling to prevent re-triggering on manual refresh
      setTimeout(() => {
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
      }, 1000);
    } else {
      // Normal tab initialization
      this.setActiveTab(activeTab, tabButtons, tabPanels);
    }

    // Always sanitize URL: if ?tab=settings was present, remove it without changing active tab
    if (tabFromUrl === 'settings') {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('tab');
      window.history.replaceState(null, null, cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    }

    // Initialize sub-tabs
    this.initSubTabs();

    // Click navigation for main tabs
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      e.preventDefault();
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) return;
      if (btn.classList.contains('active')) return;
      this.setActiveTab(targetTab, tabButtons, tabPanels);
      this.updateURL(targetTab);
    });

    // Keyboard support for accessibility
    document.addEventListener('keydown', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const targetTab = btn.getAttribute('data-tab');
        if (!targetTab) return;
        if (btn.classList.contains('active')) return;
        this.setActiveTab(targetTab, tabButtons, tabPanels);
        this.updateURL(targetTab);
      }
    });
  }

  /**
   * Initialize sub-tab functionality
   */
  initSubTabs() {
    // Handle sub-tab clicks
    document.addEventListener('click', (e) => {
      const subTabBtn = e.target.closest('.sub-tab-btn');
      if (!subTabBtn) return;
      e.preventDefault();
      
      const targetSubTab = subTabBtn.getAttribute('data-subtab');
      if (!targetSubTab) return;
      
      // Avoid redundant work if already active
      if (subTabBtn.classList.contains('active')) return;
      
      this.setActiveSubTab(targetSubTab);
    });

    // Keyboard support for sub-tabs
    document.addEventListener('keydown', (e) => {
      const subTabBtn = e.target.closest('.sub-tab-btn');
      if (!subTabBtn) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const targetSubTab = subTabBtn.getAttribute('data-subtab');
        if (!targetSubTab) return;
        if (subTabBtn.classList.contains('active')) return;
        this.setActiveSubTab(targetSubTab);
      }
    });
  }

  /**
   * Set active sub-tab
   * @param {string} targetSubTab - Target sub-tab name
   */
  setActiveSubTab(targetSubTab) {
    const subTabButtons = document.querySelectorAll('.sub-tab-btn');
    const subTabPanels = document.querySelectorAll('.sub-tab-panel');
    
    // Remove active class from all sub-tab buttons and panels
    subTabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    subTabPanels.forEach(panel => {
      panel.classList.remove('active');
      panel.setAttribute('aria-hidden', 'true');
    });
    
    // Add active class to target sub-tab button and panel
    const activeSubTabButton = document.querySelector(`[data-subtab="${targetSubTab}"]`);
    const activeSubTabPanel = document.getElementById(`content-${targetSubTab}`);
    
    if (activeSubTabButton) {
      activeSubTabButton.classList.add('active');
      activeSubTabButton.setAttribute('aria-selected', 'true');
    }
    if (activeSubTabPanel) {
      activeSubTabPanel.classList.add('active');
      activeSubTabPanel.setAttribute('aria-hidden', 'false');
    }
  }

  /**
   * Set active tab
   * @param {string} targetTab - Target tab name
   * @param {NodeList} tabButtons - Tab button elements
   * @param {NodeList} tabPanels - Tab panel elements
   */
  setActiveTab(targetTab, tabButtons, tabPanels) {
    // Remove active class from all buttons and panels
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    tabPanels.forEach(panel => {
      panel.classList.remove('active');
      panel.setAttribute('aria-hidden', 'true');
    });
    
    // Add active class to target button and panel
    const activeButton = document.querySelector(`[data-tab="${targetTab}"]`);
    const activePanel = document.getElementById(targetTab);
    
    if (activeButton) {
      activeButton.classList.add('active');
      activeButton.setAttribute('aria-selected', 'true');

      // If switching to appointments, optimistically hide the badge and
      // ask the backend to mark booking notifications as read for this church
      if (targetTab === 'appointments') {
        try {
          const badge = activeButton.querySelector('.notification-badge');
          if (badge) {
            badge.style.display = 'none';
          }
          const url = new URL(window.location.href);
          url.searchParams.set('ajax_mark_read', '1');
          fetch(url.toString(), { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .catch(err => console.warn('Failed to mark booking notifications as read:', err));
        } catch (e) {
          console.warn('Error clearing appointment badge:', e);
        }
      }
    }
    if (activePanel) {
      activePanel.classList.add('active');
      activePanel.setAttribute('aria-hidden', 'false');
    }
  }

  /**
   * Update URL with tab parameter
   * @param {string} targetTab - Target tab name
   */
  updateURL(targetTab) {
    const url = new URL(window.location);
    // Do not persist the settings tab in the URL. Only persist other tabs.
    if (targetTab === 'settings' || targetTab === this.config.defaultTab) {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', targetTab);
    }
    // Always clear any existing hash (e.g., #payment-settings) when navigating tabs
    url.hash = '';
    window.history.pushState({}, '', url);
  }

  /**
   * Scroll to a specific settings section
   * @param {string} sectionId - Section ID to scroll to
   */
  scrollToSettingsSection(sectionId) {
    const targetSection = document.getElementById(sectionId);
    const settingsContent = document.querySelector('.settings-content');
    
    if (!targetSection || !settingsContent) {
      console.warn('Section or settings content not found:', sectionId);
      return;
    }
    
    // Update active state in settings navigation
    const navLinks = document.querySelectorAll('.settings-nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      const linkSection = link.getAttribute('data-section') || link.getAttribute('href')?.replace('#', '');
      if (linkSection === sectionId) {
        link.classList.add('active');
      }
    });
    
    // Calculate exact position
    const sectionTop = targetSection.offsetTop;
    
    // Scroll to the section
    settingsContent.scrollTo({
      top: sectionTop - 20, // 20px offset for spacing
      behavior: 'smooth'
    });
    
    console.log('Scrolled to settings section:', sectionId);
  }
}

// Export for use in main application
window.TabManager = TabManager;

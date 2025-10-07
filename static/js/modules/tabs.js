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
    const activeTab = tabFromUrl || this.config.defaultTab;
    
    // Set initial active tab
    this.setActiveTab(activeTab, tabButtons, tabPanels);
    
    // Use event delegation for better performance and reliable targeting
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      e.preventDefault();
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) return;
      // Avoid redundant work if already active
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
    if (targetTab === this.config.defaultTab) {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', targetTab);
    }
    window.history.pushState({}, '', url);
  }
}

// Export for use in main application
window.TabManager = TabManager;

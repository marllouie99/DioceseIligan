/**
 * Manage Availability System
 * Main coordinator for availability management functionality
 */

class ManageAvailabilitySystem {
  constructor() {
    this.modules = {
      calendar: null,
      data: null,
      events: null
    };
    this.isInitialized = false;
  }

  /**
   * Initialize the manage availability system
   */
  init() {
    if (this.isInitialized) return;

    try {
      this.initializeModules();
      this.setupModuleConnections();
      this.setupAvailabilityData();
      this.setupEventHandlers();
      this.isInitialized = true;
      
      } catch (error) {
      }
  }

  /**
   * Initialize all modules
   */
  initializeModules() {
    // Initialize calendar module
    if (window.AvailabilityCalendar) {
      this.modules.calendar = new window.AvailabilityCalendar();
      this.modules.calendar.init();
    }

    // Initialize data module
    if (window.AvailabilityData) {
      this.modules.data = new window.AvailabilityData();
      this.modules.data.init();
    }

    // Initialize events module
    if (window.AvailabilityEvents) {
      this.modules.events = new window.AvailabilityEvents();
      this.modules.events.init();
    }
  }

  /**
   * Setup connections between modules
   */
  setupModuleConnections() {
    // Connect events to calendar and data
    if (this.modules.events) {
      if (this.modules.calendar) {
        this.modules.events.setCalendar(this.modules.calendar);
      }
      if (this.modules.data) {
        this.modules.events.setData(this.modules.data);
      }
    }

    // Connect calendar to data
    if (this.modules.calendar && this.modules.data) {
      this.modules.calendar.setAvailabilityData(this.modules.data.getAllData());
    }
  }

  /**
   * Setup availability data from Django template
   */
  setupAvailabilityData() {
    if (!this.modules.data) return;

    // Get availability data from global variable or template
    const availabilityData = window.availabilityData || {};
    this.modules.data.setData(availabilityData);
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    if (this.modules.events) {
      this.modules.events.setupKeyboardNavigation();
      this.modules.events.setupDragAndDrop();
    }
  }

  /**
   * Get calendar instance
   * @returns {AvailabilityCalendar|null} Calendar instance
   */
  getCalendar() {
    return this.modules.calendar;
  }

  /**
   * Get data instance
   * @returns {AvailabilityData|null} Data instance
   */
  getData() {
    return this.modules.data;
  }

  /**
   * Get events instance
   * @returns {AvailabilityEvents|null} Events instance
   */
  getEvents() {
    return this.modules.events;
  }

  /**
   * Initialize calendar
   */
  initializeCalendar() {
    if (this.modules.calendar) {
      this.modules.calendar.render();
    }
  }

  /**
   * Navigate to previous month
   */
  navigateToPreviousMonth() {
    if (this.modules.calendar) {
      this.modules.calendar.handlePreviousMonth();
    }
  }

  /**
   * Navigate to next month
   */
  navigateToNextMonth() {
    if (this.modules.calendar) {
      this.modules.calendar.handleNextMonth();
    }
  }

  /**
   * Navigate to specific month
   * @param {number} year - Year
   * @param {number} month - Month (0-based)
   */
  navigateToMonth(year, month) {
    if (this.modules.calendar) {
      this.modules.calendar.navigateToMonth(year, month);
    }
  }

  /**
   * Get availability data for specific date
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   * @returns {Object|null} Availability data or null
   */
  getAvailabilityForDate(dateStr) {
    return this.modules.data ? this.modules.data.getDataForDate(dateStr) : null;
  }

  /**
   * Update availability data for specific date
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   * @param {Object} availability - Availability data
   */
  updateAvailabilityForDate(dateStr, availability) {
    if (this.modules.events) {
      this.modules.events.handleAvailabilityUpdate(dateStr, availability);
    }
  }

  /**
   * Delete availability data for specific date
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   */
  deleteAvailabilityForDate(dateStr) {
    if (this.modules.events) {
      this.modules.events.handleAvailabilityDeletion(dateStr);
    }
  }

  /**
   * Get data summary
   * @returns {Object} Data summary
   */
  getDataSummary() {
    return this.modules.data ? this.modules.data.getSummary() : null;
  }

  /**
   * Refresh data
   */
  refreshData() {
    if (this.modules.events) {
      this.modules.events.handleDataRefresh();
    }
  }

  /**
   * Export data as JSON
   * @returns {string} JSON string
   */
  exportData() {
    return this.modules.data ? this.modules.data.exportAsJSON() : null;
  }

  /**
   * Import data from JSON
   * @param {string} jsonString - JSON string
   * @returns {boolean} True if successful
   */
  importData(jsonString) {
    return this.modules.data ? this.modules.data.importFromJSON(jsonString) : false;
  }
}

// Global functions for backward compatibility
let manageAvailabilitySystem = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  manageAvailabilitySystem = new ManageAvailabilitySystem();
  manageAvailabilitySystem.init();
  
  // Initialize calendar after system is ready
  manageAvailabilitySystem.initializeCalendar();
});

// Expose global functions for template compatibility
window.initializeCalendar = function() {
  if (manageAvailabilitySystem) {
    manageAvailabilitySystem.initializeCalendar();
  }
};

// Export for use in other modules
window.ManageAvailabilitySystem = ManageAvailabilitySystem;



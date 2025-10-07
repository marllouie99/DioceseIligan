/**
 * Availability Data Module
 * @module AvailabilityData
 */

class AvailabilityData {
  constructor() {
    this.data = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the availability data module
   */
  init() {
    if (this.isInitialized) return;
    
    this.loadData();
    this.isInitialized = true;
  }

  /**
   * Load availability data from global variable
   */
  loadData() {
    // Load data from global variable set by Django template
    if (window.availabilityData) {
      this.data = window.availabilityData;
    }
  }

  /**
   * Set availability data
   * @param {Object} data - Availability data object
   */
  setData(data) {
    this.data = data || {};
  }

  /**
   * Get all availability data
   * @returns {Object} Availability data object
   */
  getAllData() {
    return this.data;
  }

  /**
   * Get availability data for specific date
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   * @returns {Object|null} Availability data or null
   */
  getDataForDate(dateStr) {
    return this.data[dateStr] || null;
  }

  /**
   * Set availability data for specific date
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   * @param {Object} availability - Availability data
   */
  setDataForDate(dateStr, availability) {
    this.data[dateStr] = availability;
  }

  /**
   * Remove availability data for specific date
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   */
  removeDataForDate(dateStr) {
    delete this.data[dateStr];
  }

  /**
   * Check if date has availability data
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   * @returns {boolean} True if date has data
   */
  hasDataForDate(dateStr) {
    return dateStr in this.data;
  }

  /**
   * Get all dates with availability data
   * @returns {Array} Array of date strings
   */
  getAllDates() {
    return Object.keys(this.data);
  }

  /**
   * Get availability data for date range
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Object} Availability data for date range
   */
  getDataForDateRange(startDate, endDate) {
    const result = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (const dateStr in this.data) {
      const date = new Date(dateStr);
      if (date >= start && date <= end) {
        result[dateStr] = this.data[dateStr];
      }
    }
    
    return result;
  }

  /**
   * Get closed dates
   * @returns {Array} Array of closed date strings
   */
  getClosedDates() {
    const closedDates = [];
    for (const dateStr in this.data) {
      if (this.data[dateStr].is_closed) {
        closedDates.push(dateStr);
      }
    }
    return closedDates;
  }

  /**
   * Get special hours dates
   * @returns {Array} Array of special hours date strings
   */
  getSpecialHoursDates() {
    const specialHoursDates = [];
    for (const dateStr in this.data) {
      if (!this.data[dateStr].is_closed) {
        specialHoursDates.push(dateStr);
      }
    }
    return specialHoursDates;
  }

  /**
   * Validate availability data
   * @param {Object} availability - Availability data to validate
   * @returns {boolean} True if valid
   */
  validateAvailabilityData(availability) {
    if (!availability || typeof availability !== 'object') {
      return false;
    }

    // Check required fields
    if (typeof availability.is_closed !== 'boolean') {
      return false;
    }

    if (availability.is_closed) {
      // For closed dates, reason is required
      return typeof availability.reason === 'string' && availability.reason.trim() !== '';
    } else {
      // For special hours, start_time and end_time are required
      return typeof availability.start_time === 'string' && 
             typeof availability.end_time === 'string' &&
             availability.start_time.trim() !== '' &&
             availability.end_time.trim() !== '';
    }
  }

  /**
   * Get data summary
   * @returns {Object} Data summary
   */
  getSummary() {
    const totalDates = Object.keys(this.data).length;
    const closedDates = this.getClosedDates().length;
    const specialHoursDates = this.getSpecialHoursDates().length;
    
    return {
      totalDates,
      closedDates,
      specialHoursDates,
      regularDates: totalDates - closedDates - specialHoursDates
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.data = {};
  }

  /**
   * Export data as JSON
   * @returns {string} JSON string
   */
  exportAsJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Import data from JSON
   * @param {string} jsonString - JSON string
   * @returns {boolean} True if successful
   */
  importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (typeof data === 'object' && data !== null) {
        this.data = data;
        return true;
      }
    } catch (error) {
      }
    return false;
  }
}

// Export for use in main application
window.AvailabilityData = AvailabilityData;



/**
 * Availability Events Module
 * @module AvailabilityEvents
 */

class AvailabilityEvents {
  constructor() {
    this.elements = null;
    this.isInitialized = false;
    this.calendar = null;
    this.data = null;
  }

  /**
   * Initialize the availability events module
   */
  init() {
    if (this.isInitialized) return;
    
    this.getElements();
    this.validateElements();
    this.bindEvents();
    this.isInitialized = true;
  }

  /**
   * Get and cache DOM elements
   */
  getElements() {
    this.elements = {
      deleteButtons: document.querySelectorAll('.btn-danger')
    };
  }

  /**
   * Validate required elements exist
   */
  validateElements() {
    // Delete buttons are optional, so we don't require them
    return true;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Add confirmation for delete actions
    this.elements.deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.handleDeleteClick(e);
      });
    });
  }

  /**
   * Set the calendar reference
   * @param {AvailabilityCalendar} calendar - Calendar instance
   */
  setCalendar(calendar) {
    this.calendar = calendar;
  }

  /**
   * Set the data reference
   * @param {AvailabilityData} data - Data instance
   */
  setData(data) {
    this.data = data;
  }

  /**
   * Handle delete button click
   * @param {Event} e - Click event
   */
  handleDeleteClick(e) {
    if (!confirm('Are you sure you want to delete this availability entry? This action cannot be undone.')) {
      e.preventDefault();
    }
  }

  /**
   * Handle date selection
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   */
  handleDateSelection(dateStr) {
    if (this.calendar) {
      // Navigate to create availability page
      if (window.createAvailabilityUrl) {
        window.location.href = `${window.createAvailabilityUrl}?date=${dateStr}`;
      }
    }
  }

  /**
   * Handle availability data update
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   * @param {Object} availability - Availability data
   */
  handleAvailabilityUpdate(dateStr, availability) {
    if (this.data) {
      this.data.setDataForDate(dateStr, availability);
    }
    
    if (this.calendar) {
      this.calendar.updateAvailabilityForDate(dateStr, availability);
    }
  }

  /**
   * Handle availability data deletion
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   */
  handleAvailabilityDeletion(dateStr) {
    if (this.data) {
      this.data.removeDataForDate(dateStr);
    }
    
    if (this.calendar) {
      this.calendar.updateAvailabilityForDate(dateStr, null);
    }
  }

  /**
   * Handle calendar navigation
   * @param {string} direction - 'prev' or 'next'
   */
  handleCalendarNavigation(direction) {
    if (this.calendar) {
      if (direction === 'prev') {
        this.calendar.handlePreviousMonth();
      } else if (direction === 'next') {
        this.calendar.handleNextMonth();
      }
    }
  }

  /**
   * Handle month change
   * @param {number} year - Year
   * @param {number} month - Month (0-based)
   */
  handleMonthChange(year, month) {
    if (this.calendar) {
      this.calendar.navigateToMonth(year, month);
    }
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeydown(e) {
    if (this.calendar) {
      switch (e.key) {
        case 'ArrowLeft':
          this.calendar.handlePreviousMonth();
          break;
        case 'ArrowRight':
          this.calendar.handleNextMonth();
          break;
      }
    }
  }

  /**
   * Setup drag and drop for calendar dates
   */
  setupDragAndDrop() {
    // This could be implemented for drag-and-drop functionality
    // For now, we'll keep it simple with click handlers
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   * @param {Object} formData - Form data
   */
  handleFormSubmission(e, formData) {
    // Handle availability form submission
    // This would typically involve AJAX calls to save data
    }

  /**
   * Handle data refresh
   */
  handleDataRefresh() {
    if (this.data) {
      this.data.loadData();
    }
    
    if (this.calendar) {
      this.calendar.render();
    }
  }

  /**
   * Remove event listeners (cleanup)
   */
  destroy() {
    // Remove keyboard event listener
    document.removeEventListener('keydown', this.handleKeydown);
    
    // Remove delete button listeners
    this.elements.deleteButtons.forEach(button => {
      button.removeEventListener('click', this.handleDeleteClick);
    });
  }
}

// Export for use in main application
window.AvailabilityEvents = AvailabilityEvents;



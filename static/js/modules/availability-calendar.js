/**
 * Availability Calendar Module
 * @module AvailabilityCalendar
 */

class AvailabilityCalendar {
  constructor() {
    this.elements = null;
    this.isInitialized = false;
    this.currentDate = new Date();
    this.availabilityData = {};
  }

  /**
   * Initialize the calendar module
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
      calendarGrid: document.getElementById('calendar-grid'),
      currentMonthEl: document.getElementById('current-month'),
      prevBtn: document.getElementById('prev-month'),
      nextBtn: document.getElementById('next-month')
    };
  }

  /**
   * Validate required elements exist
   */
  validateElements() {
    if (!this.elements.calendarGrid) {
      return false;
    }
    if (!this.elements.currentMonthEl) {
      return false;
    }
    if (!this.elements.prevBtn) {
      return false;
    }
    if (!this.elements.nextBtn) {
      return false;
    }
    return true;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    if (this.elements.prevBtn) {
      this.elements.prevBtn.addEventListener('click', () => {
        this.handlePreviousMonth();
      });
    }

    if (this.elements.nextBtn) {
      this.elements.nextBtn.addEventListener('click', () => {
        this.handleNextMonth();
      });
    }
  }

  /**
   * Set availability data
   * @param {Object} data - Availability data object
   */
  setAvailabilityData(data) {
    this.availabilityData = data || {};
  }

  /**
   * Set current date
   * @param {Date} date - Current date
   */
  setCurrentDate(date) {
    this.currentDate = new Date(date);
  }

  /**
   * Get current date
   * @returns {Date} Current date
   */
  getCurrentDate() {
    return new Date(this.currentDate);
  }

  /**
   * Render the calendar
   */
  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Update month display
    this.elements.currentMonthEl.textContent = this.currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    // Clear calendar
    this.elements.calendarGrid.innerHTML = '';
    
    // Add day headers
    this.addDayHeaders();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before month starts
    this.addEmptyDays(startingDayOfWeek);
    
    // Add days of month
    this.addMonthDays(year, month, daysInMonth);
  }

  /**
   * Add day headers to calendar
   */
  addDayHeaders() {
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = day;
      this.elements.calendarGrid.appendChild(dayHeader);
    });
  }

  /**
   * Add empty days before month starts
   * @param {number} count - Number of empty days to add
   */
  addEmptyDays(count) {
    for (let i = 0; i < count; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty';
      this.elements.calendarGrid.appendChild(emptyDay);
    }
  }

  /**
   * Add days of the month
   * @param {number} year - Year
   * @param {number} month - Month (0-based)
   * @param {number} daysInMonth - Number of days in month
   */
  addMonthDays(year, month, daysInMonth) {
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      dayEl.textContent = day;
      
      // Check if this date has availability data
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const availability = this.availabilityData[dateStr];
      
      if (availability) {
        this.applyAvailabilityStyling(dayEl, availability);
      }
      
      // Add click handler for date selection
      this.addDateClickHandler(dayEl, year, month, day);
      
      this.elements.calendarGrid.appendChild(dayEl);
    }
  }

  /**
   * Apply availability styling to day element
   * @param {HTMLElement} dayEl - Day element
   * @param {Object} availability - Availability data
   */
  applyAvailabilityStyling(dayEl, availability) {
    if (availability.is_closed) {
      dayEl.classList.add('closed');
      dayEl.style.backgroundColor = '#fee2e2';
      dayEl.style.color = '#dc2626';
      dayEl.title = `Closed: ${availability.reason}`;
    } else {
      dayEl.classList.add('special-hours');
      dayEl.style.backgroundColor = '#fef3c7';
      dayEl.style.color = '#92400e';
      dayEl.title = `Special Hours: ${availability.start_time} - ${availability.end_time}`;
    }
  }

  /**
   * Add click handler for date selection
   * @param {HTMLElement} dayEl - Day element
   * @param {number} year - Year
   * @param {number} month - Month (0-based)
   * @param {number} day - Day
   */
  addDateClickHandler(dayEl, year, month, day) {
    dayEl.addEventListener('click', () => {
      const selectedDate = new Date(year, month, day);
      // Format date as YYYY-MM-DD without timezone conversion
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Navigate to create availability page
      if (window.createAvailabilityUrl) {
        window.location.href = `${window.createAvailabilityUrl}?date=${dateStr}`;
      }
    });
  }

  /**
   * Handle previous month navigation
   */
  handlePreviousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render();
  }

  /**
   * Handle next month navigation
   */
  handleNextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render();
  }

  /**
   * Navigate to specific month
   * @param {number} year - Year
   * @param {number} month - Month (0-based)
   */
  navigateToMonth(year, month) {
    this.currentDate = new Date(year, month, 1);
    this.render();
  }

  /**
   * Get availability data for specific date
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   * @returns {Object|null} Availability data or null
   */
  getAvailabilityForDate(dateStr) {
    return this.availabilityData[dateStr] || null;
  }

  /**
   * Update availability data for specific date
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   * @param {Object} availability - Availability data
   */
  updateAvailabilityForDate(dateStr, availability) {
    this.availabilityData[dateStr] = availability;
    this.render();
  }
}

// Export for use in main application
window.AvailabilityCalendar = AvailabilityCalendar;



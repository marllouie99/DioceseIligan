/**
 * Calendar Management Module
 * @module Calendar
 */

class CalendarManager {
  constructor() {
    this.currentDate = new Date();
  }

  /**
   * Initialize calendar functionality
   */
  init() {
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthEl = document.getElementById('current-month');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (!calendarGrid || !currentMonthEl || !prevBtn || !nextBtn) return;
    
    // Load existing availability data
    this.loadAvailabilityData();
    
    // Navigation handlers
    prevBtn.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar(calendarGrid, currentMonthEl);
    });
    
    nextBtn.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar(calendarGrid, currentMonthEl);
    });
    
    // Initial render
    this.renderCalendar(calendarGrid, currentMonthEl);
  }

  /**
   * Load existing availability data from the page
   */
  loadAvailabilityData() {
    this.availabilityData = new Set();
    
    // Get availability data from the closed dates list
    const availabilityItems = document.querySelectorAll('.closed-dates-list .availability-item');
    availabilityItems.forEach(item => {
      const dateAttr = item.getAttribute('data-date');
      if (dateAttr) {
        this.availabilityData.add(dateAttr);
      }
    });
  }

  /**
   * Render calendar for current month
   * @param {HTMLElement} calendarGrid - Calendar grid element
   * @param {HTMLElement} currentMonthEl - Current month display element
   */
  renderCalendar(calendarGrid, currentMonthEl) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Update month display
    currentMonthEl.textContent = this.currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    // Clear calendar
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty';
      calendarGrid.appendChild(emptyDay);
    }
    
    // Get today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      dayEl.textContent = day;
      
      // Create date object for this calendar day
      const currentDate = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Check if this is a past date
      const isPastDate = currentDate < today;
      
      if (isPastDate) {
        dayEl.classList.add('past-date');
        dayEl.title = 'Past dates cannot be modified';
        // No click handler for past dates
      } else {
        // Check if this date has an availability entry
        if (this.availabilityData && this.availabilityData.has(dateStr)) {
          dayEl.classList.add('closed');
          dayEl.title = 'This date has availability restrictions - Click to edit';
        } else {
          dayEl.title = 'Click to set availability for this date';
        }
        
        // Add click handler for future dates only
        dayEl.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Add visual feedback
          dayEl.style.transform = 'scale(0.95)';
          setTimeout(() => {
            dayEl.style.transform = '';
          }, 150);
          
          console.log('Calendar date clicked:', dateStr);
          
          if (window.djangoUrls && window.djangoUrls.createAvailability) {
            const url = window.djangoUrls.createAvailability.replace('0', dateStr);
            console.log('Navigating to:', url);
            window.location.href = url;
          } else {
            console.error('Create availability URL not found. Available URLs:', window.djangoUrls);
          }
        });
      }
      
      calendarGrid.appendChild(dayEl);
    }
  }
}

// Export for use in main application
window.CalendarManager = CalendarManager;

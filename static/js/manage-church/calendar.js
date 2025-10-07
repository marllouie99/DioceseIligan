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
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      dayEl.textContent = day;
      
      // Add click handler for date selection
      dayEl.addEventListener('click', () => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        window.location.href = window.createAvailabilityUrl.replace('0', dateStr);
      });
      
      calendarGrid.appendChild(dayEl);
    }
  }
}

// Export for use in main application
window.CalendarManager = CalendarManager;

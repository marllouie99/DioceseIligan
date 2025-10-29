/**
 * Booking Modal JavaScript
 * Handles the booking wizard modal functionality
 */

class BookingModal {
  constructor() {
    this.modal = null;
    this.currentStep = 1;
    this.totalSteps = 3;
    this.selectedDate = '';
    this.selectedTime = '';
    this.serviceData = null;
    this.churchData = null;
    this.availabilityData = null;
    this.lastCheckedValue = '';
    
    // Image carousel
    this.serviceImages = [];
    this.currentImageIndex = 0;
    
    // DOM elements (will be set when modal is opened)
    this.elements = {};
    
    // Time slot configuration
    this.timeSlotGroups = {
      morning: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
      afternoon: ['1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM']
    };
    
    this.init();
  }
  
  init() {
    // Initialize modal when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupModal());
    } else {
      this.setupModal();
    }
  }
  
  setupModal() {
    this.modal = document.getElementById('bookingModal');
    if (!this.modal) {
      console.warn('Booking modal not found');
      return;
    }
    
    console.log('Modal found:', this.modal);
    
    // Cache DOM elements
    this.cacheElements();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Add debugging styles
    console.log('Modal classes:', this.modal.className);
    console.log('Modal display style:', window.getComputedStyle(this.modal).display);
  }
  
  cacheElements() {
    this.elements = {
      overlay: this.modal.querySelector('.modal-overlay'),
      closeBtn: this.modal.querySelector('#closeBookingModal'),
      steps: this.modal.querySelectorAll('.step'),
      stepContents: this.modal.querySelectorAll('.step-content'),
      nextBtn: this.modal.querySelector('#modalNextBtn'),
      backBtn: this.modal.querySelector('#modalBackBtn'),
      submitBtn: this.modal.querySelector('#modalSubmitBtn'),
      cancelBtn: this.modal.querySelector('#modalCancelBtn'),
      
      // Form elements
      form: this.modal.querySelector('#modalBookingForm'),
      dateInput: this.modal.querySelector('#modal_date'),
      timeInput: this.modal.querySelector('#modal_time'),
      notesInput: this.modal.querySelector('#modal_notes'),
      
      // Left panel - Service details
      serviceImage: this.modal.querySelector('#modalServiceImage'),
      imagePrevBtn: this.modal.querySelector('#imagePrevBtn'),
      imageNextBtn: this.modal.querySelector('#imageNextBtn'),
      imageCounter: this.modal.querySelector('#imageCounter'),
      currentImageIndex: this.modal.querySelector('#currentImageIndex'),
      totalImages: this.modal.querySelector('#totalImages'),
      serviceName: this.modal.querySelector('#modalServiceName'),
      churchName: this.modal.querySelector('#modalChurchName'),
      serviceDuration: this.modal.querySelector('#modalServiceDuration'),
      servicePrice: this.modal.querySelector('#modalServicePrice'),
      serviceDescription: this.modal.querySelector('#modalServiceDescription'),
      
      // Right panel - Summary
      summaryDate: this.modal.querySelector('#modalSummaryDate'),
      summaryTime: this.modal.querySelector('#modalSummaryTime'),
      
      // Error/hint elements
      dateError: this.modal.querySelector('#dateError'),
      timeError: this.modal.querySelector('#timeError'),
      dateHint: this.modal.querySelector('#dateHint'),
      profileWarning: this.modal.querySelector('#profileWarning'),
      missingFields: this.modal.querySelector('#missingFields')
    };
  }
  
  setupEventListeners() {
    // Debug element finding
    console.log('Setting up event listeners...');
    console.log('Close button found:', this.elements.closeBtn);
    console.log('Overlay found:', this.elements.overlay);
    console.log('Cancel button found:', this.elements.cancelBtn);
    
    // Close modal events
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', (e) => {
        console.log('Close button clicked');
        e.preventDefault();
        e.stopPropagation();
        this.close();
      });
    }
    
    if (this.elements.overlay) {
      this.elements.overlay.addEventListener('click', (e) => {
        console.log('Overlay clicked');
        e.preventDefault();
        e.stopPropagation();
        this.close();
      });
    }
    
    if (this.elements.cancelBtn) {
      this.elements.cancelBtn.addEventListener('click', (e) => {
        console.log('Cancel button clicked');
        e.preventDefault();
        e.stopPropagation();
        this.close();
      });
    }
    
    // Alternative close button selector (fallback)
    const altCloseBtn = this.modal.querySelector('.modal-close');
    if (altCloseBtn && !this.elements.closeBtn) {
      console.log('Using alternative close button selector');
      altCloseBtn.addEventListener('click', (e) => {
        console.log('Alt close button clicked');
        e.preventDefault();
        e.stopPropagation();
        this.close();
      });
    }
    
    // Navigation events
    this.elements.nextBtn?.addEventListener('click', () => this.nextStep());
    this.elements.backBtn?.addEventListener('click', () => this.prevStep());
    this.elements.submitBtn?.addEventListener('click', () => this.submitForm());
    
    // Form events
    this.elements.dateInput?.addEventListener('change', () => this.onDateChange());
    this.elements.timeInput?.addEventListener('change', () => this.onTimeChange());
    
    // Image navigation events
    this.elements.imagePrevBtn?.addEventListener('click', () => this.previousImage());
    this.elements.imageNextBtn?.addEventListener('click', () => this.nextImage());
    
    // Date slot button events
    this.setupDateSlotButtons();
    
    // Time slot button events
    this.setupTimeSlotButtons();
    
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
        console.log('Escape key pressed');
        this.close();
      }
    });
  }
  
  setupDateSlotButtons() {
    // Date slots will be generated after church data is loaded
    // See open() method where generateDateSlots() is called
  }
  
  async generateDateSlots() {
    const dateSlotGrid = this.modal.querySelector('#dateSlotGrid');
    if (!dateSlotGrid) return;
    
    // Clear existing slots
    dateSlotGrid.innerHTML = '';
    
    // Fetch pending booking dates for this church
    let pendingDates = [];
    if (this.churchData && this.churchData.id) {
      pendingDates = await this.fetchPendingBookingDates(this.churchData.id);
    }
    
    // Generate next 14 days
    const today = new Date();
    const daysToShow = 14;
    
    // Sundays are typically closed for most services (example logic)
    const closedDays = [0]; // 0 = Sunday
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const dateString = this.formatDateForInput(date);
      const isClosed = closedDays.includes(dayOfWeek);
      const isToday = i === 0;
      const hasPending = pendingDates.includes(dateString);
      
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'date-slot-btn';
      button.setAttribute('data-date', dateString);
      
      if (isClosed) {
        button.classList.add('closed');
      }
      if (isToday) {
        button.classList.add('today');
      }
      if (hasPending) {
        button.classList.add('has-pending');
      }
      
      // Create date display elements
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = date.getDate();
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      button.innerHTML = `
        <span class="date-day">${dayName}</span>
        <span class="date-number">${dayNumber}</span>
        <span class="date-month">${monthName}</span>
      `;
      
      // Add click handler (allow selection even if has pending)
      if (!isClosed) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const dateValue = button.getAttribute('data-date');
          
          // Remove selected class from all date buttons
          dateSlotGrid.querySelectorAll('.date-slot-btn').forEach(btn => {
            btn.classList.remove('selected');
          });
          
          // Add selected class to clicked button
          button.classList.add('selected');
          
          // Set the date input value
          if (this.elements.dateInput) {
            this.elements.dateInput.value = dateValue;
            this.selectedDate = dateValue;
            this.onDateChange();
          }
          
          // Show warning if date has pending booking
          if (hasPending) {
            this.showPendingDateWarning(dateValue);
          }
        });
      }
      
      dateSlotGrid.appendChild(button);
    }
  }
  
  async fetchPendingBookingDates(churchId) {
    try {
      const response = await fetch(`/app/api/church/${churchId}/pending-booking-dates/`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return data.pending_dates || [];
    } catch (error) {
      console.error('Error fetching pending booking dates:', error);
      return [];
    }
  }
  
  showPendingDateWarning(date) {
    const dateHint = this.elements.dateHint;
    if (dateHint) {
      const dateObj = new Date(date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      dateHint.innerHTML = `⚠️ You have a pending booking request for ${formattedDate}. You can still book another appointment.`;
      dateHint.style.color = '#d97706';
      dateHint.style.fontWeight = '600';
    }
  }
  
  formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  setupTimeSlotButtons() {
    const timeSlotButtons = this.modal.querySelectorAll('.time-slot-btn');
    timeSlotButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const timeValue = button.getAttribute('data-time');
        
        // Remove selected class from all buttons
        timeSlotButtons.forEach(btn => btn.classList.remove('selected'));
        
        // Add selected class to clicked button
        button.classList.add('selected');
        
        // Set the time input value
        if (this.elements.timeInput) {
          this.elements.timeInput.value = timeValue;
          this.selectedTime = timeValue;
          this.updateSummary();
        }
      });
    });
  }
  
  onTimeChange() {
    if (this.elements.timeInput?.value) {
      this.selectedTime = this.elements.timeInput.value;
      this.updateSummary();
      
      // Sync with time slot buttons
      const timeSlotButtons = this.modal.querySelectorAll('.time-slot-btn');
      timeSlotButtons.forEach(btn => {
        if (btn.getAttribute('data-time') === this.selectedTime) {
          btn.classList.add('selected');
        } else {
          btn.classList.remove('selected');
        }
      });
    }
  }
  
  open(serviceId, churchId) {
    if (!this.modal) {
      console.error('Modal not initialized');
      return;
    }
    
    // Reset modal state
    this.reset();
    
    // Load service data
    this.loadServiceData(serviceId, churchId)
      .then(() => {
        // Show modal
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Force modal visibility (debugging)
        this.modal.style.display = 'flex';
        this.modal.style.zIndex = '9999';
        
        // Ensure modal container is visible
        const container = this.modal.querySelector('.modal-container');
        if (container) {
          container.style.zIndex = '10000';
          container.style.background = 'white';
          container.style.position = 'relative';
        }
        
        console.log('Modal should now be visible');
        console.log('Modal computed display:', window.getComputedStyle(this.modal).display);
        
        // Initialize wizard
        this.updateStepDisplay();
        this.updateDateConstraints();
        
        // Generate date slots after church data is loaded
        this.generateDateSlots();
      })
      .catch(error => {
        console.error('Error loading service data:', error);
        alert('Failed to load service information. Please try again.');
      });
  }
  
  close() {
    console.log('Close function called');
    if (!this.modal) {
      console.log('Modal not found, cannot close');
      return;
    }
    
    console.log('Closing modal...');
    this.modal.classList.remove('active');
    this.modal.style.display = 'none';  // Force hide
    document.body.style.overflow = '';
    
    console.log('Modal closed successfully');
    
    // Reset form after animation
    setTimeout(() => this.reset(), 300);
  }
  
  reset() {
    this.currentStep = 1;
    this.selectedDate = '';
    this.selectedTime = '';
    this.availabilityData = null;
    
    // Reset form
    this.elements.form?.reset();
    
    // Clear errors
    this.clearErrors();
    
    // Reset time slot selections
    this.modal?.querySelectorAll('.time-slot.selected').forEach(slot => {
      slot.classList.remove('selected');
    });
    
    // Reset hint styling
    if (this.elements.dateHint) {
      this.elements.dateHint.style.color = '';
      this.elements.dateHint.classList.remove('info', 'warning');
    }
    
    // Reset date input styling
    if (this.elements.dateInput) {
      this.elements.dateInput.classList.remove('unavailable', 'special-hours');
    }
  }
  
  async loadServiceData(serviceId, churchId) {
    try {
      console.log(`Fetching service data for service ID: ${serviceId}`);
      const response = await fetch(`/app/api/service/${serviceId}/`);
      
      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, response.headers);
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 500));
        throw new Error('Server returned non-JSON response. Check console for details.');
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      if (data.success) {
        this.serviceData = data.service;
        this.churchData = data.church;
        this.populateServiceInfo();
        
        // Load availability data for the church
        await this.loadAvailabilityData(data.church.id);
      } else {
        throw new Error(data.error || 'Failed to load service data');
      }
      
    } catch (error) {
      console.error('API fetch failed:', error);
      
      // Show more detailed error to user
      if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        alert('Server error: The service information endpoint is returning HTML instead of JSON. Please check the server logs.');
      }
      
      // Fallback: try to get data from page elements
      try {
        console.log('Attempting fallback to page data...');
        this.getServiceDataFromPage(serviceId, churchId);
        console.log('Fallback successful');
        // Show a warning that we're using fallback data
        if (this.elements.serviceMeta) {
          const warningDiv = document.createElement('div');
          warningDiv.style.cssText = 'background: #fef3c7; border: 1px solid #f59e0b; padding: 8px; border-radius: 6px; font-size: 12px; color: #92400e; margin-top: 8px;';
          warningDiv.textContent = 'Using cached service information. Some details may be limited.';
          this.elements.serviceMeta.appendChild(warningDiv);
        }
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError);
        throw new Error('Failed to load service information. Please try again.');
      }
    }
  }
  
  getServiceDataFromPage(serviceId, churchId) {
    // Extract service data from existing page elements
    const serviceElement = document.querySelector(`[data-service-id="${serviceId}"]`);
    if (serviceElement) {
      // Try to get image from service card
      const serviceCard = serviceElement.closest('.service-card');
      const imageElement = serviceCard?.querySelector('.service-image img');
      
      this.serviceData = {
        id: serviceId,
        name: serviceElement.dataset.serviceName || 'Service',
        description: serviceElement.dataset.serviceDescription || 'No description available.',
        image: imageElement?.src || null,
        duration: serviceElement.dataset.serviceDuration || '1 hour',
        price: serviceElement.dataset.servicePrice || 'Free',
        advance_booking_days: parseInt(serviceElement.dataset.advanceBookingDays) || 30
      };
      
      this.churchData = {
        id: serviceElement.dataset.churchId || churchId,
        name: serviceElement.dataset.churchName || 'Church'
      };
    } else {
      // Throw error if no data can be found
      throw new Error('Service information not found on page');
    }
    
    this.populateServiceInfo();
  }
  
  async loadAvailabilityData(churchId) {
    try {
      console.log(`🔍 DEBUG: Fetching availability data for church ID: ${churchId}`);
      const url = `/app/api/church/${churchId}/availability/`;
      console.log(`🔍 DEBUG: API URL: ${url}`);
      
      const response = await fetch(url);
      
      console.log(`🔍 DEBUG: Availability response status: ${response.status}`);
      console.log(`🔍 DEBUG: Response headers:`, response.headers);
      
      if (!response.ok) {
        console.error(`❌ API call failed with status: ${response.status}`);
        const errorText = await response.text();
        console.error(`❌ Error response:`, errorText);
        return;
      }
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('⚠️ Non-JSON availability response received');
        const responseText = await response.text();
        console.warn('⚠️ Response text:', responseText.substring(0, 500));
        return;
      }
      
      const data = await response.json();
      console.log('✅ Received availability data:', data);
      
      if (data.success) {
        this.availabilityData = data;
        console.log(`🔍 DEBUG: Closed dates:`, data.closed_dates);
        console.log(`🔍 DEBUG: Special hours:`, data.special_hours);
        
        // Log each closed date to see the exact values
        data.closed_dates.forEach((closedDate, index) => {
          console.log(`🔍 DEBUG: Closed date ${index}:`, closedDate);
        });
        
        this.updateDateConstraintsWithAvailability();
        this.setupDateValidationHooks();
      } else {
        console.error('❌ Availability API returned error:', data.error);
      }
      
    } catch (error) {
      console.error('❌ Failed to load availability data:', error);
      // Don't throw error, just continue without availability data
    }
  }
  
  populateServiceInfo() {
    // Load service images
    this.loadServiceImages();
    
    // Update left panel - Service image (will be set by loadServiceImages)
    // Initial placeholder
    if (this.elements.serviceImage && !this.serviceData.image) {
      this.elements.serviceImage.src = '/static/images/default-service.jpg';
      this.elements.serviceImage.alt = this.serviceData.name;
    }
    
    // Update left panel - Service name
    if (this.elements.serviceName) {
      this.elements.serviceName.textContent = this.serviceData.name;
    }
    
    // Update left panel - Category badge
    const categoryBadge = this.modal.querySelector('#modalServiceCategory');
    const categoryIcon = this.modal.querySelector('#modalCategoryIcon');
    const categoryName = this.modal.querySelector('#modalCategoryName');
    if (categoryBadge && this.serviceData.category) {
      categoryBadge.style.display = 'inline-flex';
      categoryBadge.style.backgroundColor = this.serviceData.category.color + '20';
      categoryBadge.style.color = this.serviceData.category.color;
      categoryBadge.style.borderColor = this.serviceData.category.color + '40';
      if (categoryIcon) categoryIcon.textContent = this.serviceData.category.icon || '📁';
      if (categoryName) categoryName.textContent = this.serviceData.category.name;
    } else if (categoryBadge) {
      categoryBadge.style.display = 'none';
    }
    
    // Update left panel - Church name with location
    if (this.elements.churchName) {
      const churchNameSpan = this.elements.churchName.querySelector('span');
      if (churchNameSpan) {
        churchNameSpan.textContent = this.churchData.name;
      } else {
        this.elements.churchName.textContent = this.churchData.name;
      }
    }
    
    // Update left panel - Duration
    if (this.elements.serviceDuration) {
      this.elements.serviceDuration.textContent = this.serviceData.duration || '1 hour';
    }
    
    // Update left panel - Price
    if (this.elements.servicePrice) {
      this.elements.servicePrice.textContent = this.serviceData.price || 'Free';
    }
    
    // Update left panel - Description
    if (this.elements.serviceDescription) {
      this.elements.serviceDescription.textContent = this.serviceData.description || 'No description available.';
    }
    
    // Re-initialize feather icons for the left panel
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }
  
  updateDateConstraints() {
    if (!this.elements.dateInput || !this.serviceData) return;
    
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + (this.serviceData.advance_booking_days || 30));
    
    this.elements.dateInput.min = today.toISOString().split('T')[0];
    this.elements.dateInput.max = maxDate.toISOString().split('T')[0];
    
    if (this.elements.dateHint) {
      this.elements.dateHint.textContent = `Choose any available date within the next ${this.serviceData.advance_booking_days || 30} days`;
    }
  }
  
  updateDateConstraintsWithAvailability() {
    if (!this.elements.dateInput || !this.serviceData || !this.availabilityData) return;
    
    // Update the date input constraints first
    this.updateDateConstraints();
    
    // Update hint to show availability information
    if (this.elements.dateHint && this.availabilityData) {
      const closedCount = this.availabilityData.closed_dates.length;
      const specialCount = this.availabilityData.special_hours.length;
      
      let hintText = `Choose any available date within the next ${this.serviceData.advance_booking_days || 30} days`;
      
      if (closedCount > 0) {
        hintText += `. Note: ${closedCount} date${closedCount > 1 ? 's are' : ' is'} closed`;
      }
      
      if (specialCount > 0) {
        hintText += `. ${specialCount} date${specialCount > 1 ? 's have' : ' has'} special hours`;
      }
      
      this.elements.dateHint.textContent = hintText;
    }
    
    // Add event listener to validate dates on change
    if (this.elements.dateInput) {
      this.elements.dateInput.addEventListener('input', (e) => this.validateSelectedDate(e.target.value));
    }
  }
  
  validateSelectedDate(dateStr) {
    console.log(`🔍 DEBUG: Validating date: ${dateStr}`);
    console.log(`🔍 DEBUG: Has availability data:`, !!this.availabilityData);
    
    if (!this.availabilityData || !dateStr) {
      console.log(`🔍 DEBUG: No availability data or date string, allowing date`);
      return true;
    }
    
    console.log(`🔍 DEBUG: Checking against closed dates:`, this.availabilityData.closed_dates);
    
    // Check if the selected date is closed
    const isClosedDate = this.availabilityData.closed_dates.some(entry => entry.date === dateStr);
    console.log(`🔍 DEBUG: Date ${dateStr} is closed:`, isClosedDate);
    
    if (isClosedDate) {
      const closedEntry = this.availabilityData.closed_dates.find(entry => entry.date === dateStr);
      const reason = closedEntry.reason ? ` (${closedEntry.reason})` : '';
      
      console.log(`❌ DEBUG: Blocking closed date ${dateStr} with reason: ${reason}`);
      
      // Add visual styling for unavailable date
      this.elements.dateInput.classList.add('unavailable');
      this.elements.dateInput.classList.remove('special-hours');
      
      this.showError('dateError', `This date is not available${reason}. Please choose another date.`);
      return false;
    }
    
    // Check if the date has special hours (show info but allow selection)
    const specialEntry = this.availabilityData.special_hours.find(entry => entry.date === dateStr);
    if (specialEntry) {
      const timeInfo = specialEntry.start_time && specialEntry.end_time 
        ? ` (Available ${specialEntry.start_time} - ${specialEntry.end_time})`
        : '';
      
      // Add visual styling for special hours date
      this.elements.dateInput.classList.add('special-hours');
      this.elements.dateInput.classList.remove('unavailable');
      
      // Clear any errors and show info
      this.clearErrors();
      if (this.elements.dateHint) {
        this.elements.dateHint.textContent = `Special hours on this date${timeInfo}`;
        this.elements.dateHint.classList.add('info');
        this.elements.dateHint.classList.remove('warning');
      }
    } else {
      // Reset styling for normal dates
      this.elements.dateInput.classList.remove('unavailable', 'special-hours');
      if (this.elements.dateHint) {
        this.elements.dateHint.classList.remove('info', 'warning');
      }
    }
    
    return true;
  }
  
  setupDateValidationHooks() {
    console.log(`🔍 DEBUG: Setting up date validation hooks`);
    
    if (!this.elements.dateInput) {
      console.error('❌ Date input element not found');
      return;
    }
    
    // Hook into multiple events that might be triggered by calendar widgets
    const events = ['change', 'input', 'click', 'blur', 'keyup'];
    
    events.forEach(eventType => {
      this.elements.dateInput.addEventListener(eventType, (e) => {
        console.log(`🔍 DEBUG: Date ${eventType} event triggered with value:`, e.target.value);
        if (e.target.value) {
          this.validateSelectedDate(e.target.value);
        }
      });
    });
    
    // Also try to observe value changes with MutationObserver
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
            const newValue = this.elements.dateInput.value;
            console.log(`🔍 DEBUG: Date input value changed via attribute:`, newValue);
            if (newValue) {
              this.validateSelectedDate(newValue);
            }
          }
        });
      });
      
      observer.observe(this.elements.dateInput, {
        attributes: true,
        attributeFilter: ['value']
      });
    }
    
    // Periodically check the input value
    setInterval(() => {
      if (this.elements.dateInput && this.elements.dateInput.value !== this.lastCheckedValue) {
        const newValue = this.elements.dateInput.value;
        console.log(`🔍 DEBUG: Date input value changed via polling:`, newValue);
        this.lastCheckedValue = newValue;
        if (newValue) {
          this.validateSelectedDate(newValue);
        }
      }
    }, 500);
  }
  
  nextStep() {
    if (!this.validateCurrentStep()) return;
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateStepDisplay();
    }
  }
  
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepDisplay();
    }
  }
  
  updateStepDisplay() {
    // Update step indicators
    this.elements.steps.forEach((step, index) => {
      const stepNumber = index + 1;
      step.classList.remove('active', 'completed');
      
      if (stepNumber === this.currentStep) {
        step.classList.add('active');
      } else if (stepNumber < this.currentStep) {
        step.classList.add('completed');
      }
    });
    
    // Update step content
    this.elements.stepContents.forEach((content, index) => {
      content.classList.remove('active');
      if (index + 1 === this.currentStep) {
        content.classList.add('active');
      }
    });
    
    // Update navigation buttons
    if (this.elements.backBtn) {
      this.elements.backBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
    }
    
    if (this.currentStep === this.totalSteps) {
      if (this.elements.nextBtn) this.elements.nextBtn.style.display = 'none';
      if (this.elements.submitBtn) this.elements.submitBtn.style.display = 'inline-flex';
      this.updateSummary();
    } else {
      if (this.elements.nextBtn) this.elements.nextBtn.style.display = 'inline-flex';
      if (this.elements.submitBtn) this.elements.submitBtn.style.display = 'none';
    }
  }
  
  validateCurrentStep() {
    this.clearErrors();
    
    switch (this.currentStep) {
      case 1:
        if (!this.elements.dateInput?.value) {
          this.showError('dateError', 'Please select a preferred date.');
          return false;
        }
        
        // Validate the selected date against availability data
        if (!this.validateSelectedDate(this.elements.dateInput.value)) {
          return false;
        }
        
        this.selectedDate = this.elements.dateInput.value;
        return true;
      
      case 2:
        if (!this.elements.timeInput?.value) {
          this.showError('timeError', 'Please select a preferred time.');
          return false;
        }
        this.selectedTime = this.elements.timeInput.value;
        return true;
      
      default:
        return true;
    }
  }
  
  generateTimeSlots() {
    if (!this.elements.timeSlots) return;
    
    this.elements.timeSlots.innerHTML = '';
    
    // Create morning section
    const morningSection = this.createTimeSection('Morning', this.timeSlotGroups.morning);
    this.elements.timeSlots.appendChild(morningSection);
    
    // Create afternoon section
    const afternoonSection = this.createTimeSection('Afternoon', this.timeSlotGroups.afternoon);
    this.elements.timeSlots.appendChild(afternoonSection);
  }
  
  createTimeSection(title, times) {
    const section = document.createElement('div');
    section.innerHTML = `<h5 style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600;">${title}</h5>`;
    
    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'time-slots';
    
    times.forEach(time => {
      const slot = this.createTimeSlot(time);
      slotsContainer.appendChild(slot);
    });
    
    section.appendChild(slotsContainer);
    return section;
  }
  
  createTimeSlot(time) {
    const slot = document.createElement('div');
    slot.className = 'time-slot';
    slot.textContent = time;
    slot.addEventListener('click', () => this.selectTimeSlot(slot, time));
    return slot;
  }
  
  selectTimeSlot(slotElement, time) {
    // Remove selection from other slots
    this.modal.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    
    // Select this slot
    slotElement.classList.add('selected');
    this.selectedTime = time;
  }
  
  onDateChange() {
    this.selectedDate = this.elements.dateInput?.value || '';
    this.clearErrors();
    this.updateSummary();
    
    // Sync with date slot buttons
    const dateSlotButtons = this.modal.querySelectorAll('.date-slot-btn');
    dateSlotButtons.forEach(btn => {
      if (btn.getAttribute('data-date') === this.selectedDate) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }
  
  updateSummary() {
    if (this.selectedDate && this.elements.summaryDate) {
      const dateObj = new Date(this.selectedDate + 'T00:00:00');
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      this.elements.summaryDate.textContent = dateObj.toLocaleDateString('en-US', options);
    }
    
    if (this.selectedTime && this.elements.summaryTime) {
      // Convert 24-hour time to 12-hour format
      const formattedTime = this.formatTime12Hour(this.selectedTime);
      this.elements.summaryTime.textContent = formattedTime;
    }
  }
  
  formatTime12Hour(time24) {
    if (!time24) return '';
    
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
  }
  
  async submitForm() {
    if (!this.validateCurrentStep()) return;
    
    const submitBtn = this.elements.submitBtn;
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');
    
    // Show loading state
    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline-flex';
    
    try {
      // Convert time to 12-hour format for the API
      const time12Hour = this.formatTime12Hour(this.selectedTime);
      
      const formData = {
        service_id: this.serviceData.id,
        date: this.selectedDate,
        time: time12Hour,
        notes: this.elements.notesInput?.value || ''
      };
      
      console.log('Submitting booking with data:', formData);
      
      const response = await fetch('/app/api/bookings/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken()
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      console.log('API Response:', result);
      
      if (response.ok && result.success) {
        // Success
        this.showSuccessMessage(result.booking_code || 'APPT-000');
      } else {
        // Error - show specific error message
        const errorMsg = result.error || result.message || 'Failed to create booking';
        console.error('Booking error:', errorMsg);
        
        // Show form errors if available
        if (result.form_errors) {
          console.error('Form errors:', result.form_errors);
          let errorDetails = '';
          for (const [field, errors] of Object.entries(result.form_errors)) {
            errorDetails += `\n${field}: ${errors.join(', ')}`;
          }
          alert(`Booking failed:\n${errorMsg}${errorDetails}`);
        } else {
          alert(`Booking failed: ${errorMsg}`);
        }
      }
      
    } catch (error) {
      console.error('Booking submission error:', error);
      alert(`Failed to submit booking request: ${error.message}`);
    } finally {
      // Reset loading state
      if (submitBtn) submitBtn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnLoading) btnLoading.style.display = 'none';
    }
  }
  
  showSuccessMessage(bookingCode) {
    // Replace modal content with success message (centered in modal)
    const modalBody = this.modal.querySelector('.modal-body');
    if (modalBody) {
      // Remove split layout classes and center content
      modalBody.classList.remove('modal-body-split');
      modalBody.style.display = 'flex';
      modalBody.style.alignItems = 'center';
      modalBody.style.justifyContent = 'center';
      modalBody.style.minHeight = '400px';
      
      modalBody.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; max-width: 500px;">
          <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
          <h3 style="margin: 0 0 12px 0; color: #059669; font-size: 24px;">Booking Request Submitted!</h3>
          <p style="color: #6b7280; margin-bottom: 24px; font-size: 15px;">Your appointment request has been sent to the church for review.</p>
          <div style="background: #f0f9ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <strong style="font-size: 16px;">Booking ID: ${bookingCode}</strong>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 32px; line-height: 1.6;">
            You will receive a notification once the church reviews your request.
            You can check the status in your appointments section.
          </p>
          <button type="button" class="btn btn-primary" onclick="bookingModal.close()" style="padding: 12px 32px;">Close</button>
        </div>
      `;
    }
    
    // Auto close after 5 seconds
    setTimeout(() => this.close(), 5000);
  }
  
  showError(elementId, message) {
    const errorElement = this.elements[elementId];
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }
  
  clearErrors() {
    Object.keys(this.elements).forEach(key => {
      if (key.includes('Error')) {
        const element = this.elements[key];
        if (element) {
          element.style.display = 'none';
          element.textContent = '';
        }
      }
    });
  }
  
  getCSRFToken() {
    const token = document.querySelector('[name=csrfmiddlewaretoken]');
    return token ? token.value : '';
  }
  
  // Image Carousel Methods
  async loadServiceImages() {
    try {
      // Fetch service images from API
      const response = await fetch(`/app/api/service/${this.serviceData.id}/images/`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.images && data.images.length > 0) {
          this.serviceImages = data.images;
        } else if (this.serviceData.image) {
          // Fallback to single image from service data
          this.serviceImages = [{ url: this.serviceData.image, is_primary: true }];
        } else {
          // No images available
          this.serviceImages = [];
        }
      } else {
        // Fallback to single image
        if (this.serviceData.image) {
          this.serviceImages = [{ url: this.serviceData.image, is_primary: true }];
        }
      }
    } catch (error) {
      console.error('Failed to load service images:', error);
      // Fallback to single image
      if (this.serviceData.image) {
        this.serviceImages = [{ url: this.serviceData.image, is_primary: true }];
      }
    }
    
    // Initialize carousel
    this.currentImageIndex = 0;
    this.updateImageDisplay();
  }
  
  updateImageDisplay() {
    if (this.serviceImages.length === 0) {
      // Show default image
      if (this.elements.serviceImage) {
        this.elements.serviceImage.src = '/static/images/default-service.jpg';
        this.elements.serviceImage.alt = this.serviceData.name;
      }
      // Hide navigation
      if (this.elements.imagePrevBtn) this.elements.imagePrevBtn.style.display = 'none';
      if (this.elements.imageNextBtn) this.elements.imageNextBtn.style.display = 'none';
      if (this.elements.imageCounter) this.elements.imageCounter.style.display = 'none';
      return;
    }
    
    // Update image
    const currentImage = this.serviceImages[this.currentImageIndex];
    if (this.elements.serviceImage) {
      this.elements.serviceImage.src = currentImage.url;
      this.elements.serviceImage.alt = this.serviceData.name;
    }
    
    // Show/hide navigation based on image count
    if (this.serviceImages.length > 1) {
      if (this.elements.imagePrevBtn) this.elements.imagePrevBtn.style.display = 'flex';
      if (this.elements.imageNextBtn) this.elements.imageNextBtn.style.display = 'flex';
      if (this.elements.imageCounter) this.elements.imageCounter.style.display = 'block';
      
      // Update counter
      if (this.elements.currentImageIndex) {
        this.elements.currentImageIndex.textContent = this.currentImageIndex + 1;
      }
      if (this.elements.totalImages) {
        this.elements.totalImages.textContent = this.serviceImages.length;
      }
    } else {
      if (this.elements.imagePrevBtn) this.elements.imagePrevBtn.style.display = 'none';
      if (this.elements.imageNextBtn) this.elements.imageNextBtn.style.display = 'none';
      if (this.elements.imageCounter) this.elements.imageCounter.style.display = 'none';
    }
    
    // Re-initialize feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }
  
  previousImage() {
    if (this.serviceImages.length <= 1) return;
    
    this.currentImageIndex--;
    if (this.currentImageIndex < 0) {
      this.currentImageIndex = this.serviceImages.length - 1;
    }
    this.updateImageDisplay();
  }
  
  nextImage() {
    if (this.serviceImages.length <= 1) return;
    
    this.currentImageIndex++;
    if (this.currentImageIndex >= this.serviceImages.length) {
      this.currentImageIndex = 0;
    }
    this.updateImageDisplay();
  }
}

// Global instance
let bookingModal;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  bookingModal = new BookingModal();
});

// Global function to open modal
function openBookingModal(serviceId, churchId) {
  if (bookingModal) {
    bookingModal.open(serviceId, churchId);
  } else {
    console.error('Booking modal not initialized');
  }
}

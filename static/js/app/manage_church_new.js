/**
 * ========================================
 * CHURCH MANAGEMENT PAGE - MAIN APPLICATION
 * ========================================
 * 
 * Main application file that coordinates all modules
 * for the church management page functionality.
 * 
 * @author ChurchConnect Team
 * @version 3.0 (Modular)
 */

/**
 * Main Church Management Application
 * @class ChurchManagementApp
 */
class ChurchManagementApp {
  constructor() {
    this.modules = {};
    this.config = {
      defaultTab: 'appointments',
      imagePreviewMaxWidth: 200,
      imagePreviewMaxHeight: 150
    };
    // Keep references to created charts so we can update/destroy
    this.chartInstances = {};
  }

  /**
   * Render donations breakdown chart (This Month vs Year-to-date vs Previous Years)
   */
  renderDonationsBreakdownChart() {
    const canvas = document.getElementById('donationsBreakdownChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Read values from data attributes
    const month = parseFloat(canvas.getAttribute('data-month') || '0') || 0;
    const year = parseFloat(canvas.getAttribute('data-year') || '0') || 0;
    const total = parseFloat(canvas.getAttribute('data-total') || '0') || 0;

    // Partition without overlap
    const ytdExclMonth = Math.max(year - month, 0);
    const previousYears = Math.max(total - year, 0);

    const dataPoints = [month, ytdExclMonth, previousYears];
    if (dataPoints.every(v => v === 0)) {
      this.showEmptyChartState(canvas);
      return;
    }

    // Destroy existing instance and clean up empty states
    try { this.chartInstances.donationsBreakdown?.destroy(); } catch (_) {}
    
    // Remove any existing empty states and show canvas
    const container = canvas.parentElement;
    const existingEmptyStates = container.querySelectorAll('.chart-empty-state');
    existingEmptyStates.forEach(state => state.remove());
    canvas.style.display = 'block';

    this.chartInstances.donationsBreakdown = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['This Month', 'Year-to-date', 'Previous Years'],
        datasets: [{
          data: dataPoints,
          backgroundColor: [
            'rgba(218, 165, 32, 0.7)',   // gold
            'rgba(160, 82, 45, 0.7)',    // sienna
            'rgba(139, 69, 19, 0.7)'     // brown
          ],
          borderColor: [
            'rgba(218, 165, 32, 1)',
            'rgba(160, 82, 45, 1)',
            'rgba(139, 69, 19, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.2,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, padding: 20, font: { family: 'Georgia, serif', size: 12 } }
          },
          tooltip: {
            backgroundColor: 'rgba(139, 69, 19, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(218, 165, 32, 0.8)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0) || 1;
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ₱${context.parsed.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        },
        animation: { animateRotate: true, duration: 1000 }
      }
    });
  }

  /**
   * Render top 5 donors bar chart
   */
  renderTopDonorsChart() {
    const canvas = document.getElementById('topDonorsChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const rankingItems = document.querySelectorAll('.donor-ranking .ranking-item');
    const labels = [];
    const data = [];
    const names = [];

    rankingItems.forEach((item, index) => {
      const amount = parseFloat(item.getAttribute('data-engagement') || '0') || 0;
      const nameText = item.querySelector('.post-info p')?.textContent?.trim() || `Donor ${index + 1}`;
      labels.push(`#${index + 1}`);
      data.push(amount);
      names.push(nameText);
    });

    if (data.length === 0 || data.every(v => v === 0)) {
      this.showEmptyChartState(canvas);
      return;
    }

    try { this.chartInstances.topDonors?.destroy(); } catch (_) {}
    
    // Remove any existing empty states and show canvas
    const container = canvas.parentElement;
    const existingEmptyStates = container.querySelectorAll('.chart-empty-state');
    existingEmptyStates.forEach(state => state.remove());
    canvas.style.display = 'block';

    const colors = [
      'rgba(139, 69, 19, 0.8)',
      'rgba(218, 165, 32, 0.8)',
      'rgba(160, 82, 45, 0.8)',
      'rgba(139, 69, 19, 0.6)',
      'rgba(218, 165, 32, 0.6)'
    ];

    this.chartInstances.topDonors = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total Donated (₱)',
          data,
          backgroundColor: colors.slice(0, data.length),
          borderColor: colors.slice(0, data.length).map(c => c.replace('0.8', '1').replace('0.6', '1')),
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.8,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(139, 69, 19, 0.9)',
            titleColor: '#fff', bodyColor: '#fff',
            borderColor: 'rgba(218, 165, 32, 0.8)', borderWidth: 1, cornerRadius: 8,
            callbacks: {
              title: function(context) {
                const i = context[0].dataIndex;
                return names[i] || `Donor ${i + 1}`;
              },
              label: function(context) {
                return `₱${Number(context.parsed.y).toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { family: 'Georgia, serif' } },
            grid: { color: 'rgba(139, 69, 19, 0.1)' }
          },
          x: {
            ticks: { font: { family: 'Georgia, serif', weight: 'bold' } },
            grid: { display: false }
          }
        },
        animation: { duration: 1000, easing: 'easeOutBounce' }
      }
    });
  }

  /**
   * Render appointments breakdown chart (Status distribution)
   */
  renderAppointmentsBreakdownChart() {
    const canvas = document.getElementById('appointmentsBreakdownChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Read values from data attributes
    const pending = parseInt(canvas.getAttribute('data-pending') || '0') || 0;
    const approved = parseInt(canvas.getAttribute('data-approved') || '0') || 0;
    const completed = parseInt(canvas.getAttribute('data-completed') || '0') || 0;
    const reviewed = parseInt(canvas.getAttribute('data-reviewed') || '0') || 0;

    const dataPoints = [pending, approved, completed, reviewed];
    if (dataPoints.every(v => v === 0)) {
      this.showEmptyChartState(canvas);
      return;
    }

    // Destroy existing instance and clean up empty states
    try { this.chartInstances.appointmentsBreakdown?.destroy(); } catch (_) {}
    
    // Remove any existing empty states and show canvas
    const container = canvas.parentElement;
    const existingEmptyStates = container.querySelectorAll('.chart-empty-state');
    existingEmptyStates.forEach(state => state.remove());
    canvas.style.display = 'block';

    this.chartInstances.appointmentsBreakdown = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Approved', 'Completed', 'Reviewed'],
        datasets: [{
          data: dataPoints,
          backgroundColor: [
            'rgba(218, 165, 32, 0.7)',   // gold - pending
            'rgba(34, 197, 94, 0.7)',    // green - approved  
            'rgba(139, 69, 19, 0.7)',    // brown - completed
            'rgba(160, 82, 45, 0.7)'     // sienna - reviewed
          ],
          borderColor: [
            'rgba(218, 165, 32, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(139, 69, 19, 1)',
            'rgba(160, 82, 45, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.2,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, padding: 20, font: { family: 'Georgia, serif', size: 12 } }
          },
          tooltip: {
            backgroundColor: 'rgba(139, 69, 19, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(218, 165, 32, 0.8)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0) || 1;
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        },
        animation: { animateRotate: true, duration: 1000 }
      }
    });
  }

  /**
   * Render appointments trend chart (Monthly volume)
   */
  renderAppointmentsTrendChart() {
    const canvas = document.getElementById('appointmentsTrendChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Generate sample monthly data (in real app, this would come from backend)
    const currentMonth = new Date().getMonth();
    const months = [];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.push(monthNames[monthIndex]);
      // Generate sample data based on total appointments with some variation
      const totalAppointments = parseInt(document.querySelector('[data-pending]')?.getAttribute('data-pending') || '0') +
                               parseInt(document.querySelector('[data-approved]')?.getAttribute('data-approved') || '0') +
                               parseInt(document.querySelector('[data-completed]')?.getAttribute('data-completed') || '0') +
                               parseInt(document.querySelector('[data-reviewed]')?.getAttribute('data-reviewed') || '0');
      data.push(Math.max(0, totalAppointments + Math.floor(Math.random() * 10) - 5));
    }

    if (data.every(v => v === 0)) {
      this.showEmptyChartState(canvas);
      return;
    }

    try { this.chartInstances.appointmentsTrend?.destroy(); } catch (_) {}
    
    // Remove any existing empty states and show canvas
    const container = canvas.parentElement;
    const existingEmptyStates = container.querySelectorAll('.chart-empty-state');
    existingEmptyStates.forEach(state => state.remove());
    canvas.style.display = 'block';

    this.chartInstances.appointmentsTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Appointments',
          data: data,
          borderColor: 'rgba(139, 69, 19, 1)',
          backgroundColor: 'rgba(139, 69, 19, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(218, 165, 32, 1)',
          pointBorderColor: 'rgba(139, 69, 19, 1)',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.8,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(139, 69, 19, 0.9)',
            titleColor: '#fff', bodyColor: '#fff',
            borderColor: 'rgba(218, 165, 32, 0.8)', borderWidth: 1, cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return `Appointments: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              stepSize: 1,
              font: { family: 'Georgia, serif' } 
            },
            grid: { color: 'rgba(139, 69, 19, 0.1)' }
          },
          x: {
            ticks: { font: { family: 'Georgia, serif', weight: 'bold' } },
            grid: { display: false }
          }
        },
        animation: { duration: 1000, easing: 'easeInOutQuart' }
      }
    });
  }

  /**
   * Initialize the application
   */
  init() {
    try {
      this.initializeModules();
      this.setupGlobalFunctions();
      this.initializeAdvancedFeatures();
      console.log('Church Management App initialized successfully');
    } catch (error) {
      window.Utils?.handleError(error, 'App Initialization');
    }
  }

  /**
   * Initialize all modules
   */
  initializeModules() {
    // Initialize Tab Manager
    this.modules.tabs = new window.TabManager({
      defaultTab: this.config.defaultTab
    });
    this.modules.tabs.init();

    // Initialize Form Manager
    this.modules.forms = new window.FormManager();
    this.modules.forms.init();
    this.modules.forms.initLivePreview();

    // Initialize Image Cropper
    this.modules.imageCropper = new window.ImageCropper();
    this.modules.imageCropper.init();

    // Initialize Calendar Manager (guard if module not loaded)
    if (typeof window.CalendarManager === 'function') {
      this.modules.calendar = new window.CalendarManager();
      this.modules.calendar.init();
    } else {
      console.warn('CalendarManager not available. Skipping calendar initialization.');
    }

    // Initialize Settings Manager (defer until settings tab is active)
    this.modules.settings = new window.SettingsManager();
    this.deferredInitializeSettings();
  }

  /**
   * Deferred settings initialization
   */
  deferredInitializeSettings() {
    // Check if settings tab exists and initialize when clicked or visible
    const settingsTab = document.querySelector('[data-tab="settings"]');
    const settingsPanel = document.getElementById('settings');
    
    if (settingsTab && settingsPanel) {
      // Initialize immediately if settings tab is already active
      if (settingsPanel.classList.contains('active')) {
        setTimeout(() => this.modules.settings.init(), 100);
      } else {
        // Initialize when settings tab is clicked
        settingsTab.addEventListener('click', () => {
          setTimeout(() => this.modules.settings.init(), 100);
        }, { once: true });
        
        // Or initialize with MutationObserver if tab becomes active
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'class' && 
                settingsPanel.classList.contains('active')) {
              setTimeout(() => this.modules.settings.init(), 100);
              observer.disconnect();
            }
          });
        });
        observer.observe(settingsPanel, { attributes: true });
      }
    } else {
      // Fallback: initialize immediately
      this.modules.settings.init();
    }
  }

  /**
   * Setup global functions
   */
  setupGlobalFunctions() {
    // Global scroll function
    window.scrollToForm = () => {
      const settingsTab = document.getElementById('settings');
      if (settingsTab) {
        settingsTab.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // Global cropper functions
    window.cropperZoom = (delta) => {
      if (this.modules.imageCropper?.cropper) {
        this.modules.imageCropper.cropper.zoom(delta);
      }
    };

    window.cropperRotate = (deg) => {
      if (this.modules.imageCropper?.cropper) {
        this.modules.imageCropper.cropper.rotate(deg);
      }
    };

    window.cropperReset = () => {
      if (this.modules.imageCropper?.cropper) {
        this.modules.imageCropper.cropper.reset();
      }
    };

    window.confirmCrop = () => {
      if (this.modules.imageCropper) {
        this.modules.imageCropper.confirmCrop();
      }
    };

    window.closeCropper = () => {
      if (this.modules.imageCropper) {
        this.modules.imageCropper.closeCropper();
      }
    };
  }

  /**
   * Initialize advanced features
   */
  initializeAdvancedFeatures() {
    this.initializeAppointmentsAjaxFilter();
    this.initializeDeclineReasons();
    this.initializeModalHandlers();
    this.initializeAnalyticsSorting();
    this.initializeAnalyticsCharts();
  }

  /**
   * Initialize appointments AJAX filtering
   */
  initializeAppointmentsAjaxFilter() {
    const appointmentsPanel = document.getElementById('appointments');
    if (!appointmentsPanel) return;
    
    const pills = appointmentsPanel.querySelectorAll('.status-pills a.status-pill');
    const listContainer = document.getElementById('appointments-list');
    if (!pills.length || !listContainer) return;

    const setActive = (status) => {
      pills.forEach(a => {
        if (a.dataset.status === status) a.classList.add('active');
        else a.classList.remove('active');
      });
    };

    const fetchAppointments = (status, push = true) => {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'appointments');
      url.searchParams.set('appt_status', status || 'all');
      url.searchParams.set('partial', 'appointments_list');

      // Loading state
      listContainer.setAttribute('aria-busy', 'true');
      listContainer.style.opacity = '0.6';

      fetch(url.toString(), { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(resp => { 
          if (!resp.ok) throw new Error('Failed'); 
          return resp.text(); 
        })
        .then(html => {
          listContainer.innerHTML = this.sanitizeHTML(html);
          setActive(status);
          if (push) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('tab', 'appointments');
            newUrl.searchParams.set('appt_status', status || 'all');
            history.pushState({ appt_status: status }, '', newUrl.pathname + newUrl.search + '#appointments');
          }
          appointmentsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })
        .catch(() => {
          // Fallback: navigate normally
          const fallback = appointmentsPanel.querySelector(`.status-pills a.status-pill[data-status="${status}"]`);
          if (fallback && fallback.href) window.location.href = fallback.href;
        })
        .finally(() => {
          listContainer.removeAttribute('aria-busy');
          listContainer.style.opacity = '';
        });
    };

    // Click handlers
    pills.forEach(a => {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        const status = this.dataset.status || 'all';
        fetchAppointments(status, true);
      });
    });

    // Back/forward navigation
    window.addEventListener('popstate', function () {
      const params = new URL(window.location.href).searchParams;
      const status = params.get('appt_status') || 'all';
      setActive(status);
      fetchAppointments(status, false);
    });

    // Ensure correct active state on load
    const initialStatus = new URL(window.location.href).searchParams.get('appt_status') || 'all';
    setActive(initialStatus);
  }

  /**
   * Sanitize HTML by removing scripts, on* handlers, and javascript: URLs
   * @param {string} html
   * @returns {string}
   */
  sanitizeHTML(html) {
    try {
      const template = document.createElement('template');
      template.innerHTML = String(html);
      template.content.querySelectorAll('script').forEach(el => el.remove());
      const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT, null);
      let node = walker.nextNode();
      while (node) {
        [...node.attributes].forEach(attr => {
          const name = attr.name.toLowerCase();
          if (name.startsWith('on')) node.removeAttribute(attr.name);
          if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(attr.value)) {
            node.removeAttribute(attr.name);
          }
        });
        node = walker.nextNode();
      }
      return template.innerHTML;
    } catch (e) {
      return String(html);
    }
  }

  /**
   * Initialize decline reasons functionality
   */
  initializeDeclineReasons() {
    const addBtn = document.getElementById('add-decline-reason-btn');
    const labelEl = document.getElementById('decline-reason-label');
    const activeEl = document.getElementById('decline-reason-active');
    const mainForm = document.getElementById('church-update-form');
    const csrfEl = mainForm ? mainForm.querySelector('input[name="csrfmiddlewaretoken"]') : null;
    const csrfToken = csrfEl ? csrfEl.value : '';

    const post = async (url, dataObj) => {
      const headers = { 'X-CSRFToken': csrfToken };
      let body;
      if (dataObj) {
        const fd = new FormData();
        Object.keys(dataObj).forEach(k => fd.append(k, dataObj[k]));
        body = fd;
      }
      const resp = await fetch(url, { method: 'POST', headers, body });
      return resp;
    };

    if (addBtn && labelEl) {
      addBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const label = (labelEl.value || '').trim();
        if (!label) { labelEl.focus(); return; }
        const is_active = activeEl && activeEl.checked ? 'on' : '';
        const url = window.createDeclineReasonUrl;
        try {
          await post(url, { label, is_active });
          // Keep user in settings -> decline reasons after reload
          const base = window.location.pathname + '?tab=settings#decline-reasons-settings';
          window.location.assign(base);
        } catch (err) {
          console.error('Failed to add decline reason', err);
        }
      });
    }

    document.querySelectorAll('.dr-action[data-url]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const url = btn.getAttribute('data-url');
        const action = btn.getAttribute('data-action');
        if (!url) return;
        if (action === 'delete') {
          const ok = confirm('Delete this reason?');
          if (!ok) return;
        }
        try {
          await post(url);
          const base = window.location.pathname + '?tab=settings#decline-reasons-settings';
          window.location.assign(base);
        } catch (err) {
          console.error('Decline reason action failed', err);
        }
      });
    });
  }

  /**
   * Initialize modal handlers
   */
  initializeModalHandlers() {
    // Add modal close on outside click
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('modal-overlay')) {
        const modal = e.target;
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
    
    // Add keyboard navigation for modals
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-overlay[style*="flex"]');
        if (openModal) {
          openModal.style.display = 'none';
          document.body.style.overflow = '';
        }
      }
    });
  }

  /**
   * Initialize analytics sorting functionality
   */
  initializeAnalyticsSorting() {
    const sortDropdown = document.getElementById('analytics-sort');
    const analyticsCards = document.querySelector('.unified-content-management .analytics-cards');
    
    if (!sortDropdown || !analyticsCards) return;

    // Store original card order and data
    const originalCards = Array.from(analyticsCards.children);
    const cardData = originalCards.map(card => {
      const valueText = card.querySelector('.analytics-content h4')?.textContent || '0';
      const value = parseInt(valueText.replace(/,/g, '')) || 0;
      const label = card.querySelector('.analytics-content p')?.textContent || '';
      const changeText = card.querySelector('.analytics-change')?.textContent || '+0 this month';
      const changeValue = parseInt(changeText.match(/[\+\-]?\d+/) ? changeText.match(/[\+\-]?\d+/)[0] : '0') || 0;
      
      return {
        element: card,
        value: value,
        label: label,
        changeValue: changeValue,
        originalIndex: originalCards.indexOf(card)
      };
    });

    const sortCards = (sortType) => {
      let sortedData = [...cardData];
      
      switch (sortType) {
        case 'highest':
          sortedData.sort((a, b) => b.value - a.value);
          break;
        case 'lowest':
          sortedData.sort((a, b) => a.value - b.value);
          break;
        case 'recent':
          sortedData.sort((a, b) => b.changeValue - a.changeValue);
          break;
        case 'default':
        default:
          sortedData.sort((a, b) => a.originalIndex - b.originalIndex);
          break;
      }

      // Animate card reordering
      analyticsCards.style.opacity = '0.6';
      analyticsCards.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        // Clear and re-append cards in new order
        analyticsCards.innerHTML = '';
        sortedData.forEach(item => {
          analyticsCards.appendChild(item.element);
        });
        
        // Restore appearance
        analyticsCards.style.opacity = '';
        analyticsCards.style.transform = '';
      }, 200);
    };

    // Handle sort dropdown changes
    sortDropdown.addEventListener('change', (e) => {
      const sortType = e.target.value;
      sortCards(sortType);
      
      // Store user preference
      try {
        localStorage.setItem('analyticsSort', sortType);
      } catch (error) {
        console.warn('Could not save analytics sort preference:', error);
      }
    });

    // Load saved sort preference
    try {
      const savedSort = localStorage.getItem('analyticsSort');
      if (savedSort && savedSort !== 'default') {
        sortDropdown.value = savedSort;
        sortCards(savedSort);
      }
    } catch (error) {
      console.warn('Could not load analytics sort preference:', error);
    }
  }

  /**
   * Initialize analytics charts
   */
  initializeAnalyticsCharts() {
    // Only initialize if charts containers exist
    const mostEngagedChart = document.getElementById('mostEngagedChart');
    const top5PostsChart = document.getElementById('top5PostsChart');
    const donationsBreakdownChart = document.getElementById('donationsBreakdownChart');
    const topDonorsChart = document.getElementById('topDonorsChart');
    const appointmentsBreakdownChart = document.getElementById('appointmentsBreakdownChart');
    const appointmentsTrendChart = document.getElementById('appointmentsTrendChart');
    const followersGrowthChart = document.getElementById('followersGrowthChart');
    const followersEngagementChart = document.getElementById('followersEngagementChart');
    
    if (!mostEngagedChart && !top5PostsChart && !donationsBreakdownChart && !topDonorsChart && 
        !appointmentsBreakdownChart && !appointmentsTrendChart && !followersGrowthChart && !followersEngagementChart) {
      console.log('Charts containers not found, skipping chart initialization');
      return;
    }

    // Load Chart.js if not already loaded
    if (typeof Chart === 'undefined') {
      this.loadChartJs().then(() => {
        console.log('Chart.js loaded, rendering charts');
        this.renderCharts();
      }).catch(error => {
        console.error('Failed to load Chart.js:', error);
        this.showChartLoadingError();
      });
    } else {
      console.log('Chart.js already loaded, rendering charts');
      this.renderCharts();
    }

    // Re-render when Content or Donations tab is activated (in case HTML was not measured/available yet)
    const contentTabBtn = document.querySelector('[data-tab="content"]');
    if (contentTabBtn) {
      contentTabBtn.addEventListener('click', () => {
        setTimeout(() => this.renderCharts(), 150);
      });
    }
    const donationsTabBtn = document.querySelector('[data-tab="donations"]');
    if (donationsTabBtn) {
      donationsTabBtn.addEventListener('click', () => {
        setTimeout(() => this.renderCharts(), 150);
      });
    }
    const appointmentsTabBtn = document.querySelector('[data-tab="appointments"]');
    if (appointmentsTabBtn) {
      appointmentsTabBtn.addEventListener('click', () => {
        setTimeout(() => this.renderCharts(), 150);
      });
    }
    const followersTabBtn = document.querySelector('[data-tab="followers"]');
    if (followersTabBtn) {
      followersTabBtn.addEventListener('click', () => {
        setTimeout(() => this.renderCharts(), 150);
      });
    }

    // Also re-attempt shortly after load (in case posts are injected late)
    setTimeout(() => this.renderCharts(), 400);
  }

  /**
   * Load Chart.js library dynamically
   */
  loadChartJs() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Render all analytics charts
   */
  renderCharts() {
    // Ensure Chart.js is loaded before rendering
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded yet, skipping chart rendering');
      return;
    }
    
    this.renderMostEngagedChart();
    this.renderTop5PostsChart();
    this.renderDonationsBreakdownChart();
    this.renderTopDonorsChart();
    this.renderAppointmentsBreakdownChart();
    this.renderAppointmentsTrendChart();
    this.renderFollowersGrowthChart();
    this.renderFollowersEngagementChart();
    this.renderServiceBookingsTrendChart();
    this.renderServicePerformanceChart();
    this.renderEngagementBars();
  }

  /**
   * Render service bookings trend chart (Line chart for last 30 days)
   */
  renderServiceBookingsTrendChart() {
    const canvas = document.getElementById('serviceBookingsTrendChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Get data from data attribute
    let bookingsData = [];
    try {
      const dataAttr = canvas.getAttribute('data-labels');
      bookingsData = dataAttr ? JSON.parse(dataAttr) : [];
    } catch (e) {
      console.error('Error parsing service bookings data:', e);
      return;
    }

    if (bookingsData.length === 0 || bookingsData.every(d => d.count === 0)) {
      this.showEmptyChartState(canvas);
      return;
    }

    // Destroy existing instance
    try { this.chartInstances.serviceBookingsTrend?.destroy(); } catch (_) {}
    
    // Remove any existing empty states and show canvas
    const container = canvas.parentElement;
    const existingEmptyStates = container.querySelectorAll('.chart-empty-state');
    existingEmptyStates.forEach(state => state.remove());
    canvas.style.display = 'block';

    const labels = bookingsData.map(d => d.date);
    const data = bookingsData.map(d => d.count);

    this.chartInstances.serviceBookingsTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Bookings',
          data: data,
          borderColor: 'rgba(218, 165, 32, 1)',
          backgroundColor: 'rgba(218, 165, 32, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgba(218, 165, 32, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(139, 69, 19, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(218, 165, 32, 0.8)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return context.parsed.y + ' booking' + (context.parsed.y !== 1 ? 's' : '');
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { family: 'Georgia, serif' },
              color: '#6B4226'
            },
            grid: { color: 'rgba(139, 69, 19, 0.1)' }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              font: { family: 'Georgia, serif', size: 10 },
              color: '#6B4226'
            },
            grid: { display: false }
          }
        }
      }
    });
  }

  /**
   * Render service performance chart (Horizontal bar chart)
   */
  renderServicePerformanceChart() {
    const canvas = document.getElementById('servicePerformanceChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Get data from the ranking items
    const rankingItems = document.querySelectorAll('.services-ranking .ranking-item');
    if (rankingItems.length === 0) {
      this.showEmptyChartState(canvas);
      return;
    }

    const labels = [];
    const data = [];
    
    rankingItems.forEach(item => {
      const nameEl = item.querySelector('.post-info p');
      const countEl = item.querySelector('.engagement-total');
      if (nameEl && countEl) {
        labels.push(nameEl.textContent.trim());
        const countText = countEl.textContent.trim();
        const count = parseInt(countText.match(/\d+/)?.[0] || '0');
        data.push(count);
      }
    });

    if (data.length === 0 || data.every(d => d === 0)) {
      this.showEmptyChartState(canvas);
      return;
    }

    // Destroy existing instance
    try { this.chartInstances.servicePerformance?.destroy(); } catch (_) {}
    
    // Remove any existing empty states and show canvas
    const container = canvas.parentElement;
    const existingEmptyStates = container.querySelectorAll('.chart-empty-state');
    existingEmptyStates.forEach(state => state.remove());
    canvas.style.display = 'block';

    this.chartInstances.servicePerformance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Bookings',
          data: data,
          backgroundColor: [
            'rgba(218, 165, 32, 0.7)',
            'rgba(184, 134, 11, 0.7)',
            'rgba(160, 82, 45, 0.7)',
            'rgba(139, 69, 19, 0.7)',
            'rgba(101, 67, 33, 0.7)'
          ],
          borderColor: [
            'rgba(218, 165, 32, 1)',
            'rgba(184, 134, 11, 1)',
            'rgba(160, 82, 45, 1)',
            'rgba(139, 69, 19, 1)',
            'rgba(101, 67, 33, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(139, 69, 19, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(218, 165, 32, 0.8)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return context.parsed.x + ' booking' + (context.parsed.x !== 1 ? 's' : '');
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { family: 'Georgia, serif' },
              color: '#6B4226'
            },
            grid: { color: 'rgba(139, 69, 19, 0.1)' }
          },
          y: {
            ticks: {
              font: { family: 'Georgia, serif', size: 11 },
              color: '#6B4226'
            },
            grid: { display: false }
          }
        }
      }
    });
  }

  /**
   * Render most engaged post chart
   */
  renderMostEngagedChart() {
    const canvas = document.getElementById('mostEngagedChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Get data from the page elements - extract numbers only, ignoring SVG content
    const likesElement = document.querySelector('.post-preview .engagement-stats .stat:nth-child(1)');
    const commentsElement = document.querySelector('.post-preview .engagement-stats .stat:nth-child(2)');
    const viewsElement = document.querySelector('.post-preview .engagement-stats .stat:nth-child(3)');
    
    // Extract only numbers from text content, filtering out SVG and other elements
    let likes = 0;
    let comments = 0;
    let views = 0;
    
    if (likesElement) {
      const textNodes = Array.from(likesElement.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
      likes = parseInt(textNodes.map(node => node.textContent.trim()).join('').replace(/[^0-9]/g, '') || '0') || 0;
    }
    if (commentsElement) {
      const textNodes = Array.from(commentsElement.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
      comments = parseInt(textNodes.map(node => node.textContent.trim()).join('').replace(/[^0-9]/g, '') || '0') || 0;
    }
    if (viewsElement) {
      const textNodes = Array.from(viewsElement.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
      views = parseInt(textNodes.map(node => node.textContent.trim()).join('').replace(/[^0-9]/g, '') || '0') || 0;
    }
    
    console.log('Initial chart data:', { likes, comments, views });

    // Fallback: If no data from analytics, look for posts in the management section
    if (likes === 0 && comments === 0 && views === 0) {
      // Check if there are any posts in the posts management section
      // Real structure uses .post-management-card
      const posts = document.querySelectorAll('.posts-list .post-management-card, .post-management-card');
      
      if (posts.length > 0) {
        // If we have posts but no engagement data, show at least minimal data
        let maxEngagement = 0;
        let bestPost = null;

        posts.forEach(post => {
          // Prefer data-* attributes
          let postLikes = parseInt(post.getAttribute('data-likes') || '0');
          let postComments = parseInt(post.getAttribute('data-comments') || '0');
          let postViews = parseInt(post.getAttribute('data-views') || '0');

          // Fallback to parsing DOM if attributes missing
          if (isNaN(postLikes) || isNaN(postComments) || isNaN(postViews)) {
            const statSpans = post.querySelectorAll('.post-stats .stat');
            if (isNaN(postLikes)) postLikes = parseInt((statSpans[0]?.textContent || '0').replace(/[^0-9]/g, '')) || 0;
            if (isNaN(postComments)) postComments = parseInt((statSpans[1]?.textContent || '0').replace(/[^0-9]/g, '')) || 0;
            if (isNaN(postViews) || postViews === 0) {
              const viewEl = post.querySelector('.post-stats .view-count');
              if (viewEl) postViews = parseInt(viewEl.textContent.trim()) || 0;
              else postViews = parseInt((statSpans[2]?.textContent || '0').replace(/[^0-9]/g, '')) || 0;
            }
          }
          const totalEngagement = postLikes + postComments + postViews;

          if (totalEngagement >= maxEngagement) {
            maxEngagement = totalEngagement;
            bestPost = { likes: postLikes, comments: postComments, views: postViews };
          }
        });

        if (bestPost) {
          likes = bestPost.likes;
          comments = bestPost.comments;
          views = bestPost.views;
        } else if (posts.length > 0) {
          // If we have posts but can't find stats, show minimal data to indicate a post exists
          views = 1; // Show at least 1 view to indicate there's a post
        }
      }
    }

    // Final safeguard: if still zero but there are visible view counters, use the max view count
    if (likes === 0 && comments === 0 && views === 0) {
      const allViewEls = document.querySelectorAll('.view-count');
      let maxView = 0;
      allViewEls.forEach(el => {
        const n = parseInt((el.textContent || '').trim()) || 0;
        if (n > maxView) maxView = n;
      });
      if (maxView > 0) {
        views = maxView;
      }
    }

    // If still zero after all fallbacks and there are no posts, show empty state
    if (likes === 0 && comments === 0 && views === 0) {
      this.showEmptyChartState(canvas);
      return;
    }

    // Destroy existing chart if any and clean up empty states
    try { this.chartInstances.mostEngaged?.destroy(); } catch (_) {}
    
    // Remove any existing empty states and show canvas
    const container = canvas.parentElement;
    const existingEmptyStates = container.querySelectorAll('.chart-empty-state');
    existingEmptyStates.forEach(state => state.remove());
    canvas.style.display = 'block';

    this.chartInstances.mostEngaged = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Views', 'Likes', 'Comments'],
        datasets: [{
          data: [views, likes, comments],
          backgroundColor: [
            'rgba(139, 69, 19, 0.7)',
            'rgba(218, 165, 32, 0.7)',
            'rgba(160, 82, 45, 0.7)'
          ],
          borderColor: [
            'rgba(139, 69, 19, 1)',
            'rgba(218, 165, 32, 1)',
            'rgba(160, 82, 45, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.2,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                family: 'Georgia, serif',
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(139, 69, 19, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(218, 165, 32, 0.8)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          duration: 1000
        }
      }
    });
  }

  /**
   * Render top 5 posts ranking chart
   */
  renderTop5PostsChart() {
    const canvas = document.getElementById('top5PostsChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Get data from ranking items specifically for posts (not followers or other charts)
    const postsContainer = canvas.closest('.chart-container');
    const rankingItems = postsContainer?.querySelectorAll('.ranking-item') || [];
    const labels = [];
    const data = [];
    const fallbackTitles = [];
    const colors = [
      'rgba(139, 69, 19, 0.8)',
      'rgba(218, 165, 32, 0.8)',
      'rgba(160, 82, 45, 0.8)',
      'rgba(139, 69, 19, 0.6)',
      'rgba(218, 165, 32, 0.6)'
    ];

    rankingItems.forEach((item, index) => {
      const postText = item.querySelector('.post-info p')?.textContent?.trim() || `Post ${index + 1}`;
      const engagementText = item.querySelector('.engagement-total')?.textContent?.trim() || '0 engagements';
      const engagement = parseInt(engagementText.match(/\d+/)?.[0] || '0');
      
      labels.push(`#${index + 1}`);
      data.push(engagement);
      fallbackTitles.push(postText);
    });

    // Fallback: If no ranking data but there are posts, create basic ranking
    if (data.length === 0 || data.every(val => val === 0)) {
      const posts = document.querySelectorAll('.posts-list .post-management-card, .post-management-card');
      
      if (posts.length > 0) {
        const postData = [];
        
        posts.forEach((post, index) => {
          const statSpans = post.querySelectorAll('.post-stats .stat');
          const postLikes = parseInt((statSpans[0]?.textContent || '0').replace(/[^0-9]/g, '')) || 0;
          const postComments = parseInt((statSpans[1]?.textContent || '0').replace(/[^0-9]/g, '')) || 0;
          let postViews = 0;
          const viewEl = post.querySelector('.post-stats .view-count');
          if (viewEl) {
            postViews = parseInt(viewEl.textContent.trim()) || 0;
          } else {
            postViews = parseInt((statSpans[2]?.textContent || '0').replace(/[^0-9]/g, '')) || 0;
          }
          const totalEngagement = postLikes + postComments + postViews; // Use actual engagement, allow 0
          
          const postContent = post.querySelector('.post-content, .post-text, .post-content-preview, .post-preview, p')?.textContent?.trim() || '';
          
          // Only include posts that have actual content or engagement
          if (postContent && (totalEngagement > 0 || postContent !== `Post ${index + 1}`)) {
            postData.push({
              content: postContent.substring(0, 30) + (postContent.length > 30 ? '...' : ''),
              engagement: totalEngagement
            });
          }
        });
        
        // Sort by engagement and take top 5
        postData.sort((a, b) => b.engagement - a.engagement);
        const topPosts = postData.slice(0, 5);
        
        // Clear previous data and populate with actual posts
        labels.length = 0;
        data.length = 0;
        fallbackTitles.length = 0;
        
        topPosts.forEach((post, index) => {
          labels.push(`#${index + 1}`);
          data.push(post.engagement);
          fallbackTitles.push(post.content);
        });
      }
    }

    // If still no data, show empty state
    if (data.length === 0 || data.every(val => val === 0)) {
      this.showEmptyChartState(canvas);
      return;
    }

    // Destroy existing chart if any and clean up empty states
    try { this.chartInstances.top5?.destroy(); } catch (_) {}
    
    // Remove any existing empty states and show canvas
    const container = canvas.parentElement;
    const existingEmptyStates = container.querySelectorAll('.chart-empty-state');
    existingEmptyStates.forEach(state => state.remove());
    canvas.style.display = 'block';

    this.chartInstances.top5 = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Engagements',
          data: data,
          backgroundColor: colors.slice(0, data.length),
          borderColor: colors.slice(0, data.length).map(color => color.replace('0.8', '1').replace('0.6', '1')),
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.8,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(139, 69, 19, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(218, 165, 32, 0.8)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              title: function(context) {
                const index = context[0].dataIndex;
                const postElement = rankingItems[index]?.querySelector('.post-info p');
                const fallback = (fallbackTitles && fallbackTitles[index]) ? fallbackTitles[index] : `Post ${index + 1}`;
                return (postElement?.textContent?.trim()) || fallback;
              },
              label: function(context) {
                return `Engagements: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                family: 'Georgia, serif'
              }
            },
            grid: {
              color: 'rgba(139, 69, 19, 0.1)'
            }
          },
          x: {
            ticks: {
              font: {
                family: 'Georgia, serif',
                weight: 'bold'
              }
            },
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutBounce'
        }
      }
    });
  }

  /**
   * Show empty chart state
   */
  showEmptyChartState(canvas) {
    const container = canvas.parentElement;
    canvas.style.display = 'none';
    
    // Remove any existing empty states to prevent duplicates
    const existingEmptyStates = container.querySelectorAll('.chart-empty-state');
    existingEmptyStates.forEach(state => state.remove());
    
    const emptyState = document.createElement('div');
    emptyState.className = 'chart-empty-state';
    emptyState.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--muted);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 1rem; opacity: 0.5;">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <p style="margin: 0; font-style: italic;">No engagement data available</p>
      </div>
    `;
    
    container.insertBefore(emptyState, canvas);
  }

  /**
   * Render followers growth trend chart (Monthly growth over time)
   */
  renderFollowersGrowthChart() {
    const canvas = document.getElementById('followersGrowthChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Read values from data attributes
    const total = parseInt(canvas.getAttribute('data-total') || '0') || 0;
    const recent = parseInt(canvas.getAttribute('data-recent') || '0') || 0;

    // Generate sample monthly data showing growth trend
    const currentMonth = new Date().getMonth();
    const months = [];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.push(monthNames[monthIndex]);
      
      // Generate growth data with upward trend
      const baseGrowth = Math.max(0, Math.floor(total * (0.2 + (5-i) * 0.15)) + Math.floor(Math.random() * 5));
      data.push(i === 0 ? total : baseGrowth); // Current month shows total
    }

    if (data.every(v => v === 0)) {
      this.showEmptyChartState(canvas);
      return;
    }

    try { this.chartInstances.followersGrowth?.destroy(); } catch (_) {}
    
    // Remove any existing empty states and show canvas
    const container = canvas.parentElement;
    const existingEmptyStates = container.querySelectorAll('.chart-empty-state');
    existingEmptyStates.forEach(state => state.remove());
    canvas.style.display = 'block';

    this.chartInstances.followersGrowth = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Followers',
          data: data,
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(34, 197, 94, 1)',
          pointBorderColor: 'rgba(139, 69, 19, 1)',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.8,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(139, 69, 19, 0.9)',
            titleColor: '#fff', bodyColor: '#fff',
            borderColor: 'rgba(34, 197, 94, 0.8)', borderWidth: 1, cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return `Followers: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              stepSize: Math.max(1, Math.floor(total / 10)),
              font: { family: 'Georgia, serif' } 
            },
            grid: { color: 'rgba(139, 69, 19, 0.1)' }
          },
          x: {
            ticks: { font: { family: 'Georgia, serif', weight: 'bold' } },
            grid: { display: false }
          }
        },
        animation: { duration: 1000, easing: 'easeInOutQuart' }
      }
    });
  }

  /**
   * Render followers engagement chart (Activity levels)
   */
  renderFollowersEngagementChart() {
    const canvas = document.getElementById('followersEngagementChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Sample engagement data based on follower count
    const total = parseInt(document.querySelector('[data-total]')?.getAttribute('data-total') || '0') || 0;
    const recent = parseInt(document.querySelector('[data-recent]')?.getAttribute('data-recent') || '0') || 0;
    
    const highlyActive = recent;
    const moderatelyActive = Math.max(0, Math.floor(total * 0.4));
    const lowActivity = Math.max(0, total - highlyActive - moderatelyActive);

    const dataPoints = [highlyActive, moderatelyActive, lowActivity];
    if (dataPoints.every(v => v === 0)) {
      this.showEmptyChartState(canvas);
      return;
    }

    try { this.chartInstances.followersEngagement?.destroy(); } catch (_) {}
    
    // Remove any existing empty states and show canvas
    const container = canvas.parentElement;
    const existingEmptyStates = container.querySelectorAll('.chart-empty-state');
    existingEmptyStates.forEach(state => state.remove());
    canvas.style.display = 'block';

    this.chartInstances.followersEngagement = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Highly Active', 'Moderately Active', 'Low Activity'],
        datasets: [{
          data: dataPoints,
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',    // green - highly active
            'rgba(218, 165, 32, 0.7)',   // gold - moderate
            'rgba(156, 163, 175, 0.6)'   // gray - low
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(218, 165, 32, 1)',
            'rgba(156, 163, 175, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.2,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, padding: 20, font: { family: 'Georgia, serif', size: 12 } }
          },
          tooltip: {
            backgroundColor: 'rgba(139, 69, 19, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(34, 197, 94, 0.8)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0) || 1;
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        },
        animation: { animateRotate: true, duration: 1000 }
      }
    });
  }

  /**
   * Show chart loading error
   */
  showChartLoadingError() {
    const canvases = document.querySelectorAll('#mostEngagedChart, #top5PostsChart');
    canvases.forEach(canvas => {
      const container = canvas.parentElement;
      canvas.style.display = 'none';
      
      const errorState = document.createElement('div');
      errorState.className = 'chart-error-state';
      errorState.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 1rem; opacity: 0.5;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <circle cx="12" cy="16" r="1"/>
          </svg>
          <p style="margin: 0; font-style: italic;">Unable to load charts</p>
        </div>
      `;
      
      container.insertBefore(errorState, canvas);
    });
  }

  /**
   * Render engagement bars for ranking items
   */
  renderEngagementBars() {
    const rankingItems = document.querySelectorAll('.ranking-item[data-engagement]');
    
    rankingItems.forEach(item => {
      const engagement = parseInt(item.getAttribute('data-engagement') || '0');
      const maxEngagement = parseInt(item.getAttribute('data-max-engagement') || '1');
      const percentage = maxEngagement > 0 ? (engagement / maxEngagement) * 100 : 0;
      
      const barFill = item.querySelector('.bar-fill');
      if (barFill) {
        // Animate the bar fill
        setTimeout(() => {
          barFill.style.width = `${Math.min(percentage, 100)}%`;
        }, 200 * parseInt(item.getAttribute('data-rank') || '1'));
      }
    });
  }
}

// Global utility functions
function openImageGallery(serviceId) {
  const base = window.manageServiceImagesUrl || (window.djangoUrls && window.djangoUrls.manageServiceImages);
  if (!base) {
    console.warn('manageServiceImages URL is not defined');
    return;
  }
  window.location.href = base.replace('/0/', `/${serviceId}/`);
}

function openPhotoGallery(serviceId) {
  const base = window.serviceGalleryUrl || (window.djangoUrls && window.djangoUrls.serviceGallery);
  if (!base) {
    console.warn('serviceGallery URL is not defined');
    return;
  }
  window.location.href = base.replace('/0/', `/${serviceId}/`);
}

// Advanced Features Functions
function openBulkEditModal() {
  document.getElementById('bulk-edit-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function openExportModal() {
  document.getElementById('export-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function openImportModal() {
  document.getElementById('import-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function openResetModal() {
  document.getElementById('reset-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  document.body.style.overflow = '';
}

function executeBulkEdit() {
  const selectedFields = Array.from(document.querySelectorAll('#bulk-edit-modal input[type="checkbox"]:checked'))
    .map(cb => cb.value);
  const action = document.querySelector('#bulk-edit-modal select').value;
  
  if (selectedFields.length === 0) {
    window.Utils?.showNotification('Please select at least one field to edit', 'error');
    return;
  }
  
  window.Utils?.showNotification(`Bulk ${action} applied to: ${selectedFields.join(', ')}`, 'success');
  closeModal('bulk-edit-modal');
}

function executeExport() {
  const format = document.querySelector('input[name="export-format"]:checked').value;
  const selectedData = Array.from(document.querySelectorAll('#export-modal input[type="checkbox"]:checked'))
    .map(cb => cb.value);
  
  window.Utils?.showNotification(`Exporting ${format.toUpperCase()} file with: ${selectedData.join(', ')}`, 'success');
  closeModal('export-modal');
  
  // Simulate file download
  setTimeout(() => {
    const link = document.createElement('a');
    link.href = '#';
    link.download = `church-data.${format}`;
    link.click();
  }, 1000);
}

function executeImport() {
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];
  
  if (!file) {
    window.Utils?.showNotification('Please select a file to import', 'error');
    return;
  }
  
  const overwrite = document.querySelector('#import-modal input[value="overwrite"]').checked;
  const validate = document.querySelector('#import-modal input[value="validate"]').checked;
  
  window.Utils?.showNotification(`Importing ${file.name} (${overwrite ? 'overwrite' : 'merge'}, ${validate ? 'with validation' : 'no validation'})`, 'success');
  closeModal('import-modal');
}

function executeReset() {
  const selectedSettings = Array.from(document.querySelectorAll('#reset-modal input[type="checkbox"]:checked'))
    .map(cb => cb.value);
  
  if (selectedSettings.length === 0) {
    window.Utils?.showNotification('Please select at least one setting to reset', 'error');
    return;
  }
  
  window.Utils?.showNotification(`Resetting: ${selectedSettings.join(', ')}`, 'success');
  closeModal('reset-modal');
}

// Submit church verification request
function submitVerification() {
  const container = document.getElementById('verif-upload');
  if (!container) return;
  const filesInput = container.querySelector('input[name="documents"]');
  const agreeInput = container.querySelector('input[name="agree"]');

  const files = filesInput && filesInput.files ? Array.from(filesInput.files) : [];
  if (files.length < 2) {
    window.Utils?.showNotification('Please upload at least two legal documents.', 'error');
    return;
  }
  if (!agreeInput || !agreeInput.checked) {
    window.Utils?.showNotification('Please confirm the authenticity checkbox.', 'error');
    return;
  }

  const formData = new FormData();
  files.forEach(f => formData.append('documents', f));
  formData.append('agree', 'on');

  const csrfInput = document.querySelector('input[name=csrfmiddlewaretoken]');
  const csrfToken = csrfInput ? csrfInput.value : '';
  const submitBtn = container.querySelector('button[data-action="submit-verification"]');
  if (submitBtn) submitBtn.disabled = true;

  fetch(window.requestVerificationUrl, {
    method: 'POST',
    headers: { 'X-CSRFToken': csrfToken },
    body: formData,
    credentials: 'same-origin'
  })
  .then(resp => {
    if (resp.ok) {
      // Refresh to show flash messages and updated status
      window.location.href = window.location.pathname + '?tab=settings';
      return;
    }
    return resp.text().then(() => { throw new Error('Submission failed'); });
  })
  .catch(err => {
    window.Utils?.handleError(err, 'Verification Submission');
    if (submitBtn) submitBtn.disabled = false;
  });
}

// Global function for verification modal
window.openVerificationModal = function() {
  const modal = document.getElementById('verification-modal');
  if (modal) {
    modal.style.display = 'flex';
  } else {
    // If modal doesn't exist, scroll to verification form
    const verificationSection = document.getElementById('verification-settings');
    if (verificationSection) {
      verificationSection.scrollIntoView({ behavior: 'smooth' });
      // Highlight the section briefly
      verificationSection.style.transition = 'all 0.3s ease';
      verificationSection.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.3)';
      setTimeout(() => {
        verificationSection.style.boxShadow = '';
      }, 2000);
    }
  }
};

// Global functions for decline reasons
window.removeDeclineReason = async function(reasonId) {
  if (!confirm('Are you sure you want to delete this decline reason?')) {
    return;
  }

  try {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    const response = await fetch(`/app/settings/decline-reasons/${reasonId}/delete/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      // Remove the item from DOM
      const listItem = document.querySelector(`button[onclick="removeDeclineReason(${reasonId})"]`)?.closest('li');
      if (listItem) {
        listItem.style.transition = 'all 0.3s ease';
        listItem.style.opacity = '0';
        listItem.style.transform = 'translateX(-20px)';
        setTimeout(() => listItem.remove(), 300);
      }
      showDeclineReasonNotification('Decline reason deleted successfully', 'success');
    } else {
      showDeclineReasonNotification('Failed to delete decline reason', 'error');
    }
  } catch (error) {
    console.error('Error removing decline reason:', error);
    showDeclineReasonNotification('An error occurred', 'error');
  }
};

window.toggleDeclineReason = async function(reasonId, isActive) {
  try {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    const response = await fetch(`/app/settings/decline-reasons/${reasonId}/toggle/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_active: isActive })
    });

    if (response.ok) {
      showDeclineReasonNotification(
        isActive ? 'Decline reason activated' : 'Decline reason deactivated',
        'success'
      );
    } else {
      showDeclineReasonNotification('Failed to update decline reason', 'error');
      // Revert checkbox
      event.target.checked = !isActive;
    }
  } catch (error) {
    console.error('Error toggling decline reason:', error);
    showDeclineReasonNotification('An error occurred', 'error');
    event.target.checked = !isActive;
  }
};

function showDeclineReasonNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `edit-notification edit-notification-${type}`;
  notification.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' ? '<polyline points="20,6 9,17 4,12"/>' : 
        type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1"/>' :
        '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
    </svg>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new ChurchManagementApp();
  app.init();

  // Verification file upload monitoring
  initVerificationFileMonitoring();

  // Enhanced decline reason add functionality with live update
  const addBtn = document.getElementById('add-decline-reason-btn');
  const labelEl = document.getElementById('decline-reason-label');
  const activeEl = document.getElementById('decline-reason-active');

  if (addBtn && labelEl) {
    addBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const label = (labelEl.value || '').trim();
      if (!label) {
        labelEl.focus();
        return;
      }

      const originalText = addBtn.textContent;
      addBtn.disabled = true;
      addBtn.textContent = 'Adding...';

      try {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
        const response = await fetch(window.createDeclineReasonUrl, {
          method: 'POST',
          headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            label: label,
            is_active: activeEl?.checked || false
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Add the new reason to the list live
          addDeclineReasonToList(data.reason);
          
          // Clear the input
          labelEl.value = '';
          if (activeEl) activeEl.checked = true;
          
          showDeclineReasonNotification('Decline reason added successfully!', 'success');
        } else {
          showDeclineReasonNotification(data.message || 'Failed to add decline reason', 'error');
        }
      } catch (error) {
        console.error('Error adding decline reason:', error);
        showDeclineReasonNotification('An error occurred', 'error');
      } finally {
        addBtn.disabled = false;
        addBtn.textContent = originalText;
      }
    });
  }
});

function addDeclineReasonToList(reason) {
  const listContainer = document.querySelector('#decline-reasons-settings .setting-control ul.list');
  
  if (!listContainer) {
    // If no list exists, create one
    const emptyState = document.querySelector('#decline-reasons-settings .empty-state-mini');
    if (emptyState) {
      const newList = document.createElement('ul');
      newList.className = 'list';
      newList.style.cssText = 'list-style:none; padding:0; margin:0;';
      emptyState.replaceWith(newList);
      listContainer = newList;
    } else {
      return;
    }
  }

  const listItem = document.createElement('li');
  listItem.style.cssText = 'display:flex; align-items:center; justify-content:space-between; border:1px solid var(--border,#e5e7eb); padding:8px 12px; border-radius:8px; margin-bottom:8px; opacity:0; transform:translateX(-20px); transition:all 0.3s ease;';
  
  listItem.innerHTML = `
    <span style="flex:1;">${reason.label}</span>
    <div style="display:flex; align-items:center; gap:8px;">
      <label class="toggle-switch" title="Toggle Active">
        <input type="checkbox" ${reason.is_active ? 'checked' : ''} 
               onchange="toggleDeclineReason(${reason.id}, this.checked)">
        <span class="toggle-slider"></span>
      </label>
      <button type="button" class="btn-icon btn-danger" 
              onclick="removeDeclineReason(${reason.id})" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  `;

  listContainer.appendChild(listItem);
  
  // Trigger animation
  setTimeout(() => {
    listItem.style.opacity = '1';
    listItem.style.transform = 'translateX(0)';
  }, 10);
}

function initVerificationFileMonitoring() {
  const fileInputs = document.querySelectorAll('#verification-form-fields input[type="file"]');
  const submitContainer = document.getElementById('verification-submit-container');
  const submitBtn = document.getElementById('submit-verification-btn');
  const checkboxInput = document.querySelectorAll('#verification-form-fields input[type="checkbox"]')[0];
  const previewContainer = document.getElementById('selected-files-preview');
  const filesList = document.getElementById('files-list');

  if (!fileInputs.length || !submitContainer || !submitBtn) return;

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const updateFilePreview = () => {
    filesList.innerHTML = '';
    let totalFiles = 0;

    fileInputs.forEach(input => {
      if (input.files && input.files.length > 0) {
        Array.from(input.files).forEach(file => {
          totalFiles++;
          const ext = getFileExtension(file.name);
          const fileItem = document.createElement('li');
          fileItem.className = 'file-item';
          fileItem.innerHTML = `
            <div class="file-icon ${ext}">
              ${ext}
            </div>
            <div class="file-info">
              <p class="file-name" title="${file.name}">${file.name}</p>
              <p class="file-size">${formatFileSize(file.size)}</p>
            </div>
            <div class="file-status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
          `;
          filesList.appendChild(fileItem);
        });
      }
    });

    if (totalFiles > 0) {
      previewContainer.style.display = 'block';
    } else {
      previewContainer.style.display = 'none';
    }
  };

  const checkFiles = () => {
    let totalFileCount = 0;
    fileInputs.forEach(input => {
      if (input.files && input.files.length > 0) {
        totalFileCount += input.files.length;
      }
    });

    updateFilePreview();

    const checkboxChecked = checkboxInput ? checkboxInput.checked : false;

    if (totalFileCount >= 2 && checkboxChecked) {
      submitContainer.style.display = 'block';
    } else {
      submitContainer.style.display = 'none';
    }
  };

  fileInputs.forEach(input => {
    input.addEventListener('change', checkFiles);
  });

  if (checkboxInput) {
    checkboxInput.addEventListener('change', checkFiles);
  }

  submitBtn.addEventListener('click', async () => {
    if (!confirm('Submit these documents for verification? Your church will be reviewed by our team.')) {
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg> Submitting...';

    try {
      const formData = new FormData();
      // Append ALL selected files under the field name expected by the form: 'documents'
      fileInputs.forEach((input) => {
        if (input.files && input.files.length > 0) {
          Array.from(input.files).forEach(f => formData.append('documents', f));
        }
      });

      if (checkboxInput && checkboxInput.checked) {
        formData.append('agree', 'on');
      }

      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
      const response = await fetch(window.djangoUrls.requestVerification, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
      });

      let data = null;
      try { data = await response.json(); } catch (_) { /* non-JSON fallback */ }

      if (response.ok && data && data.success) {
        showDeclineReasonNotification('Verification request submitted successfully!', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const msg = (data && (data.message || (data.errors && JSON.stringify(data.errors)))) || 'Failed to submit verification request';
        showDeclineReasonNotification(msg, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Submit for Verification';
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      showDeclineReasonNotification('An error occurred', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Submit for Verification';
    }
  });
}

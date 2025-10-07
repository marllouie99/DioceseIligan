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
  }

  /**
   * Initialize the application
   */
  init() {
    try {
      this.initializeModules();
      this.setupGlobalFunctions();
      this.initializeAdvancedFeatures();
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

    // Initialize Calendar Manager
    this.modules.calendar = new window.CalendarManager();
    this.modules.calendar.init();

    // Initialize Settings Manager
    this.modules.settings = new window.SettingsManager();
    this.modules.settings.init();
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
}

// Global utility functions
function openImageGallery(serviceId) {
  const base = window.manageServiceImagesUrl;
  window.location.href = base.replace('/0/', `/${serviceId}/`);
}

function openPhotoGallery(serviceId) {
  const base = window.serviceGalleryUrl;
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new ChurchManagementApp();
  app.init();
});

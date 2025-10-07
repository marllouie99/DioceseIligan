/**
 * Settings Section Edit Handler
 * Enables/disables editing for individual settings sections
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all sections as read-only
  initializeSections();

  // Add event listeners to all edit buttons
  document.querySelectorAll('.edit-section-btn').forEach(button => {
    button.addEventListener('click', function() {
      const sectionId = this.getAttribute('data-section');
      enableSectionEdit(sectionId);
    });
  });
});

/**
 * Initialize all sections as read-only on page load
 */
function initializeSections() {
  const sections = document.querySelectorAll('.settings-section');
  sections.forEach(section => {
    disableSection(section, false); // Disable without showing buttons
  });
}

/**
 * Enable editing for a specific section
 */
function enableSectionEdit(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  // Store original values for cancel functionality
  storeOriginalValues(section);

  // Enable all form fields in this section
  const inputs = section.querySelectorAll('input:not([type="hidden"]), textarea, select');
  inputs.forEach(input => {
    input.disabled = false;
    input.classList.add('editing');
  });

  // Hide the edit button
  const editBtn = section.querySelector('.edit-section-btn');
  if (editBtn) {
    editBtn.style.display = 'none';
  }

  // Show or create action buttons
  showSectionActions(section);

  // Add visual indicator that section is being edited
  section.classList.add('section-editing');
}

/**
 * Disable editing for a specific section
 */
function disableSection(section, showEditButton = true) {
  // Disable all form fields in this section
  const inputs = section.querySelectorAll('input:not([type="hidden"]), textarea, select');
  inputs.forEach(input => {
    input.disabled = true;
    input.classList.remove('editing');
  });

  // Show the edit button
  if (showEditButton) {
    const editBtn = section.querySelector('.edit-section-btn');
    if (editBtn) {
      editBtn.style.display = 'flex';
    }
  }

  // Hide action buttons
  const actionButtons = section.querySelector('.section-actions');
  if (actionButtons) {
    actionButtons.remove();
  }

  // Remove editing indicator
  section.classList.remove('section-editing');
}

/**
 * Store original values for cancel functionality
 */
function storeOriginalValues(section) {
  const inputs = section.querySelectorAll('input:not([type="hidden"]), textarea, select');
  inputs.forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.setAttribute('data-original-checked', input.checked);
    } else if (input.type === 'file') {
      // File inputs can't restore original value for security reasons
      input.setAttribute('data-original-value', '');
    } else {
      input.setAttribute('data-original-value', input.value);
    }
  });
}

/**
 * Restore original values (for cancel)
 */
function restoreOriginalValues(section) {
  const inputs = section.querySelectorAll('input:not([type="hidden"]), textarea, select');
  inputs.forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      const originalChecked = input.getAttribute('data-original-checked');
      input.checked = originalChecked === 'true';
    } else if (input.type !== 'file') {
      const originalValue = input.getAttribute('data-original-value');
      if (originalValue !== null) {
        input.value = originalValue;
      }
    }
  });
}

/**
 * Show action buttons for a section
 */
function showSectionActions(section) {
  // Check if action buttons already exist
  let actionButtons = section.querySelector('.section-actions');
  
  if (!actionButtons) {
    // Create action buttons container
    actionButtons = document.createElement('div');
    actionButtons.className = 'section-actions';
    actionButtons.innerHTML = `
      <button type="button" class="btn btn-primary apply-section-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
        Apply
      </button>
      <button type="button" class="btn btn-secondary cancel-section-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        Cancel
      </button>
    `;

    // Insert after section header
    const sectionHeader = section.querySelector('.section-header');
    if (sectionHeader) {
      sectionHeader.after(actionButtons);
    }

    // Add event listeners
    const applyBtn = actionButtons.querySelector('.apply-section-btn');
    const cancelBtn = actionButtons.querySelector('.cancel-section-btn');

    applyBtn.addEventListener('click', function() {
      applySectionChanges(section);
    });

    cancelBtn.addEventListener('click', function() {
      cancelSectionEdit(section);
    });
  } else {
    actionButtons.style.display = 'flex';
  }
}

/**
 * Apply changes for a section
 */
function applySectionChanges(section) {
  // Show loading state
  const applyBtn = section.querySelector('.apply-section-btn');
  const originalText = applyBtn.innerHTML;
  applyBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg> Saving...';
  applyBtn.disabled = true;

  // Submit the entire form (all sections are part of the same form)
  const form = section.closest('form');
  if (form) {
    // Save current section ID to return here after page reload
    const sectionId = section.id;
    if (sectionId) {
      try {
        sessionStorage.setItem('return_to_section', sectionId);
      } catch(e) {}
    }
    
    // Temporarily enable all disabled inputs so required fields are posted
    const disabledEls = form.querySelectorAll('input:disabled, select:disabled, textarea:disabled');
    disabledEls.forEach(el => { el.disabled = false; el.setAttribute('data-temp-enabled', '1'); });

    // Actually submit the form
    form.submit();
  } else {
    applyBtn.innerHTML = originalText;
    applyBtn.disabled = false;
    showNotification('Form not found', 'error');
  }
}

/**
 * Cancel section edit
 */
function cancelSectionEdit(section) {
  // Restore original values
  restoreOriginalValues(section);
  
  // Disable section
  disableSection(section, true);
  
  showNotification('Changes cancelled', 'info');
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.edit-notification');
  if (existing) existing.remove();

  // Create notification
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

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

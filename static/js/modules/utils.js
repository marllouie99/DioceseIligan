/**
 * Utility Functions for Church Management
 * @module Utils
 */

/**
 * Show notification to user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (info, success, error, warning)
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
function showNotification(message, type = 'info', duration = 5000) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');
  notification.setAttribute('aria-atomic', 'true');
  
  // Add to page
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Remove after specified duration
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

/**
 * Enhanced error handling
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 */
function handleError(error, context = '') {
  const message = error.message || 'An unexpected error occurred';
  showNotification(`${context ? context + ': ' : ''}${message}`, 'error', 7000);
}

/**
 * Loading state management
 * @param {HTMLElement} element - The element to show loading state on
 * @param {string} text - Loading text to display
 * @returns {Function} Function to restore original state
 */
function showLoadingState(element, text = 'Loading...') {
  if (!element) return;
  
  const originalText = element.textContent;
  element.dataset.originalText = originalText;
  element.textContent = text;
  element.disabled = true;
  element.style.opacity = '0.7';
  
  return () => {
    element.textContent = originalText;
    element.disabled = false;
    element.style.opacity = '1';
  };
}

/**
 * Debounce utility for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Whether to call immediately
 * @returns {Function} Debounced function
 */
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle utility for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Throttle limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Get CSRF token from form
 * @returns {string} CSRF token
 */
function getCsrfToken() {
  // 1) Prefer token from the main manage form
  const form = document.getElementById('church-update-form');
  const csrfEl = form ? form.querySelector('input[name="csrfmiddlewaretoken"]') : null;
  if (csrfEl && csrfEl.value) {
    return csrfEl.value;
  }
  // 2) Fallback: any csrf input on the page
  const anyCsrf = document.querySelector('input[name="csrfmiddlewaretoken"]');
  if (anyCsrf && anyCsrf.value) {
    return anyCsrf.value;
  }
  // 3) Final fallback: read from cookie "csrftoken"
  try {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    for (let c of cookies) {
      const [name, value] = c.trim().split('=');
      if (name === 'csrftoken') return decodeURIComponent(value || '');
    }
  } catch (e) {
    // no-op
  }
  return '';
}

/**
 * Validate form fields
 * @returns {boolean} Whether form is valid
 */
function validateForm() {
  const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;
  let firstError = null;
  
  requiredFields.forEach(field => {
    const settingItem = field.closest('.setting-item');
    const errorDiv = settingItem.querySelector('.form-error');
    
    if (!field.value.trim()) {
      isValid = false;
      if (errorDiv) {
        errorDiv.textContent = 'This field is required';
        errorDiv.style.display = 'block';
      }
      if (!firstError) {
        firstError = field;
      }
    } else {
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
    }
  });
  
  if (!isValid && firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstError.focus();
  }
  
  return isValid;
}

// Export functions for use in other modules
window.Utils = {
  showNotification,
  handleError,
  showLoadingState,
  debounce,
  throttle,
  getCsrfToken,
  validateForm
};

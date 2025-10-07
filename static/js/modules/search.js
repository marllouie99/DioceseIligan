/**
 * Search Module
 * @module SearchModule
 * @description Handles search functionality with debouncing and API integration
 * @version 1.0.0
 */

class SearchModule {
  constructor(config = {}) {
    this.config = {
      minQueryLength: 3,
      debounceDelay: 300,
      searchEndpoint: '/api/search/',
      ...config
    };
    
    this.isInitialized = false;
    this.searchInput = null;
    this.debouncedSearch = null;
    this.searchResults = null;
  }

  /**
   * Initialize search functionality
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        return true;
      }

      this.getElements();
      if (!this.validateElements()) {
        return false;
      }

      this.setupDebouncedSearch();
      this.bindEvents();
      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'SearchModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.searchInput = document.querySelector('.search input');
    this.searchResults = document.querySelector('.search-results');
  }

  /**
   * Validate required elements exist
   * @returns {boolean} Validation result
   * @private
   */
  validateElements() {
    if (!this.searchInput) {
      return false;
    }
    return true;
  }

  /**
   * Setup debounced search function
   * @private
   */
  setupDebouncedSearch() {
    // Use global debounce if available, otherwise create local one
    const debounceFunc = window.Utils?.debounce || this.debounce;
    this.debouncedSearch = debounceFunc((query) => {
      if (query.length >= this.config.minQueryLength) {
        this.performSearch(query);
      } else {
        this.clearResults();
      }
    }, this.config.debounceDelay);
  }

  /**
   * Bind event listeners
   * @private
   */
  bindEvents() {
    this.searchInput.addEventListener('input', (e) => {
      this.debouncedSearch(e.target.value);
    });

    // Handle search input focus
    this.searchInput.addEventListener('focus', () => {
      this.showResults();
    });

    // Handle search input blur
    this.searchInput.addEventListener('blur', (e) => {
      // Delay hiding to allow clicking on results
      setTimeout(() => {
        this.hideResults();
      }, 200);
    });

    // Handle keyboard navigation
    this.searchInput.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });
  }

  /**
   * Perform search request
   * @param {string} query - Search query
   * @private
   */
  async performSearch(query) {
    try {
      // Show loading state
      this.showLoadingState();

      // Make search request
      const response = await fetch(this.config.searchEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
        },
        body: JSON.stringify({ query })
      });

      if (response.ok) {
        const data = await response.json();
        this.displayResults(data.results || []);
      } else {
        throw new Error(`Search failed: ${response.status}`);
      }
    } catch (error) {
      this.showError('Search failed. Please try again.');
    }
  }

  /**
   * Display search results
   * @param {Array} results - Search results
   * @private
   */
  displayResults(results) {
    if (!this.searchResults) {
      this.createResultsContainer();
    }

    if (results.length === 0) {
      this.searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
    } else {
      const resultsHTML = results.map(result => this.createResultItem(result)).join('');
      this.searchResults.innerHTML = resultsHTML;
    }

    this.showResults();
  }

  /**
   * Create result item HTML
   * @param {Object} result - Search result
   * @returns {string} HTML string
   * @private
   */
  createResultItem(result) {
    const safeTitle = this.escapeHtml(result?.title || 'Untitled');
    const safeDesc = this.escapeHtml(result?.description || '');
    const urlRaw = typeof result?.url === 'string' ? result.url : '#';
    const safeUrl = (/^(https?:)?\/\//.test(urlRaw) || urlRaw.startsWith('/')) ? urlRaw : '#';
    return `
      <div class="search-result-item" data-url="${safeUrl}">
        <div class="search-result-title">${safeTitle}</div>
        <div class="search-result-description">${safeDesc}</div>
      </div>
    `;
  }

  /**
   * Create results container if it doesn't exist
   * @private
   */
  createResultsContainer() {
    this.searchResults = document.createElement('div');
    this.searchResults.className = 'search-results';
    this.searchInput.parentNode.appendChild(this.searchResults);
  }

  /**
   * Show search results
   * @private
   */
  showResults() {
    if (this.searchResults) {
      this.searchResults.style.display = 'block';
    }
  }

  /**
   * Hide search results
   * @private
   */
  hideResults() {
    if (this.searchResults) {
      this.searchResults.style.display = 'none';
    }
  }

  /**
   * Clear search results
   * @private
   */
  clearResults() {
    if (this.searchResults) {
      this.searchResults.innerHTML = '';
      this.hideResults();
    }
  }

  /**
   * Show loading state
   * @private
   */
  showLoadingState() {
    if (this.searchResults) {
      this.searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
      this.showResults();
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   * @private
   */
  showError(message) {
    if (this.searchResults) {
      this.searchResults.innerHTML = `<div class="search-error">${message}</div>`;
      this.showResults();
    }
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e - Keyboard event
   * @private
   */
  handleKeyboardNavigation(e) {
    if (!this.searchResults || this.searchResults.style.display === 'none') {
      return;
    }

    const items = this.searchResults.querySelectorAll('.search-result-item');
    if (items.length === 0) return;

    // Handle arrow keys for navigation
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      // Implementation for keyboard navigation
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const activeItem = this.searchResults.querySelector('.search-result-item.active');
      if (activeItem) {
        const url = activeItem.dataset.url;
        if (url && url !== '#') {
          window.location.href = url;
        }
      }
    }
  }

  /**
   * Get CSRF token
   * @returns {string} CSRF token
   * @private
   */
  getCSRFToken() {
    if (window.Utils?.getCSRFToken) {
      return window.Utils.getCSRFToken();
    }
    
    const tokenEl = document.querySelector('[name=csrfmiddlewaretoken]');
    return tokenEl ? tokenEl.value : '';
  }

  /**
   * Debounce function (fallback)
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} Debounced function
   * @private
   */
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Escape HTML to prevent XSS when injecting strings via innerHTML
   * @param {string} text
   * @returns {string}
   * @private
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  /**
   * Set search endpoint
   * @param {string} endpoint - Search endpoint URL
   */
  setSearchEndpoint(endpoint) {
    this.config.searchEndpoint = endpoint;
  }

  /**
   * Set minimum query length
   * @param {number} length - Minimum query length
   */
  setMinQueryLength(length) {
    this.config.minQueryLength = length;
  }

  /**
   * Cleanup search module
   */
  destroy() {
    this.searchInput = null;
    this.searchResults = null;
    this.debouncedSearch = null;
    this.isInitialized = false;
  }
}

// Export for use in main application
window.SearchModule = SearchModule;

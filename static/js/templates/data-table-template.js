/**
 * Data Table Module Template
 * @module DataTableModuleName
 * @description Template for data table modules with sorting, filtering, and pagination
 * @version 1.0.0
 * @author Your Name
 */

class DataTableModuleName {
  constructor(config = {}) {
    this.config = {
      dataEndpoint: '/api/data/',
      pageSize: 10,
      sortable: true,
      filterable: true,
      pagination: true,
      searchable: true,
      ...config
    };
    
    this.isInitialized = false;
    this.tables = new Map();
    this.currentData = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.filters = {};
    this.searchQuery = '';
  }

  /**
   * Initialize the data table module
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        console.warn('DataTableModuleName already initialized');
        return true;
      }

      this.bindEvents();
      this.isInitialized = true;
      console.log('DataTableModuleName initialized successfully');
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'DataTableModuleName Initialization');
      return false;
    }
  }

  /**
   * Bind global events
   * @private
   */
  bindEvents() {
    // Handle table initialization
    document.addEventListener('DOMContentLoaded', () => {
      this.initializeTables();
    });

    // Handle sorting
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-sort]')) {
        e.preventDefault();
        const table = e.target.closest('[data-table]');
        const column = e.target.dataset.sort;
        this.sort(table, column);
      }
    });

    // Handle filtering
    document.addEventListener('input', (e) => {
      if (e.target.matches('[data-filter]')) {
        const table = e.target.closest('[data-table]');
        const column = e.target.dataset.filter;
        const value = e.target.value;
        this.filter(table, column, value);
      }
    });

    // Handle search
    document.addEventListener('input', (e) => {
      if (e.target.matches('[data-table-search]')) {
        const table = e.target.closest('[data-table]');
        const query = e.target.value;
        this.search(table, query);
      }
    });

    // Handle pagination
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-page]')) {
        e.preventDefault();
        const table = e.target.closest('[data-table]');
        const page = parseInt(e.target.dataset.page);
        this.goToPage(table, page);
      }
    });
  }

  /**
   * Initialize all tables
   * @private
   */
  initializeTables() {
    const tables = document.querySelectorAll('[data-table]');
    tables.forEach(table => this.initializeTable(table));
  }

  /**
   * Initialize individual table
   * @param {HTMLElement} table - Table element
   * @private
   */
  initializeTable(table) {
    const tableId = table.id || `table-${Date.now()}`;
    table.id = tableId;
    
    this.tables.set(table, {
      id: tableId,
      data: [],
      filteredData: [],
      currentPage: 1,
      totalPages: 1,
      sortColumn: null,
      sortDirection: 'asc',
      filters: {},
      searchQuery: ''
    });

    this.loadData(table);
  }

  /**
   * Load table data
   * @param {HTMLElement} table - Table element
   * @private
   */
  async loadData(table) {
    try {
      const tableConfig = this.tables.get(table);
      const response = await this.fetchData(table);
      
      tableConfig.data = response.data || [];
      tableConfig.filteredData = [...tableConfig.data];
      
      this.renderTable(table);
      this.renderPagination(table);
    } catch (error) {
      window.Utils?.handleError(error, 'Data Table Load');
      this.showError(table, 'Failed to load data');
    }
  }

  /**
   * Fetch data from server
   * @param {HTMLElement} table - Table element
   * @returns {Promise} Data response
   * @private
   */
  async fetchData(table) {
    const tableConfig = this.tables.get(table);
    const params = new URLSearchParams({
      page: tableConfig.currentPage,
      pageSize: this.config.pageSize,
      search: tableConfig.searchQuery,
      sort: tableConfig.sortColumn,
      direction: tableConfig.sortDirection,
      ...tableConfig.filters
    });

    const response = await fetch(`${this.config.dataEndpoint}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Render table
   * @param {HTMLElement} table - Table element
   * @private
   */
  renderTable(table) {
    const tableConfig = this.tables.get(table);
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (tableConfig.filteredData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
      return;
    }

    tableConfig.filteredData.forEach(row => {
      const tr = this.createTableRow(row, table);
      tbody.appendChild(tr);
    });
  }

  /**
   * Create table row
   * @param {Object} row - Row data
   * @param {HTMLElement} table - Table element
   * @returns {HTMLElement} Table row element
   * @private
   */
  createTableRow(row, table) {
    const tr = document.createElement('tr');
    tr.dataset.rowId = row.id;
    
    const columns = table.querySelectorAll('thead th[data-column]');
    columns.forEach(th => {
      const column = th.dataset.column;
      const td = document.createElement('td');
      
      if (row[column] !== undefined) {
        td.textContent = row[column];
      } else {
        td.innerHTML = this.renderCellContent(row, column, th);
      }
      
      tr.appendChild(td);
    });
    
    return tr;
  }

  /**
   * Render cell content
   * @param {Object} row - Row data
   * @param {string} column - Column name
   * @param {HTMLElement} th - Table header
   * @returns {string} HTML content
   * @private
   */
  renderCellContent(row, column, th) {
    const cellType = th.dataset.cellType || 'text';
    
    switch (cellType) {
      case 'date':
        return this.formatDate(row[column]);
      case 'currency':
        return this.formatCurrency(row[column]);
      case 'boolean':
        return row[column] ? 'Yes' : 'No';
      case 'actions':
        return this.renderActions(row, th);
      default:
        return row[column] || '';
    }
  }

  /**
   * Render action buttons
   * @param {Object} row - Row data
   * @param {HTMLElement} th - Table header
   * @returns {string} HTML content
   * @private
   */
  renderActions(row, th) {
    const actions = th.dataset.actions ? JSON.parse(th.dataset.actions) : [];
    return actions.map(action => {
      const url = action.url.replace(':id', row.id);
      return `<a href="${url}" class="btn btn-sm btn-${action.class || 'primary'}">${action.label}</a>`;
    }).join(' ');
  }

  /**
   * Format date
   * @param {string} date - Date string
   * @returns {string} Formatted date
   * @private
   */
  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  /**
   * Format currency
   * @param {number} amount - Amount
   * @returns {string} Formatted currency
   * @private
   */
  formatCurrency(amount) {
    if (amount === null || amount === undefined) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Sort table
   * @param {HTMLElement} table - Table element
   * @param {string} column - Column to sort
   */
  sort(table, column) {
    const tableConfig = this.tables.get(table);
    
    if (tableConfig.sortColumn === column) {
      tableConfig.sortDirection = tableConfig.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      tableConfig.sortColumn = column;
      tableConfig.sortDirection = 'asc';
    }
    
    this.sortData(table);
    this.renderTable(table);
    this.updateSortHeaders(table);
  }

  /**
   * Sort data
   * @param {HTMLElement} table - Table element
   * @private
   */
  sortData(table) {
    const tableConfig = this.tables.get(table);
    
    tableConfig.filteredData.sort((a, b) => {
      const aVal = a[tableConfig.sortColumn];
      const bVal = b[tableConfig.sortColumn];
      
      if (aVal < bVal) return tableConfig.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return tableConfig.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Update sort headers
   * @param {HTMLElement} table - Table element
   * @private
   */
  updateSortHeaders(table) {
    const tableConfig = this.tables.get(table);
    const headers = table.querySelectorAll('th[data-sort]');
    
    headers.forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      
      if (th.dataset.sort === tableConfig.sortColumn) {
        th.classList.add(`sort-${tableConfig.sortDirection}`);
      }
    });
  }

  /**
   * Filter table
   * @param {HTMLElement} table - Table element
   * @param {string} column - Column to filter
   * @param {string} value - Filter value
   */
  filter(table, column, value) {
    const tableConfig = this.tables.get(table);
    
    if (value) {
      tableConfig.filters[column] = value;
    } else {
      delete tableConfig.filters[column];
    }
    
    this.applyFilters(table);
    this.renderTable(table);
  }

  /**
   * Apply filters
   * @param {HTMLElement} table - Table element
   * @private
   */
  applyFilters(table) {
    const tableConfig = this.tables.get(table);
    
    tableConfig.filteredData = tableConfig.data.filter(row => {
      return Object.entries(tableConfig.filters).every(([column, value]) => {
        return row[column] && row[column].toString().toLowerCase().includes(value.toLowerCase());
      });
    });
  }

  /**
   * Search table
   * @param {HTMLElement} table - Table element
   * @param {string} query - Search query
   */
  search(table, query) {
    const tableConfig = this.tables.get(table);
    tableConfig.searchQuery = query;
    
    this.applySearch(table);
    this.renderTable(table);
  }

  /**
   * Apply search
   * @param {HTMLElement} table - Table element
   * @private
   */
  applySearch(table) {
    const tableConfig = this.tables.get(table);
    
    if (!tableConfig.searchQuery) {
      tableConfig.filteredData = [...tableConfig.data];
      return;
    }
    
    const query = tableConfig.searchQuery.toLowerCase();
    tableConfig.filteredData = tableConfig.data.filter(row => {
      return Object.values(row).some(value => 
        value && value.toString().toLowerCase().includes(query)
      );
    });
  }

  /**
   * Go to page
   * @param {HTMLElement} table - Table element
   * @param {number} page - Page number
   */
  goToPage(table, page) {
    const tableConfig = this.tables.get(table);
    tableConfig.currentPage = page;
    
    this.renderTable(table);
    this.renderPagination(table);
  }

  /**
   * Render pagination
   * @param {HTMLElement} table - Table element
   * @private
   */
  renderPagination(table) {
    const tableConfig = this.tables.get(table);
    const pagination = table.querySelector('.pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(tableConfig.filteredData.length / this.config.pageSize);
    tableConfig.totalPages = totalPages;
    
    pagination.innerHTML = '';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = tableConfig.currentPage === 1;
    prevBtn.addEventListener('click', () => this.goToPage(table, tableConfig.currentPage - 1));
    pagination.appendChild(prevBtn);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === tableConfig.currentPage ? 'active' : '';
      pageBtn.addEventListener('click', () => this.goToPage(table, i));
      pagination.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = tableConfig.currentPage === totalPages;
    nextBtn.addEventListener('click', () => this.goToPage(table, tableConfig.currentPage + 1));
    pagination.appendChild(nextBtn);
  }

  /**
   * Show error message
   * @param {HTMLElement} table - Table element
   * @param {string} message - Error message
   * @private
   */
  showError(table, message) {
    const tbody = table.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="100%" class="text-center text-error">${message}</td></tr>`;
    }
  }

  /**
   * Refresh table data
   * @param {HTMLElement} table - Table element
   */
  refresh(table) {
    this.loadData(table);
  }

  /**
   * Cleanup data table module
   */
  destroy() {
    this.tables.clear();
    this.currentData = [];
    this.isInitialized = false;
  }
}

// Export for use in main application
window.DataTableModuleName = DataTableModuleName;

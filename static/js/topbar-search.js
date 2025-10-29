/**
 * Topbar Global Search Module
 * Handles search input, API calls, and dropdown results display
 */

(function() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const searchDropdown = document.getElementById('search-dropdown');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchDropdown || !searchResults) {
        return; // Elements not found, exit
    }
    
    let searchTimeout = null;
    let currentQuery = '';
    
    // Search input handler
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        currentQuery = query;
        
        // Show/hide clear button
        if (query.length > 0) {
            searchClear.style.display = 'block';
        } else {
            searchClear.style.display = 'none';
            hideDropdown();
            return;
        }
        
        // Debounce search
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            hideDropdown();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    // Clear button handler
    searchClear.addEventListener('click', function() {
        searchInput.value = '';
        searchClear.style.display = 'none';
        hideDropdown();
        searchInput.focus();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!document.getElementById('search-container').contains(e.target)) {
            hideDropdown();
        }
    });
    
    // Perform search via API
    function performSearch(query) {
        fetch(`/app/api/search/?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayResults(data.churches, data.posts);
                }
            })
            .catch(error => {
                console.error('Search error:', error);
                showError();
            });
    }
    
    // Display search results
    function displayResults(churches, posts) {
        searchResults.innerHTML = '';
        
        const hasChurches = churches && churches.length > 0;
        const hasPosts = posts && posts.length > 0;
        
        if (!hasChurches && !hasPosts) {
            showNoResults();
            return;
        }
        
        // Display churches
        if (hasChurches) {
            const churchSection = document.createElement('div');
            churchSection.className = 'search-section';
            churchSection.innerHTML = '<div class="search-section-title">Parishes</div>';
            
            churches.forEach(church => {
                const item = createChurchItem(church);
                churchSection.appendChild(item);
            });
            
            searchResults.appendChild(churchSection);
        }
        
        // Display posts
        if (hasPosts) {
            const postSection = document.createElement('div');
            postSection.className = 'search-section';
            postSection.innerHTML = '<div class="search-section-title">Posts</div>';
            
            posts.forEach(post => {
                const item = createPostItem(post);
                postSection.appendChild(item);
            });
            
            searchResults.appendChild(postSection);
        }
        
        showDropdown();
    }
    
    // Create church result item
    function createChurchItem(church) {
        const item = document.createElement('a');
        item.href = church.url;
        item.className = 'search-result-item';
        
        const logoHtml = church.logo_url 
            ? `<img src="${church.logo_url}" alt="${church.name}" class="search-result-icon">`
            : `<div class="search-result-icon-placeholder">${church.name.charAt(0).toUpperCase()}</div>`;
        
        item.innerHTML = `
            ${logoHtml}
            <div class="search-result-content">
                <div class="search-result-title">${escapeHtml(church.name)}</div>
                ${church.address ? `<div class="search-result-subtitle">${escapeHtml(church.address)}</div>` : ''}
            </div>
            <svg class="search-result-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polyline points="9 18 15 12 9 6"/>
            </svg>
        `;
        
        return item;
    }
    
    // Create post result item
    function createPostItem(post) {
        const item = document.createElement('a');
        item.href = post.url;
        item.className = 'search-result-item';
        
        item.innerHTML = `
            <div class="search-result-icon-post">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
            </div>
            <div class="search-result-content">
                <div class="search-result-title">${escapeHtml(post.content)}</div>
                <div class="search-result-subtitle">${escapeHtml(post.church_name)}</div>
            </div>
            <svg class="search-result-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polyline points="9 18 15 12 9 6"/>
            </svg>
        `;
        
        return item;
    }
    
    // Show no results message
    function showNoResults() {
        searchResults.innerHTML = `
            <div class="search-no-results">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                </svg>
                <div class="search-no-results-text">No results found</div>
                <div class="search-no-results-hint">Try searching for a different parish or post</div>
            </div>
        `;
        showDropdown();
    }
    
    // Show error message
    function showError() {
        searchResults.innerHTML = `
            <div class="search-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div class="search-error-text">Something went wrong</div>
                <div class="search-error-hint">Please try again later</div>
            </div>
        `;
        showDropdown();
    }
    
    // Show dropdown
    function showDropdown() {
        searchDropdown.style.display = 'block';
    }
    
    // Hide dropdown
    function hideDropdown() {
        searchDropdown.style.display = 'none';
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();

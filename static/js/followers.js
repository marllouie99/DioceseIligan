/**
 * Followers Management JavaScript
 * Handles search, filtering, and interaction features for the followers tab
 */

class FollowersManager {
    constructor() {
        this.followers = [];
        this.filteredFollowers = [];
        this.currentSort = 'recent';
        this.currentTimeFilter = 'all';
        this.currentQuery = '';
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadFollowers();
    }

    cacheElements() {
        this.searchInput = document.getElementById('followerSearch');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.sortSelect = document.getElementById('sortFollowers');
        this.timeSelect = document.getElementById('timeFilter');
        this.resetBtn = document.getElementById('resetFilters');
        this.followersList = document.getElementById('followersList');
        this.noResults = document.getElementById('noResults');
        this.followersCount = document.getElementById('followersCount');
        this.followersLabel = document.getElementById('followersLabel');
        this.searchQuery = document.getElementById('searchQuery');
        this.modal = document.getElementById('followerActivityModal');
    }

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.handleSearch.bind(this));
            this.searchInput.addEventListener('keyup', this.handleSearchKeyup.bind(this));
        }
        
        if (this.clearSearchBtn) {
            this.clearSearchBtn.addEventListener('click', this.clearSearch.bind(this));
        }
        
        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', this.handleSortChange.bind(this));
        }
        
        if (this.timeSelect) {
            this.timeSelect.addEventListener('change', this.handleTimeFilterChange.bind(this));
        }
        
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', this.resetFilters.bind(this));
        }

        // Close modal when clicking outside
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeFollowerActivity();
                }
            });
        }

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.classList.contains('active')) {
                this.closeFollowerActivity();
            }
        });
    }

    loadFollowers() {
        // Get all follower items from the DOM
        const followerElements = document.querySelectorAll('.follower-item');
        
        this.followers = Array.from(followerElements).map(el => ({
            element: el,
            name: el.dataset.name || '',
            email: el.dataset.email || '',
            joined: el.dataset.joined || '',
            userId: el.dataset.userId || ''
        }));
        
        this.filteredFollowers = [...this.followers];
        this.updateDisplay();
    }

    handleSearch() {
        this.currentQuery = this.searchInput.value.toLowerCase().trim();
        
        if (this.currentQuery.length > 0) {
            this.clearSearchBtn.style.display = 'flex';
            this.searchQuery.textContent = `for "${this.currentQuery}"`;
            this.searchQuery.style.display = 'inline';
        } else {
            this.clearSearchBtn.style.display = 'none';
            this.searchQuery.style.display = 'none';
        }
        
        this.applyFilters();
    }

    handleSearchKeyup(e) {
        if (e.key === 'Enter') {
            this.searchInput.blur();
        }
    }

    clearSearch() {
        this.searchInput.value = '';
        this.currentQuery = '';
        this.clearSearchBtn.style.display = 'none';
        this.searchQuery.style.display = 'none';
        this.applyFilters();
    }

    handleSortChange() {
        this.currentSort = this.sortSelect.value;
        console.log('Sort changed to:', this.currentSort);
        this.applyFilters();
    }

    handleTimeFilterChange() {
        this.currentTimeFilter = this.timeSelect.value;
        this.applyFilters();
    }

    resetFilters() {
        this.searchInput.value = '';
        this.currentQuery = '';
        this.currentSort = 'recent';
        this.currentTimeFilter = 'all';
        
        this.sortSelect.value = 'recent';
        this.timeSelect.value = 'all';
        this.clearSearchBtn.style.display = 'none';
        this.searchQuery.style.display = 'none';
        
        this.applyFilters();
    }

    applyFilters() {
        let filtered = [...this.followers];

        // Apply search filter
        if (this.currentQuery) {
            filtered = filtered.filter(follower => 
                follower.name.includes(this.currentQuery) ||
                follower.email.includes(this.currentQuery)
            );
        }

        // Apply time filter
        if (this.currentTimeFilter !== 'all') {
            const now = new Date();
            const cutoffDate = new Date();
            
            switch (this.currentTimeFilter) {
                case 'week':
                    cutoffDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    cutoffDate.setMonth(now.getMonth() - 1);
                    break;
                case 'quarter':
                    cutoffDate.setMonth(now.getMonth() - 3);
                    break;
            }
            
            filtered = filtered.filter(follower => {
                const joinedDate = new Date(follower.joined);
                return joinedDate >= cutoffDate;
            });
        }

        // Apply sorting
        this.sortFollowers(filtered);
        
        this.filteredFollowers = filtered;
        this.updateDisplay();
    }

    sortFollowers(followers) {
        console.log('Sorting with currentSort:', this.currentSort);
        console.log('Followers before sort:', followers.map(f => ({name: f.name, joined: f.joined})));
        
        followers.sort((a, b) => {
            switch (this.currentSort) {
                case 'name':
                    const nameResult = a.name.localeCompare(b.name);
                    console.log(`Comparing "${a.name}" vs "${b.name}" = ${nameResult}`);
                    return nameResult;
                case 'name-desc':
                    const nameDescResult = b.name.localeCompare(a.name);
                    console.log(`Comparing "${b.name}" vs "${a.name}" (desc) = ${nameDescResult}`);
                    return nameDescResult;
                case 'oldest':
                    return new Date(a.joined) - new Date(b.joined);
                case 'recent':
                default:
                    return new Date(b.joined) - new Date(a.joined);
            }
        });
        
        console.log('Followers after sort:', followers.map(f => ({name: f.name, joined: f.joined})));
    }

    updateDisplay() {
        console.log('Updating display with filtered followers:', this.filteredFollowers.map(f => f.name));
        
        // Hide all follower elements first
        this.followers.forEach(follower => {
            follower.element.style.display = 'none';
        });

        // Show filtered followers and reorder them in the DOM
        if (this.filteredFollowers.length > 0) {
            // Remove all follower elements from the DOM temporarily
            this.filteredFollowers.forEach(follower => {
                follower.element.remove();
            });
            
            // Re-append them in the correct sorted order
            this.filteredFollowers.forEach(follower => {
                follower.element.style.display = 'flex';
                this.followersList.appendChild(follower.element);
            });
            
            if (this.followersList) {
                this.followersList.style.display = 'block';
            }
            if (this.noResults) {
                this.noResults.style.display = 'none';
            }
        } else {
            if (this.followersList) {
                this.followersList.style.display = 'none';
            }
            if (this.noResults) {
                this.noResults.style.display = 'block';
            }
        }

        // Update count
        if (this.followersCount) {
            this.followersCount.textContent = this.filteredFollowers.length;
        }
        if (this.followersLabel) {
            this.followersLabel.textContent = this.filteredFollowers.length === 1 ? 'follower found' : 'followers found';
        }
        
        console.log('Display update complete - DOM reordered');
    }

    // Activity Modal Functions
    viewFollowerActivity(userId, userName) {
        this.currentUserId = userId; // Store current user ID
        document.getElementById('followerActivityTitle').textContent = `${userName}'s Activity`;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Reset to first tab
        this.switchActivityTab('interactions');
        
        // Load activity data
        this.loadFollowerActivity(userId, 'interactions');
        
        // Load follower stats
        this.loadFollowerStats(userId);
    }

    closeFollowerActivity() {
        const modal = document.getElementById('followerActivityModal');
        if (modal) {
            modal.style.display = 'none';
        }
        document.body.style.overflow = '';
        
        // Clear all activity data
        const panels = ['interactions', 'appointments', 'reviews', 'timeline'];
        panels.forEach(panel => {
            const list = document.getElementById(`${panel}List`);
            if (list) {
                list.innerHTML = '';
                list.style.display = 'none';
            }
            
            const loading = document.querySelector(`#${panel}-tab .activity-loading`);
            if (loading) {
                loading.style.display = 'flex';
            }
        });
    }

    switchActivityTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.activity-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.activity-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    async loadFollowerActivity(userId, type) {
        const loadingEl = document.querySelector(`#${type}-tab .activity-loading`);
        const listEl = document.getElementById(`${type}List`);
        
        loadingEl.style.display = 'flex';
        listEl.style.display = 'none';
        
        try {
            // Get CSRF token for Django
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const apiUrl = `/app/api/followers/${userId}/activity/${type}/`;
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.renderActivityData(type, data.activities);
            } else {
                this.renderActivityError(type, data.error || 'Failed to load activity data.');
            }
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
            this.renderActivityError(type, `Error: ${error.message}`);
        }
        
        loadingEl.style.display = 'none';
        listEl.style.display = 'block';
    }

    async loadFollowerStats(userId) {
        try {
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch(`/app/api/followers/${userId}/stats/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateFollowerStatsInDOM(userId, data.stats);
            }
        } catch (error) {
            console.error('Error loading follower stats:', error);
        }
    }

    updateFollowerStatsInDOM(userId, stats) {
        // Update the follower item in the list with fresh stats
        const followerItem = document.querySelector(`.follower-item[data-user-id="${userId}"]`);
        if (followerItem) {
            const interactionBadge = followerItem.querySelector('.stat-badge:first-child span');
            const appointmentBadge = followerItem.querySelector('.stat-badge:last-child span');
            
            if (interactionBadge) {
                interactionBadge.textContent = stats.interactions_count;
            }
            if (appointmentBadge) {
                appointmentBadge.textContent = stats.appointments_count;
            }
        }
    }

    renderActivityData(type, activities) {
        const listEl = document.getElementById(`${type}List`);
        
        if (!activities || activities.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <i data-feather="${this.getActivityIcon(type)}" class="empty-icon"></i>
                    <h4>No ${type} found</h4>
                    <p>This follower hasn't ${this.getActivityDescription(type)} yet.</p>
                </div>
            `;
            // Replace feather icons if library is available
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
            return;
        }

        const html = activities.map(activity => this.renderActivityItem(type, activity)).join('');
        listEl.innerHTML = html;
        
        // Replace feather icons if library is available
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    renderActivityError(type, message) {
        const listEl = document.getElementById(`${type}List`);
        listEl.innerHTML = `
            <div class="empty-state">
                <i data-feather="alert-circle" class="empty-icon" style="color: #ef4444;"></i>
                <h4>Error Loading Data</h4>
                <p>${message}</p>
                <button onclick="followersManager.loadFollowerActivity('${this.currentUserId}', '${type}')" class="btn btn-outline btn-sm">
                    <i data-feather="refresh-cw"></i>
                    Try Again
                </button>
            </div>
        `;
        // Replace feather icons if library is available
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    renderActivityItem(type, activity) {
        const iconClass = this.getActivityIconClass(type);
        const icon = this.getActivityIcon(type);
        
        // Handle grouped interactions with enhanced display
        if (activity.status === 'grouped_interaction' && activity.details) {
            const details = activity.details;
            const badges = [];
            
            if (details.likes > 0) {
                badges.push(`<span class="activity-badge likes">❤️ ${details.likes}</span>`);
            }
            if (details.comments > 0) {
                badges.push(`<span class="activity-badge comments">💬 ${details.comments}</span>`);
            }
            if (details.bookmarks > 0) {
                badges.push(`<span class="activity-badge bookmarks">🔖 ${details.bookmarks}</span>`);
            }
            if (details.shares > 0) {
                badges.push(`<span class="activity-badge shares">📤 ${details.shares}</span>`);
            }
            
            return `
                <div class="activity-item grouped">
                    <div class="activity-icon ${iconClass}">
                        <i data-feather="${icon}"></i>
                    </div>
                    <div class="activity-details">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-badges">
                            ${badges.join('')}
                        </div>
                        <div class="activity-meta">
                            <span>${activity.date}</span>
                            <span>Post #${activity.post_id}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Regular activity display
        return `
            <div class="activity-item">
                <div class="activity-icon ${iconClass}">
                    <i data-feather="${icon}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-meta">
                        <span>${activity.date}</span>
                        ${activity.status ? `<span>Type: ${activity.status}</span>` : ''}
                        ${activity.rating ? `<span>Rating: ${'★'.repeat(activity.rating)}${'☆'.repeat(5-activity.rating)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getActivityIcon(type) {
        const icons = {
            interactions: 'heart',
            appointments: 'calendar',
            reviews: 'star',
            timeline: 'clock'
        };
        return icons[type] || 'activity';
    }

    getActivityIconClass(type) {
        const classes = {
            interactions: 'interaction',
            appointments: 'appointment',
            reviews: 'review',
            timeline: 'interaction'
        };
        return classes[type] || 'interaction';
    }

    getActivityDescription(type) {
        const descriptions = {
            interactions: 'interacted with your church',
            appointments: 'booked any appointments',
            reviews: 'left any reviews',
            timeline: 'any activity'
        };
        return descriptions[type] || 'any activity';
    }

    viewFollowerProfile(userId) {
        console.log('FollowersManager.viewFollowerProfile called with userId:', userId);
        
        if (!userId) {
            console.error('No userId provided');
            return;
        }
        
        // Get follower name from the table row
        const row = document.querySelector(`tr[data-user-id="${userId}"]`);
        const followerName = row ? row.querySelector('.name').textContent : 'Follower';
        
        // Update modal title
        const titleElement = document.getElementById('followerActivityTitle');
        if (titleElement) {
            titleElement.textContent = `${followerName}'s Activity`;
        }
        
        // Show modal
        const modal = document.getElementById('followerActivityModal');
        
        if (!modal) {
            console.error('Modal not found!');
            return;
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Reset to first tab
        document.querySelectorAll('.activity-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.activity-panel').forEach(panel => panel.classList.remove('active'));
        
        const firstTab = document.querySelector('.activity-tab[data-tab="interactions"]');
        const firstPanel = document.getElementById('interactions-tab');
        
        if (firstTab) firstTab.classList.add('active');
        if (firstPanel) firstPanel.classList.add('active');
        
        // Load interactions data
        this.loadFollowerInteractions(userId);
        
        // Setup tab switching
        this.setupActivityTabs(userId);
    }
    
    setupActivityTabs(userId) {
        const tabs = document.querySelectorAll('.activity-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                const tabName = tab.getAttribute('data-tab');
                
                // Update active states
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.activity-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                document.getElementById(`${tabName}-tab`).classList.add('active');
                
                // Load data for the selected tab
                switch(tabName) {
                    case 'interactions':
                        this.loadFollowerInteractions(userId);
                        break;
                    case 'appointments':
                        this.loadFollowerAppointments(userId);
                        break;
                    case 'reviews':
                        this.loadFollowerReviews(userId);
                        break;
                    case 'timeline':
                        this.loadFollowerTimeline(userId);
                        break;
                }
            };
        });
    }
    
    async loadFollowerInteractions(userId) {
        const container = document.getElementById('interactionsList');
        const loading = document.querySelector('#interactions-tab .activity-loading');
        
        loading.style.display = 'flex';
        container.style.display = 'none';
        
        try {
            const response = await fetch(`/app/api/followers/${userId}/activity/interactions/`);
            const result = await response.json();
            
            if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
                container.innerHTML = result.data.map(item => `
                    <div class="activity-item">
                        <div class="activity-icon ${item.type || 'interaction'}">
                            <i data-feather="${this.getActivityIcon(item.type || 'interaction')}"></i>
                        </div>
                        <div class="activity-details">
                            <p class="activity-text"><strong>${item.title || 'Activity'}</strong></p>
                            <p class="activity-subtext">${item.description}</p>
                            <span class="activity-time">${item.date}</span>
                        </div>
                    </div>
                `).join('');
                
                // Re-initialize feather icons
                if (typeof feather !== 'undefined') feather.replace();
            } else {
                container.innerHTML = '<div class="empty-activity"><p>No interactions yet</p></div>';
            }
            
            loading.style.display = 'none';
            container.style.display = 'block';
        } catch (error) {
            console.error('Error loading interactions:', error);
            container.innerHTML = '<div class="empty-activity"><p>Failed to load interactions</p></div>';
            loading.style.display = 'none';
            container.style.display = 'block';
        }
    }
    
    async loadFollowerAppointments(userId) {
        const container = document.getElementById('appointmentsList');
        const loading = document.querySelector('#appointments-tab .activity-loading');
        
        loading.style.display = 'flex';
        container.style.display = 'none';
        
        try {
            const response = await fetch(`/app/api/followers/${userId}/activity/appointments/`);
            const result = await response.json();
            
            if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
                container.innerHTML = result.data.map(item => `
                    <div class="activity-item">
                        <div class="activity-icon appointment">
                            <i data-feather="calendar"></i>
                        </div>
                        <div class="activity-details">
                            <p class="activity-text"><strong>${item.title || 'Appointment'}</strong></p>
                            <p class="activity-subtext">${item.description}</p>
                            <span class="activity-time">${item.date}</span>
                            <span class="status-badge status-${(item.status || '').toLowerCase().replace(' ', '-')}">${item.status}</span>
                        </div>
                    </div>
                `).join('');
                
                if (typeof feather !== 'undefined') feather.replace();
            } else {
                container.innerHTML = '<div class="empty-activity"><p>No appointments yet</p></div>';
            }
            
            loading.style.display = 'none';
            container.style.display = 'block';
        } catch (error) {
            console.error('Error loading appointments:', error);
            container.innerHTML = '<div class="empty-activity"><p>Failed to load appointments</p></div>';
            loading.style.display = 'none';
            container.style.display = 'block';
        }
    }
    
    async loadFollowerReviews(userId) {
        const container = document.getElementById('reviewsList');
        const loading = document.querySelector('#reviews-tab .activity-loading');
        
        loading.style.display = 'flex';
        container.style.display = 'none';
        
        try {
            const response = await fetch(`/app/api/followers/${userId}/activity/reviews/`);
            const result = await response.json();
            
            if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
                container.innerHTML = result.data.map(item => `
                    <div class="activity-item">
                        <div class="activity-icon review">
                            <i data-feather="star"></i>
                        </div>
                        <div class="activity-details">
                            <div class="review-rating">${'★'.repeat(item.rating || 0)}${'☆'.repeat(5-(item.rating || 0))}</div>
                            <p class="activity-text"><strong>${item.title || 'Review'}</strong></p>
                            <p class="activity-subtext">${item.description}</p>
                            <span class="activity-time">${item.date}</span>
                        </div>
                    </div>
                `).join('');
                
                if (typeof feather !== 'undefined') feather.replace();
            } else {
                container.innerHTML = '<div class="empty-activity"><p>No reviews yet</p></div>';
            }
            
            loading.style.display = 'none';
            container.style.display = 'block';
        } catch (error) {
            console.error('Error loading reviews:', error);
            container.innerHTML = '<div class="empty-activity"><p>Failed to load reviews</p></div>';
            loading.style.display = 'none';
            container.style.display = 'block';
        }
    }
    
    async loadFollowerTimeline(userId) {
        const container = document.getElementById('timelineList');
        const loading = document.querySelector('#timeline-tab .activity-loading');
        
        loading.style.display = 'flex';
        container.style.display = 'none';
        
        try {
            const response = await fetch(`/app/api/followers/${userId}/activity/timeline/`);
            const result = await response.json();
            
            if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
                container.innerHTML = result.data.map(item => `
                    <div class="activity-item timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="activity-details">
                            <p class="activity-text"><strong>${item.title || 'Activity'}</strong></p>
                            <p class="activity-subtext">${item.description}</p>
                            <span class="activity-time">${item.date}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div class="empty-activity"><p>No activity yet</p></div>';
            }
            
            loading.style.display = 'none';
            container.style.display = 'block';
        } catch (error) {
            console.error('Error loading timeline:', error);
            container.innerHTML = '<div class="empty-activity"><p>Failed to load timeline</p></div>';
            loading.style.display = 'none';
            container.style.display = 'block';
        }
    }
    
    getActivityIcon(type) {
        const icons = {
            'like': 'heart',
            'comment': 'message-circle',
            'bookmark': 'bookmark',
            'view': 'eye',
            'share': 'share-2'
        };
        return icons[type] || 'activity';
    }
}

// Global functions for template onclick handlers
function viewFollowerActivity(userId, userName) {
    if (window.followersManager) {
        window.followersManager.viewFollowerActivity(userId, userName);
    }
}

function closeFollowerActivity() {
    if (window.followersManager) {
        window.followersManager.closeFollowerActivity();
    }
}

function viewFollowerProfile(userId) {
    if (window.followersManager) {
        window.followersManager.viewFollowerProfile(userId);
    }
}

// Activity tab switching
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('activity-tab')) {
        const tabName = e.target.dataset.tab;
        if (window.followersManager) {
            window.followersManager.switchActivityTab(tabName);
            
            // Load data for the tab if not already loaded
            const panel = document.getElementById(`${tabName}-tab`);
            const list = document.getElementById(`${tabName}List`);
            if (list && list.innerHTML === '') {
                // Extract userId from modal title or store it when opening
                const userId = window.followersManager.currentUserId;
                if (userId) {
                    window.followersManager.loadFollowerActivity(userId, tabName);
                }
            }
        }
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const followersTab = document.getElementById('followers');
    if (followersTab) {
        window.followersManager = new FollowersManager();
    }
});

// Also initialize when the followers tab becomes visible
document.addEventListener('click', (e) => {
    if (e.target.matches('[data-tab="followers"]')) {
        setTimeout(() => {
            if (!window.followersManager) {
                window.followersManager = new FollowersManager();
            }
        }, 100);
    }
});

// Promote Dropdown Functions
function togglePromoteDropdown(event, userId) {
    event.stopPropagation();
    
    // Close all other dropdowns
    document.querySelectorAll('.promote-dropdown').forEach(dropdown => {
        if (dropdown.id !== `promoteDropdown${userId}`) {
            dropdown.style.display = 'none';
        }
    });
    
    // Toggle current dropdown
    const dropdown = document.getElementById(`promoteDropdown${userId}`);
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-wrapper')) {
        document.querySelectorAll('.promote-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
});

// Promote follower to admin role
async function promoteFollower(userId, role) {
    const roleName = role === 'secretary' ? 'Parish Secretary/Coordinator' : 'Ministry Leader/Volunteer';
    
    if (!confirm(`Are you sure you want to promote this follower to ${roleName}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/app/manage-church/${CURRENT_CHURCH_ID}/add-staff/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                user_id: userId,
                role: role
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Successfully promoted to ${roleName}!`);
            // Close dropdown
            document.querySelectorAll('.promote-dropdown').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
            // Optionally reload or update the UI
            location.reload();
        } else {
            alert(data.message || 'Failed to promote follower');
        }
    } catch (error) {
        console.error('Error promoting follower:', error);
        alert('An error occurred while promoting the follower');
    }
}

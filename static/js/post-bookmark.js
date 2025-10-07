/**
 * Post Bookmark Functionality
 * Handles saving/unsaving posts via AJAX
 */

class PostBookmarkHandler {
    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        // Handle bookmark button clicks in post actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.bookmark-action[data-action="bookmark"]')) {
                e.preventDefault();
                e.stopPropagation();
                const bookmarkBtn = e.target.closest('.bookmark-action');
                const postId = bookmarkBtn.dataset.postId;
                this.toggleBookmark(postId, bookmarkBtn);
            }
        });

        // Handle bookmark menu item clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.menu-item.bookmark-action')) {
                e.preventDefault();
                e.stopPropagation();
                const menuItem = e.target.closest('.menu-item.bookmark-action');
                const postId = menuItem.dataset.postId;
                this.toggleBookmark(postId, null, menuItem);
            }
        });
    }

    async toggleBookmark(postId, actionBtn = null, menuItem = null) {
        if (!postId) {
            console.error('No post ID provided');
            return;
        }

        try {
            // Get CSRF token from multiple possible sources
            let csrfToken = window.csrfToken; // Try global variable first
            
            if (!csrfToken) {
                csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            }
            
            if (!csrfToken) {
                csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            }
            
            if (!csrfToken) {
                // Try to get from cookie
                const cookies = document.cookie.split(';');
                for (let cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === 'csrftoken') {
                        csrfToken = value;
                        break;
                    }
                }
            }

            console.log('CSRF token found:', csrfToken ? 'Yes' : 'No');

            if (!csrfToken) {
                console.error('CSRF token not found in any location');
                this.showToast('Security token not found. Please refresh the page.', 'error');
                return;
            }

            // Show loading state
            if (actionBtn) {
                actionBtn.style.opacity = '0.6';
                actionBtn.style.pointerEvents = 'none';
            }

            // Make AJAX request  
            const response = await fetch(`/app/posts/${postId}/bookmark/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                // Update UI based on bookmark status
                this.updateBookmarkUI(postId, data.is_bookmarked, actionBtn, menuItem);
                
                // If unbookmarked from profile page, remove the entire item
                if (!data.is_bookmarked && window.location.pathname.includes('profile')) {
                    this.removeFromProfile(postId);
                }
                
                // Show success message
                this.showToast(data.message, 'success');
            } else {
                throw new Error(data.message || 'Failed to toggle bookmark');
            }

        } catch (error) {
            console.error('Bookmark toggle failed:', error);
            this.showToast('Failed to save post. Please try again.', 'error');
        } finally {
            // Remove loading state
            if (actionBtn) {
                actionBtn.style.opacity = '';
                actionBtn.style.pointerEvents = '';
            }
        }
    }

    updateBookmarkUI(postId, isBookmarked, actionBtn = null, menuItem = null) {
        // Update action button if provided
        if (actionBtn) {
            if (isBookmarked) {
                actionBtn.classList.add('bookmarked');
                actionBtn.querySelector('.action-text').textContent = 'Saved';
                // Fill the bookmark icon
                const svg = actionBtn.querySelector('svg');
                if (svg) {
                    svg.style.fill = 'currentColor';
                }
            } else {
                actionBtn.classList.remove('bookmarked');
                actionBtn.querySelector('.action-text').textContent = 'Save';
                // Unfill the bookmark icon
                const svg = actionBtn.querySelector('svg');
                if (svg) {
                    svg.style.fill = 'none';
                }
            }
        }

        // Update menu item if provided
        if (menuItem) {
            const textSpan = menuItem.querySelector('.bookmark-text');
            if (textSpan) {
                textSpan.textContent = isBookmarked ? 'Remove bookmark' : 'Save post';
            }
        }

        // Update all bookmark actions for this post
        const allBookmarkActions = document.querySelectorAll(`[data-post-id="${postId}"].bookmark-action`);
        allBookmarkActions.forEach(btn => {
            if (btn !== actionBtn) { // Don't update the button we just clicked
                if (isBookmarked) {
                    btn.classList.add('bookmarked');
                    const text = btn.querySelector('.action-text');
                    if (text) text.textContent = 'Saved';
                    const svg = btn.querySelector('svg');
                    if (svg) svg.style.fill = 'currentColor';
                } else {
                    btn.classList.remove('bookmarked');
                    const text = btn.querySelector('.action-text');
                    if (text) text.textContent = 'Save';
                    const svg = btn.querySelector('svg');
                    if (svg) svg.style.fill = 'none';
                }
            }
        });

        // Update menu items for this post
        const allMenuItems = document.querySelectorAll(`[data-post-id="${postId}"].menu-item.bookmark-action`);
        allMenuItems.forEach(item => {
            if (item !== menuItem) { // Don't update the menu item we just clicked
                const textSpan = item.querySelector('.bookmark-text');
                if (textSpan) {
                    textSpan.textContent = isBookmarked ? 'Remove bookmark' : 'Save post';
                }
            }
        });
    }

    removeFromProfile(postId) {
        // Remove the saved post item from profile page
        const savedPostItem = document.querySelector(`.saved-post-item .post-action-btn[data-post-id="${postId}"]`)?.closest('.saved-post-item');
        if (savedPostItem) {
            savedPostItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            savedPostItem.style.opacity = '0';
            savedPostItem.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                savedPostItem.remove();
                
                // Check if no saved posts remain, show empty state
                const remainingPosts = document.querySelectorAll('.saved-post-item');
                if (remainingPosts.length === 0) {
                    const savedPostsList = document.querySelector('.saved-posts-list');
                    if (savedPostsList) {
                        savedPostsList.innerHTML = `
                            <div class="empty-saved-posts">
                                <div class="empty-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                                    </svg>
                                </div>
                                <h4>No saved posts yet</h4>
                                <p>Posts you save will appear here for easy access later.</p>
                            </div>
                        `;
                    }
                }
            }, 300);
        }
    }

    showToast(message, type = 'info') {
        // Check if we have a toast system available
        if (typeof showToast === 'function') {
            showToast(message, type);
            return;
        }

        // Simple fallback toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f56565' : '#48bb78'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PostBookmarkHandler();
});

// Export for potential external use
window.PostBookmarkHandler = PostBookmarkHandler;

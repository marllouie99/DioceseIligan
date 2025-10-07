/**
 * Post View Tracker
 * Tracks post views when they become visible in the viewport
 * Handles both authenticated and anonymous users
 */

// Prevent multiple declarations if script is loaded multiple times
if (typeof window.PostViewTracker === 'undefined') {
    class PostViewTracker {
        constructor(options = {}) {
            this.options = {
                threshold: 0.5, // 50% of post must be visible
                debounceTime: 1000, // Wait 1 second before tracking
                ...options
            };
            
            this.trackedPosts = new Set();
            this.observer = null;
            this.debounceTimers = new Map();
            
            this.init();
        }
        
        init() {
            // Initialize Intersection Observer
            this.initObserver();
            
            // Find and observe all post cards
            this.observePosts();
            
            if (window.DEBUG_POST_VIEW_TRACKER) {
                console.log('[PostViewTracker] Initialized - found posts to track:', document.querySelectorAll('.post-card[data-post-id], .post-management-card[data-post-id], .top-post-card[data-post-id]').length);
            }
        }
        
        initObserver() {
            if (!('IntersectionObserver' in window)) {
                console.warn('[PostViewTracker] IntersectionObserver not supported');
                return;
            }
            
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.handlePostVisible(entry.target);
                    }
                });
            }, {
                threshold: this.options.threshold,
                rootMargin: '0px 0px -100px 0px' // Start tracking when post is 100px into viewport
            });
        }
        
        observePosts() {
            if (!this.observer) return;
            
            // Find all post cards (both regular and management cards)
            const postCards = document.querySelectorAll(
                '.post-card[data-post-id], .post-management-card[data-post-id], .top-post-card[data-post-id]'
            );
            
            postCards.forEach(card => {
                this.observer.observe(card);
            });
            
            if (window.DEBUG_POST_VIEW_TRACKER) {
                console.log(`[PostViewTracker] Observing ${postCards.length} posts`);
            }
        }
        
        handlePostVisible(postElement) {
            const postId = postElement.dataset.postId;
            
            if (!postId || this.trackedPosts.has(postId)) {
                return; // Already tracked this post
            }
            
            // Clear existing timer for this post
            if (this.debounceTimers.has(postId)) {
                clearTimeout(this.debounceTimers.get(postId));
            }
            
            // Set debounce timer
            const timer = setTimeout(() => {
                this.trackPostView(postId, postElement);
                this.debounceTimers.delete(postId);
            }, this.options.debounceTime);
            
            this.debounceTimers.set(postId, timer);
        }
        
        async trackPostView(postId, postElement) {
            try {
                // Mark as tracked immediately to prevent duplicates
                this.trackedPosts.add(postId);
                
                const csrfToken = this.getCSRFToken();
                if (window.DEBUG_POST_VIEW_TRACKER) {
                    console.log(`[PostViewTracker] Tracking view for post ${postId}, CSRF token:`, csrfToken ? 'found' : 'missing');
                }

                const url = (window.djangoUrls && window.djangoUrls.trackPostView)
                  ? window.djangoUrls.trackPostView.replace('0', postId)
                  : `/app/posts/${postId}/view/`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    credentials: 'same-origin'
                });
                
                if (window.DEBUG_POST_VIEW_TRACKER) {
                    console.log(`[PostViewTracker] Response status for post ${postId}:`, response.status);
                }
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                
                const data = await response.json();
                if (window.DEBUG_POST_VIEW_TRACKER) {
                    console.log(`[PostViewTracker] Response data for post ${postId}:`, data);
                }
                
                if (data.success) {
                    console.log(`[PostViewTracker] ✅ Tracked view for post ${postId} (count: ${data.view_count}, counted: ${data.counted})`);
                    
                    // Update view count in UI if element exists
                    this.updateViewCountUI(postElement, data.view_count);
                    
                    // Stop observing this post
                    if (this.observer) {
                        this.observer.unobserve(postElement);
                    }
                } else {
                    // Remove from tracked set if tracking failed
                    this.trackedPosts.delete(postId);
                    if (window.DEBUG_POST_VIEW_TRACKER) {
                        console.warn(`[PostViewTracker] ❌ Failed to track view for post ${postId}: ${data.message}`);
                    }
                    // Stop observing to avoid repeated failures
                    if (this.observer) {
                        this.observer.unobserve(postElement);
                    }
                }
                
            } catch (error) {
                // Remove from tracked set if tracking failed
                this.trackedPosts.delete(postId);
                if (window.DEBUG_POST_VIEW_TRACKER) {
                    console.error(`[PostViewTracker] ❌ Error tracking view for post ${postId}:`, error);
                }
                // Stop observing to avoid repeated failures
                if (this.observer) {
                    this.observer.unobserve(postElement);
                }
            }
        }
        
        updateViewCountUI(postElement, viewCount) {
            // Look for view count elements in post management cards only
            const viewCountElements = postElement.querySelectorAll('.view-count, [data-view-count]');
            
            viewCountElements.forEach(element => {
                // Update text content for view count displays in management interface
                if (element.classList.contains('view-count') || 
                    element.dataset.viewCount !== undefined) {
                    element.textContent = viewCount;
                    element.dataset.viewCount = viewCount;
                }
            });
        }
        
        getCSRFToken() {
            // Try to get from window.csrfToken (set by template)
            if (window.csrfToken) {
                return window.csrfToken;
            }
            
            // Try to get from Django's CSRF cookie
            const csrfCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('csrftoken='));
            
            if (csrfCookie) {
                return csrfCookie.split('=')[1];
            }
            
            // Try to get from any form on the page
            const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
            if (csrfInput) {
                return csrfInput.value;
            }
            
            console.warn('[PostViewTracker] CSRF token not found');
            return '';
        }
        
        // Public method to manually track a post view
        trackPost(postId) {
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
                this.trackPostView(postId, postElement);
            }
        }
        
        // Public method to add new posts to observation
        observeNewPosts() {
            this.observePosts();
        }
        
        // Cleanup method
        destroy() {
            if (this.observer) {
                this.observer.disconnect();
            }
            
            // Clear all debounce timers
            this.debounceTimers.forEach(timer => clearTimeout(timer));
            this.debounceTimers.clear();
            
            console.log('[PostViewTracker] Destroyed');
        }
    }
    
    // Export to global scope
    window.PostViewTracker = PostViewTracker;
}

// Auto-initialize if we're on a page with posts
document.addEventListener('DOMContentLoaded', function() {
    // Prevent multiple initializations
    if (window.postViewTrackerInstance) {
        return;
    }
    
    // Check if we have posts to track
    const hasPostsToTrack = document.querySelector('.post-card[data-post-id], .post-management-card[data-post-id], .top-post-card[data-post-id]');
    
    if (hasPostsToTrack) {
        window.postViewTrackerInstance = new PostViewTracker();
    }
});

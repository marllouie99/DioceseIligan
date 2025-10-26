/**
 * Dashboard Posts Module
 * @module DashboardPosts
 * @description Handles post interactions and menu functionality for dashboard community feed
 */

// Prevent redeclaration if already loaded
if (typeof window.DashboardPosts === 'undefined') {
  
class DashboardPosts {
  constructor(config = {}) {
    this.config = { ...config };
    this.isInitialized = false;
  }

  /**
   */
  init() {
    if (this.isInitialized) return;
    
    // Fix any existing broken timestamps immediately
    this.fixBrokenTimestamps();
    
    this.setupClickOutsideHandlers();
    this.setupPostActions();
    this.setupCommentForms();
    this.updateExistingCommentTimestamps();
    this.isInitialized = true;
    
    // Set up a periodic check for broken timestamps
    this.startTimestampMonitoring();
  }

  /**
   * Setup post menu functionality
   */
  setupPostMenus() {
    // Delegate event for post menu buttons
    document.addEventListener('click', (event) => {
      const menuBtn = event.target.closest('.post-menu-btn');
      if (menuBtn) {
        this.togglePostMenu(menuBtn);
      }
    });
  }

  /**
   * Toggle post menu dropdown
   * @param {HTMLElement} button - The menu button element
   */
  togglePostMenu(button) {
    const dropdown = button.nextElementSibling;
    if (!dropdown) return;

    const card = button.closest('.post-card');
    const willOpen = !dropdown.classList.contains('show');

    // Close all other dropdowns (remove class and inline styles)
    this.closeAllDropdowns();

    if (willOpen) {
      dropdown.classList.add('show');
      dropdown.style.removeProperty('display');
      if (card) card.classList.add('dropdown-open');
    }
  }

  /**
   * Close all post menu dropdowns
   */
  closeAllDropdowns() {
    document.querySelectorAll('.post-menu-dropdown').forEach(dropdown => {
      dropdown.classList.remove('show');
      dropdown.style.removeProperty('display');
      const c = dropdown.closest('.post-card');
      if (c) c.classList.remove('dropdown-open');
    });
  }

  /**
   * Setup click outside handlers
   */
  setupClickOutsideHandlers() {
    document.addEventListener('click', (event) => {
      // Close dropdowns when clicking outside (ignore clicks on button, dropdown, or modals)
      if (
        !event.target.closest('.post-menu-btn') &&
        !event.target.closest('.post-menu-dropdown') &&
        !event.target.closest('.post-modal')
      ) {
        this.closeAllDropdowns();
      }
    });
  }

  /**
   * Setup post action handlers
   */
  setupPostActions() {
    // Delegate event for post actions
    document.addEventListener('click', (event) => {
      const actionBtn = event.target.closest('.post-action');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const postId = actionBtn.dataset.postId;
        
        if (action && postId) {
          this.handlePostAction(action, postId, actionBtn);
        }
      }
    });
  }

  /**
   * Setup comment form handlers
   */
  setupCommentForms() {
    // Delegate event for comment form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target.closest('.add-comment-form');
      if (form) {
        event.preventDefault();
        this.handleCommentSubmission(form);
      }
    });

    // Auto-resize textarea and show/hide inline controls
    document.addEventListener('input', (event) => {
      if (event.target.classList.contains('comment-input')) {
        this.autoResizeTextarea(event.target);
        this.toggleInlineControls(event.target);
      }
    });

    // Cancel comment
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('cancel-comment')) {
        this.cancelComment(event.target);
      }
    });
  }

  /**
   * Handle post actions (like, comment, share)
   * @param {string} action - The action type
   * @param {string} postId - The post ID
   * @param {HTMLElement} element - The action element
   */
  handlePostAction(action, postId, element) {
    switch (action) {
      case 'like':
        this.toggleLike(postId, element);
        break;
      case 'comment':
        this.toggleComments(postId);
        break;
      case 'share':
        this.sharePost(postId);
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }

  /**
   * Toggle like on a post
   * @param {string} postId - The post ID
   * @param {HTMLElement} element - The like button element
   */
  async toggleLike(postId, element) {
    try {
      element.classList.add('loading');
      
      const response = await fetch(`/app/posts/${postId}/like/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': this.getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        // Update like button state
        const countElement = element.querySelector('.action-count');
        if (countElement) {
          countElement.textContent = data.like_count || 0;
        }
        
        // Toggle liked class
        if (data.is_liked) {
          element.classList.add('liked');
        } else {
          element.classList.remove('liked');
        }
        
        // Show feedback
        this.showActionFeedback(element, data.message);
      } else {
        this.showError(data.message || 'Failed to like post');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      this.showError('An error occurred. Please try again.');
    } finally {
      element.classList.remove('loading');
    }
  }

  /**
   * Toggle comments section visibility
   * @param {string} postId - The post ID
   */
  async toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-section-${postId}`);
    if (!commentsSection) return;

    const isVisible = commentsSection.style.display !== 'none';
    
    if (isVisible) {
      // Hide comments
      commentsSection.style.display = 'none';
    } else {
      // Show comments and load them
      commentsSection.style.display = 'block';
      await this.loadComments(postId);
      
      // Focus on comment input
      const commentInput = commentsSection.querySelector('.comment-input');
      if (commentInput) {
        commentInput.focus();
      }
    }
  }

  /**
   * Load comments for a post
   * @param {string} postId - The post ID
   */
  async loadComments(postId) {
    try {
      const container = document.getElementById(`comments-container-${postId}`);
      if (!container) return;

      container.innerHTML = '<div class="loading-comments">Loading comments...</div>';

      const response = await fetch(`/app/posts/${postId}/comments/`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        container.innerHTML = '';
        
        if (data.comments.length === 0) {
          container.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
        } else {
          data.comments.forEach(comment => {
            container.appendChild(this.createCommentElement(comment));
          });
        }
      } else {
        container.innerHTML = '<div class="error-comments">Failed to load comments</div>';
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      const container = document.getElementById(`comments-container-${postId}`);
      if (container) {
        container.innerHTML = '<div class="error-comments">Error loading comments</div>';
      }
    }
  }

  /**
   * Handle comment form submission
   * @param {HTMLFormElement} form - The comment form
   */
  async handleCommentSubmission(form) {
    try {
      const postId = form.dataset.postId;
      const formData = new FormData(form);
      const content = formData.get('content').trim();

      if (!content) {
        this.showError('Comment cannot be empty');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting...';

      const response = await fetch(`/app/posts/${postId}/comment/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': this.getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        // Clear form
        form.reset();
        
        // Update comment count
        const commentAction = document.querySelector(`[data-action="comment"][data-post-id="${postId}"]`);
        if (commentAction) {
          const countElement = commentAction.querySelector('.action-count');
          if (countElement) {
            countElement.textContent = data.comment_count || 0;
          }
        }
        
        // Add new comment to list
        const container = document.getElementById(`comments-container-${postId}`);
        if (container) {
          // Remove "no comments" message if present
          const noComments = container.querySelector('.no-comments');
          if (noComments) {
            noComments.remove();
          }
          
          const commentElement = this.createCommentElement(data.comment);
          container.appendChild(commentElement);
          
          // Scroll to new comment
          commentElement.scrollIntoView({ behavior: 'smooth' });
        }
        
        this.showActionFeedback(submitBtn, 'Comment posted!');
      } else {
        this.showError(data.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      this.showError('An error occurred. Please try again.');
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post';
    }
  }

  /**
   * Share a post
   * @param {string} postId - The post ID
   */
  async sharePost(postId) {
    try {
      const response = await fetch(`/app/posts/${postId}/share/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': this.getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        // Copy URL to clipboard if possible
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(data.share_url);
          this.showSuccess('Link copied to clipboard!');
        } else {
          // Fallback: show share modal or URL
          this.showShareModal(data.share_url, data.post_title);
        }
      } else {
        this.showError(data.message || 'Failed to share post');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      this.showError('An error occurred. Please try again.');
    }
  }

  /**
   * Format date to relative time (1m, 1h, 1d, etc.)
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted relative time
   */
  formatRelativeTime(dateString) {
    try {
      const now = new Date();
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime()) || isNaN(now.getTime())) {
        return 'now';
      }
      
      const diffInMs = now - date;
      const diffInSeconds = Math.floor(diffInMs / 1000);
      
      // Handle negative differences (future dates)
      if (diffInSeconds < 0) {
        return 'now';
      }
      
      // Handle each time unit with proper validation
      if (diffInSeconds < 60) {
        const seconds = Math.max(0, diffInSeconds);
        return `${seconds}s`;
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${Math.max(1, minutes)}m`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${Math.max(1, hours)}h`;
      } else if (diffInSeconds < 2592000) { // 30 days
        const days = Math.floor(diffInSeconds / 86400);
        return `${Math.max(1, days)}d`;
      } else if (diffInSeconds < 31536000) { // 365 days
        const months = Math.floor(diffInSeconds / 2592000);
        return `${Math.max(1, months)}mo`;
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `${Math.max(1, years)}y`;
      }
    } catch (error) {
      console.warn('Error in formatRelativeTime:', error, dateString);
      return 'now';
    }
  }

  /**
   * Create a comment DOM element
   * @param {Object} comment - Comment data
   * @returns {HTMLElement} - Comment element
   */
  createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = `comment ${comment.is_reply ? 'comment-reply' : ''}`;
    
    // Helper function to create rank badge HTML
    const getRankBadgeHTML = (rank) => {
      if (!rank) return '';
      return `<span class="donation-rank-badge" style="background: ${rank.color}22; color: ${rank.color}; border: 1px solid ${rank.color}44;" title="${rank.name}">${rank.name}</span>`;
    };
    
    div.innerHTML = `
      <div class="comment-avatar">
        <div class="avatar-placeholder small">${comment.user_initial}</div>
      </div>
      <div class="comment-content">
        <div class="comment-author">
          ${comment.user_name}
          ${getRankBadgeHTML(comment.donation_rank)}
        </div>
        <div class="comment-text">${this.escapeHtml(comment.content)}</div>
        <div class="comment-meta">
          <span class="comment-time">${this.formatRelativeTime(comment.created_at)}</span>
          <button class="comment-reply-btn" data-comment-id="${comment.id}">Reply</button>
          <button class="comment-report-btn" data-comment-id="${comment.id}" title="Report comment">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
            Report
          </button>
        </div>
        ${comment.replies ? comment.replies.map(reply => 
          `<div class="comment comment-reply">
            <div class="comment-avatar">
              <div class="avatar-placeholder small">${reply.user_initial}</div>
            </div>
            <div class="comment-content">
              <div class="comment-author">
                ${reply.user_name}
                ${getRankBadgeHTML(reply.donation_rank)}
              </div>
              <div class="comment-text">${this.escapeHtml(reply.content)}</div>
              <div class="comment-meta">
                <span class="comment-time">${this.formatRelativeTime(reply.created_at)}</span>
                <button class="comment-report-btn" data-comment-id="${reply.id}" title="Report comment">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                    <line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                  Report
                </button>
              </div>
            </div>
          </div>`
        ).join('') : ''}
      </div>
    `;
    return div;
  }

  /**
   * Auto-resize textarea based on content
   * @param {HTMLTextAreaElement} textarea - The textarea element
   */
  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  /**
   * Cancel comment (clear and hide form)
   * @param {HTMLElement} cancelBtn - The cancel button
   */
  cancelComment(cancelBtn) {
    const form = cancelBtn.closest('.add-comment-form');
    if (form) {
      form.reset();
      const textarea = form.querySelector('.comment-input');
      if (textarea) {
        this.autoResizeTextarea(textarea);
        this.toggleInlineControls(textarea); // This will hide the inline controls
      }
    }
  }

  /**
   * Toggle inline controls visibility based on input content
   * @param {HTMLTextAreaElement} textarea - The textarea element
   */
  toggleInlineControls(textarea) {
    const wrapper = textarea.closest('.comment-input-wrapper');
    if (!wrapper) return;

    const inlineControls = wrapper.querySelector('.comment-inline-controls');
    const legacyActions = wrapper.querySelector('.comment-actions');
    
    if (!inlineControls) return;

    const hasContent = textarea.value.trim().length > 0;
    
    if (hasContent) {
      // Show inline controls when typing
      inlineControls.style.display = 'flex';
      textarea.classList.add('has-inline-controls');
    } else {
      // Hide inline controls when not typing (clean state)
      inlineControls.style.display = 'none';
      textarea.classList.remove('has-inline-controls');
    }
  }

  /**
   * Get CSRF token from cookies
   * @returns {string} - CSRF token
   */
  getCsrfToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  /**
   * Show action feedback
   * @param {HTMLElement} element - Element to show feedback on
   * @param {string} message - Feedback message
   */
  showActionFeedback(element, message) {
    // Show feedback only on the action text, not the entire element
    const actionTextElement = element.querySelector('.action-text');
    if (actionTextElement) {
      const originalText = actionTextElement.textContent;
      actionTextElement.textContent = message;
      setTimeout(() => {
        actionTextElement.textContent = originalText;
      }, 1500);
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    // Simple error display - you can enhance this with a proper notification system
    console.error(message);
    alert(message); // Replace with better UI later
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    // Simple success display - you can enhance this with a proper notification system
    console.log(message);
    alert(message); // Replace with better UI later
  }

  /**
   * Show share modal (fallback for clipboard API)
   * @param {string} url - Share URL
   * @param {string} title - Post title
   */
  showShareModal(url, title) {
    // Simple fallback - you can create a proper modal
    const shareText = `${title}\n${url}`;
    prompt('Copy this link to share:', url);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Update existing comment timestamps to relative format
   */
  updateExistingCommentTimestamps() {
    const commentTimes = document.querySelectorAll('.comment-time');
    console.log(`Found ${commentTimes.length} comment timestamps to update`);
    
    commentTimes.forEach((timeElement, index) => {
      const originalTime = timeElement.textContent.trim();
      console.log(`Processing timestamp ${index + 1}: "${originalTime}"`);
      
      // Skip if it's broken/invalid
      if (originalTime.includes('NaN') || originalTime === 'NaNv' || originalTime === '' || originalTime === 'undefined' || originalTime === 'null') {
        console.log(`Fixing broken timestamp: "${originalTime}"`);
        timeElement.textContent = 'now';
        return;
      }
      
      // Skip if it's already in relative format (1h, 2m, 3d, etc.)
      if (/^\d+[smhdy]$/.test(originalTime) || /^\d+mo$/.test(originalTime)) {
        console.log(`Already in relative format: "${originalTime}"`);
        return;
      }
      
      // Try to parse the original timestamp and convert to relative time
      try {
        let date = null;
        
        // Try different parsing approaches
        if (originalTime.includes('ago')) {
          // Handle "X days ago", "X hours ago", etc.
          const agoMatch = originalTime.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/i);
          if (agoMatch) {
            const [, num, unit] = agoMatch;
            const now = new Date();
            const multipliers = {
              second: 1000,
              minute: 60000,
              hour: 3600000,
              day: 86400000,
              week: 604800000,
              month: 2592000000,
              year: 31536000000
            };
            const multiplier = multipliers[unit.toLowerCase()] || 1000;
            date = new Date(now.getTime() - (parseInt(num) * multiplier));
          }
        } else if (originalTime.includes('at') && originalTime.includes(',')) {
          // Handle legacy format "December 25, 2024 at 02:30 PM"
          date = new Date(originalTime);
        } else {
          // Try direct date parsing (handles ISO format and most other formats)
          date = new Date(originalTime);
        }
        
        // If we have a valid date, format it
        if (date && !isNaN(date.getTime())) {
          const relativeTime = this.formatRelativeTime(date.toISOString());
          console.log(`Converted "${originalTime}" to "${relativeTime}"`);
          timeElement.textContent = relativeTime;
        } else {
          // If all parsing fails, show a default
          console.warn('Could not parse comment timestamp:', originalTime);
          timeElement.textContent = 'now';
        }
      } catch (error) {
        // If parsing fails, show a default
        console.warn('Error parsing comment timestamp:', originalTime, error);
        timeElement.textContent = 'now';
      }
    });
  }

  /**
   * Fix any broken timestamps immediately
   */
  fixBrokenTimestamps() {
    const brokenTimes = document.querySelectorAll('.comment-time');
    brokenTimes.forEach(timeElement => {
      const text = timeElement.textContent.trim();
      // Only fix truly broken timestamps, not valid relative times or dates
      if (text.includes('NaN') || text === 'NaNv' || text === '' || text === 'undefined' || text === 'null') {
        console.log(`Fixing broken timestamp: "${text}"`);
        timeElement.textContent = 'now';
      }
    });
  }

  /**
   * Start monitoring for broken timestamps
   */
  startTimestampMonitoring() {
    // Check every 30 seconds for broken timestamps (less aggressive)
    setInterval(() => {
      this.fixBrokenTimestamps();
    }, 30000);
  }

  /**
   * Destroy the instance
   */
  destroy() {
    // Remove event listeners if needed
    this.isInitialized = false;
  }
}

// Make available globally
window.DashboardPosts = DashboardPosts;

} // End of conditional block

// Auto-initialize when DOM is ready (only if not already initialized)
document.addEventListener('DOMContentLoaded', () => {
  // Prevent multiple initializations
  if (window.dashboardPostsInstance) {
    return;
  }
  
  // Initialize on dashboard, home, church detail, manage church, and any page with post cards
  const hasPostCards = document.querySelector('.post-card');
  const isDashboard = window.location.pathname === '/' || window.location.pathname.includes('dashboard');
  const isChurchDetail = window.location.pathname.includes('/app/church/');
  const isManageChurch = window.location.pathname.includes('manage-church');
  
  if (isDashboard || isChurchDetail || isManageChurch || hasPostCards) {
    window.dashboardPostsInstance = new DashboardPosts();
    window.dashboardPostsInstance.init();
  }
});

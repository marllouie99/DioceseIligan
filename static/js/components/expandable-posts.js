/**
 * Expandable Posts Module
 * Handles expand/collapse functionality for post cards with smooth curtain animation
 * 
 * Features:
 * - Smart height detection - only shows expand button when needed
 * - Smooth curtain animations with 400ms transitions
 * - Text truncation with "See more" for long captions
 * - Works with both regular and management post cards
 * - Analytics tracking for engagement metrics
 * - Keyboard accessibility support
 * - Auto-scroll to keep posts in view when collapsing
 */

class ExpandablePosts {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
    // Add a small delay to ensure DOM is fully ready
    setTimeout(() => {
      this.initTextTruncation();
      this.checkPostHeights();
    }, 100);
    this.initSubTabs();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Use event delegation for expand toggle buttons
    document.addEventListener('click', (e) => {
      const expandToggle = e.target.closest('.expand-toggle');
      if (expandToggle) {
        e.preventDefault();
        this.togglePostExpansion(expandToggle);
      }

      // Handle text see more/less toggles
      const textToggle = e.target.closest('.text-see-more');
      if (textToggle) {
        e.preventDefault();
        this.toggleTextExpansion(textToggle);
      }
    });

    // Check post heights on window resize
    window.addEventListener('resize', () => {
      this.debounce(() => this.checkPostHeights(), 300);
    });

    // Check post heights when images load
    document.addEventListener('load', (e) => {
      if (e.target.classList && e.target.classList.contains('post-image')) {
        this.checkPostHeights();
      }
    }, true);
  }

  /**
   * Initialize text truncation functionality
   */
  initTextTruncation() {
    const textElements = document.querySelectorAll('.post-text');
    const maxLines = 3; // Show maximum 3 lines before truncating
    
    textElements.forEach(textElement => {
      // Skip if already processed or empty
      if (textElement.querySelector('.text-truncation-wrapper') || !textElement.textContent.trim()) {
        return;
      }
      
      // Check if this post has images - if so, skip text truncation
      const postCard = textElement.closest('.post-card, .post-management-card');
      const hasImage = postCard && postCard.querySelector('.post-image, .post-image-preview');
      
      if (hasImage) {
        console.log('Post has image - skipping text truncation, using post-level expansion');
        return;
      }
      
      // Get computed line height
      const computedStyle = window.getComputedStyle(textElement);
      const lineHeight = parseInt(computedStyle.lineHeight) || parseInt(computedStyle.fontSize) * 1.4;
      const maxHeight = maxLines * lineHeight;
      
      console.log(`Text-only post: scrollHeight=${textElement.scrollHeight}, maxHeight=${maxHeight}, lineHeight=${lineHeight}`);
      
      // Check if text exceeds maximum lines OR character count
      const textLength = textElement.textContent.trim().length;
      const shouldTruncate = textElement.scrollHeight > maxHeight + 10 || textLength > 200;
      
      console.log(`Should truncate text-only post: ${shouldTruncate} (height: ${textElement.scrollHeight > maxHeight + 10}, length: ${textLength > 200}, chars: ${textLength})`);
      
      if (shouldTruncate) {
        this.truncateText(textElement, maxHeight);
      }
    });
  }

  /**
   * Truncate text and add see more link
   */
  truncateText(textElement, maxHeight) {
    const originalText = textElement.innerHTML;
    
    console.log('Truncating text:', originalText.substring(0, 100) + '...');
    
    // Create truncated wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'text-truncation-wrapper';
    
    // Create truncated content with proper line-clamp
    const truncatedContent = document.createElement('div');
    truncatedContent.className = 'text-truncated';
    truncatedContent.innerHTML = originalText;
    
    // Apply CSS styles that work with the post card width
    truncatedContent.style.cssText = `
      display: -webkit-box !important;
      -webkit-line-clamp: 3 !important;
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
      word-wrap: break-word !important;
      line-height: 1.5 !important;
    `;
    
    // Create full content (hidden initially)
    const fullContent = document.createElement('div');
    fullContent.className = 'text-full';
    fullContent.style.cssText = 'display: none;';
    fullContent.innerHTML = originalText;
    
    // Create see more/less toggle
    const seeMoreLink = document.createElement('button');
    seeMoreLink.className = 'text-see-more';
    seeMoreLink.type = 'button';
    seeMoreLink.innerHTML = 'See more';
    seeMoreLink.style.cssText = `
      background: none !important;
      border: none !important;
      color: #3b82f6 !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      cursor: pointer !important;
      padding: 4px 0 !important;
      margin-top: 8px !important;
      display: block !important;
    `;
    
    // Replace original content
    textElement.innerHTML = '';
    wrapper.appendChild(truncatedContent);
    wrapper.appendChild(fullContent);
    wrapper.appendChild(seeMoreLink);
    textElement.appendChild(wrapper);
    
    console.log('Text truncation applied successfully');
    console.log('Truncated content height:', truncatedContent.scrollHeight);
    console.log('Full content length:', fullContent.textContent.length);
  }

  /**
   * Toggle text expansion
   */
  toggleTextExpansion(toggleButton) {
    const wrapper = toggleButton.closest('.text-truncation-wrapper');
    const truncatedContent = wrapper.querySelector('.text-truncated');
    const fullContent = wrapper.querySelector('.text-full');
    
    if (!wrapper || !truncatedContent || !fullContent) {
      console.error('Text expansion elements not found');
      return;
    }
    
    const isExpanded = fullContent.style.display !== 'none';
    
    console.log('Toggle text expansion:', { isExpanded, buttonText: toggleButton.innerHTML });
    
    if (isExpanded) {
      // Collapse to truncated view
      truncatedContent.style.display = 'block';
      fullContent.style.display = 'none';
      toggleButton.innerHTML = 'See more';
      console.log('Collapsed to truncated view');
    } else {
      // Expand to full view
      truncatedContent.style.display = 'none';
      fullContent.style.display = 'block';
      toggleButton.innerHTML = 'See less';
      console.log('Expanded to full view');
    }
    
    // Recalculate post heights after text change
    setTimeout(() => {
      this.checkPostHeights();
    }, 50);
  }

  /**
   * Initialize sub-tab functionality for manage church page
   */
  initSubTabs() {
    // Handle sub-tab clicks and refresh post heights when switching tabs
    document.addEventListener('click', (e) => {
      const subTabBtn = e.target.closest('.sub-tab-btn');
      if (!subTabBtn) return;
      
      // Refresh post heights after tab switch (with small delay for DOM update)
      setTimeout(() => {
        this.checkPostHeights();
      }, 100);
    });
  }

  /**
   * Check if posts need expand toggle based on content height
   */
  checkPostHeights() {
    // Handle both regular post cards and management post cards
    const posts = document.querySelectorAll('.post-card.expandable, .post-management-card.expandable');
    
    posts.forEach(post => {
      const contentWrapper = post.querySelector('.post-content-wrapper');
      const expandToggle = post.querySelector('.expand-toggle');
      
      if (!contentWrapper || !expandToggle) return;

      // Temporarily expand to measure full height
      post.classList.add('expanded');
      
      const fullHeight = contentWrapper.scrollHeight;
      const collapsedHeight = 200; // Should match CSS max-height
      
      // Clear all expansion-related classes first
      post.classList.remove('expanded', 'collapsed', 'needs-expand');
      
      // Show/hide expand toggle based on content height
      if (fullHeight > collapsedHeight) {
        // Content is tall - needs expand functionality
        expandToggle.style.display = 'flex';
        post.classList.add('needs-expand', 'collapsed');
        
        // Set initial collapsed state with inline styles
        contentWrapper.style.transition = 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        contentWrapper.style.maxHeight = '200px';
        contentWrapper.style.overflow = 'hidden';
      } else {
        // Content is short - no expand needed, always show full
        expandToggle.style.display = 'none';
        post.classList.add('expanded');
        
        // Ensure full height for short posts
        contentWrapper.style.maxHeight = 'none';
        contentWrapper.style.overflow = 'visible';
      }
    });
  }

  /**
   * Toggle post expansion with smooth animation
   */
  togglePostExpansion(toggleButton) {
    // Handle both regular post cards and management post cards
    const postCard = toggleButton.closest('.post-card, .post-management-card');
    const contentWrapper = postCard.querySelector('.post-content-wrapper');
    
    if (!postCard || !contentWrapper) return;

    const isExpanded = postCard.classList.contains('expanded');
    
    if (isExpanded) {
      this.collapsePostInternal(postCard, contentWrapper);
    } else {
      this.expandPostInternal(postCard, contentWrapper);
    }

    // Update button accessibility
    toggleButton.setAttribute('aria-expanded', !isExpanded);
  }

  /**
   * Expand post with curtain animation (internal method)
   */
  expandPostInternal(postCard, contentWrapper) {
    // Clean class state
    postCard.classList.remove('collapsed');
    postCard.classList.add('expanded');

    // Set transition and expand to full height
    const fullHeight = contentWrapper.scrollHeight;
    contentWrapper.style.transition = 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    contentWrapper.style.maxHeight = (fullHeight + 50) + 'px'; // Add extra space for images

    // Reset max-height after animation
    setTimeout(() => {
      if (postCard.classList.contains('expanded')) {
        contentWrapper.style.maxHeight = 'none';
      }
    }, 400);

    // Analytics tracking
    this.trackExpansion('expand', postCard.dataset.postId);
  }

  /**
   * Collapse post with curtain animation (internal method)
   */
  collapsePostInternal(postCard, contentWrapper) {
    // Set transition and explicit height first for smooth transition
    contentWrapper.style.transition = 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    contentWrapper.style.maxHeight = contentWrapper.scrollHeight + 'px';
    
    // Force reflow
    contentWrapper.offsetHeight;
    
    // Then collapse - clean class state
    postCard.classList.remove('expanded');
    postCard.classList.add('collapsed');
    contentWrapper.style.maxHeight = '200px';

    // Scroll to top of post if it's not visible
    this.scrollToPostIfNeeded(postCard);

    // Analytics tracking
    this.trackExpansion('collapse', postCard.dataset.postId);
  }

  /**
   * Scroll to post if the top is not visible after collapse
   */
  scrollToPostIfNeeded(postCard) {
    const rect = postCard.getBoundingClientRect();
    const isTopVisible = rect.top >= 0;
    
    if (!isTopVisible) {
      postCard.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  }

  /**
   * Track post expansion/collapse for analytics
   */
  trackExpansion(action, postId) {
    // Only track if post ID exists
    if (!postId || postId === 'temp') return;

    // Send analytics event if tracking is available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'post_' + action, {
        event_category: 'engagement',
        event_label: 'post_id_' + postId,
        value: 1
      });
    }
  }

  /**
   * Debounce utility function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Public method to refresh post heights (useful for dynamic content)
   */
  refresh() {
    this.initTextTruncation();
    this.checkPostHeights();
  }

  /**
   * Public method to manually trigger text truncation (for testing)
   */
  refreshTextTruncation() {
    console.log('Manually refreshing text truncation...');
    this.initTextTruncation();
  }


  /**
   * Public method to expand a specific post
   */
  expandPost(postId) {
    // Try both regular and management post card IDs
    let postCard = document.getElementById(`post-card-${postId}`);
    if (!postCard) {
      postCard = document.getElementById(`post-mgmt-card-${postId}`);
    }
    
    if (postCard) {
      const toggleButton = postCard.querySelector('.expand-toggle');
      if (toggleButton && postCard.classList.contains('collapsed')) {
        this.togglePostExpansion(toggleButton);
      }
    }
  }

  /**
   * Public method to collapse a specific post
   */
  collapsePost(postId) {
    // Try both regular and management post card IDs
    let postCard = document.getElementById(`post-card-${postId}`);
    if (!postCard) {
      postCard = document.getElementById(`post-mgmt-card-${postId}`);
    }
    
    if (postCard) {
      const toggleButton = postCard.querySelector('.expand-toggle');
      if (toggleButton && postCard.classList.contains('expanded')) {
        this.togglePostExpansion(toggleButton);
      }
    }
  }
}

// DISABLED: Expand-toggle feature removed - posts now display full content
// Initialize when DOM is ready
// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', () => {
//     window.expandablePosts = new ExpandablePosts();
//   });
// } else {
//   window.expandablePosts = new ExpandablePosts();
// }

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExpandablePosts;
}

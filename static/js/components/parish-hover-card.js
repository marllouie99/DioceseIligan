/**
 * Parish Hover Card Component
 * Facebook-style profile preview on hover
 */

class ParishHoverCard {
  constructor() {
    this.hoverCard = null;
    this.currentChurchSlug = null;
    this.showTimeout = null;
    this.hideTimeout = null;
    this.isHoveringCard = false;
    this.isHoveringTrigger = false;
    this.SHOW_DELAY = 400; // Delay before showing (ms)
    this.HIDE_DELAY = 300; // Delay before hiding (ms)
    
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.hoverCard = document.getElementById('parish-hover-card');
    if (!this.hoverCard) {
      console.warn('❌ Parish hover card element not found');
      return;
    }

    console.log('✅ Parish hover card initialized successfully');
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Delegate hover events for parish avatars and names
    document.addEventListener('mouseover', (e) => {
      if (!e.target || typeof e.target.closest !== 'function') return;
      
      const trigger = e.target.closest('.post-author-avatar, .church-name-link');
      if (trigger && !trigger.dataset.hoverActive) {
        trigger.dataset.hoverActive = 'true';
        this.handleTriggerEnter(trigger, e);
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (!e.target || typeof e.target.closest !== 'function') return;
      
      const trigger = e.target.closest('.post-author-avatar, .church-name-link');
      if (trigger && trigger.dataset.hoverActive) {
        delete trigger.dataset.hoverActive;
        this.handleTriggerLeave();
      }
    });

    // Hover card events
    this.hoverCard.addEventListener('mouseenter', () => {
      this.isHoveringCard = true;
      this.cancelHide();
    });

    this.hoverCard.addEventListener('mouseleave', () => {
      this.isHoveringCard = false;
      this.scheduleHide();
    });

    // Close button
    const closeBtn = this.hoverCard.querySelector('.parish-hover-card-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Follow button
    const followBtn = this.hoverCard.querySelector('.parish-hover-follow-btn');
    if (followBtn) {
      followBtn.addEventListener('click', (e) => this.handleFollow(e));
    }
  }

  handleTriggerEnter(trigger, event) {
    this.isHoveringTrigger = true;
    this.cancelHide();

    // Get church data from the post card
    const postCard = trigger.closest('.post-card');
    if (!postCard) return;

    const churchLink = postCard.querySelector('.church-name-link');
    if (!churchLink) return;

    const churchSlug = this.extractSlugFromUrl(churchLink.href);
    if (!churchSlug) return;

    // Schedule showing the card
    this.showTimeout = setTimeout(() => {
      if (this.isHoveringTrigger) {
        this.show(trigger, churchSlug, postCard, event);
      }
    }, this.SHOW_DELAY);
  }

  handleTriggerLeave() {
    this.isHoveringTrigger = false;
    this.cancelShow();
    this.scheduleHide();
  }

  async show(trigger, churchSlug, postCard, event) {
    // Don't show if already showing the same church
    if (this.currentChurchSlug === churchSlug && this.hoverCard.classList.contains('show')) {
      return;
    }

    this.currentChurchSlug = churchSlug;

    // Get church data from the post card
    const churchData = this.extractChurchData(postCard);
    
    // Populate the hover card
    this.populateCard(churchData);

    // Position the card
    this.positionCard(trigger, event);

    // Show the card
    this.hoverCard.classList.add('show');

    // Fetch additional data if needed
    this.fetchChurchDetails(churchSlug);
  }

  hide() {
    this.hoverCard.classList.remove('show');
    this.currentChurchSlug = null;
  }

  scheduleHide() {
    this.hideTimeout = setTimeout(() => {
      if (!this.isHoveringCard && !this.isHoveringTrigger) {
        this.hide();
      }
    }, this.HIDE_DELAY);
  }

  cancelHide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  cancelShow() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
  }

  extractChurchData(postCard) {
    const data = {
      name: '',
      slug: '',
      logo: null,
      initial: '',
      verified: false,
      location: '',
      followers: 0,
      description: '',
      isFollowing: false
    };

    // Get name
    const nameLink = postCard.querySelector('.church-name-link');
    if (nameLink) {
      data.name = nameLink.textContent.trim();
      data.slug = this.extractSlugFromUrl(nameLink.href);
    }

    // Get logo
    const logoImg = postCard.querySelector('.post-author-avatar img');
    if (logoImg) {
      data.logo = logoImg.src;
    } else {
      const placeholder = postCard.querySelector('.post-author-avatar .avatar-placeholder');
      if (placeholder) {
        data.initial = placeholder.textContent.trim();
      }
    }

    // Get verified status
    data.verified = postCard.querySelector('.verified-badge') !== null;

    return data;
  }

  populateCard(data) {
    // Set logo
    const logoContainer = this.hoverCard.querySelector('.parish-hover-logo');
    if (data.logo) {
      logoContainer.innerHTML = `<img src="${data.logo}" alt="${data.name}" loading="lazy">`;
    } else {
      logoContainer.innerHTML = `<div class="avatar-placeholder">${data.initial}</div>`;
    }

    // Set name
    const nameEl = this.hoverCard.querySelector('.parish-hover-name');
    if (nameEl) {
      nameEl.textContent = data.name;
    }

    // Set verified badge
    const verifiedEl = this.hoverCard.querySelector('.parish-hover-verified');
    if (verifiedEl) {
      if (data.verified) {
        verifiedEl.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#1E90FF">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        `;
      } else {
        verifiedEl.innerHTML = '';
      }
    }

    // Set view parish link
    const viewBtn = this.hoverCard.querySelector('.parish-hover-view-btn');
    if (viewBtn && data.slug) {
      viewBtn.href = `/app/church/${data.slug}/`;
    }

    // Set location (will be updated from API)
    const locationEl = this.hoverCard.querySelector('.parish-hover-location');
    if (locationEl) {
      locationEl.textContent = data.location || 'Loading...';
    }

    // Set followers (will be updated from API)
    const followersEl = this.hoverCard.querySelector('.parish-hover-followers');
    if (followersEl) {
      followersEl.textContent = data.followers ? `${data.followers} followers` : 'Loading...';
    }

    // Set description (will be updated from API)
    const descEl = this.hoverCard.querySelector('.parish-hover-description');
    if (descEl) {
      descEl.textContent = data.description || 'Loading...';
    }

    // Set follow button state
    this.updateFollowButton(data.isFollowing);
  }

  positionCard(trigger, event) {
    const triggerRect = trigger.getBoundingClientRect();
    const cardWidth = 360;
    const cardHeight = this.hoverCard.offsetHeight || 400;
    const padding = 12;

    let left = triggerRect.left;
    let top = triggerRect.bottom + padding;

    // Adjust horizontal position if card would overflow
    if (left + cardWidth > window.innerWidth - padding) {
      left = window.innerWidth - cardWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    // Adjust vertical position if card would overflow
    if (top + cardHeight > window.innerHeight - padding) {
      top = triggerRect.top - cardHeight - padding;
    }
    if (top < padding) {
      top = padding;
    }

    this.hoverCard.style.left = `${left}px`;
    this.hoverCard.style.top = `${top}px`;
  }

  async fetchChurchDetails(slug) {
    try {
      const response = await fetch(`/app/api/churches/${slug}/preview/`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) return;

      const data = await response.json();

      // Update location
      const locationEl = this.hoverCard.querySelector('.parish-hover-location');
      if (locationEl && data.location) {
        locationEl.textContent = data.location;
      }

      // Update followers
      const followersEl = this.hoverCard.querySelector('.parish-hover-followers');
      if (followersEl && data.followers_count !== undefined) {
        followersEl.textContent = `${data.followers_count} follower${data.followers_count !== 1 ? 's' : ''}`;
      }

      // Update description
      const descEl = this.hoverCard.querySelector('.parish-hover-description');
      if (descEl && data.description) {
        descEl.textContent = data.description;
      }

      // Update follow status
      if (data.is_following !== undefined) {
        this.updateFollowButton(data.is_following);
      }
    } catch (error) {
      console.error('Error fetching church details:', error);
    }
  }

  updateFollowButton(isFollowing) {
    const followBtn = this.hoverCard.querySelector('.parish-hover-follow-btn');
    const followText = this.hoverCard.querySelector('.follow-btn-text');
    
    if (!followBtn || !followText) return;

    if (isFollowing) {
      followBtn.classList.add('following');
      followText.textContent = 'Following';
    } else {
      followBtn.classList.remove('following');
      followText.textContent = 'Follow';
    }
  }

  async handleFollow(event) {
    event.preventDefault();
    
    if (!this.currentChurchSlug) return;

    const followBtn = event.currentTarget;
    const followText = followBtn.querySelector('.follow-btn-text');
    const isFollowing = followBtn.classList.contains('following');

    try {
      followBtn.disabled = true;

      const response = await fetch(`/app/api/churches/${this.currentChurchSlug}/follow/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': this.getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Follow request failed');

      const data = await response.json();
      this.updateFollowButton(data.is_following);

      // Update followers count
      if (data.followers_count !== undefined) {
        const followersEl = this.hoverCard.querySelector('.parish-hover-followers');
        if (followersEl) {
          followersEl.textContent = `${data.followers_count} follower${data.followers_count !== 1 ? 's' : ''}`;
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      followBtn.disabled = false;
    }
  }

  extractSlugFromUrl(url) {
    const match = url.match(/\/church\/([^\/]+)\//);
    return match ? match[1] : null;
  }

  getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.parishHoverCard = new ParishHoverCard();
  });
} else {
  window.parishHoverCard = new ParishHoverCard();
}

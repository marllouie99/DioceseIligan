document.addEventListener('DOMContentLoaded', function() {
  // Handle follow/unfollow button
  const followBtn = document.querySelector('.follow-btn');

  if (followBtn) {
    followBtn.addEventListener('click', function() {
      const churchId = this.dataset.churchId;
      const action = this.dataset.action;
      const url = action === 'follow' ? window.djangoUrls.followChurch.replace('0', churchId) : window.djangoUrls.unfollowChurch.replace('0', churchId);

      const originalText = this.innerHTML;
      this.innerHTML = '<svg class="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Following...';
      this.disabled = true;

      fetch(url, {
        method: 'POST',
        headers: {
          'X-CSRFToken': window.csrfToken || document.querySelector('[name=csrfmiddlewaretoken]').value,
          'Content-Type': 'application/json',
        },
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          if (data.action === 'followed') {
            this.dataset.action = 'unfollow';
            this.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              Following
            `;
            this.classList.add('following');
          } else {
            this.dataset.action = 'follow';
            this.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              Follow
            `;
            this.classList.remove('following');
          }

          const followerCount = document.querySelector('.stat-number');
          if (followerCount) {
            followerCount.textContent = data.follower_count;
          }

          showNotification(data.message, 'success');
        } else {
          showNotification(data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred. Please try again.', 'error');
      })
      .finally(() => {
        this.disabled = false;
      });
    });
  }

  // Tabs behavior
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  function activateTab(name) {
    tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    panels.forEach(p => p.classList.toggle('active', p.id === name));
  }
  tabButtons.forEach(b => b.addEventListener('click', () => activateTab(b.dataset.tab)));
  
  // Check for URL parameters and hash to activate tab and scroll to post
  function handleInitialNavigation() {
    // Check URL parameters for tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    // Check hash for post anchor or tab
    const hash = window.location.hash.substring(1); // Remove the # symbol
    
    // Determine which tab to activate
    let targetTab = 'posts'; // Default tab
    
    if (tabParam) {
      // URL parameter takes precedence
      targetTab = tabParam;
    } else if (hash && document.getElementById(hash)) {
      // If hash matches a tab ID, activate that tab
      targetTab = hash;
    }
    
    // Activate the target tab
    activateTab(targetTab);
    
    // If hash is a post anchor (starts with 'post-card-'), scroll to it after tab is activated
    if (hash && hash.startsWith('post-card-')) {
      setTimeout(() => {
        const postElement = document.getElementById(hash);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }
  
  // Check for hash in URL and activate corresponding tab
  function handleHashNavigation() {
    const hash = window.location.hash.substring(1); // Remove the # symbol
    if (hash && document.getElementById(hash)) {
      // Check if it's a tab or a post
      if (hash.startsWith('post-card-')) {
        // It's a post anchor, make sure posts tab is active
        activateTab('posts');
        setTimeout(() => {
          const postElement = document.getElementById(hash);
          if (postElement) {
            postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        // It's a tab
        activateTab(hash);
      }
    } else {
      activateTab('posts');
    }
  }
  
  // Initial navigation handling
  handleInitialNavigation();
  
  // Listen for hash changes (when user uses back/forward buttons)
  window.addEventListener('hashchange', handleHashNavigation);

  // Handle location link clicks to open in maps
  const locationLink = document.querySelector('.location-link');
  if (locationLink) {
    locationLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      const lat = this.dataset.lat;
      const lng = this.dataset.lng;
      const address = this.dataset.address;
      
      // If coordinates are available, use them for better accuracy
      if (lat && lng && lat !== 'None' && lng !== 'None') {
        openInMaps(lat, lng);
      } else if (address && address !== 'No address provided') {
        // Fallback to address-based search
        openInMapsByAddress(address);
      } else {
        showNotification('Location information not available', 'error');
      }
    });
  }

  // Handle message button click to open chat widget
  const messageBtn = document.querySelector('.message-btn');
  if (messageBtn) {
    messageBtn.addEventListener('click', function() {
      const churchId = this.dataset.churchId;
      
      // Get church information from the page
      const churchName = document.querySelector('.church-name')?.textContent.trim() || 'Church';
      const churchAvatar = document.querySelector('.church-avatar img')?.src || null;
      
      // Check if chat widget is available
      if (window.chatWidget) {
        window.chatWidget.openConversation(churchId, churchName, churchAvatar);
      } else {
        console.error('Chat widget not initialized');
        showNotification('Chat feature is currently unavailable. Please try again later.', 'error');
      }
    });
  }
});

// Modal functions
function showCreatePostModal() {
  document.getElementById('createPostModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function hideCreatePostModal() {
  document.getElementById('createPostModal').style.display = 'none';
  document.body.style.overflow = 'auto';
  document.getElementById('createPostForm').reset();
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('createPostModal');
  if (event.target === modal) {
    hideCreatePostModal();
  }
}

// Removed legacy post menu handlers in favor of global delegated handler

// Filter functions
function filterPosts(filter) {
  const posts = document.querySelectorAll('.post-card');
  const filterTabs = document.querySelectorAll('.filter-tab');

  filterTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === filter);
  });

  posts.forEach(post => {
    let show = true;
    switch(filter) {
      case 'recent':
        show = true;
        break;
      case 'with-images':
        show = post.querySelector('.post-image') !== null;
        break;
      case 'text-only':
        show = post.querySelector('.post-image') === null;
        break;
      case 'all':
      default:
        show = true;
        break;
    }
    post.style.display = show ? 'block' : 'none';
  });
}

function sortPosts(sortBy) {
  const postsContainer = document.querySelector('.posts-feed');
  const posts = Array.from(document.querySelectorAll('.post-card'));

  posts.sort((a, b) => {
    if (sortBy === 'oldest') {
      return 1;
    } else {
      return -1;
    }
  });

  posts.forEach(post => postsContainer.appendChild(post));
}

// Add event listeners for filter tabs
document.addEventListener('DOMContentLoaded', function() {
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      filterPosts(this.dataset.filter);
    });
  });
});

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Church detail image preview functionality
document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('post-image');

  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];

      if (file && file.type.startsWith('image/')) {
        if (file.size > 10 * 1024 * 1024) {
          alert('Image size must be less than 10MB.');
          e.target.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = document.getElementById('imagePreview');
          const previewImg = document.getElementById('previewImg');

          if (preview && previewImg) {
            previewImg.src = event.target.result;
            preview.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
});

function removeImagePreview() {
  const preview = document.getElementById('imagePreview');
  const imageInput = document.getElementById('post-image');

  if (preview) {
    preview.style.display = 'none';
  }

  if (imageInput) {
    imageInput.value = '';
  }
}

// Scroll to a specific post
function scrollToPost(postId) {
  // Wait for tab to activate
  setTimeout(() => {
    const postCard = document.querySelector(`[data-post-id="${postId}"]`);
    if (postCard) {
      postCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a highlight effect
      postCard.style.transition = 'all 0.3s ease';
      postCard.style.boxShadow = '0 0 0 4px rgba(139, 69, 19, 0.3)';
      setTimeout(() => {
        postCard.style.boxShadow = '';
      }, 2000);
    }
  }, 100);
}

/**
 * Opens the location in a maps application using coordinates
 * Tries multiple map services with fallbacks
 */
function openInMaps(lat, lng) {
  // Detect user's device/platform
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /android/i.test(userAgent);
  
  let mapUrl;
  
  if (isIOS) {
    // For iOS devices, try Apple Maps first, fallback to Google Maps
    mapUrl = `maps://maps.apple.com/?q=${lat},${lng}`;
    // Try to open Apple Maps
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = mapUrl;
    document.body.appendChild(iframe);
    
    // Fallback to Google Maps after a short delay if Apple Maps doesn't open
    setTimeout(() => {
      document.body.removeChild(iframe);
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }, 500);
  } else if (isAndroid) {
    // For Android devices, use geo: URI scheme which opens default maps app
    mapUrl = `geo:${lat},${lng}?q=${lat},${lng}`;
    window.location.href = mapUrl;
    
    // Fallback to Google Maps if geo: doesn't work
    setTimeout(() => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }, 1000);
  } else {
    // For desktop/other devices, open Google Maps in a new tab
    mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(mapUrl, '_blank');
  }
}

/**
 * Opens the location in a maps application using address string
 * Used as fallback when coordinates are not available
 */
function openInMapsByAddress(address) {
  // Encode the address for URL
  const encodedAddress = encodeURIComponent(address);
  
  // Detect user's device/platform
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /android/i.test(userAgent);
  
  let mapUrl;
  
  if (isIOS) {
    // For iOS devices, try Apple Maps first
    mapUrl = `maps://maps.apple.com/?q=${encodedAddress}`;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = mapUrl;
    document.body.appendChild(iframe);
    
    // Fallback to Google Maps
    setTimeout(() => {
      document.body.removeChild(iframe);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }, 500);
  } else if (isAndroid) {
    // For Android devices, use geo: URI with address query
    mapUrl = `geo:0,0?q=${encodedAddress}`;
    window.location.href = mapUrl;
    
    // Fallback to Google Maps
    setTimeout(() => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }, 1000);
  } else {
    // For desktop/other devices, open Google Maps in a new tab
    mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapUrl, '_blank');
  }
}




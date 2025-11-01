(function() {
  'use strict';

  // Get modal elements
  const modal = document.getElementById('parishDetailModal');
  const modalOverlay = modal?.querySelector('.parish-modal-overlay');
  const closeButton = modal?.querySelector('.parish-modal-close');
  const churchCards = document.querySelectorAll('.church-card[data-church-id]');

  if (!modal) {
    console.warn('Parish modal not found');
    return;
  }

  // Modal control functions
  function openModal() {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Trigger fade-in animation
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
  }

  function closeModal() {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }, 300);
  }

  // Fetch church details and populate modal
  async function loadChurchDetails(churchId, churchCard) {
    try {
      // Extract data from the card element
      const churchName = churchCard.querySelector('.church-name')?.textContent || 'Church';
      const churchDescription = churchCard.querySelector('.church-description')?.textContent || '';
      const churchAddress = churchCard.querySelector('.church-location')?.textContent || 'Address not available';
      const churchFollowers = churchCard.querySelector('.church-stat')?.textContent || '0 followers';
      const coverImage = churchCard.querySelector('.church-card-image img')?.src || '';
      const isVerified = churchCard.querySelector('.verified-badge') !== null;
      const churchSlug = churchCard.dataset.churchSlug || '';

      // Populate modal with church data
      document.getElementById('modalChurchName').textContent = churchName;
      document.getElementById('modalDescription').textContent = churchDescription || 'No description available.';
      document.getElementById('modalAddress').textContent = churchAddress;
      document.getElementById('modalFollowers').textContent = churchFollowers;

      // Handle cover image
      const modalCoverImage = document.getElementById('modalCoverImage');
      const modalCoverPlaceholder = document.getElementById('modalCoverPlaceholder');
      
      if (coverImage) {
        modalCoverImage.src = coverImage;
        modalCoverImage.style.display = 'block';
        modalCoverPlaceholder.style.display = 'none';
      } else {
        modalCoverImage.style.display = 'none';
        modalCoverPlaceholder.style.display = 'flex';
      }

      // Show verified badge if applicable
      const verifiedBadge = document.getElementById('modalVerifiedBadge');
      verifiedBadge.style.display = isVerified ? 'flex' : 'none';

      // Set the view full button link
      const viewFullButton = document.getElementById('modalViewFullButton');
      if (churchSlug) {
        viewFullButton.href = `/app/church/${churchSlug}/`;
      }

      // Set placeholder values for data we'll fetch
      document.getElementById('modalEmail').textContent = 'Loading...';
      document.getElementById('modalPhone').textContent = 'Loading...';
      document.getElementById('modalServiceTimes').textContent = 'Loading...';

      // Fetch detailed church data and services
      await Promise.all([
        fetchChurchServices(churchId),
        fetchAdditionalChurchData(churchId, churchSlug)
      ]);

    } catch (error) {
      console.error('Error loading church details:', error);
      showErrorMessage('Failed to load parish details. Please try again.');
    }
  }

  // Fetch additional church data (this could be expanded with a dedicated API endpoint)
  async function fetchAdditionalChurchData(churchId, churchSlug) {
    try {
      // For now, we'll use placeholder data
      // In a production environment, you'd create an API endpoint for this
      document.getElementById('modalEmail').textContent = 'Contact via parish page';
      document.getElementById('modalPhone').textContent = 'See parish page for contact';
      document.getElementById('modalServiceTimes').textContent = 'Visit parish page for schedule';
    } catch (error) {
      console.error('Error fetching additional church data:', error);
      document.getElementById('modalEmail').textContent = 'Not available';
      document.getElementById('modalPhone').textContent = 'Not available';
      document.getElementById('modalServiceTimes').textContent = 'Not available';
    }
  }

  // Fetch church services
  async function fetchChurchServices(churchId) {
    const servicesContainer = document.getElementById('modalServicesContainer');
    
    // Show loading state
    servicesContainer.innerHTML = `
      <div class="services-loading">
        <div class="spinner"></div>
        <p>Loading services...</p>
      </div>
    `;

    try {
      const response = await fetch(`/app/api/church/${churchId}/services/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();

      if (data.success && data.services && data.services.length > 0) {
        displayServices(data.services);
      } else {
        servicesContainer.innerHTML = `
          <div class="no-services">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p>No services are currently available for booking at this parish.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      servicesContainer.innerHTML = `
        <div class="services-error">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p>Unable to load services. Please try again later.</p>
        </div>
      `;
    }
  }

  // Display services in the modal
  function displayServices(services) {
    const servicesContainer = document.getElementById('modalServicesContainer');
    
    const servicesHTML = services.map(service => `
      <div class="service-card">
        ${service.image_url ? `
          <div class="service-image">
            <img src="${service.image_url}" alt="${escapeHtml(service.name)}" loading="lazy">
          </div>
        ` : ''}
        <div class="service-content">
          <h4 class="service-name">${escapeHtml(service.name)}</h4>
          <p class="service-description">${escapeHtml(service.description)}</p>
          <div class="service-meta">
            <span class="service-duration">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              ${escapeHtml(service.duration)}
            </span>
            <span class="service-price ${service.is_free ? 'free' : ''}">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              ${escapeHtml(service.price)}
            </span>
          </div>
        </div>
      </div>
    `).join('');

    servicesContainer.innerHTML = servicesHTML || '<p class="no-services-text">No services available.</p>';
  }

  // Show error message
  function showErrorMessage(message) {
    const servicesContainer = document.getElementById('modalServicesContainer');
    servicesContainer.innerHTML = `
      <div class="modal-error">
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Event listeners for church cards
  churchCards.forEach(card => {
    card.addEventListener('click', function(e) {
      // Don't open modal if clicking on a link
      if (e.target.closest('a')) {
        return;
      }

      const churchId = this.dataset.churchId;
      if (churchId) {
        openModal();
        loadChurchDetails(churchId, this);
      }
    });

    // Add hover effect
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-4px)';
    });

    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });

  // Event listeners for closing modal
  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
  }

  // Close modal on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeModal();
    }
  });

  // Prevent scroll on modal content from affecting body
  if (modal) {
    const modalContent = modal.querySelector('.parish-modal-content');
    if (modalContent) {
      modalContent.addEventListener('wheel', function(e) {
        const scrollTop = this.scrollTop;
        const scrollHeight = this.scrollHeight;
        const height = this.clientHeight;
        const delta = e.deltaY;
        const up = delta < 0;

        if (!up && delta + scrollTop + height >= scrollHeight) {
          e.preventDefault();
          this.scrollTop = scrollHeight;
        } else if (up && delta + scrollTop <= 0) {
          e.preventDefault();
          this.scrollTop = 0;
        }
      });
    }
  }

})();

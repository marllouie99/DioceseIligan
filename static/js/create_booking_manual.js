/**
 * Manual Booking Creation for Parish Staff
 * Handles user search, service selection, and booking creation
 */

let userSearchTimeout = null;
let selectedUser = null;
let services = [];
let userMode = 'create'; // 'search' or 'create'
const currentChurchId = window.location.pathname.match(/\/manage-church\/(\d+)/)?.[1];

// Toggle between search and create mode
function toggleUserMode(mode) {
  userMode = mode;
  const searchMode = document.getElementById('searchUserMode');
  const createMode = document.getElementById('createUserMode');
  const searchBtn = document.getElementById('searchUserBtn');
  const createBtn = document.getElementById('createUserBtn');
  
  if (mode === 'search') {
    searchMode.style.display = 'block';
    createMode.style.display = 'none';
    searchBtn.classList.remove('btn-outline');
    searchBtn.classList.add('btn-primary');
    createBtn.classList.remove('btn-primary');
    createBtn.classList.add('btn-outline');
    
    // Clear create mode fields
    document.getElementById('contactName').value = '';
    document.getElementById('contactInfo').value = '';
  } else {
    searchMode.style.display = 'none';
    createMode.style.display = 'block';
    createBtn.classList.remove('btn-outline');
    createBtn.classList.add('btn-primary');
    searchBtn.classList.remove('btn-primary');
    searchBtn.classList.add('btn-outline');
    
    // Clear search mode
    clearUserSelection();
  }
}

// Open modal and load services
function openCreateBookingModal() {
  const modal = document.getElementById('createBookingModal');
  modal.style.display = 'block';
  
  // Load services
  loadServices();
  
  // Set minimum date to today
  const dateInput = document.getElementById('bookingDate');
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
}

// Close modal
function closeCreateBookingModal() {
  const modal = document.getElementById('createBookingModal');
  modal.style.display = 'none';
  
  // Reset form
  document.getElementById('createBookingForm').reset();
  clearUserSelection();
  document.getElementById('createBookingError').style.display = 'none';
}

// Load available services
async function loadServices() {
  try {
    const response = await fetch(`/app/create-booking-manually/?church_id=${currentChurchId}`);
    const data = await response.json();
    
    if (data.success) {
      services = data.services;
      const select = document.getElementById('serviceSelect');
      select.innerHTML = '<option value="">Select a service...</option>';
      
      // Group by category
      const grouped = {};
      services.forEach(service => {
        const category = service.category || 'Uncategorized';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(service);
      });
      
      // Add options
      Object.keys(grouped).sort().forEach(category => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;
        grouped[category].forEach(service => {
          const option = document.createElement('option');
          option.value = service.id;
          option.textContent = service.name;
          option.dataset.price = service.price;
          option.dataset.isFree = service.is_free;
          optgroup.appendChild(option);
        });
        select.appendChild(optgroup);
      });
    }
  } catch (error) {
    console.error('Error loading services:', error);
  }
}

// Handle service selection
document.addEventListener('DOMContentLoaded', function() {
  const serviceSelect = document.getElementById('serviceSelect');
  if (serviceSelect) {
    serviceSelect.addEventListener('change', function() {
      const serviceId = this.value;
      const detailsDiv = document.getElementById('serviceDetails');
      const priceSpan = document.getElementById('servicePrice');
      const durationSpan = document.getElementById('serviceDuration');
      
      if (serviceId) {
        // Find service from loaded services array
        const service = services.find(s => s.id == serviceId);
        
        if (service) {
          let detailsHTML = '';
          
          if (service.is_free) {
            detailsHTML += '<span style="color: #10b981; font-weight: 600;">✓ Free Service</span>';
          } else {
            detailsHTML += `<span style="color: #1f2937; font-weight: 600;">Price: ₱${service.price.toFixed(2)}</span>`;
          }
          
          if (service.duration_minutes) {
            const hours = Math.floor(service.duration_minutes / 60);
            const minutes = service.duration_minutes % 60;
            let durationText = '';
            if (hours > 0) durationText += `${hours}h `;
            if (minutes > 0) durationText += `${minutes}m`;
            detailsHTML += ` &nbsp;|&nbsp; <span style="color: #6b7280;">Duration: ${durationText.trim()}</span>`;
          }
          
          detailsDiv.innerHTML = detailsHTML;
          detailsDiv.style.display = 'block';
        }
      } else {
        detailsDiv.style.display = 'none';
      }
    });
  }
  
  // Payment status change handler
  const paymentStatus = document.getElementById('paymentStatus');
  if (paymentStatus) {
    paymentStatus.addEventListener('change', function() {
      const methodGroup = document.getElementById('paymentMethodGroup');
      if (this.value === 'paid') {
        methodGroup.style.display = 'block';
        document.getElementById('paymentMethod').setAttribute('required', 'required');
      } else {
        methodGroup.style.display = 'none';
        document.getElementById('paymentMethod').removeAttribute('required');
      }
    });
  }
});

// User search functionality
document.addEventListener('DOMContentLoaded', function() {
  const userSearch = document.getElementById('userSearch');
  if (userSearch) {
    userSearch.addEventListener('input', function() {
      clearTimeout(userSearchTimeout);
      const query = this.value.trim();
      
      if (query.length < 2) {
        document.getElementById('userSearchResults').style.display = 'none';
        return;
      }
      
      userSearchTimeout = setTimeout(() => searchUsers(query), 300);
    });
  }
});

async function searchUsers(query) {
  try {
    const response = await fetch(`/app/api/search-users/?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    const resultsDiv = document.getElementById('userSearchResults');
    
    if (data.users && data.users.length > 0) {
      resultsDiv.innerHTML = data.users.map(user => `
        <div class="search-result-item" onclick='selectUser(${JSON.stringify(user)})'>
          ${user.avatar 
            ? `<img src="${user.avatar}" alt="${user.display_name}" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px;">` 
            : `<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; margin-right: 10px;">${user.display_name.charAt(0).toUpperCase()}</div>`
          }
          <div style="flex: 1;">
            <div style="font-weight: 500;">${user.display_name}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">${user.contact_info}</div>
          </div>
        </div>
      `).join('');
      resultsDiv.style.display = 'block';
    } else {
      resultsDiv.innerHTML = '<div style="padding: 12px; text-align: center; color: #6b7280;">No users found</div>';
      resultsDiv.style.display = 'block';
    }
  } catch (error) {
    console.error('Error searching users:', error);
  }
}

function selectUser(user) {
  selectedUser = user;
  
  // Hide search results
  document.getElementById('userSearchResults').style.display = 'none';
  document.getElementById('userSearch').style.display = 'none';
  
  // Show selected user
  document.getElementById('selectedUserId').value = user.id;
  document.getElementById('selectedUserName').textContent = user.display_name;
  document.getElementById('selectedUserEmail').textContent = user.contact_info || 'No contact info';
  
  if (user.avatar) {
    document.getElementById('selectedUserAvatar').src = user.avatar;
    document.getElementById('selectedUserAvatar').style.display = 'block';
  } else {
    document.getElementById('selectedUserAvatar').style.display = 'none';
  }
  
  document.getElementById('selectedUserDisplay').style.display = 'flex';
  document.getElementById('selectedUserDisplay').style.alignItems = 'center';
  document.getElementById('selectedUserDisplay').style.gap = '10px';
}

function clearUserSelection() {
  selectedUser = null;
  document.getElementById('selectedUserId').value = '';
  document.getElementById('userSearch').value = '';
  document.getElementById('userSearch').style.display = 'block';
  document.getElementById('selectedUserDisplay').style.display = 'none';
  document.getElementById('userSearchResults').style.display = 'none';
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('createBookingForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const btn = document.getElementById('createBookingBtn');
      const btnText = document.getElementById('createBookingBtnText');
      const btnLoading = document.getElementById('createBookingBtnLoading');
      const errorDiv = document.getElementById('createBookingError');
      
      // Disable button
      btn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
      errorDiv.style.display = 'none';
      
      try {
        // Validate based on mode
        if (userMode === 'search') {
          if (!document.getElementById('selectedUserId').value) {
            errorDiv.textContent = 'Please select a user from search results.';
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            return;
          }
        } else {
          // Create mode - validate contact info
          const name = document.getElementById('contactName').value.trim();
          const contactInfo = document.getElementById('contactInfo').value.trim();
          
          if (!name) {
            errorDiv.textContent = 'Please enter the contact name.';
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            return;
          }
          
          if (!contactInfo) {
            errorDiv.textContent = 'Please provide email or phone number.';
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            return;
          }
        }
        
        // Parse contact info to determine if it's email or phone
        let contactEmail = '';
        let contactPhone = '';
        
        if (userMode === 'create') {
          const contactInfo = document.getElementById('contactInfo').value.trim();
          // Simple detection: if it contains @, it's email; otherwise phone
          if (contactInfo.includes('@')) {
            contactEmail = contactInfo;
          } else {
            contactPhone = contactInfo;
          }
        }
        
        // Get form data
        const formData = {
          mode: userMode,
          user_id: userMode === 'search' ? document.getElementById('selectedUserId').value : null,
          contact_name: userMode === 'create' ? document.getElementById('contactName').value : null,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          service_id: document.getElementById('serviceSelect').value,
          date: document.getElementById('bookingDate').value,
          start_time: document.getElementById('startTime').value,
          end_time: document.getElementById('endTime').value,
          notes: document.getElementById('bookingNotes').value,
          payment_status: document.getElementById('paymentStatus').value,
          payment_method: document.getElementById('paymentMethod').value,
          auto_approve: document.getElementById('autoApprove').checked
        };
        
        // Get CSRF token
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        // Submit
        const response = await fetch(`/app/create-booking-manually/?church_id=${currentChurchId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Show success message
          alert(`Booking created successfully!\nAppointment ID: ${data.booking.code}\nStatus: ${data.booking.status}`);
          
          // Close modal
          closeCreateBookingModal();
          
          // Reload the appointments list
          window.location.reload();
        } else {
          // Show error
          errorDiv.textContent = data.message || 'Failed to create booking. Please try again.';
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        console.error('Error creating booking:', error);
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.style.display = 'block';
      } finally {
        // Re-enable button
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
      }
    });
  }
});

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('createBookingModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeCreateBookingModal();
      }
    });
  }
});

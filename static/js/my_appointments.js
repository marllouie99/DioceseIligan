/**
 * My Appointments Page JavaScript
 * Handles review modal functionality and form submissions
 */

let currentServiceId = null;

/**
 * Open the review modal with service information
 * @param {number} serviceId - ID of the service to review
 * @param {string} serviceName - Name of the service
 * @param {string} churchName - Name of the church
 * @param {number} bookingId - ID of the booking
 */
function openReviewModal(serviceId, serviceName, churchName, bookingId) {
    currentServiceId = serviceId;
    document.getElementById('modal-service-name').textContent = serviceName;
    document.getElementById('modal-church-name').textContent = 'at ' + churchName;
    document.getElementById('reviewModal').style.display = 'flex';
    
    // Reset form
    document.getElementById('reviewForm').reset();
    document.getElementById('modal-rating').value = '';
    
    // Reset stars
    const stars = document.querySelectorAll('.star-rating-modal .star');
    stars.forEach(star => star.classList.remove('filled'));
}

/**
 * Close the review modal and reset state
 */
function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
    currentServiceId = null;
}

/**
 * Initialize modal event listeners and star rating functionality
 */
function initializeReviewModal() {
    const modal = document.getElementById('reviewModal');
    const stars = document.querySelectorAll('.star-rating-modal .star');
    const reviewForm = document.getElementById('reviewForm');
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeReviewModal();
        }
    });
    
    // Star rating click handlers
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            const rating = index + 1;
            document.getElementById('modal-rating').value = rating;
            
            // Update visual stars
            updateStarDisplay(rating);
        });
        
        star.addEventListener('mouseenter', function() {
            const rating = index + 1;
            updateStarPreview(rating);
        });
    });
    
    // Reset star display on mouse leave
    document.querySelector('.star-rating-modal').addEventListener('mouseleave', function() {
        const currentRating = parseInt(document.getElementById('modal-rating').value) || 0;
        updateStarDisplay(currentRating);
    });
    
    // Form submission handler
    reviewForm.addEventListener('submit', handleReviewSubmission);
}

/**
 * Update star display based on rating
 * @param {number} rating - Rating value (1-5)
 */
function updateStarDisplay(rating) {
    const stars = document.querySelectorAll('.star-rating-modal .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
            star.style.color = '#fbbf24';
        } else {
            star.classList.remove('filled');
            star.style.color = '#d1d5db';
        }
    });
}

/**
 * Update star preview on hover
 * @param {number} rating - Rating value (1-5)
 */
function updateStarPreview(rating) {
    const stars = document.querySelectorAll('.star-rating-modal .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#fbbf24';
        } else {
            star.style.color = '#d1d5db';
        }
    });
}

/**
 * Validate review form data
 * @param {string} rating - Rating value
 * @param {string} title - Review title
 * @param {string} comment - Review comment
 * @returns {Object} Validation result with isValid flag and message
 */
function validateReviewForm(rating, title, comment) {
    if (!rating || rating < 1 || rating > 5) {
        return {
            isValid: false,
            message: 'Please provide a rating between 1 and 5 stars.'
        };
    }
    
    if (!title || title.length < 5) {
        return {
            isValid: false,
            message: 'Please provide a review title with at least 5 characters.'
        };
    }
    
    if (!comment || comment.length < 10) {
        return {
            isValid: false,
            message: 'Please provide a review comment with at least 10 characters.'
        };
    }
    
    return { isValid: true };
}

/**
 * Handle review form submission
 * @param {Event} e - Form submission event
 */
function handleReviewSubmission(e) {
    e.preventDefault();
    
    if (!currentServiceId) {
        alert('Error: No service selected');
        return;
    }
    
    // Get form data
    const rating = document.getElementById('modal-rating').value;
    const title = document.getElementById('modal-title').value.trim();
    const comment = document.getElementById('modal-comment').value.trim();
    
    // Validate form data
    const validation = validateReviewForm(rating, title, comment);
    if (!validation.isValid) {
        alert(validation.message);
        return;
    }
    
    const formData = new FormData(e.target);
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Update button state
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    
    // Submit review
    submitReview(formData, submitButton);
}

/**
 * Submit review to server
 * @param {FormData} formData - Form data to submit
 * @param {HTMLElement} submitButton - Submit button element
 */
function submitReview(formData, submitButton) {
    // Debug form data
    console.log('Form data being sent:');
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }
    
    // Construct review URL using Django template variable
    const reviewUrl = window.djangoUrls.createReviewUrl.replace('0', currentServiceId);
    console.log('Submitting to URL:', reviewUrl);
    
    fetch(reviewUrl, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest',
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Server response:', text);
                throw new Error(`HTTP ${response.status}: ${text}`);
            });
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            alert('Thank you for your review!');
            closeReviewModal();
            // Refresh the page to show updated button state
            location.reload();
        } else {
            alert('Error submitting review: ' + (data.message || 'Please try again'));
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        alert('Error submitting review: ' + error.message);
    })
    .finally(() => {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Review';
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeReviewModal();
});

// Expose functions globally for inline event handlers (if needed)
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;

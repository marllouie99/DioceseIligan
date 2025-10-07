/**
 * Service Reviews JavaScript
 * Handles star ratings, review submission, and helpful votes
 */

class ServiceReviewHandler {
    constructor() {
        this.csrfToken = window.csrfToken || document.querySelector('[name=csrfmiddlewaretoken]')?.value;
        this.serviceId = window.serviceId;
        
        this.init();
    }
    
    init() {
        this.initStarRatings();
        this.initHelpfulButtons();
        this.initFormSubmission();
        
        // Initialize Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    initStarRatings() {
        const starRatings = document.querySelectorAll('.star-rating');
        
        starRatings.forEach(rating => {
            const stars = rating.querySelectorAll('.star');
            const input = this.getAssociatedInput(rating);
            
            stars.forEach((star, index) => {
                star.addEventListener('mouseenter', () => {
                    this.highlightStars(stars, index + 1);
                });
                
                star.addEventListener('mouseleave', () => {
                    const currentRating = parseInt(rating.dataset.rating) || 0;
                    this.highlightStars(stars, currentRating);
                });
                
                star.addEventListener('click', () => {
                    const value = parseInt(star.dataset.value);
                    rating.dataset.rating = value;
                    this.highlightStars(stars, value);
                    
                    if (input) {
                        input.value = value;
                    }
                });
            });
        });
    }
    
    getAssociatedInput(rating) {
        const name = rating.dataset.name;
        if (name) {
            return document.querySelector(`input[name="${name}"]`);
        } else {
            // Default to main rating input
            return document.getElementById('rating');
        }
    }
    
    highlightStars(stars, count) {
        stars.forEach((star, index) => {
            if (index < count) {
                star.classList.add('filled');
            } else {
                star.classList.remove('filled');
            }
        });
    }
    
    initHelpfulButtons() {
        const helpfulButtons = document.querySelectorAll('.helpful-btn');
        
        helpfulButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleHelpful(button);
            });
        });
    }
    
    async toggleHelpful(button) {
        const reviewId = button.dataset.reviewId;
        if (!reviewId) return;
        
        try {
            button.disabled = true;
            
            const response = await fetch(`/app/review/${reviewId}/helpful/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update button state
                if (data.is_helpful) {
                    button.classList.add('active');
                    button.querySelector('.helpful-text').textContent = 'Helpful!';
                } else {
                    button.classList.remove('active');
                    button.querySelector('.helpful-text').textContent = 'Helpful';
                }
                
                // Update count
                button.querySelector('.helpful-count').textContent = data.helpful_count;
                
                // Show toast
                this.showToast(`Review marked as ${data.action === 'added' ? 'helpful' : 'not helpful'}`, 'success');
            } else {
                this.showToast('Error updating helpful vote', 'error');
            }
        } catch (error) {
            console.error('Error toggling helpful vote:', error);
            this.showToast('Error updating helpful vote', 'error');
        } finally {
            button.disabled = false;
        }
    }
    
    initFormSubmission() {
        const form = document.querySelector('.review-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
            }
        });
    }
    
    validateForm() {
        const rating = document.getElementById('rating').value;
        const title = document.getElementById('title').value.trim();
        const comment = document.getElementById('comment').value.trim();
        
        if (!rating || rating < 1 || rating > 5) {
            this.showToast('Please provide a rating between 1 and 5 stars', 'error');
            return false;
        }
        
        if (!title || title.length < 5) {
            this.showToast('Please provide a review title with at least 5 characters', 'error');
            return false;
        }
        
        if (!comment || comment.length < 10) {
            this.showToast('Please provide a review comment with at least 10 characters', 'error');
            return false;
        }
        
        return true;
    }
    
    showToast(message, type = 'info') {
        // Try to use existing toast system
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        
        // Fallback toast system
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Style the toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            maxWidth: '300px',
            backgroundColor: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'
        });
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });
        
        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ServiceReviewHandler();
});

// Export for potential external use
window.ServiceReviewHandler = ServiceReviewHandler;

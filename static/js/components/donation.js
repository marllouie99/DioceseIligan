/**
 * Donation functionality with PayPal and Stripe integration
 */

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('donation-modal');
    if (!modal) return;
    
    const closeBtn = document.getElementById('donation-modal-close');
    const amountBtns = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('custom-amount');
    const messageInput = document.getElementById('donation-message');
    const messageCharCount = document.getElementById('message-char-count');
    const errorMessage = document.getElementById('donation-error-message');
    
    let currentPostId = null;
    let currentChurchSlug = null;
    let currentPostData = {};
    let currentPaymentMethod = 'paypal'; // Default to PayPal
    
    // Stripe Elements
    let stripe = null;
    let stripeElements = null;
    let stripeCardElement = null;
    
    // Open donation modal when clicking "Donate" button
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-donate')) {
            e.preventDefault();
            const btn = e.target.closest('.btn-donate');
            currentPostId = btn.dataset.postId;
            currentChurchSlug = btn.dataset.churchSlug;
            
            // Fetch post data and open modal
            fetchPostData(currentPostId);
        }
    });
    
    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDonationModal);
    }
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target.classList.contains('modal-overlay')) {
            closeDonationModal();
        }
    });
    
    // ESC key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeDonationModal();
        }
    });
    
    // Amount button selection
    amountBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            amountBtns.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            customAmountInput.value = this.dataset.amount;
            
            clearError();
            renderPayPalButton();
        });
    });
    
    // Custom amount input
    customAmountInput.addEventListener('input', function() {
        amountBtns.forEach(b => b.classList.remove('selected'));
        clearError();
        
        const amount = parseFloat(this.value);
        if (amount >= 10) {
            renderPayPalButton();
        }
    });
    
    // Message character counter
    if (messageInput && messageCharCount) {
        messageInput.addEventListener('input', function() {
            messageCharCount.textContent = this.value.length;
        });
    }
    
    // Payment method tab switching
    const paymentTabs = document.querySelectorAll('.payment-tab');
    const paypalSection = document.getElementById('paypal-payment-section');
    const stripeSection = document.getElementById('stripe-payment-section');
    
    paymentTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const method = this.dataset.method;
            
            // Update active tab
            paymentTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Switch payment sections
            if (method === 'paypal') {
                currentPaymentMethod = 'paypal';
                paypalSection.style.display = 'block';
                stripeSection.style.display = 'none';
                
                // Re-render PayPal button if amount is set
                const amount = parseFloat(customAmountInput.value);
                if (amount >= 10) {
                    renderPayPalButton();
                }
            } else if (method === 'stripe') {
                currentPaymentMethod = 'stripe';
                paypalSection.style.display = 'none';
                stripeSection.style.display = 'block';
                
                // Initialize Stripe if not already done
                if (!stripeCardElement) {
                    initializeStripe();
                }
            }
            
            clearError();
        });
    });
    
    // Initialize Stripe
    function initializeStripe() {
        if (typeof Stripe === 'undefined') {
            console.error('Stripe.js not loaded');
            return;
        }
        
        // Get Stripe publishable key from template
        const stripeKey = document.querySelector('meta[name="stripe-key"]')?.content || 
                         window.STRIPE_PUBLISHABLE_KEY;
        
        if (!stripeKey) {
            console.error('Stripe publishable key not found');
            return;
        }
        
        stripe = Stripe(stripeKey);
        stripeElements = stripe.elements();
        
        // Create card element
        stripeCardElement = stripeElements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#32325d',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    '::placeholder': {
                        color: '#aab7c4'
                    }
                },
                invalid: {
                    color: '#fa755a',
                    iconColor: '#fa755a'
                }
            }
        });
        
        stripeCardElement.mount('#stripe-card-element');
        
        // Handle card errors
        stripeCardElement.on('change', function(event) {
            const cardErrors = document.getElementById('stripe-card-errors');
            if (event.error) {
                cardErrors.textContent = event.error.message;
                cardErrors.style.display = 'block';
            } else {
                cardErrors.style.display = 'none';
            }
        });
        
        // Handle Stripe payment submission
        const stripeSubmitBtn = document.getElementById('stripe-submit-btn');
        if (stripeSubmitBtn) {
            stripeSubmitBtn.addEventListener('click', handleStripePayment);
        }
    }
    
    function fetchPostData(postId) {
        // Get post data from the card
        const postCard = document.querySelector(`[data-post-id="${postId}"]`).closest('.post-card');
        if (!postCard) {
            showError('Post not found');
            return;
        }
        
        // Extract post information
        const churchName = postCard.querySelector('.post-author-name')?.textContent || 'Church';
        const postText = postCard.querySelector('.post-text')?.textContent.trim().substring(0, 100) || 'Support this cause';
        
        // Check for event title
        const eventTitle = postCard.querySelector('.event-title')?.textContent || null;
        const title = eventTitle || postText;
        
        // Check for donation goal
        const goalElement = postCard.querySelector('.stat-goal');
        const goal = goalElement ? goalElement.textContent : null;
        
        currentPostData = {
            id: postId,
            title: title,
            churchName: churchName,
            goal: goal
        };
        
        openDonationModal();
    }
    
    function openDonationModal() {
        // Populate modal with post data
        document.getElementById('donation-post-id').value = currentPostId;
        document.getElementById('donation-church-slug').value = currentChurchSlug;
        document.getElementById('donation-post-title').textContent = currentPostData.title;
        document.getElementById('donation-church-name').textContent = currentPostData.churchName;
        
        // Show goal if available
        const goalInfo = document.getElementById('donation-goal-info');
        const goalAmount = document.getElementById('donation-goal-amount');
        if (currentPostData.goal) {
            goalAmount.textContent = currentPostData.goal;
            goalInfo.style.display = 'flex';
        } else {
            goalInfo.style.display = 'none';
        }
        
        modal.style.display = 'flex';
        modal.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        
        // Reset form
        document.getElementById('donation-form').reset();
        customAmountInput.value = '';
        amountBtns.forEach(b => b.classList.remove('selected'));
        messageCharCount.textContent = '0';
        clearError();
        
        // Clear PayPal button
        document.getElementById('paypal-button-container').innerHTML = 
            '<p style="text-align: center; color: #6b7280;">Select an amount to continue</p>';
    }
    
    function closeDonationModal() {
        modal.style.display = 'none';
        modal.classList.remove('modal-open');
        document.body.style.overflow = '';
        currentPostId = null;
        currentChurchSlug = null;
        currentPostData = {};
    }
    
    function renderPayPalButton() {
        const amount = parseFloat(customAmountInput.value);
        
        if (!amount || amount < 10) {
            document.getElementById('paypal-button-container').innerHTML = 
                '<p class="error-message" style="display: block;">Please enter an amount of at least ₱10</p>';
            return;
        }
        
        // Clear previous button
        const container = document.getElementById('paypal-button-container');
        container.innerHTML = '';
        
        // Check if PayPal SDK is loaded
        if (typeof paypal === 'undefined') {
            container.innerHTML = '<p class="error-message" style="display: block;">PayPal is not available. Please refresh the page.</p>';
            return;
        }
        
        // Render PayPal button
        paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'paypal'
            },
            
            createOrder: function(data, actions) {
                // Show loading
                container.style.opacity = '0.6';
                clearError();
                
                return fetch(`/app/donations/create/${currentPostId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': getCsrfToken()
                    },
                    body: new URLSearchParams({
                        'amount': amount,
                        'message': document.getElementById('donation-message').value,
                        'is_anonymous': document.getElementById('donation-anonymous').checked
                    })
                })
                .then(response => response.json())
                .then(data => {
                    container.style.opacity = '1';
                    
                    if (data.success && data.order_id) {
                        return data.order_id;
                    } else {
                        throw new Error(data.message || 'Failed to create donation order');
                    }
                })
                .catch(error => {
                    container.style.opacity = '1';
                    showError(error.message);
                    throw error;
                });
            },
            
            onApprove: function(data, actions) {
                // Show loading
                container.style.opacity = '0.6';
                showError('Processing your donation...');
                
                // Capture the order
                return fetch(`/app/donations/capture/${currentPostId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': getCsrfToken()
                    },
                    body: new URLSearchParams({
                        'order_id': data.orderID
                    })
                })
                .then(response => response.json())
                .then(result => {
                    container.style.opacity = '1';
                    
                    if (result.success) {
                        // Redirect to success page
                        window.location.href = result.redirect_url || `/app/donations/success/${currentPostId}/`;
                    } else {
                        showError(result.message || 'Failed to complete donation');
                    }
                })
                .catch(error => {
                    container.style.opacity = '1';
                    showError('Error completing donation. Please contact support.');
                    console.error('Capture error:', error);
                });
            },
            
            onCancel: function(data) {
                // Call cancel endpoint
                if (data.orderID) {
                    fetch(`/app/donations/cancel/${currentPostId}/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'X-CSRFToken': getCsrfToken()
                        },
                        body: new URLSearchParams({
                            'order_id': data.orderID
                        })
                    }).catch(err => console.error('Cancel error:', err));
                }
                
                closeDonationModal();
                showMessage('Donation cancelled', 'info');
            },
            
            onError: function(err) {
                console.error('PayPal error:', err);
                
                // Don't show error for popup close (user cancelled)
                if (err && err.message && err.message.includes('popup close')) {
                    closeDonationModal();
                    showMessage('Payment window was closed', 'info');
                } else {
                    showError('Payment error occurred. Please try again.');
                }
            }
        }).render('#paypal-button-container');
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    function clearError() {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }
    
    function showMessage(message, type) {
        // Create temporary message
        const msg = document.createElement('div');
        msg.className = `notification ${type}`;
        msg.textContent = message;
        msg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'info' ? '#3b82f6' : '#10b981'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            msg.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => msg.remove(), 300);
        }, 3000);
    }
    
    async function handleStripePayment() {
        const amount = parseFloat(customAmountInput.value);
        
        if (!amount || amount < 10) {
            showError('Please enter an amount of at least ₱10');
            return;
        }
        
        if (!stripeCardElement) {
            showError('Payment form not initialized');
            return;
        }
        
        const submitBtn = document.getElementById('stripe-submit-btn');
        const buttonText = document.getElementById('stripe-button-text');
        const spinner = document.getElementById('stripe-spinner');
        
        // Disable button and show loading
        submitBtn.disabled = true;
        buttonText.textContent = 'Processing...';
        if (spinner) spinner.style.display = 'inline-block';
        clearError();
        
        try {
            // Create Payment Intent
            const response = await fetch(`/app/donations/stripe/create/${currentPostId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': getCsrfToken()
                },
                body: new URLSearchParams({
                    'amount': amount,
                    'message': document.getElementById('donation-message').value,
                    'is_anonymous': document.getElementById('donation-anonymous').checked
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to create payment');
            }
            
            // Confirm card payment
            const result = await stripe.confirmCardPayment(data.client_secret, {
                payment_method: {
                    card: stripeCardElement,
                }
            });
            
            if (result.error) {
                // Show error to customer
                showError(result.error.message);
                submitBtn.disabled = false;
                buttonText.textContent = 'Donate Now';
                if (spinner) spinner.style.display = 'none';
            } else {
                // Payment succeeded
                if (result.paymentIntent.status === 'succeeded') {
                    // Confirm payment on server
                    const confirmResponse = await fetch(`/app/donations/stripe/confirm/${currentPostId}/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'X-CSRFToken': getCsrfToken()
                        },
                        body: new URLSearchParams({
                            'payment_intent_id': result.paymentIntent.id
                        })
                    });
                    
                    const confirmData = await confirmResponse.json();
                    
                    if (confirmData.success) {
                        // Redirect to success page
                        window.location.href = confirmData.redirect_url || `/app/donations/success/${currentPostId}/`;
                    } else {
                        showError(confirmData.message || 'Failed to confirm payment');
                        submitBtn.disabled = false;
                        buttonText.textContent = 'Donate Now';
                        if (spinner) spinner.style.display = 'none';
                    }
                }
            }
        } catch (error) {
            console.error('Stripe payment error:', error);
            showError(error.message || 'An error occurred while processing your payment');
            submitBtn.disabled = false;
            buttonText.textContent = 'Donate Now';
            if (spinner) spinner.style.display = 'none';
        }
    }
    
    function getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]').value;
    }
});

# PayPal Donation Integration Guide

## 🎯 Overview
Complete guide for integrating PayPal donations into ChurchIligan platform.

## 📋 Prerequisites

### 1. PayPal Developer Account Setup
- ✅ Go to https://developer.paypal.com/
- ✅ Sign in with your PayPal account
- ✅ Access Dashboard > Sandbox > Accounts

### 2. Create Sandbox Test Accounts
You need TWO sandbox accounts:

**A. Business Account (Church/Receiver)**
- Type: Business
- Email: ramdar-sandbox@gmail.com (PH)
- Purpose: Receives donations
- Already created ✅

**B. Personal Account (Donor/Sender)** - Create this
- Type: Personal
- Email: donor-sandbox@gmail.com
- Purpose: Test making donations
- Needs funds for testing

### 3. Create PayPal App (Current Step)
Based on your screenshot:

**Settings:**
```
App Name: Church Iligan
Type: Merchant ✅
Sandbox Account: ramdar-sandbox@gmail.com (PH) ✅
```

**After clicking "Create App", you'll receive:**
- Client ID: `AXXXxxxXXXxxx...` (Save this!)
- Secret: `EXXXxxxXXXxxx...` (Save this!)

## 🔐 Environment Variables Setup

Add to your `.env` file:

```env
# PayPal Configuration
PAYPAL_MODE=sandbox  # Change to 'live' for production
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_secret_here
PAYPAL_WEBHOOK_ID=your_webhook_id_here  # Get this after creating webhook

# Currency
PAYPAL_CURRENCY=PHP

# URLs
SITE_URL=http://localhost:8000
```

## 📦 Install Required Packages

```bash
pip install paypalrestsdk
pip install python-decouple  # For environment variables
```

Update `requirements.txt`:
```txt
paypalrestsdk==1.13.3
python-decouple==3.8
```

## 🗄️ Database Models

Create `core/models.py` additions:

```python
class Donation(models.Model):
    """Track all donations made to posts."""
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('paypal', 'PayPal'),
        ('gcash', 'GCash'),
        ('paymongo', 'PayMongo'),
        ('bank', 'Bank Transfer'),
    ]
    
    # Core fields
    post = models.ForeignKey('Post', on_delete=models.CASCADE, related_name='donations')
    donor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='donations_made')
    
    # Donation details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='PHP')
    message = models.TextField(blank=True, help_text="Optional message from donor")
    is_anonymous = models.BooleanField(default=False, help_text="Hide donor name from public")
    
    # Payment details
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='paypal')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # PayPal specific fields
    paypal_order_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    paypal_payer_id = models.CharField(max_length=255, blank=True, null=True)
    paypal_payer_email = models.EmailField(blank=True, null=True)
    paypal_transaction_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['post', 'payment_status']),
            models.Index(fields=['paypal_order_id']),
        ]
    
    def __str__(self):
        donor_name = self.get_donor_name()
        return f"{donor_name} donated ₱{self.amount} to {self.post.church.name}"
    
    def get_donor_name(self):
        """Get donor display name."""
        if self.is_anonymous:
            return "Anonymous"
        elif self.donor:
            profile = getattr(self.donor, 'profile', None)
            if profile and profile.full_name:
                return profile.full_name
            return self.donor.username
        elif self.paypal_payer_email:
            return self.paypal_payer_email.split('@')[0]
        return "Anonymous"
    
    @property
    def is_completed(self):
        return self.payment_status == 'completed'
    
    def mark_as_completed(self):
        """Mark donation as completed."""
        from django.utils import timezone
        self.payment_status = 'completed'
        self.completed_at = timezone.now()
        self.save()
```

Update `Post` model to include donation aggregates:

```python
class Post(models.Model):
    # ... existing fields ...
    
    def get_donation_stats(self):
        """Get donation statistics for this post."""
        from django.db.models import Sum, Count
        
        completed_donations = self.donations.filter(payment_status='completed')
        
        stats = completed_donations.aggregate(
            total_raised=Sum('amount'),
            donor_count=Count('id', distinct=True)
        )
        
        total_raised = stats['total_raised'] or 0
        donor_count = stats['donor_count'] or 0
        
        progress_percentage = 0
        if self.donation_goal:
            progress_percentage = min((total_raised / self.donation_goal) * 100, 100)
        
        return {
            'total_raised': total_raised,
            'donor_count': donor_count,
            'goal': self.donation_goal,
            'progress_percentage': progress_percentage,
        }
```

## 🔄 Create Migration

```bash
python manage.py makemigrations
python manage.py migrate
```

## ⚙️ PayPal Configuration

Create `core/payment_config.py`:

```python
"""PayPal payment configuration."""
import paypalrestsdk
from decouple import config

# PayPal SDK Configuration
paypalrestsdk.configure({
    "mode": config('PAYPAL_MODE', default='sandbox'),  # sandbox or live
    "client_id": config('PAYPAL_CLIENT_ID'),
    "client_secret": config('PAYPAL_CLIENT_SECRET')
})

# Payment settings
PAYPAL_CURRENCY = config('PAYPAL_CURRENCY', default='PHP')
SITE_URL = config('SITE_URL', default='http://localhost:8000')
```

## 🎨 Frontend: Donation Modal

Create `templates/partials/donation_modal.html`:

```html
<!-- Donation Modal -->
<div id="donation-modal" class="modal" style="display: none;">
  <div class="modal-content donation-modal-content">
    <div class="modal-header">
      <h3 class="modal-title">
        <svg class="modal-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        Make a Donation
      </h3>
      <button type="button" class="modal-close">&times;</button>
    </div>
    
    <div class="modal-body">
      <!-- Post Info -->
      <div class="donation-post-info">
        <h4 id="donation-post-title"></h4>
        <p id="donation-church-name"></p>
      </div>
      
      <!-- Donation Form -->
      <form id="donation-form">
        {% csrf_token %}
        <input type="hidden" id="donation-post-id" name="post_id">
        
        <!-- Amount Selection -->
        <div class="form-group">
          <label class="form-label">Select Amount</label>
          <div class="amount-options">
            <button type="button" class="amount-btn" data-amount="100">₱100</button>
            <button type="button" class="amount-btn" data-amount="500">₱500</button>
            <button type="button" class="amount-btn" data-amount="1000">₱1,000</button>
            <button type="button" class="amount-btn" data-amount="2000">₱2,000</button>
            <button type="button" class="amount-btn" data-amount="5000">₱5,000</button>
          </div>
          
          <div class="custom-amount-wrapper">
            <label for="custom-amount" class="form-label">Or enter custom amount</label>
            <div class="input-with-prefix">
              <span class="input-prefix">₱</span>
              <input type="number" id="custom-amount" name="amount" class="form-input" 
                     placeholder="0.00" min="10" step="0.01" required>
            </div>
          </div>
        </div>
        
        <!-- Message -->
        <div class="form-group">
          <label for="donation-message" class="form-label">Message (Optional)</label>
          <textarea id="donation-message" name="message" class="form-input" rows="3" 
                    placeholder="Share why you're donating..." maxlength="500"></textarea>
        </div>
        
        <!-- Anonymous Option -->
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="donation-anonymous" name="is_anonymous">
            <span>Donate anonymously</span>
          </label>
        </div>
        
        <!-- PayPal Button Container -->
        <div id="paypal-button-container"></div>
        
        <p class="donation-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          You'll be redirected to PayPal to complete your donation securely.
        </p>
      </form>
    </div>
  </div>
</div>
```

## 💻 Backend: Views

Create `core/donation_views.py`:

```python
"""Donation views for PayPal integration."""
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from decimal import Decimal
import paypalrestsdk
import json
import logging

from .models import Post, Donation
from .payment_config import PAYPAL_CURRENCY, SITE_URL

logger = logging.getLogger(__name__)


@login_required
@require_POST
def create_donation_order(request, post_id):
    """Create a PayPal order for donation."""
    try:
        post = get_object_or_404(Post, id=post_id, is_active=True, enable_donation=True)
        
        # Get form data
        amount = Decimal(request.POST.get('amount', 0))
        message = request.POST.get('message', '').strip()
        is_anonymous = request.POST.get('is_anonymous') == 'true'
        
        # Validate amount
        if amount < 10:
            return JsonResponse({
                'success': False,
                'message': 'Minimum donation amount is ₱10'
            }, status=400)
        
        # Create PayPal payment
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": f"{SITE_URL}/donations/execute/{post.id}/",
                "cancel_url": f"{SITE_URL}/donations/cancel/{post.id}/"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": f"Donation to {post.church.name}",
                        "sku": f"donation-post-{post.id}",
                        "price": str(amount),
                        "currency": PAYPAL_CURRENCY,
                        "quantity": 1
                    }]
                },
                "amount": {
                    "total": str(amount),
                    "currency": PAYPAL_CURRENCY
                },
                "description": f"Donation for: {post.content[:100]}"
            }]
        })
        
        if payment.create():
            # Create donation record
            donation = Donation.objects.create(
                post=post,
                donor=request.user,
                amount=amount,
                currency=PAYPAL_CURRENCY,
                message=message,
                is_anonymous=is_anonymous,
                payment_method='paypal',
                payment_status='pending',
                paypal_order_id=payment.id
            )
            
            # Get approval URL
            approval_url = None
            for link in payment.links:
                if link.rel == "approval_url":
                    approval_url = link.href
                    break
            
            return JsonResponse({
                'success': True,
                'approval_url': approval_url,
                'order_id': payment.id
            })
        else:
            logger.error(f"PayPal payment creation failed: {payment.error}")
            return JsonResponse({
                'success': False,
                'message': 'Failed to create payment. Please try again.'
            }, status=500)
            
    except Exception as e:
        logger.error(f"Donation order creation error: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'An error occurred. Please try again.'
        }, status=500)


@login_required
@require_http_methods(["GET"])
def execute_donation(request, post_id):
    """Execute PayPal payment after approval."""
    try:
        post = get_object_or_404(Post, id=post_id)
        
        payment_id = request.GET.get('paymentId')
        payer_id = request.GET.get('PayerID')
        
        if not payment_id or not payer_id:
            return render(request, 'donations/failed.html', {
                'message': 'Invalid payment parameters'
            })
        
        # Get the payment
        payment = paypalrestsdk.Payment.find(payment_id)
        
        # Execute the payment
        if payment.execute({"payer_id": payer_id}):
            # Update donation record
            donation = Donation.objects.get(paypal_order_id=payment_id)
            donation.payment_status = 'completed'
            donation.completed_at = timezone.now()
            donation.paypal_payer_id = payer_id
            donation.paypal_transaction_id = payment.transactions[0].related_resources[0].sale.id
            donation.paypal_payer_email = payment.payer.payer_info.email
            donation.save()
            
            # Send notification email to church owner
            # TODO: Implement email notification
            
            return render(request, 'donations/success.html', {
                'donation': donation,
                'post': post
            })
        else:
            logger.error(f"PayPal payment execution failed: {payment.error}")
            return render(request, 'donations/failed.html', {
                'message': 'Payment execution failed'
            })
            
    except Donation.DoesNotExist:
        return render(request, 'donations/failed.html', {
            'message': 'Donation record not found'
        })
    except Exception as e:
        logger.error(f"Donation execution error: {str(e)}")
        return render(request, 'donations/failed.html', {
            'message': 'An error occurred'
        })


@login_required
@require_http_methods(["GET"])
def cancel_donation(request, post_id):
    """Handle cancelled donation."""
    post = get_object_or_404(Post, id=post_id)
    
    payment_id = request.GET.get('token')
    if payment_id:
        try:
            donation = Donation.objects.get(paypal_order_id=payment_id)
            donation.payment_status = 'cancelled'
            donation.save()
        except Donation.DoesNotExist:
            pass
    
    return render(request, 'donations/cancelled.html', {
        'post': post
    })


@csrf_exempt
@require_POST
def paypal_webhook(request):
    """Handle PayPal webhook notifications."""
    try:
        # Verify webhook signature
        # TODO: Implement webhook signature verification
        
        event_body = json.loads(request.body)
        event_type = event_body.get('event_type')
        
        if event_type == 'PAYMENT.SALE.COMPLETED':
            # Handle successful payment
            resource = event_body.get('resource', {})
            payment_id = resource.get('parent_payment')
            
            donation = Donation.objects.get(paypal_order_id=payment_id)
            if donation.payment_status != 'completed':
                donation.mark_as_completed()
                # Send notification
        
        elif event_type == 'PAYMENT.SALE.REFUNDED':
            # Handle refund
            resource = event_body.get('resource', {})
            sale_id = resource.get('sale_id')
            
            donation = Donation.objects.get(paypal_transaction_id=sale_id)
            donation.payment_status = 'refunded'
            donation.save()
        
        return JsonResponse({'status': 'success'})
        
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        return JsonResponse({'status': 'error'}, status=500)
```

## 🛣️ URL Configuration

Add to `core/urls.py`:

```python
from django.urls import path
from . import donation_views

app_name = 'core'

urlpatterns = [
    # ... existing URLs ...
    
    # Donation URLs
    path('donations/create/<int:post_id>/', donation_views.create_donation_order, name='create_donation'),
    path('donations/execute/<int:post_id>/', donation_views.execute_donation, name='execute_donation'),
    path('donations/cancel/<int:post_id>/', donation_views.cancel_donation, name='cancel_donation'),
    path('donations/webhook/', donation_views.paypal_webhook, name='paypal_webhook'),
]
```

## 🎨 Frontend JavaScript

Create `static/js/components/donation.js`:

```javascript
/**
 * Donation functionality with PayPal integration
 */

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('donation-modal');
    const closeBtn = modal.querySelector('.modal-close');
    const amountBtns = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('custom-amount');
    
    let currentPostId = null;
    let currentChurchSlug = null;
    
    // Open donation modal
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-donate')) {
            e.preventDefault();
            const btn = e.target.closest('.btn-donate');
            currentPostId = btn.dataset.postId;
            currentChurchSlug = btn.dataset.churchSlug;
            
            openDonationModal(currentPostId);
        }
    });
    
    // Close modal
    closeBtn.addEventListener('click', closeDonationModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeDonationModal();
        }
    });
    
    // Amount button selection
    amountBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            amountBtns.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            customAmountInput.value = this.dataset.amount;
            
            renderPayPalButton();
        });
    });
    
    // Custom amount input
    customAmountInput.addEventListener('input', function() {
        amountBtns.forEach(b => b.classList.remove('selected'));
        renderPayPalButton();
    });
    
    function openDonationModal(postId) {
        currentPostId = postId;
        modal.style.display = 'flex';
        document.getElementById('donation-post-id').value = postId;
        
        // Reset form
        document.getElementById('donation-form').reset();
        customAmountInput.value = '';
        amountBtns.forEach(b => b.classList.remove('selected'));
        
        // Load PayPal button
        renderPayPalButton();
    }
    
    function closeDonationModal() {
        modal.style.display = 'none';
        currentPostId = null;
    }
    
    function renderPayPalButton() {
        const amount = parseFloat(customAmountInput.value);
        
        if (!amount || amount < 10) {
            document.getElementById('paypal-button-container').innerHTML = 
                '<p class="error-message">Please enter an amount of at least ₱10</p>';
            return;
        }
        
        // Clear previous button
        document.getElementById('paypal-button-container').innerHTML = '';
        
        // Render PayPal button
        paypal.Buttons({
            createOrder: function() {
                const formData = new FormData();
                formData.append('amount', amount);
                formData.append('message', document.getElementById('donation-message').value);
                formData.append('is_anonymous', document.getElementById('donation-anonymous').checked);
                formData.append('csrfmiddlewaretoken', window.csrfToken);
                
                return fetch(`/donations/create/${currentPostId}/`, {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        return data.order_id;
                    } else {
                        throw new Error(data.message);
                    }
                });
            },
            onApprove: function(data) {
                // Redirect to execute URL
                window.location.href = `/donations/execute/${currentPostId}/?paymentId=${data.orderID}&PayerID=${data.payerID}`;
            },
            onCancel: function() {
                closeDonationModal();
                showMessage('Donation cancelled', 'info');
            },
            onError: function(err) {
                console.error('PayPal error:', err);
                showMessage('Payment error occurred', 'error');
            }
        }).render('#paypal-button-container');
    }
    
    function showMessage(message, type) {
        // Implement your notification system
        alert(message);
    }
});
```

## 📄 Success/Cancel Templates

Create `templates/donations/success.html`:

```html
{% extends 'layouts/app_base.html' %}

{% block title %}Donation Successful{% endblock %}

{% block content %}
<div class="donation-result success">
  <div class="result-icon">
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  </div>
  
  <h1>Thank You for Your Donation!</h1>
  
  <div class="donation-details">
    <p class="amount">₱{{ donation.amount|floatformat:2 }}</p>
    <p class="church">to {{ post.church.name }}</p>
  </div>
  
  <p class="message">Your generous donation has been received. A confirmation email has been sent to you.</p>
  
  <div class="actions">
    <a href="{% url 'core:church_detail' post.church.slug %}" class="btn-primary">Back to Church</a>
    <a href="{% url 'accounts:dashboard' %}" class="btn-secondary">Go to Dashboard</a>
  </div>
</div>
{% endblock %}
```

## 🧪 Testing

### Test in Sandbox Mode:

1. **Use Sandbox Credentials:**
   - Business Account: `ramdar-sandbox@gmail.com`
   - Personal Account: Create in PayPal Developer Dashboard

2. **Test Flow:**
   ```
   1. Click "Donate" button on post
   2. Enter amount (₱100)
   3. Click PayPal button
   4. Login with PERSONAL sandbox account
   5. Complete payment
   6. Verify redirect to success page
   7. Check donation in database
   ```

3. **Test Cases:**
   - ✅ Successful payment
   - ✅ Cancelled payment
   - ✅ Invalid amount
   - ✅ Anonymous donation
   - ✅ Multiple donations to same post

## 🚀 Going Live

When ready for production:

1. **Update .env:**
   ```env
   PAYPAL_MODE=live
   PAYPAL_CLIENT_ID=<your_live_client_id>
   PAYPAL_CLIENT_SECRET=<your_live_client_secret>
   ```

2. **Create Live App in PayPal:**
   - Go to PayPal Developer Dashboard
   - Create new app for LIVE environment
   - Get Live credentials

3. **SSL Certificate:**
   - Ensure your site has HTTPS
   - PayPal requires SSL for live mode

4. **Webhook URL:**
   - Set webhook URL to your production domain
   - `https://yourdomain.com/donations/webhook/`

## 📊 Admin Interface

Add to `core/admin.py`:

```python
from django.contrib import admin
from .models import Donation

@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_donor_name', 'post', 'amount', 'payment_status', 'created_at']
    list_filter = ['payment_status', 'payment_method', 'is_anonymous', 'created_at']
    search_fields = ['donor__username', 'post__church__name', 'paypal_transaction_id']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    
    fieldsets = (
        ('Donation Info', {
            'fields': ('post', 'donor', 'amount', 'currency', 'message', 'is_anonymous')
        }),
        ('Payment Details', {
            'fields': ('payment_method', 'payment_status', 'paypal_order_id', 
                      'paypal_payer_id', 'paypal_transaction_id', 'paypal_payer_email')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at')
        }),
    )
```

## ✅ Checklist

Before going live:

- [ ] PayPal app created and configured
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Donation model tested
- [ ] PayPal integration tested in sandbox
- [ ] Success/cancel pages created
- [ ] Email notifications implemented
- [ ] Webhook configured and tested
- [ ] SSL certificate installed
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Tax receipt system (if needed)

## 🎉 You're Ready!

Your donation system is now set up with PayPal Sandbox. Test thoroughly before going live!

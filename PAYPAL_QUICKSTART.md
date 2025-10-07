# PayPal Donation System - Quick Start Guide

## ✅ Step-by-Step Setup

### **Step 1: Create PayPal Sandbox App** (You're Here Now!)

In the PayPal Developer Dashboard form you have open:

1. **App Name:** `Church Iligan` ✅ (Already filled)
2. **Type:** `Merchant` ✅ (Already selected)
3. **Sandbox Account:** `ramdar-sandbox@gmail.com (PH)` ✅ (Already selected)
4. **Click "Create App"** button

### **Step 2: Save Your Credentials**

After clicking "Create App", you'll see:
```
Client ID: AXXXxxxXXXxxx...
Secret: EXXXxxxXXXxxx...
```

**COPY BOTH IMMEDIATELY!**

### **Step 3: Create .env File**

Create `c:\Users\asus\CascadeProjects\ChurchIligan\.env`:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True

# PayPal Sandbox Configuration
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=paste_your_client_id_here
PAYPAL_CLIENT_SECRET=paste_your_secret_here
PAYPAL_CURRENCY=PHP
SITE_URL=http://localhost:8000

# Database (if using PostgreSQL)
# DATABASE_URL=postgresql://user:password@localhost/churchiligan

# Email (Optional for now)
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
```

### **Step 4: Install Required Packages**

Open PowerShell in your project directory:

```powershell
cd c:\Users\asus\CascadeProjects\ChurchIligan
pip install paypalrestsdk==1.13.3 python-decouple==3.8
pip freeze > requirements.txt
```

### **Step 5: Run Database Migrations**

The Donation model has been added to `core/models.py`. Create the database table:

```powershell
python manage.py makemigrations
python manage.py migrate
```

### **Step 6: Update Post Card Template**

Update `templates/partials/post_card.html` to show real donation stats:

Find the donation card section and update to use dynamic data:

```html
{% if post.enable_donation %}
<div class="donation-card">
  <div class="donation-header">
    <svg class="donation-heart-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
    <span class="donation-title">Support This {% if post.post_type == 'event' %}Event{% elif post.post_type == 'prayer' %}Prayer{% else %}Cause{% endif %}</span>
  </div>
  
  <div class="donation-info">
    <div class="donation-stats-wrapper">
      {% with stats=post.get_donation_stats %}
      {% if post.donation_goal %}
      <div class="donation-stats">
        <span class="stat-amount">₱{{ stats.total_raised|floatformat:0 }} raised</span>
        <span class="stat-separator">•</span>
        <span class="stat-goal">₱{{ post.donation_goal|floatformat:0 }} goal</span>
        <span class="stat-separator">•</span>
        <span class="stat-donors">{{ stats.donor_count }} donor{{ stats.donor_count|pluralize }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {{ stats.progress_percentage }}%"></div>
      </div>
      {% else %}
      <div class="donation-stats">
        <span class="stat-amount">₱{{ stats.total_raised|floatformat:0 }} raised</span>
        <span class="stat-separator">•</span>
        <span class="stat-donors">{{ stats.donor_count }} donor{{ stats.donor_count|pluralize }}</span>
      </div>
      {% endif %}
      {% endwith %}
    </div>
    <button class="btn-donate" data-post-id="{{ post.id }}" data-church-slug="{{ post.church.slug }}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      Donate
    </button>
  </div>
</div>
{% endif %}
```

### **Step 7: Add Donation Stats Method to Post Model**

Add this method to your `Post` model in `core/models.py` (around line 600):

```python
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

### **Step 8: Test the Setup**

1. **Run the development server:**
   ```powershell
   python manage.py runserver
   ```

2. **Access Django Admin:**
   - Go to `http://localhost:8000/admin/`
   - Login
   - Check if "Donations" appears in the menu

3. **Create a test post with donations:**
   - Go to dashboard
   - Create a post
   - Enable donations
   - Set goal (e.g., ₱50,000)
   - Check if donation badge and card appear

## 📝 What's Been Done

✅ **Donation Model** - Added to `core/models.py`
✅ **Admin Interface** - Registered in `core/admin.py`
✅ **Database Ready** - Just need to run migrations

## 🚀 Next Steps (After Basic Setup Works)

1. **Create donation views** - Handle PayPal payments
2. **Create donation modal** - UI for making donations
3. **Add PayPal JavaScript SDK** - Frontend integration
4. **Test with sandbox** - Use test PayPal accounts
5. **Add email notifications** - Notify churches of donations
6. **Create donation history page** - Show all donations

## 📚 Reference Files

- **Complete Guide:** `PAYPAL_INTEGRATION_GUIDE.md`
- **Donation Model:** `core/models.py` (line 1177)
- **Admin:** `core/admin.py` (line 333)
- **Post Card Template:** `templates/partials/post_card.html`

## 🆘 Troubleshooting

**If migrations fail:**
```powershell
python manage.py migrate --fake-initial
```

**If .env variables not loading:**
```powershell
pip install python-decouple
```

**Check Django can import models:**
```powershell
python manage.py shell
>>> from core.models import Donation
>>> Donation.objects.all()
```

## 🎯 Current Status

You are at: **Step 1 - Creating PayPal Sandbox App**

After clicking "Create App":
1. Save credentials
2. Add to .env file
3. Run migrations
4. Test in admin panel

Then proceed to build the donation flow (views, templates, JavaScript).

---

**Ready to proceed? Click that "Create App" button! 🚀**

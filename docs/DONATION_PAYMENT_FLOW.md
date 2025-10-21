# Donation Payment Flow Documentation

## 🎯 Overview

This document explains how the church-specific donation payment system works in ChurchIligan.

## 📋 System Architecture

### **Option Implemented: Church Profile Payment Setup**

Churches must configure their PayPal email in their Church Profile **before** they can enable donations on posts.

## 🔄 Payment Flow

### **Step 1: Church Setup (One-Time)**

1. Church owner navigates to **Manage Church → Settings Tab**
2. Clicks on **Payment Settings** in the sidebar
3. Enters their PayPal email address
4. Saves the church profile

**Status Indicator:**
- ⚠️ Yellow warning dot appears if PayPal email is not set
- ✅ Green checkmark when PayPal email is configured

### **Step 2: Creating Donation-Enabled Posts**

1. Church creates a new post (general or event)
2. Toggles "Enable Donations" checkbox
3. **Validation occurs:**
   - ✅ If `church.paypal_email` exists → Post can be created
   - ❌ If `church.paypal_email` is empty → Error message shown:
     ```
     "Please set up your PayPal email in Church Profile settings before 
     enabling donations. This is required to receive donation payments directly."
     ```

### **Step 3: Donor Makes a Donation**

1. Donor clicks "Donate" button on a post
2. **Backend validation:**
   - Checks if `post.enable_donation == True`
   - Checks if `post.church.paypal_email` exists
   - If missing → Error: "This church has not set up their payment method yet"
3. Donor enters amount, message, and anonymous preference
4. PayPal payment is created with:
   - **Payee email**: `post.church.paypal_email`
   - **Transaction description**: Includes church name and cause
   - **Item description**: References church PayPal email

### **Step 4: Payment Processing**

1. Payment goes to **platform's PayPal account** (via configured credentials)
2. Transaction includes church's PayPal email in the payee field
3. Donation record stores:
   - `donor` - Who donated
   - `post` - Which post received the donation
   - `amount` - Donation amount
   - `church.paypal_email` - Where funds should go

### **Step 5: Fund Distribution**

**Current Implementation:**
- Funds collect in platform's PayPal account
- Platform must manually/automatically transfer to churches using:
  - PayPal Mass Payouts API
  - Manual PayPal transfers
  - Scheduled batch transfers

**Future Enhancement:**
- Implement PayPal Payouts API for automatic distribution
- Add payout schedule configuration
- Create payout history tracking

## 📊 Database Schema

### **Church Model**
```python
class Church(models.Model):
    # ... existing fields ...
    paypal_email = models.EmailField(
        blank=True, 
        null=True, 
        help_text="PayPal email for receiving donations"
    )
```

### **Donation Model**
```python
class Donation(models.Model):
    post = models.ForeignKey('Post', ...)
    donor = models.ForeignKey(User, ...)
    amount = models.DecimalField(...)
    payment_method = models.CharField(default='paypal')
    payment_status = models.CharField(...)  # pending, completed, failed
    paypal_order_id = models.CharField(...)
    # ... other fields ...
```

## 🎨 User Interface

### **Church Settings - Payment Section**

**Location:** Manage Church → Settings → Payment Settings

**Features:**
1. **Status Alert:**
   - Warning (yellow) if PayPal not configured
   - Success (green) if PayPal configured
   
2. **PayPal Email Field:**
   - Input field with validation
   - Help text explaining importance
   - Shows current configured email
   
3. **How It Works Section:**
   - Step-by-step donation flow
   - Explanation of fund transfer
   
4. **Setup Instructions:**
   - Link to PayPal.com
   - Steps to create PayPal Business account
   - Verification requirements

## ✅ Validation Rules

### **Church Profile Form**
- PayPal email is **optional** (not required to create church)
- Must be valid email format if provided

### **Post Creation/Update Form**
- If `enable_donation == True`:
  - Church **must** have `paypal_email` set
  - Otherwise, validation error is raised

### **Donation Creation**
- Post must exist and be active
- Post must have `enable_donation == True`
- Church must have `paypal_email` set
- Amount must be ≥ ₱10

## 🔒 Security Considerations

1. **PayPal Email Validation:**
   - Email format validation
   - No verification that email is active PayPal account (user responsibility)

2. **Payment Processing:**
   - Uses platform's PayPal credentials (secure)
   - Church email stored in transaction metadata
   - No direct access to donor payment info

3. **Fund Distribution:**
   - Platform acts as intermediary
   - Requires trust between churches and platform
   - Manual/API payouts provide audit trail

## 🚀 Future Enhancements

### **Phase 1: Automatic Payouts**
- Integrate PayPal Payouts API
- Schedule automatic transfers (daily/weekly/monthly)
- Email notifications for payouts

### **Phase 2: Multiple Payment Methods**
- Add GCash support
- Add bank transfer option
- Add PayMongo integration

### **Phase 3: Advanced Features**
- Payout history dashboard
- Tax receipt generation
- Donation analytics per church
- Refund handling

### **Phase 4: Direct Church Payments**
- Allow churches to use their own PayPal apps
- Implement PayPal Partner/Marketplace API
- True peer-to-peer donations

## 📝 Important Notes

### **Current Limitations**

1. **Not Direct Church-to-Donor:**
   - Payments go through platform account
   - Requires manual/API distribution
   - Platform fee potential exists

2. **PayPal Only:**
   - No alternative payment methods yet
   - Philippines-specific considerations needed
   - Currency limited to configured option (PHP)

3. **Email Verification:**
   - System doesn't verify if PayPal email is valid
   - Church responsible for accuracy
   - Invalid email = failed transfers

### **Best Practices**

1. **For Churches:**
   - Use PayPal Business account
   - Verify email address with PayPal
   - Keep contact info updated
   - Monitor donation notifications

2. **For Platform Admin:**
   - Process payouts regularly
   - Monitor donation records
   - Handle disputes promptly
   - Maintain audit trail

3. **For Donors:**
   - Check church is verified
   - Save donation receipts
   - Contact church for questions
   - Report suspicious activity

## 🧪 Testing Guide

### **Test Scenarios**

1. **Church Setup:**
   - [ ] Create church without PayPal email
   - [ ] Try to enable donations on post → Should fail
   - [ ] Add PayPal email to church profile
   - [ ] Enable donations on post → Should succeed

2. **Donation Flow:**
   - [ ] Click donate on post without church PayPal → Error
   - [ ] Click donate on post with church PayPal → Success
   - [ ] Complete payment in PayPal sandbox
   - [ ] Verify donation record created
   - [ ] Check email notifications sent

3. **Validation:**
   - [ ] Invalid PayPal email format → Form error
   - [ ] Amount < ₱10 → Validation error
   - [ ] Anonymous donation → Name hidden
   - [ ] Donation with message → Message stored

## 📧 Notifications

### **Email Notifications Sent:**

1. **To Church Owner:**
   - New donation received
   - Donation details (amount, donor, message)
   - Link to view donation in admin

2. **To Donor:**
   - Donation confirmation
   - Receipt with transaction ID
   - Church contact information

3. **To Platform Admin:**
   - Daily/weekly donation summary
   - Payout reminders
   - Dispute notifications

## 🔗 Related Files

### **Models:**
- `core/models.py` - Church, Donation models

### **Forms:**
- `core/forms.py` - ChurchUpdateForm, PostForm

### **Views:**
- `core/donation_views.py` - Payment processing
- `core/views.py` - Church management

### **Templates:**
- `templates/partials/manage/settings/payment_settings.html`
- `templates/partials/manage/settings_sidebar.html`

### **Migrations:**
- `core/migrations/0025_add_church_paypal_email.py`

## 📞 Support

For questions or issues:
- Check PayPal Sandbox documentation
- Review PAYPAL_INTEGRATION_GUIDE.md
- Test in sandbox before going live
- Contact PayPal support for account issues

---

**Last Updated:** 2025-10-07  
**Version:** 1.0  
**Status:** Production Ready (Sandbox Testing Required)

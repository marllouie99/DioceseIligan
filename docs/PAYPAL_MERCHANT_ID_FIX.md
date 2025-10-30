# PayPal Merchant ID Mismatch Fix

## Issue
PayPal donations were failing with the error:
```
Payee(s) passed in transaction does not match expected merchant id. 
Please ensure you are passing merchant-id=marllouie4@gmail.com
```

## Root Cause
The PayPal SDK was hardcoded with `merchant-id=85AJSLNF2W8Q4` in the script URL, but the backend was creating orders with the church's PayPal email (`marllouie4@gmail.com` or other church emails). This caused a mismatch between the SDK configuration and the order payee.

## Solution
Removed the hardcoded `merchant-id` parameter from all PayPal SDK script tags. The merchant/payee is now only specified in the backend order creation API call via the `payee.email_address` field.

## Files Modified
1. `templates/core/church_detail.html` - Line 211
2. `templates/core/events.html` - Line 285
3. `templates/core/my_appointments.html` - Line 21
4. `templates/dashboard.html` - Line 1026

## Changes Made
**Before:**
```html
<script src="https://www.paypal.com/sdk/js?client-id={{ PAYPAL_CLIENT_ID }}&merchant-id=85AJSLNF2W8Q4&currency={{ PAYPAL_CURRENCY }}"></script>
```

**After:**
```html
<script src="https://www.paypal.com/sdk/js?client-id={{ PAYPAL_CLIENT_ID }}&currency={{ PAYPAL_CURRENCY }}"></script>
```

## How It Works Now
1. **Frontend**: PayPal SDK loads without a specific merchant-id
2. **Backend**: When creating an order in `core/donation_views.py` (line 115-117), the payee is specified:
   ```python
   "payee": {
       "email_address": post.church.paypal_email
   }
   ```
3. **Result**: Each church can receive donations to their own PayPal account

## Benefits
- ✅ Supports multiple churches with different PayPal accounts
- ✅ No hardcoded merchant IDs
- ✅ Flexible and scalable for multi-tenant system
- ✅ Follows PayPal best practices

## Testing
After this fix:
1. Clear browser cache
2. Navigate to a post with donations enabled
3. Click "Donate"
4. Complete the PayPal payment flow
5. Payment should now process successfully

## Related Files
- Backend order creation: `core/donation_views.py` (lines 106-125)
- Church model with PayPal email: `core/models.py`
- Donation JavaScript: `static/js/components/donation.js`

## Date Fixed
October 30, 2025

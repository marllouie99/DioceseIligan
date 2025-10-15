# Stripe Credit Card Payment Integration

## Overview
This guide documents the integration of Stripe payment processing for credit card donations alongside the existing PayPal payment system.

## Features Added
- ✅ Credit card payment option using Stripe
- ✅ Dual payment method support (PayPal + Stripe)
- ✅ Payment method tabs in donation modal
- ✅ Secure payment processing with Stripe Elements
- ✅ Payment Intent API for 3D Secure support
- ✅ Webhook support for payment confirmations
- ✅ Credit Card display in donation history

## Files Modified

### Backend Changes

#### 1. **core/models.py**
- Added `'stripe'` to `PAYMENT_METHOD_CHOICES` as `'Credit Card'`
- Added Stripe-specific fields:
  - `stripe_payment_intent_id` - Unique payment intent ID
  - `stripe_charge_id` - Charge ID after successful payment
  - `stripe_customer_id` - Customer ID (optional)
  - `stripe_payment_method_id` - Payment method ID

#### 2. **core/donation_views.py**
- Imported `stripe` library
- Added Stripe configuration (API keys)
- Created new views:
  - `create_stripe_payment_intent()` - Creates payment intent
  - `confirm_stripe_payment()` - Confirms successful payment
  - `stripe_webhook()` - Handles Stripe webhook events

#### 3. **core/urls.py**
- Added Stripe donation endpoints:
  - `/app/donations/stripe/create/<post_id>/`
  - `/app/donations/stripe/confirm/<post_id>/`
  - `/app/donations/stripe/webhook/`

#### 4. **core/views.py**
- Added `STRIPE_PUBLISHABLE_KEY` to context processor

### Frontend Changes

#### 5. **templates/partials/donation_modal.html**
- Added payment method selection tabs (PayPal/Credit Card)
- Added Stripe card element container
- Added Stripe submit button with loading spinner
- Separated PayPal and Stripe payment sections

#### 6. **static/js/components/donation.js**
- Added Stripe Elements initialization
- Added payment method tab switching
- Added `handleStripePayment()` function
- Integrated Stripe card validation
- Added payment confirmation flow

#### 7. **templates/dashboard.html, church_detail.html, events.html**
- Added Stripe.js SDK script tag
- Added `window.STRIPE_PUBLISHABLE_KEY` variable

#### 8. **templates/partials/manage/donations_tab.html**
- Updated to display "Credit Card" badge for Stripe payments
- Added conditional rendering for payment method icons

#### 9. **static/css/components/donation.css**
- Added styles for payment method tabs
- Added Stripe card element styles
- Added payment method badge styles (PayPal/Stripe)
- Added loading spinner animation

### Configuration Files

#### 10. **.env**
- Added Stripe configuration:
  ```
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=
  ```

#### 11. **.env.example**
- Added Stripe configuration template

#### 12. **requirements.txt**
- Added `stripe==11.1.1`

### Database Migration

#### 13. **core/migrations/0031_add_stripe_support.py**
- Added Stripe-specific fields to Donation model
- Updated payment method choices

## Setup Instructions

### 1. Install Dependencies
```bash
pip install stripe==11.1.1
```

### 2. Configure Environment Variables
Add to your `.env` file:
```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Run Migrations
```bash
python manage.py migrate
```

### 4. Test Stripe Integration
Use Stripe test cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

Any future expiry date and any 3-digit CVC will work.

## Payment Flow

### Stripe Payment Flow
1. User selects "Credit Card" payment method
2. Stripe Elements loads card input form
3. User enters card details
4. User clicks "Donate Now"
5. Frontend creates Payment Intent via `/donations/stripe/create/`
6. Stripe.js confirms card payment with 3D Secure if needed
7. Frontend confirms payment via `/donations/stripe/confirm/`
8. User redirected to success page
9. Webhook confirms payment asynchronously

### PayPal Payment Flow (Existing)
1. User selects "PayPal" payment method
2. PayPal button renders
3. User clicks PayPal button
4. Redirects to PayPal for authentication
5. Returns and captures payment
6. Redirects to success page

## Webhook Configuration

### For Production (Render)
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.onrender.com/app/donations/stripe/webhook/`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET` env var

### For Local Testing
Use Stripe CLI:
```bash
stripe listen --forward-to localhost:8000/app/donations/stripe/webhook/
```

## Render Deployment

### Environment Variables to Set on Render
```
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Important**: For production, use live keys (`pk_live_...` and `sk_live_...`) instead of test keys.

## Security Considerations

1. **API Keys**: Never commit real API keys to version control
2. **Webhook Signature**: Always verify webhook signatures
3. **HTTPS**: Stripe requires HTTPS in production (Render provides this)
4. **PCI Compliance**: Stripe Elements handles card data, so you never touch card numbers
5. **Client Secret**: Payment Intent client secret is single-use and expires

## Testing Checklist

- [ ] Can switch between PayPal and Credit Card tabs
- [ ] Stripe card element loads correctly
- [ ] Card validation works (invalid card shows error)
- [ ] Payment processes successfully with test card
- [ ] Donation record created with correct payment method
- [ ] Success page displays after payment
- [ ] Donation appears in "Recent Donations" with "Credit Card" badge
- [ ] Email notification sent to church owner
- [ ] Webhook processes payment confirmation

## Troubleshooting

### Stripe.js Not Loading
- Check if `STRIPE_PUBLISHABLE_KEY` is set in environment
- Verify script tag in template: `<script src="https://js.stripe.com/v3/"></script>`
- Check browser console for errors

### Payment Intent Creation Fails
- Verify `STRIPE_SECRET_KEY` is correct
- Check minimum amount (₱10 = 1000 cents)
- Review server logs for Stripe API errors

### Webhook Not Working
- Verify webhook secret matches Stripe dashboard
- Check endpoint URL is accessible
- Review webhook logs in Stripe dashboard
- Ensure CSRF exemption on webhook view

### Card Element Not Mounting
- Check if Stripe.js loaded before donation.js
- Verify `#stripe-card-element` div exists in DOM
- Check browser console for initialization errors

## API Reference

### Create Payment Intent
**Endpoint**: `POST /app/donations/stripe/create/<post_id>/`

**Request Body**:
```
amount=100.00
message=Optional message
is_anonymous=false
```

**Response**:
```json
{
  "success": true,
  "client_secret": "pi_xxx_secret_xxx",
  "donation_id": 123
}
```

### Confirm Payment
**Endpoint**: `POST /app/donations/stripe/confirm/<post_id>/`

**Request Body**:
```
payment_intent_id=pi_xxx
```

**Response**:
```json
{
  "success": true,
  "donation_id": 123,
  "redirect_url": "/app/donations/success/1/"
}
```

## Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)

For integration issues:
- Check server logs: `python manage.py runserver`
- Review browser console for JavaScript errors
- Test with Stripe test cards

## Future Enhancements

- [ ] Add support for recurring donations
- [ ] Implement refund functionality
- [ ] Add donation receipt generation
- [ ] Support multiple currencies
- [ ] Add Apple Pay / Google Pay
- [ ] Implement saved payment methods
- [ ] Add donation analytics dashboard

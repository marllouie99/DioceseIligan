# Stripe Integration - Quick Start Guide

## 🚀 Quick Deploy to Render

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Add Stripe credit card payment integration"
git push origin main
```

### 2. Add Environment Variables on Render
Go to your Render dashboard → Environment tab and add:

```
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

STRIPE_SECRET_KEY=sk_test_your_secret_key_here

STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Deploy
Render will automatically:
- Install stripe package
- Run migrations
- Deploy your app

### 4. Set Up Webhook (After Deploy)
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://your-app.onrender.com/app/donations/stripe/webhook/`
4. Events to select:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy webhook signing secret
6. Add to Render as `STRIPE_WEBHOOK_SECRET`
7. Restart service

### 5. Test It!
Visit your site and test donation with:
- **Card**: 4242 4242 4242 4242
- **Expiry**: Any future date
- **CVC**: Any 3 digits

---

## 🧪 Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Declined |
| 4000 0025 0000 3155 | 🔐 Requires 3D Secure |

---

## ✅ What's New

### For Users:
- Can now pay with credit/debit cards directly
- No PayPal account needed
- Faster checkout experience

### For Church Admins:
- See "Credit Card" badge in donations table
- Same email notifications
- All donations tracked in one place

---

## 🔧 Troubleshooting

### Stripe not showing up?
Check: Environment variables set on Render

### Payment fails?
Check: Using test card numbers above

### Webhook not working?
Check: Webhook secret matches Stripe dashboard

---

## 📞 Quick Links

- **Stripe Dashboard**: https://dashboard.stripe.com/test/dashboard
- **Test Cards**: https://stripe.com/docs/testing
- **Webhook Logs**: https://dashboard.stripe.com/test/webhooks

---

## 🎯 Go Live Checklist

When ready for real payments:

- [ ] Get live API keys from Stripe
- [ ] Update STRIPE_PUBLISHABLE_KEY (pk_live_...)
- [ ] Update STRIPE_SECRET_KEY (sk_live_...)
- [ ] Set up live webhook endpoint
- [ ] Test with small real donation
- [ ] Monitor first few transactions
- [ ] Enable Stripe Radar (fraud protection)

---

**That's it! Your donation system now accepts both PayPal and Credit Cards! 🎉**

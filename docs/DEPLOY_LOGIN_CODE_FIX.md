# Login Code Email Fix - Deployment Guide

## Problem
Login code emails were not being sent on the live Render hosting because:
1. BREVO_API_KEY was not configured in the environment
2. DEFAULT_FROM_EMAIL was using an unverified Gmail address

## Solution Applied
Updated the following files:
- `render.yaml` - Added BREVO_API_KEY and corrected DEFAULT_FROM_EMAIL
- `accounts/email_utils.py` - Switched login code emails to use Brevo API
- `ChurchIligan/settings/base.py` - Added BREVO_API_KEY configuration

## Deploy to Render

### Step 1: Commit Changes
```bash
git add .
git commit -m "Fix: Add Brevo API key for login code emails"
```

### Step 2: Push to Repository
```bash
git push origin main
```

### Step 3: Wait for Render Deployment
- Render will automatically detect the changes and redeploy
- This usually takes 3-5 minutes
- You can monitor the deployment in your Render dashboard

### Step 4: Test on Live Site
1. Visit: https://churchiligan.onrender.com/login-with-code/
2. Enter your email address
3. Check your inbox for the login code
4. The email should arrive within 1-2 minutes

## What Changed

### Email Sender
- **Before**: `ChurchConnect <marllouie4@gmail.com>` (unverified)
- **After**: `ChurchConnect <979d0a001@smtp-brevo.com>` (verified Brevo sender)

### Email Delivery Method
- **Before**: Django send_mail() with SMTP (unreliable on free hosting)
- **After**: Brevo HTTP API (reliable, works on all hosting)

### Environment Variables Added
```yaml
BREVO_API_KEY: [Your Brevo API key - configured in render.yaml]
DEFAULT_FROM_EMAIL: ChurchConnect <979d0a001@smtp-brevo.com>
```

## Verification

### Check Render Logs
After deployment, check the Render logs for:
```
✓ Email sent successfully via Brevo API to [email] (Message ID: ...)
```

### If Still Not Working
1. Check Render environment variables in dashboard
2. Verify BREVO_API_KEY is set correctly
3. Check Render logs for any errors
4. Ensure the Brevo sender email (979d0a001@smtp-brevo.com) is verified in your Brevo account

## Brevo Account Info
- **Sender Email**: 979d0a001@smtp-brevo.com
- **API Key**: Configured in render.yaml
- **Free Tier**: 300 emails/day

## Notes
- Login codes expire after 15 minutes
- Rate limit: 1 code per 2 minutes per email
- Emails are sent via Brevo API for better deliverability
- The same fix applies to verification emails (already using Brevo API)

## Next Steps (Optional)
Consider switching password reset emails to Brevo API as well for consistency.

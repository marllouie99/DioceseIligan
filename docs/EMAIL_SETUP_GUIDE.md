# Email Setup Guide for ChurchConnect

## Overview
ChurchConnect uses **Brevo (formerly Sendinblue)** for sending transactional emails (verification codes, login codes, password resets) because it works reliably on free hosting platforms like Render.

## Why Brevo Instead of SMTP?
- **Render Free Tier Limitation**: Render's free tier blocks outbound SMTP connections (port 587/465)
- **Brevo HTTP API**: Works via HTTPS (port 443) which is never blocked
- **Reliability**: Better delivery rates and monitoring
- **Free Tier**: 300 emails/day free forever

## Setup Instructions

### 1. Create a Brevo Account
1. Go to [https://www.brevo.com/](https://www.brevo.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key
1. Log in to Brevo dashboard
2. Go to **Settings** → **SMTP & API** → **API Keys**
3. Click **Generate a new API key**
4. Copy the key (starts with `xkeysib-`)
5. **IMPORTANT**: Save this key securely - you won't be able to see it again

### 3. Add a Verified Sender
1. In Brevo dashboard, go to **Senders**
2. Add a sender email (e.g., `noreply@yourdomain.com` or use Brevo's SMTP relay)
3. For free accounts, you can use: `your-account@smtp-brevo.com`
4. Verify the sender email

### 4. Configure Environment Variables

#### For Local Development (.env file)
```env
BREVO_API_KEY=xkeysib-your-actual-api-key-here
DEFAULT_FROM_EMAIL=ChurchConnect <your-verified-sender@smtp-brevo.com>
```

#### For Render (Production)
1. Go to your Render dashboard
2. Select your web service
3. Go to **Environment** tab
4. Add these environment variables:

| Key | Value | Example |
|-----|-------|---------|
| `BREVO_API_KEY` | Your Brevo API key | `xkeysib-abc123...` |
| `DEFAULT_FROM_EMAIL` | Your verified sender | `ChurchConnect <979d0a001@smtp-brevo.com>` |

5. Click **Save Changes**
6. Render will automatically redeploy your service

### 5. Test Email Sending

#### Test Locally
```bash
python manage.py shell
```

```python
from accounts.email_utils import send_verification_code

# Test sending a verification code
result = send_verification_code('your-test-email@gmail.com')
if result:
    print(f"✓ Email sent! Code: {result.code}")
else:
    print("✗ Email failed to send")
```

#### Check Logs on Render
1. Go to your Render service
2. Click **Logs** tab
3. Look for messages like:
   - `✓ Email sent successfully via Brevo API`
   - `✗ BREVO_API_KEY not configured` (if missing)
   - `✗ Brevo API error` (if API key is invalid)

## Troubleshooting

### Emails Not Sending on Render

**Symptom**: Users don't receive verification/login codes

**Diagnosis**:
1. Check Render logs for error messages
2. Look for: `✗ BREVO_API_KEY not configured`

**Solution**:
1. Verify `BREVO_API_KEY` is set in Render environment variables
2. Verify `DEFAULT_FROM_EMAIL` is set
3. Redeploy the service after adding variables
4. Check Brevo dashboard → **Statistics** to see if emails were sent

### "BREVO_API_KEY not configured" Error

**Cause**: Environment variable not set on hosting platform

**Fix**:
1. Add `BREVO_API_KEY` to Render environment variables
2. Ensure no typos in the variable name
3. Redeploy

### Emails Sent But Not Received

**Possible Causes**:
1. **Spam folder**: Check recipient's spam/junk folder
2. **Invalid sender**: Sender email not verified in Brevo
3. **Brevo account suspended**: Check Brevo dashboard for warnings
4. **Daily limit reached**: Free tier has 300 emails/day limit

**Fix**:
1. Verify sender email in Brevo dashboard
2. Check Brevo **Statistics** page for delivery status
3. Ask recipients to check spam folder
4. Add your sender domain to recipient's safe senders list

### API Key Invalid Error

**Symptom**: `✗ Brevo API error: 401 Unauthorized`

**Fix**:
1. Generate a new API key in Brevo dashboard
2. Update `BREVO_API_KEY` in Render environment variables
3. Redeploy

## Email Types Sent by ChurchConnect

| Email Type | Template | Purpose |
|------------|----------|---------|
| Email Verification | `emails/verification_code.html` | Verify email during registration |
| Login Code | `emails/login_code.html` | Passwordless login |
| Password Reset | `emails/password_reset_code.html` | Reset forgotten password |
| Church Verification Approved | `emails/church_verification_approved.html` | Notify church owner of approval |
| Church Verification Rejected | `emails/church_verification_rejected.html` | Notify church owner of rejection |

## Monitoring Email Delivery

### Brevo Dashboard
1. Go to **Statistics** → **Email**
2. View:
   - Emails sent
   - Delivery rate
   - Bounce rate
   - Open rate (if tracking enabled)

### Application Logs
- Check Render logs for email send confirmations
- Look for Brevo API message IDs in successful sends

## Security Best Practices

1. **Never commit API keys to Git**
   - Use `.env` for local development
   - Add `.env` to `.gitignore`
   - Use environment variables on hosting platforms

2. **Rotate API keys periodically**
   - Generate new key every 6-12 months
   - Update in all environments

3. **Use verified senders only**
   - Prevents emails being marked as spam
   - Improves delivery rates

## Alternative: SMTP Configuration (Not Recommended for Render)

If you're using a different hosting platform that allows SMTP:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-brevo-login-email@example.com
EMAIL_HOST_PASSWORD=your-brevo-smtp-key
```

**Note**: Render free tier blocks SMTP, so use the HTTP API instead.

## Support

- **Brevo Support**: [https://help.brevo.com/](https://help.brevo.com/)
- **Brevo API Docs**: [https://developers.brevo.com/](https://developers.brevo.com/)
- **ChurchConnect Issues**: Check application logs on Render

## Quick Checklist for Production

- [ ] Brevo account created and verified
- [ ] API key generated
- [ ] Sender email verified in Brevo
- [ ] `BREVO_API_KEY` set in Render environment
- [ ] `DEFAULT_FROM_EMAIL` set in Render environment
- [ ] Service redeployed after adding variables
- [ ] Test email sent successfully
- [ ] Checked Brevo dashboard for delivery confirmation

---

**Last Updated**: October 12, 2025

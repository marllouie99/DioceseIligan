# Brevo (Sendinblue) Email Setup Guide

## Overview

Brevo is an excellent email service for production use with generous free tier and better deliverability than Gmail SMTP.

## Why Choose Brevo?

| Feature | Brevo | Gmail SMTP |
|---------|-------|------------|
| Free Tier | 300 emails/day | Limited |
| Port Blocking | ✅ No issues | ❌ Often blocked |
| Deliverability | ✅ Excellent | ⚠️ Variable |
| Analytics | ✅ Dashboard | ❌ None |
| Spam Score | ✅ Low | ⚠️ Higher |
| Setup Time | 5 minutes | Already done |

---

## Setup Option 1: SMTP (Recommended - Easiest)

**No code changes needed!** Just update environment variables.

### Step 1: Create Brevo Account

1. Go to https://www.brevo.com
2. Sign up for free account
3. Complete email verification

### Step 2: Get SMTP Credentials

1. In Brevo dashboard, go to: **Settings** → **SMTP & API** → **SMTP**
2. Click **Generate a new SMTP key**
3. Copy the credentials:
   - Server: `smtp-relay.brevo.com`
   - Port: `587`
   - Login: Your Brevo account email
   - Password: The generated SMTP key (starts with `xsmtpsib-`)

### Step 3: Verify Sender Email

**Important**: Brevo requires sender verification to prevent spam.

1. In Brevo dashboard: **Senders, Domains & Dedicated IPs** → **Senders**
2. Click **Add a sender**
3. Enter: `marllouie4@gmail.com`
4. Check your Gmail inbox for verification email from Brevo
5. Click the verification link

### Step 4: Update Render Environment Variables

1. Go to **Render Dashboard** → Your Service → **Environment**
2. Update these variables:

```
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_HOST_USER=marllouie4@gmail.com
EMAIL_HOST_PASSWORD=xsmtpsib-your-generated-smtp-key-here
```

**Keep these unchanged:**
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_USE_TLS=True
EMAIL_TIMEOUT=10
DEFAULT_FROM_EMAIL=ChurchConnect <marllouie4@gmail.com>
```

### Step 5: Deploy

1. Click **Manual Deploy** in Render dashboard
2. Or just **Restart** the service (environment changes don't require rebuild)

### Step 6: Test

1. Go to https://churchiligan.onrender.com
2. Try registration
3. Check email - should arrive within seconds
4. Check Brevo dashboard → **Statistics** to see email status

---

## Setup Option 2: Brevo API (Advanced - Better Performance)

Use Brevo's API for faster email sending and better error handling.

### Step 1-3: Same as SMTP Option

Complete Steps 1-3 from SMTP setup above.

### Step 4: Get API Key

1. In Brevo dashboard: **Settings** → **SMTP & API** → **API Keys**
2. Click **Generate a new API key**
3. Name it "ChurchIligan Production"
4. Copy the API key (starts with `xkeysib-`)

### Step 5: Install Brevo SDK

Uncomment in `requirements.txt`:

```python
# Email service (optional - for Brevo API)
sib-api-v3-sdk==7.6.0
```

### Step 6: Create Brevo Email Backend

Create `accounts/brevo_backend.py`:

```python
"""
Brevo (Sendinblue) email backend for Django
"""
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class BrevoEmailBackend(BaseEmailBackend):
    """
    Email backend using Brevo's API for better performance and reliability
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        
        # Configure API client
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = settings.BREVO_API_KEY
        self.api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )
    
    def send_messages(self, email_messages):
        """
        Send one or more EmailMessage objects and return the number sent.
        """
        if not email_messages:
            return 0
        
        num_sent = 0
        for message in email_messages:
            try:
                sent = self._send(message)
                if sent:
                    num_sent += 1
            except Exception as e:
                logger.error(f"Failed to send email via Brevo: {e}")
                if not self.fail_silently:
                    raise
        
        return num_sent
    
    def _send(self, message):
        """
        Send a single email message via Brevo API
        """
        try:
            # Prepare email data
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": recipient} for recipient in message.to],
                sender={"email": settings.EMAIL_HOST_USER, "name": "ChurchConnect"},
                subject=message.subject,
                html_content=message.alternatives[0][0] if message.alternatives else None,
                text_content=message.body,
            )
            
            # Add CC and BCC if present
            if message.cc:
                send_smtp_email.cc = [{"email": email} for email in message.cc]
            if message.bcc:
                send_smtp_email.bcc = [{"email": email} for email in message.bcc]
            
            # Send email
            api_response = self.api_instance.send_transac_email(send_smtp_email)
            logger.info(f"Email sent via Brevo API: {api_response.message_id}")
            return True
            
        except ApiException as e:
            logger.error(f"Brevo API error: {e}")
            return False
```

### Step 7: Update Settings

Add to `ChurchIligan/settings.py`:

```python
# Brevo API configuration
BREVO_API_KEY = env('BREVO_API_KEY', default='')

# Use Brevo API backend if API key is set, otherwise fall back to SMTP
if BREVO_API_KEY:
    EMAIL_BACKEND = 'accounts.brevo_backend.BrevoEmailBackend'
else:
    EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
```

### Step 8: Update Render Environment

Add to Render dashboard:

```
BREVO_API_KEY=xkeysib-your-api-key-here
```

### Step 9: Deploy

```bash
git add requirements.txt accounts/brevo_backend.py ChurchIligan/settings.py
git commit -m "Add Brevo API email backend"
git push origin main
```

---

## Comparison: SMTP vs API

| Feature | SMTP | API |
|---------|------|-----|
| Setup Complexity | ⭐ Easy | ⭐⭐ Moderate |
| Speed | Fast | Faster |
| Error Handling | Good | Better |
| Tracking | Dashboard only | Dashboard + API |
| Async Compatible | ✅ Yes | ✅ Yes |
| Code Changes | ❌ None | ✅ Required |

**Recommendation**: Start with **SMTP** (easier), switch to **API** later if you need advanced features.

---

## Monitoring Email Delivery

### In Brevo Dashboard

1. Go to **Statistics** → **Email**
2. See real-time stats:
   - Sent
   - Delivered
   - Opens
   - Clicks
   - Bounces

### In Render Logs

Search for:
```
"Queuing verification email"  # Email queued
"Verification email sent"     # Success
"SMTP failed"                 # Check Brevo dashboard
```

---

## Troubleshooting

### Emails Not Arriving

1. **Check sender verification**:
   - Brevo Dashboard → Senders
   - Ensure `marllouie4@gmail.com` is verified

2. **Check spam folder**:
   - Brevo emails rarely go to spam
   - But check recipient's spam folder

3. **Check Brevo dashboard**:
   - Statistics → Email
   - See if email was sent/delivered/bounced

4. **Check SMTP credentials**:
   - Ensure SMTP key is correct
   - Key should start with `xsmtpsib-`

### "Sender not verified" Error

```
Error: Sender email not verified
```

**Solution**:
1. Go to Brevo Dashboard → Senders
2. Add and verify `marllouie4@gmail.com`
3. Check Gmail for verification email

### API Rate Limits

Free tier: 300 emails/day

If you hit limit:
- Upgrade to paid plan ($25/mo for 20,000 emails)
- Or implement daily limit tracking in your app

---

## Email Templates in Brevo

You can also create email templates in Brevo dashboard for consistent branding:

1. **Templates** → **Create Template**
2. Design email with drag-and-drop editor
3. Use template ID in code:

```python
# In email_utils.py
send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
    to=[{"email": email}],
    template_id=1,  # Your template ID
    params={"CODE": code}  # Template variables
)
```

---

## Cost Comparison

| Plan | Price | Emails/Month | Best For |
|------|-------|--------------|----------|
| Free | $0 | 9,000 | Development/Small apps |
| Starter | $25/mo | 20,000 | Growing apps |
| Business | $65/mo | 100,000 | Production apps |

For comparison:
- **SendGrid Free**: 100 emails/day (3,000/month)
- **Mailgun Free**: 5,000 emails/month (first 3 months only)
- **Resend Free**: 3,000 emails/month

**Brevo offers the most generous free tier!**

---

## Next Steps

1. **Now**: Use SMTP setup (5 minutes)
2. **Later**: Consider API setup for better performance
3. **Future**: Explore Brevo's marketing features (newsletters, SMS, etc.)

## Support

- **Brevo Docs**: https://developers.brevo.com/
- **Support**: https://help.brevo.com/
- **Status**: https://status.brevo.com/

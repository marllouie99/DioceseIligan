# Email Delivery Fix for Render Deployment

## Problem Summary

When deploying to Render's free tier, email sending via Gmail SMTP was causing worker timeouts and 500 errors during user registration. The issue manifested as:

- **Worker timeout after 30 seconds** while attempting to send email
- **SMTP connection hanging** when connecting to `smtp.gmail.com:587`
- **Registration failures** due to synchronous email blocking the HTTP request

## Root Causes

1. **Render Network Restrictions**: Render's free tier may throttle or restrict outbound SMTP connections on port 587 to prevent spam
2. **Synchronous Email Sending**: Emails were sent synchronously in the request/response cycle, blocking the HTTP worker
3. **No Connection Timeout**: SMTP connections had no timeout, causing indefinite hangs
4. **Default Worker Timeout**: Gunicorn's 30-second default timeout was too short for slow SMTP connections

## Solutions Implemented

### 1. ✅ Asynchronous Email Sending

**File**: `accounts/email_utils.py`

Implemented threaded email sending using Python's `threading` module:

```python
def send_email_async(func):
    """Decorator to send emails in background thread"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        thread = threading.Thread(target=func, args=args, kwargs=kwargs)
        thread.daemon = True
        thread.start()
        return True  # Return immediately
    return wrapper
```

**Benefits**:
- HTTP requests return immediately
- Email sending happens in background
- No worker timeout issues
- Fallback logging to console if SMTP fails

### 2. ✅ SMTP Connection Timeout

**File**: `ChurchIligan/settings.py`

Added 10-second timeout for SMTP connections:

```python
EMAIL_TIMEOUT = int(env('EMAIL_TIMEOUT', default=10))
```

**Benefits**:
- Fails fast if SMTP is blocked/throttled
- Prevents indefinite hangs
- Verification codes still logged to console on failure

### 3. ✅ Increased Gunicorn Worker Timeout

**File**: `gunicorn.conf.py` (new)

Created gunicorn configuration with 60-second worker timeout:

```python
timeout = 60  # Increased from 30 seconds
graceful_timeout = 30
```

**Benefits**:
- Handles occasional slow database queries
- Provides buffer for async email thread spawning
- More resilient to network latency

### 4. ✅ Fallback Console Logging

When SMTP fails, verification codes are printed to console/logs:

```
=== EMAIL SEND FAILED - VERIFICATION CODE FOR user@example.com: 123456 ===
```

**Benefits**:
- Can still complete registration during SMTP issues
- Verification codes visible in Render logs
- Temporary workaround while fixing email delivery

## Verification Steps

After deploying these fixes:

1. **Check Registration**: Attempt to register with a new email
2. **Check Logs**: If email doesn't arrive, check Render logs for the verification code
3. **Manual Verification**: Use the code from logs to verify the email
4. **Monitor Performance**: HTTP requests should return within 1-2 seconds

## Long-Term Solutions (Recommended)

While the above fixes resolve the immediate issue, consider these production-grade alternatives:

### Option 1: Switch to Transactional Email Service (RECOMMENDED)

Use a dedicated email service instead of Gmail SMTP:

#### **Resend** (Best for Django)
- Free tier: 3,000 emails/month
- No SMTP port blocking issues
- API-based (more reliable than SMTP)
- Excellent deliverability

**Setup**:
```bash
pip install resend
```

```python
# settings.py
RESEND_API_KEY = env('RESEND_API_KEY', default='')

# email_utils.py
import resend
resend.api_key = settings.RESEND_API_KEY

def send_verification_email(email, code):
    params = {
        "from": "ChurchConnect <noreply@churchiligan.com>",
        "to": [email],
        "subject": "Verify Your Email",
        "html": render_to_string('emails/verification_code.html', {'code': code})
    }
    resend.Emails.send(params)
```

#### **SendGrid** (Popular Choice)
- Free tier: 100 emails/day
- Reliable delivery
- Detailed analytics

```bash
pip install sendgrid
```

```python
# settings.py
SENDGRID_API_KEY = env('SENDGRID_API_KEY', default='')
EMAIL_BACKEND = 'sendgrid_backend.SendgridBackend'
```

#### **Mailgun** (Developer-Friendly)
- Free tier: 5,000 emails/month (first 3 months)
- EU and US regions
- Powerful API

```bash
pip install django-anymail
```

```python
# settings.py
EMAIL_BACKEND = 'anymail.backends.mailgun.EmailBackend'
ANYMAIL = {
    "MAILGUN_API_KEY": env('MAILGUN_API_KEY'),
    "MAILGUN_SENDER_DOMAIN": env('MAILGUN_DOMAIN'),
}
```

#### **Amazon SES** (Scalable)
- Free tier: 62,000 emails/month (if hosted on AWS)
- 3,000 emails/month otherwise
- Enterprise-grade

### Option 2: Use Celery for Background Tasks

For more robust async processing:

```bash
pip install celery redis
```

```python
# tasks.py
from celery import shared_task

@shared_task
def send_verification_email_task(email, code):
    send_verification_email(email, code)
```

**Note**: Requires a Redis/RabbitMQ instance (additional cost on Render)

### Option 3: Use Alternative SMTP Port

Try port 465 (SSL) instead of 587 (TLS):

```python
# render.yaml
- key: EMAIL_PORT
  value: "465"
- key: EMAIL_USE_TLS
  value: "False"
- key: EMAIL_USE_SSL
  value: "True"

# settings.py
EMAIL_USE_SSL = env.bool('EMAIL_USE_SSL', default=False)
```

## Comparison Table

| Solution | Cost | Reliability | Setup Complexity | Recommended For |
|----------|------|-------------|------------------|-----------------|
| **Current (Async Gmail)** | Free | Low (port blocking) | Low | Development/Testing |
| **Resend** | Free (3K/mo) | High | Low | **Production** |
| **SendGrid** | Free (100/day) | High | Medium | Small Apps |
| **Mailgun** | Free (5K/mo) | High | Medium | Medium Apps |
| **Amazon SES** | Free (62K/mo)* | Very High | High | Enterprise |
| **Celery + Redis** | ~$7/mo | Very High | High | Complex Apps |

*Free tier requires AWS hosting

## Recommended Next Steps

1. **Immediate**: Deploy the async fixes (already implemented)
2. **Short-term**: Sign up for Resend and migrate from Gmail SMTP
3. **Long-term**: Consider Celery if adding more background tasks (e.g., scheduled reports, notifications)

## Testing Email Locally

During development, use console backend to see emails in terminal:

```python
# .env (local)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

## Environment Variables Reference

Add to Render dashboard or `.env` file:

```bash
# Gmail SMTP (current)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_TIMEOUT=10

# Resend (recommended alternative)
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST=smtp.resend.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=resend
# EMAIL_HOST_PASSWORD=your-resend-api-key
# EMAIL_TIMEOUT=10
```

## Monitoring

Check Render logs for email status:

```bash
# In Render dashboard, go to Logs and search for:
"Queuing verification email"  # Email queued successfully
"SMTP failed"                 # Email delivery failed
"EMAIL SEND FAILED"           # Fallback console logging
```

## Support

If issues persist after deploying these fixes:

1. Check Render logs for the verification code
2. Verify Gmail app password is correct
3. Try port 465 instead of 587
4. Consider switching to Resend (5-minute setup)

# Email Verification Setup Guide

This guide will help you configure email verification for ChurchConnect registration.

## Features Implemented

✅ **6-digit verification codes** - Secure numeric codes sent to user's email  
✅ **15-minute expiration** - Codes automatically expire for security  
✅ **Rate limiting** - 2-minute cooldown between resend requests  
✅ **Spam prevention** - Maximum 5 verification attempts per code  
✅ **Beautiful email template** - Professional HTML emails with branding  
✅ **Auto-submit form** - Automatically submits when 6 digits are entered  
✅ **Resend functionality** - Users can request new codes with countdown timer  
✅ **Works with any email** - Gmail, temporary emails, custom domains  

## Quick Start (Development)

For development and testing, emails will display in your terminal console:

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. The default console backend is already configured in `.env.example`

3. Start the development server:
   ```bash
   python manage.py runserver
   ```

4. Try registering - verification emails will appear in your terminal!

## Gmail SMTP Setup (Production)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Enable 2-Factor Authentication if not already enabled

### Step 2: Generate App Password
1. In Google Account settings, go to Security
2. Under "How you sign in to Google", select App passwords
3. Generate a new app password for "Mail"
4. Copy the 16-character password (remove spaces)

### Step 3: Configure Environment Variables
Update your `.env` file:

```env
# Email Configuration for Gmail
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-app-password
DEFAULT_FROM_EMAIL=ChurchConnect <your-email@gmail.com>
```

### Step 4: Test the Setup
1. Restart your Django server
2. Try registering with a real email address
3. Check the recipient's inbox for the verification email

## Other Email Providers

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@outlook.com
EMAIL_HOST_PASSWORD=your-password
```

### Custom SMTP Server
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587  # or 465 for SSL
EMAIL_USE_TLS=True  # or EMAIL_USE_SSL=True for port 465
EMAIL_HOST_USER=your-username
EMAIL_HOST_PASSWORD=your-password
```

## Testing with Temporary Email Services

The system works with temporary email services for testing:

### Recommended Services:
- **10MinuteMail** - https://10minutemail.com/
- **TempMail** - https://temp-mail.org/
- **Guerrilla Mail** - https://www.guerrillamail.com/

### Testing Process:
1. Get a temporary email address
2. Use it to register on ChurchConnect
3. Check the temporary email inbox for verification code
4. Complete the verification process

## Troubleshooting

### Common Issues:

**Emails not being sent:**
- Check your email credentials in `.env`
- Verify app password is correct (no spaces)
- Ensure 2FA is enabled for Gmail

**Verification codes not working:**
- Codes expire after 15 minutes
- Maximum 5 attempts per code
- Case-sensitive comparison

**Rate limiting errors:**
- Wait 2 minutes between resend requests
- Clear browser cache if needed

### Debug Mode:
To see detailed email errors, add to your `.env`:
```env
DEBUG=True
```

Check the Django console for detailed error messages.

## Security Features

### Code Generation:
- 6-digit numeric codes only
- Cryptographically secure random generation
- Unique codes for each request

### Expiration & Limits:
- 15-minute expiration time
- Maximum 5 verification attempts
- 2-minute cooldown between resends
- Automatic cleanup of old codes

### Session Security:
- Signup data stored in secure Django sessions
- Sessions cleared after verification
- CSRF protection on all forms

## Email Template Customization

The email template is located at:
```
templates/emails/verification_code.html
```

You can customize:
- Logo and branding
- Colors and styling
- Message content
- Support contact information

## Monitoring & Analytics

### Database Tables:
- `accounts_emailverification` - Stores verification codes and attempts
- Built-in admin interface for monitoring

### Useful Queries:
```python
# Check recent verification attempts
from accounts.models import EmailVerification
recent = EmailVerification.objects.filter(
    created_at__gte=timezone.now() - timedelta(hours=1)
)

# Clean up old codes (runs automatically)
EmailVerification.objects.filter(
    created_at__lt=timezone.now() - timedelta(hours=1)
).delete()
```

## Next Steps

1. **Set up email monitoring** - Use services like SendGrid or Amazon SES for production
2. **Add phone verification** - Extend system to support SMS codes
3. **Implement password reset** - Use same verification system for password resets
4. **Add email preferences** - Let users choose notification settings

---

Need help? The verification system is fully functional and ready for production use!

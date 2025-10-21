# Render Deployment Troubleshooting Guide

## Recent Changes That Could Affect Deployment

### Latest Commits:
1. **Email Notifications for Booking Status** (cb687ce)
   - Added `send_booking_status_email()` function
   - Created 5 new email templates
   - Updated signals to send emails

2. **Enhanced Conflict Detection** (01e5f8c)
   - Updated conflict detection logic in views
   - Enhanced CSS styling
   - Updated appointment list template

3. **Booking Duplication Fix & Notifications** (930047c)
   - Fixed Booking.save() method
   - Added notification indicators

## Common Render Deployment Issues & Solutions

### 1. Build Command Failures

**Check:**
```bash
# Verify build.sh is executable
chmod +x build.sh

# Test build locally
bash build.sh
```

**Potential Issues:**
- Missing dependencies in requirements.txt
- Python version mismatch
- Static files collection failure

### 2. Template Loading Issues

**Recent Template Changes:**
- `templates/emails/booking_approved.html`
- `templates/emails/booking_reviewed.html`
- `templates/emails/booking_declined.html`
- `templates/emails/booking_completed.html`
- `templates/emails/booking_canceled.html`
- `templates/core/partials/appointments_list.html`
- `templates/partials/topbar.html`
- `templates/partials/manage/tab_navigation.html`

**Solution:**
Ensure all templates are committed and pushed to git.

### 3. Import Errors

**Recent Import Changes:**
```python
# core/signals.py
from accounts.email_utils import send_booking_status_email

# core/views.py
from collections import Counter
```

**Verify:**
- All imports are available in production
- No circular import issues

### 4. Environment Variables

**Required Environment Variables on Render:**
- `BREVO_API_KEY` - For email sending (CRITICAL)
- `EMAIL_HOST_PASSWORD` - Brevo SMTP password
- `SECRET_KEY` - Django secret key
- `DATABASE_URL` - PostgreSQL connection
- `CLOUDINARY_*` - Media storage credentials
- `STRIPE_*` - Payment processing (if used)
- `PAYPAL_*` - Payment processing (if used)

**Check in Render Dashboard:**
1. Go to your service
2. Click "Environment"
3. Verify all required variables are set

### 5. Database Migration Issues

**Check:**
```bash
# Verify no pending migrations
python manage.py showmigrations

# Check for migration conflicts
python manage.py migrate --plan
```

**Solution:**
If migrations are stuck, you may need to:
1. Run migrations manually via Render shell
2. Check for conflicting migrations

### 6. Static Files Issues

**Verify:**
- `STATIC_ROOT` is set correctly
- `STATICFILES_DIRS` includes all static directories
- `whitenoise` is configured properly

**Check in settings/production.py:**
```python
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### 7. Memory/Resource Limits (Free Tier)

**Render Free Tier Limits:**
- 512 MB RAM
- Spins down after 15 minutes of inactivity
- Limited build time

**Solution:**
- Optimize imports (lazy loading)
- Reduce memory usage in views
- Use database connection pooling

## Debugging Steps

### Step 1: Check Render Logs
1. Go to Render Dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for error messages during build or deploy

### Step 2: Check Build Logs
Look for:
- `pip install` failures
- `collectstatic` errors
- `migrate` errors
- Import errors
- Template syntax errors

### Step 3: Check Runtime Logs
Look for:
- Application startup errors
- Import errors
- Database connection errors
- Template rendering errors

### Step 4: Test Locally with Production Settings
```bash
# Use production settings locally
export DJANGO_SETTINGS_MODULE=ChurchIligan.settings.production
export DEBUG=False

# Run checks
python manage.py check --deploy

# Test server
python manage.py runserver
```

### Step 5: Verify Recent Changes

**Test email functionality:**
```python
# In Django shell
from accounts.email_utils import send_booking_status_email
from core.models import Booking

# Test with a real booking
booking = Booking.objects.first()
send_booking_status_email(booking, 'approved')
```

**Test conflict detection:**
```python
# In Django shell
from core.views import manage_church
# Check for any errors in the conflict detection logic
```

## Specific Issues from Recent Changes

### Issue 1: Email Template Rendering
**Symptom:** Template loading errors
**Solution:**
- Verify all email templates exist in `templates/emails/`
- Check template syntax (no unclosed tags)
- Ensure templates are in git and pushed

### Issue 2: Brevo API Key Missing
**Symptom:** Email sending fails
**Solution:**
- Set `BREVO_API_KEY` in Render environment variables
- Verify API key is valid in Brevo dashboard

### Issue 3: Collections Counter Import
**Symptom:** Import error for Counter
**Solution:**
- Counter is part of Python standard library
- Should work on Python 3.11+ (which Render uses)

### Issue 4: CSS Animation Issues
**Symptom:** Static files not loading
**Solution:**
- Run `collectstatic` manually
- Check `STATIC_URL` and `STATIC_ROOT` settings
- Verify whitenoise configuration

## Quick Fixes

### Fix 1: Force Rebuild
1. Go to Render Dashboard
2. Click "Manual Deploy"
3. Select "Clear build cache & deploy"

### Fix 2: Verify Environment Variables
```bash
# In Render Shell
echo $BREVO_API_KEY
echo $DATABASE_URL
echo $SECRET_KEY
```

### Fix 3: Run Migrations Manually
```bash
# In Render Shell
python manage.py migrate
```

### Fix 4: Check Django Settings
```bash
# In Render Shell
python manage.py diffsettings
```

## Rollback Plan

If deployment continues to fail:

### Option 1: Revert Recent Commits
```bash
# Revert to last working commit
git revert 01e5f8c  # Conflict detection
git revert cb687ce  # Email notifications
git push origin main
```

### Option 2: Disable New Features Temporarily
```python
# In core/signals.py - comment out email sending
# try:
#     send_booking_status_email(instance, instance.status)
# except Exception as e:
#     logger.error(f"Failed to send booking status email: {str(e)}")
```

## Prevention

### Before Next Deployment:
1. ✅ Test all changes locally with production settings
2. ✅ Run `python manage.py check --deploy`
3. ✅ Verify all environment variables are set
4. ✅ Test email functionality locally
5. ✅ Check static files collection
6. ✅ Verify all templates render correctly
7. ✅ Run migrations locally first

## Contact Support

If issue persists:
1. Check Render Status Page: https://status.render.com/
2. Contact Render Support with:
   - Service name: churchiligan
   - Deploy ID (from logs)
   - Error messages
   - Recent changes

## Most Likely Causes (Based on Recent Changes)

### 1. Missing BREVO_API_KEY (HIGH PROBABILITY)
The email notification feature requires `BREVO_API_KEY` to be set in Render environment variables.

**Fix:**
1. Go to Render Dashboard → Environment
2. Add: `BREVO_API_KEY` = `<your-brevo-api-key>`
3. Redeploy

### 2. Template Syntax Error (MEDIUM PROBABILITY)
One of the new email templates might have a syntax error.

**Fix:**
Test each template locally:
```bash
python manage.py check
```

### 3. Import Error (LOW PROBABILITY)
The `Counter` import from collections should work fine.

**Fix:**
Already using standard library, no action needed.

## Next Steps

1. **Check Render Logs** - Look for specific error message
2. **Verify BREVO_API_KEY** - Most likely cause
3. **Test Templates** - Ensure no syntax errors
4. **Force Rebuild** - Clear cache and redeploy
5. **Contact Support** - If issue persists

## Monitoring

After successful deployment:
- Monitor error logs for 24 hours
- Test email sending functionality
- Verify conflict detection works
- Check notification indicators appear
- Test booking status updates

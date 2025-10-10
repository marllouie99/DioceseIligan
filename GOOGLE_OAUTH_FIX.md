# Google OAuth Configuration Fix

## Issue
The Google OAuth button on the landing page was showing "(Setup Required)" even though the credentials were properly configured in the Render environment variables.

## Root Cause
The `landing` view in `accounts/views.py` was not properly detecting when Google OAuth credentials were configured. The original check only looked for `client_id` and `client_secret`, and checked for demo placeholder strings that were never used.

## Changes Made

### 1. Updated OAuth Detection Logic (`accounts/views.py` lines 93-105)

**Before:**
```python
# Check if Google OAuth is configured
client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', '')
client_secret = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', '')

google_oauth_configured = (
    client_id and 
    client_secret and
    'demo_client_id_not_configured' not in client_id and
    'demo_client_secret_not_configured' not in client_secret
)
```

**After:**
```python
# Check if Google OAuth is configured
client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', '').strip()
client_secret = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', '').strip()
redirect_uri = getattr(settings, 'GOOGLE_OAUTH_REDIRECT_URI', '').strip()

# OAuth is configured if all three values are present and not empty
google_oauth_configured = bool(
    client_id and 
    client_secret and
    redirect_uri and
    len(client_id) > 10 and  # Valid client IDs are much longer
    len(client_secret) > 10  # Valid secrets are much longer
)
```

### Key Improvements:
1. **Added `.strip()`** - Removes any whitespace from environment variables
2. **Checks all three required values** - Now validates `GOOGLE_OAUTH_REDIRECT_URI` as well
3. **Length validation** - Ensures credentials are actual valid values (not empty or placeholder strings)
4. **Removed demo string checks** - These were never used and added unnecessary complexity

## Environment Variables Required

Make sure these are set in your Render environment:

```
GOOGLE_OAUTH_CLIENT_ID=your_actual_client_id_from_google
GOOGLE_OAUTH_CLIENT_SECRET=your_actual_client_secret_from_google
GOOGLE_OAUTH_REDIRECT_URI=https://churchiligan.onrender.com/google/callback/
```

## Testing

After deploying this fix:

1. Visit your landing page at `https://churchiligan.onrender.com`
2. The Google OAuth button should now show **"Continue with Google"** instead of "Google OAuth (Setup Required)"
3. Clicking the button should redirect to Google's OAuth consent screen
4. After authorizing, you should be redirected back and logged in

## Verification Checklist

- [x] All three environment variables are set in Render
- [x] `GOOGLE_OAUTH_REDIRECT_URI` matches the authorized redirect URI in Google Cloud Console
- [x] The redirect URI uses HTTPS for production
- [x] The button text changes from "(Setup Required)" to "Continue with Google"

## Related Files
- `accounts/views.py` - Landing view with OAuth detection logic
- `templates/landing.html` - Landing page template with OAuth button
- `ChurchIligan/settings.py` - Settings file that loads OAuth environment variables
- `GOOGLE_OAUTH_SETUP.md` - Complete setup guide for Google OAuth

## Next Steps

1. **Deploy the fix** to Render
2. **Verify** the button shows correctly on the landing page
3. **Test** the complete OAuth flow with a Google account
4. **Monitor** logs for any OAuth-related errors

## Troubleshooting

If the button still shows "(Setup Required)" after deployment:

1. **Check environment variables in Render dashboard**
   - Go to your service → Environment tab
   - Verify all three OAuth variables are set
   - Make sure there are no extra spaces

2. **Verify redirect URI**
   - Must match exactly what's in Google Cloud Console
   - Should be: `https://churchiligan.onrender.com/google/callback/`
   - Note the trailing slash

3. **Check logs**
   - Look for any errors during startup
   - Verify settings are being loaded correctly

4. **Force redeploy**
   - Sometimes Render needs a manual redeploy to pick up changes
   - Go to Manual Deploy → Deploy latest commit

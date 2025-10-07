# 🔑 Google OAuth Setup Guide for ChurchConnect

This guide will help you set up Google OAuth authentication for your ChurchConnect application.

## 📋 Prerequisites

- A Google account
- Access to Google Cloud Console
- ChurchConnect application running locally

## 🚀 Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `ChurchConnect OAuth`
4. Click "Create"

### 2. Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"
4. Also enable "Google Identity" if available

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type (unless you have G Suite)
3. Fill in the application information:
   - **App name**: `ChurchConnect`
   - **User support email**: Your email
   - **App domain**: `http://127.0.0.1:8000` (for development)
   - **Developer contact**: Your email
4. Click "Save and Continue"
5. Skip "Scopes" for now
6. Add test users (optional for development)
7. Review and submit

### 4. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set up the credentials:
   - **Name**: `ChurchConnect Web Client`
   - **Authorized JavaScript origins**: `http://127.0.0.1:8000`
   - **Authorized redirect URIs**: `http://127.0.0.1:8000/google/callback/`
5. Click "Create"
6. **Important**: Copy the Client ID and Client Secret

### 5. Configure ChurchConnect

Create a `.env` file in your project root with:

```bash
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=http://127.0.0.1:8000/google/callback/
```

### 6. Update Django Settings

Make sure your `settings.py` reads from environment variables:

```python
# Enable environment variables
environ.Env.read_env(BASE_DIR / '.env')
```

### 7. Test the Integration

1. Restart your Django development server:
   ```bash
   python manage.py runserver
   ```

2. Go to `http://127.0.0.1:8000`
3. Click "Continue with Google"
4. You should be redirected to Google's OAuth flow

## 🎯 Production Setup

For production deployment:

1. Update OAuth consent screen with your production domain
2. Add production redirect URIs:
   - `https://yourdomain.com/google/callback/`
3. Update environment variables with production values
4. Set proper HTTPS settings in Django

## 🔒 Security Notes

- **Never commit credentials to version control**
- Use environment variables for all sensitive data
- Enable HTTPS in production
- Regularly rotate OAuth secrets
- Monitor OAuth usage in Google Cloud Console

## 🐛 Common Issues & Solutions

### "OAuth is not configured" Error
- Check that environment variables are loaded
- Verify `.env` file exists and has correct values
- Restart Django server after changes

### "Invalid Redirect URI" Error  
- Ensure redirect URI in Google Console matches exactly: `http://127.0.0.1:8000/google/callback/`
- Check for trailing slashes
- Verify domain matches (127.0.0.1 vs localhost)

### "Access Blocked" Error
- Add your email as a test user in OAuth consent screen
- Verify OAuth consent screen is configured
- Check app verification status

## 📱 Features Enabled

Once configured, users can:
- ✅ Sign in with existing Google accounts
- ✅ Create new accounts using Google profile data
- ✅ Skip password creation/management
- ✅ Enjoy seamless authentication experience
- ✅ Have their profile automatically populated

## 🎨 UI Integration

The Google OAuth button:
- Matches ChurchConnect's Warm Sacred Earth theme
- Shows as disabled until credentials are configured
- Provides helpful setup messages
- Integrates seamlessly with progressive login flow

## 📞 Support

For additional help:
1. Check Django logs for detailed error messages
2. Verify Google Cloud Console configuration
3. Test with different Google accounts
4. Ensure all URLs match exactly between Django and Google Console

---

**🎉 Once configured, your church community will have modern, secure Google authentication alongside the beautiful ChurchConnect interface!**

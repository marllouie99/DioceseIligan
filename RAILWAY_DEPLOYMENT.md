# Railway Deployment Guide

## Prerequisites
- GitHub account with the repo pushed
- Railway account (https://railway.app)
- Environment variables ready

## Step 1: Connect Repository to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `marllouie99/DioceseIligan`
4. Railway will auto-detect the Dockerfile and deploy

## Step 2: Add PostgreSQL Database

1. In your Railway project, click "Add Service"
2. Select "PostgreSQL"
3. Railway will auto-link `DATABASE_URL` environment variable

## Step 3: Configure Environment Variables

In Railway Dashboard, set these variables:

### Critical (Must Set)
- `SECRET_KEY` = `I76I~l_-61vlaXxJBg0.k9Fmmp9yWhXa`
- `DEBUG` = `False`
- `ALLOWED_HOSTS` = `churchiligan.railway.app,127.0.0.1,localhost` (replace with your Railway domain)
- `CSRF_TRUSTED_ORIGINS` = `https://churchiligan.railway.app,http://127.0.0.1:8000,http://localhost:8000`
- `DJANGO_SETTINGS_MODULE` = `ChurchIligan.settings.production`

### Email (Brevo SMTP)
- `EMAIL_HOST_PASSWORD` = Your Brevo SMTP password (NOT in git)
- `EMAIL_HOST_USER` = `979d0a001@smtp-brevo.com`
- `EMAIL_HOST` = `smtp-relay.brevo.com`
- `EMAIL_PORT` = `587`
- `EMAIL_USE_TLS` = `True`
- `DEFAULT_FROM_EMAIL` = `ChurchConnect <979d0a001@smtp-brevo.com>`

### Google OAuth
- `GOOGLE_OAUTH_CLIENT_ID` = `1053022434620-53ddgsjm3docsougushcna2a5hoqe0vd.apps.googleusercontent.com`
- `GOOGLE_OAUTH_CLIENT_SECRET` = `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`
- `GOOGLE_OAUTH_REDIRECT_URI` = `https://churchiligan.railway.app/google/callback/` (update domain)

### Cloudinary (Media Storage)
- `CLOUDINARY_CLOUD_NAME` = `dqmgbrxgv`
- `CLOUDINARY_API_KEY` = `794325529773894`
- `CLOUDINARY_API_SECRET` = `-zTa6wf0Qup0hwDd-1bBMPM4PaI`

### PayPal
- `PAYPAL_CLIENT_ID` = Your PayPal Client ID (NOT in git)
- `PAYPAL_CLIENT_SECRET` = Your PayPal Client Secret (NOT in git)
- `PAYPAL_MODE` = `sandbox`
- `PAYPAL_CURRENCY` = `PHP`

### Superuser
- `DJANGO_SUPERUSER_USERNAME` = `admin`
- `DJANGO_SUPERUSER_EMAIL` = `asusadmin@gmail.com`
- `DJANGO_SUPERUSER_PASSWORD` = `ramdar143`

### Other
- `STATIC_VERSION` = `1`

## Step 4: Deploy

1. Click "Deploy" in Railway Dashboard
2. Watch the build logs
3. Once deployed, click "View Logs" to verify migrations ran successfully
4. Access your app at `https://churchiligan.railway.app` (or your custom domain)

## Step 5: Verify Deployment

1. Check admin panel: `https://your-railway-domain/admin/`
2. Login with superuser credentials
3. Test email functionality
4. Verify media uploads work (Cloudinary)
5. Test Google OAuth login
6. Test PayPal integration (sandbox mode)

## Troubleshooting

### Build Fails
- Check Railway build logs for errors
- Ensure `requirements.txt` has all dependencies
- Verify `build.sh` permissions (should be executable)

### Database Connection Error
- Verify PostgreSQL service is added
- Check `DATABASE_URL` is set correctly
- Run migrations: Check Railway logs for migration output

### Static Files Not Loading
- Verify `collectstatic` ran in build logs
- Check Cloudinary credentials are correct
- Clear browser cache

### Email Not Sending
- Verify `EMAIL_HOST_PASSWORD` is set in Railway Dashboard
- Check Brevo account is active
- Test with admin panel email functionality

### Google OAuth Not Working
- Update `GOOGLE_OAUTH_REDIRECT_URI` with correct Railway domain
- Verify credentials in Google Cloud Console
- Check callback URL matches exactly

## Important Security Notes

⚠️ **DO NOT commit these to git:**
- `EMAIL_HOST_PASSWORD`
- `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET`
- `SECRET_KEY` (use Railway's generated value)
- Any API keys or secrets

Always set sensitive variables in Railway Dashboard, not in code or `.env` files.

## Useful Commands

View logs:
```bash
railway logs
```

SSH into container:
```bash
railway shell
```

Run Django commands:
```bash
railway run python manage.py createsuperuser
```

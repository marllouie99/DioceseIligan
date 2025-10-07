# Deploying ChurchIligan to Render

This guide helps you deploy the Django app to Render using the included render.yaml blueprint.

## What was added/updated
- render.yaml: Render blueprint for Web Service and PostgreSQL DB
- build.sh: Install, collectstatic, migrate
- requirements.txt: Added gunicorn and whitenoise
- ChurchIligan/settings.py: Production-safe settings, WhiteNoise, env-based Email & OAuth
- .env.example: Expanded with all required variables

## Prerequisites
- Code is pushed to a Git provider (GitHub/GitLab/Bitbucket)
- Render account: https://render.com

## Deploy steps (Blueprint)
1. Push this repository to your Git provider.
2. On Render: New -> Blueprint -> Connect your repo.
3. Review resources from `render.yaml` and click "Apply".
4. First deploy will:
   - Install dependencies
   - Collect static files (WhiteNoise)
   - Run DB migrations
5. Wait for "Live" status.

## Configure environment variables
`render.yaml` sets safe defaults. After the first deploy, update these in Render -> Service -> Environment:
- DEBUG = False
- SECRET_KEY = auto-generated (already)
- ALLOWED_HOSTS = your-service-subdomain.onrender.com,127.0.0.1,localhost
- CSRF_TRUSTED_ORIGINS = https://your-service-subdomain.onrender.com,http://127.0.0.1:8000,http://localhost:8000
- DATABASE_URL = auto-wired from the created DB
- EMAIL_* variables if you want real email (else console backend will be used)
- GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET (optional)
- GOOGLE_OAUTH_REDIRECT_URI = https://your-service-subdomain.onrender.com/google/callback/

Note: If Render assigns a different subdomain than `churchiligan.onrender.com`, replace it in ALLOWED_HOSTS and CSRF_TRUSTED_ORIGINS.

## Create an admin user (first-time)
Use Render shell for the web service:
```
python manage.py createsuperuser
```

## Common checks
- Static files: Served by WhiteNoise from `staticfiles/` (collectstatic done in build)
- DB: PostgreSQL is provisioned from `render.yaml` and wired via `DATABASE_URL`
- HTTPS: Enabled via Render proxy; `SECURE_SSL_REDIRECT` defaults to True in production (False if DEBUG=True)
- Logs: Check Render service logs if something fails

## Google OAuth (optional)
- Update Google Cloud Console OAuth credentials
- Add authorized redirect URI: `https://your-service-subdomain.onrender.com/google/callback/`
- Set the three GOOGLE_OAUTH_* env vars on Render

## Email delivery (optional)
- Default is console backend (emails appear in logs)
- To use SMTP, set:
  - EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
  - EMAIL_HOST, EMAIL_PORT, EMAIL_USE_TLS, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD
  - DEFAULT_FROM_EMAIL (e.g., "Church Iligan Connect <noreply@example.com>")

## Rollbacks and updates
- Push changes to your repo; Render will auto-deploy
- To roll back, redeploy an earlier commit from Render dashboard

## Troubleshooting
- 500 error after deploy: Check logs, ensure ALLOWED_HOSTS and CSRF_TRUSTED_ORIGINS include the live domain
- Static files not loading: Confirm collectstatic succeeded and WhiteNoise is active in settings
- DB errors: Verify DATABASE_URL set by Render and migrations ran

---
Ready to go live. If you need help configuring email or Google OAuth, see `.env.example` for required variables.

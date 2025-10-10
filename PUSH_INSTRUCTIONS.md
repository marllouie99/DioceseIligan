# Push Instructions - Login Code Email Fix

## Current Status
✅ All changes are committed locally
❌ Need to push to GitHub to deploy to Render

## Commit Details
- **Commit Message**: "Fix: Add Brevo API for login code emails on live hosting"
- **Branch**: main
- **Files Changed**: 11 files

## How to Push

### Option 1: GitHub Desktop (Recommended)
1. Open GitHub Desktop
2. You should see the commit ready to push
3. Click "Push origin" button
4. Wait for Render to auto-deploy (3-5 minutes)

### Option 2: Command Line with Personal Access Token
```bash
# If you have a personal access token
git push https://YOUR_TOKEN@github.com/ramdar143/ChurchIligan.git main
```

### Option 3: SSH (if configured)
```bash
# Change remote to SSH
git remote set-url origin git@github.com:ramdar143/ChurchIligan.git
git push origin main
```

## What Happens After Push
1. GitHub receives your changes
2. Render detects the update automatically
3. Render rebuilds and redeploys (3-5 minutes)
4. New environment variables take effect:
   - BREVO_API_KEY
   - DEFAULT_FROM_EMAIL

## Test After Deployment
1. Visit: https://churchiligan.onrender.com/login-with-code/
2. Enter your email address
3. Check inbox for login code
4. Code should arrive within 1-2 minutes

## Changes Summary

### render.yaml
- Added BREVO_API_KEY environment variable
- Updated DEFAULT_FROM_EMAIL to verified Brevo sender

### accounts/email_utils.py
- Switched login code emails to Brevo HTTP API
- Made email sending synchronous with proper error handling

### Settings Files
- base.py: Added BREVO_API_KEY and DEFAULT_FROM_EMAIL
- development.py: Made email backend configurable
- production.py: Removed duplicate DEFAULT_FROM_EMAIL

## Troubleshooting

### If Push Fails
- Use GitHub Desktop (easiest)
- Check your GitHub credentials
- Ensure you have push access to the repository

### If Emails Still Don't Work After Deploy
1. Check Render logs for errors
2. Verify BREVO_API_KEY in Render dashboard
3. Confirm DEFAULT_FROM_EMAIL is set correctly
4. Check Brevo account for sender verification

## Support
If you need help pushing, you can:
1. Use GitHub Desktop application
2. Set up a personal access token in GitHub settings
3. Configure SSH keys for Git authentication

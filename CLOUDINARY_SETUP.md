# Cloudinary Setup Guide

## Why Cloudinary?

Render's free tier uses **ephemeral storage** - every deployment wipes the `/media/` directory. This means all uploaded images (profile pictures, church logos, cover images) are lost after each deployment.

**Cloudinary** provides free cloud storage that persists across deployments.

## Setup Steps

### 1. Create a Free Cloudinary Account

1. Go to https://cloudinary.com/users/register_free
2. Sign up with your email
3. Verify your email address
4. Log in to your dashboard

### 2. Get Your Cloudinary Credentials

After logging in:
1. Go to **Dashboard** (https://console.cloudinary.com/)
2. You'll see your credentials:
   - **Cloud Name** (e.g., `dxyz1234`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `AbCdEfGhIjKlMnOpQrStUvWxYz`)
3. Copy the **Environment variable** URL which looks like:
   ```
   cloudinary://123456789012345:AbCdEfGhIjKlMnOpQrStUvWxYz@dxyz1234
   ```

### 3. Add Credentials to Render

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your **ChurchIligan** web service
3. Go to **Environment** tab
4. Add these 4 new environment variables:

   ```
   CLOUDINARY_CLOUD_NAME
   <your-cloud-name>

   CLOUDINARY_API_KEY
   <your-api-key>

   CLOUDINARY_API_SECRET
   <your-api-secret>

   CLOUDINARY_URL
   cloudinary://<api-key>:<api-secret>@<cloud-name>
   ```

5. Click **Save Changes**

### 4. Redeploy

Render will automatically redeploy. Wait 3-5 minutes.

## ✅ What Changes?

**Before (Broken):**
- ❌ Upload profile picture → Works
- ❌ Deploy new code → Profile picture disappears
- ❌ Files stored in ephemeral `/media/` directory

**After (Fixed):**
- ✅ Upload profile picture → Works
- ✅ Deploy new code → Profile picture persists!
- ✅ Files stored in Cloudinary cloud storage

## Free Tier Limits

Cloudinary free tier includes:
- ✅ 25GB storage
- ✅ 25GB monthly bandwidth
- ✅ 25,000 transformations/month

This is more than enough for a student project!

## Testing

After setup, test by:
1. Upload a profile picture
2. Make a code change and deploy
3. Check if profile picture is still there ✅

## Troubleshooting

If images don't upload after setup:
1. Check Render logs for errors
2. Verify all 4 environment variables are set correctly
3. Make sure `CLOUDINARY_URL` format is exactly: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`
4. Restart the service manually if needed

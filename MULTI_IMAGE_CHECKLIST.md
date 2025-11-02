# Multi-Image Post Feature - Troubleshooting Checklist

## Issue Status:
1. ✅ Image rendering (black boxes) - FIXED
2. ❌ Dashboard multi-image upload - NOT WORKING YET
3. ❌ Post images clickable (lightbox) - NOT WORKING YET  
4. ❌ Single image black background - NOT WORKING YET

## Steps to Fix:

### Step 1: Clear Browser Cache
**This is CRITICAL - new CSS/JS won't load without this!**

1. Press `Ctrl + Shift + Delete` in your browser
2. OR Press `Ctrl + F5` on the page (hard refresh)
3. OR Go to DevTools (F12) → Network tab → Check "Disable cache"

### Step 2: Verify Static Files
Run this command:
```bash
python manage.py collectstatic --noinput
```

### Step 3: Restart Development Server
1. Stop the server (Ctrl+C)
2. Start it again:
```bash
python manage.py runserver
```

### Step 4: Check Browser Console for Errors
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for any red error messages
4. Share them if you see any

### Step 5: Test Each Feature

#### A) Dashboard Multi-Image Upload
1. Go to Dashboard → Posts Management
2. Click "Create New Post"
3. Click "Photo/Video" button
4. Select MULTIPLE images (hold Ctrl/Cmd while clicking)
5. **Expected:** Should see preview grid with all images
6. **Expected:** Label should say "X images selected"

#### B) Post Image Lightbox (Clickable)
1. Find any post with images
2. Click on any image
3. **Expected:** Full-screen lightbox opens
4. **Expected:** Can navigate with arrows
5. **Expected:** Shows "1 / X" counter
6. **Expected:** Press ESC to close

#### C) Single Image Background
1. Find a post with 1 image
2. **Expected:** Image should have white/transparent background
3. **NOT:** Black bars on sides

## Files Updated:

### CSS Files:
- `static/css/components/post_images_grid.css` - Grid layouts
- `static/css/components/multi_image_upload.css` - Upload previews
- `static/css/components/post_image_lightbox.css` - Lightbox styling

### JavaScript Files:
- `static/js/manage/post-management.js` - Dashboard multi-upload
- `templates/core/church_detail.html` - Church page multi-upload
- `templates/layouts/app_base.html` - Lightbox functionality

### Template Files:
- `templates/partials/post_card.html` - Multi-image grid display
- `templates/partials/manage/modals/create_post_modal.html` - Dashboard modal
- `templates/partials/church/create_post_modal.html` - Church page modal
- `templates/layouts/app_base.html` - Base template with lightbox HTML

### Backend:
- `core/models.py` - PostImage model
- `core/admin.py` - PostImage admin
- `core/views.py` - Multi-image upload handling

## Common Issues:

### Issue: "Photo/Video button doesn't show preview"
**Fix:** 
- Clear cache and hard refresh
- Check browser console for JavaScript errors
- Verify `post-management.js` is loading

### Issue: "Images not clickable"
**Fix:**
- Clear cache and hard refresh  
- Check if `app_base.html` lightbox script is loading
- Open DevTools Console and type: `typeof openPostImageLightbox`
  - Should return "function", not "undefined"

### Issue: "Black background on single images"
**Fix:**
- Clear cache and hard refresh
- Check if `post_images_grid.css` is loading
- Inspect element and verify `.post-image-single` has `background: transparent`

## Debug Commands:

### Check if lightbox is available:
Open browser console (F12) and run:
```javascript
console.log(typeof openPostImageLightbox);
console.log(typeof closePostImageLightbox);
console.log(document.getElementById('postImageLightbox'));
```

### Check if post-management.js loaded:
```javascript
console.log(window.PostManagement);
```

### Force reload all CSS:
```javascript
location.reload(true);
```

## If Still Not Working:

1. **Share browser console errors** - Press F12, copy any red errors
2. **Share Network tab** - Check if CSS/JS files return 200 or 404
3. **Try incognito mode** - To eliminate cache issues
4. **Check Django debug toolbar** - Verify templates are using latest version

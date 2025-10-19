# Church Selection Feature Implementation

## Overview
Implemented a church selection page that allows managers who are assigned to multiple churches to choose which church they want to manage before accessing the management dashboard.

## Problem Solved
Previously, when a user was assigned as a manager to multiple churches, clicking "Manage Church" would only show the first church. This caused issues because:
- Users couldn't easily switch between managing different churches
- The system didn't account for managers handling multiple parishes
- No clear way to select which church to manage

## Solution
Created a church selection interface that:
1. Shows all churches a user manages in a grid layout
2. Displays key stats for each church (followers, posts, services)
3. Shows notification badges for unread booking notifications per church
4. Allows easy switching between churches
5. Automatically redirects if user only manages one church

## Files Changed

### 1. **core/views.py**
- Added `select_church()` view to display church selection page
- Modified `manage_church()` view to accept optional `church_id` parameter
- Added logic to redirect to selection page when managing multiple churches
- Added notification count per church in selection view

### 2. **templates/core/select_church.html** (NEW)
- Created beautiful church selection page with Blue Sky theme
- Grid layout showing all managed churches
- Church cards display:
  - Church logo/icon
  - Church name and location
  - Stats (followers, posts, services)
  - Verification status badge
  - Notification badge for unread bookings
  - Hover effects for better UX

### 3. **core/urls.py**
- Added `path('select-church/', views.select_church, name='select_church')`
- Added `path('manage-church/<int:church_id>/', views.manage_church, name='manage_church')`
- Kept original `path('manage-church/', ...)` for backward compatibility

### 4. **templates/partials/topbar.html**
- Updated "Manage Church" link to point to `select_church` instead of directly to `manage_church`
- Updated active state to include both `manage_church` and `select_church` URL names

### 5. **templates/partials/manage/page_header.html**
- Added "Switch Church" button when user manages multiple churches
- Button appears in the page header for easy access
- Only shows when `user.owned_churches.count > 1`

## User Flow

### For Users Managing One Church:
1. Click "Manage Church" in topbar
2. Redirected to `select_church` view
3. Automatically redirected to `manage_church` for their single church
4. Seamless experience, no extra clicks

### For Users Managing Multiple Churches:
1. Click "Manage Church" in topbar
2. Shown church selection page with all their churches
3. Click on desired church card
4. Redirected to `manage_church` with specific `church_id`
5. Can switch churches using "Switch Church" button in page header

## Features

### Church Selection Page
- **Beautiful Grid Layout**: Responsive grid that adapts to screen size
- **Church Cards**: Each card shows:
  - Church logo or initial
  - Church name and location
  - Key statistics (followers, posts, services)
  - Verification status
  - Unread booking notifications badge
  - Hover effects for interactivity

### Notification System
- Shows unread booking notification count per church
- Red badge with count appears on church cards
- Helps managers prioritize which church needs attention

### Smart Redirects
- Single church: Auto-redirect to management page
- Multiple churches: Show selection page
- No churches: Redirect to home with message
- Invalid church_id: Error message and redirect to selection

### Permission Checks
- Verifies user owns the church before allowing management
- Prevents unauthorized access to church management
- Proper error handling for edge cases

## Benefits

1. **Multi-Church Management**: Managers can now easily handle multiple parishes
2. **Better UX**: Clear visual interface for church selection
3. **Notification Awareness**: See which churches need attention at a glance
4. **Flexible Navigation**: Easy switching between churches
5. **Backward Compatible**: Existing links still work
6. **Scalable**: Works for any number of churches

## Technical Details

### View Logic
```python
# select_church view
- Fetches all churches owned by user
- Calculates unread booking notifications per church
- Auto-redirects if only one church
- Renders selection page for multiple churches

# manage_church view
- Accepts optional church_id parameter
- If church_id provided: Get that specific church
- If no church_id: Redirect to select_church for multiple churches
- If only one church: Use it directly
- Permission check: Verify user owns the church
```

### URL Patterns
```python
# New patterns
select-church/                    # Church selection page
manage-church/<int:church_id>/    # Manage specific church

# Existing (backward compatible)
manage-church/                    # Auto-redirects based on church count
```

## Testing Checklist

- [x] User with one church: Auto-redirects to management
- [x] User with multiple churches: Shows selection page
- [x] User with no churches: Shows appropriate message
- [x] Notification badges display correctly
- [x] Church stats display correctly
- [x] Switch Church button appears for multi-church managers
- [x] Switch Church button hidden for single-church managers
- [x] Permission checks work correctly
- [x] Responsive design works on mobile
- [x] Hover effects work properly
- [x] Verification badges display correctly

## Future Enhancements

1. **Search/Filter**: Add search bar for managers with many churches
2. **Sorting Options**: Sort by name, notifications, followers, etc.
3. **Recent Churches**: Show most recently managed churches first
4. **Favorites**: Allow pinning favorite churches to top
5. **Quick Actions**: Add quick action buttons on church cards
6. **Analytics Preview**: Show more detailed stats on hover
7. **Bulk Actions**: Manage multiple churches simultaneously

## Related Files

- `core/views.py` - View logic
- `core/urls.py` - URL routing
- `templates/core/select_church.html` - Selection page template
- `templates/partials/topbar.html` - Navigation bar
- `templates/partials/manage/page_header.html` - Management page header

## Notes

- Uses Blue Sky theme for consistent design
- Follows optimization guide for efficient queries
- Maintains backward compatibility with existing links
- Properly handles edge cases and errors
- Includes proper permission checks
- Mobile-responsive design

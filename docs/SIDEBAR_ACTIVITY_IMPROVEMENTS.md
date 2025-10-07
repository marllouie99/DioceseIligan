# Sidebar Activity Improvements

## Changes Made

### 1. Limited Sidebar Activities to 3
**Reason:** Keep sidebar clean and focused, showing only the most recent activities.

#### Files Modified:

**`core/views.py`** - `get_context_data()` function
```python
# Changed from [:5] to [:3]
recent_activities = UserInteraction.objects.filter(
    user=user
).select_related('content_type').prefetch_related('content_object').order_by('-created_at')[:3]
```

**`accounts/views.py`** - `landing()` function
```python
# Changed from [:5] to [:3]
recent_activities = UserInteraction.objects.filter(
    user=request.user
).select_related('content_type').prefetch_related('content_object').order_by('-created_at')[:3]
```

**`core/views.py`** - `user_activities()` view
```python
# Changed from [:5] to [:3]
recent_auth_activities = UserActivity.objects.filter(
    user=request.user
).order_by('-created_at')[:3]
```

### 2. Added "See More Activities" Button
**Feature:** Button in sidebar that navigates to the profile page and scrolls directly to the Recent Activity section.

#### Template Changes:

**`templates/partials/sidebar.html`**
- Added footer section after activity list
- Includes "See More Activities" button with arrow icon
- Links to: `{% url 'accounts:manage_profile' %}#recent-activity-section`

```html
<div class="sidebar-activity-footer">
  <a href="{% url 'accounts:manage_profile' %}#recent-activity-section" class="sidebar-activity-see-more">
    See More Activities
    <svg><!-- arrow icon --></svg>
  </a>
</div>
```

**`templates/manage_profile.html`**
- Added ID anchor to Recent Activity section: `id="recent-activity-section"`
- Allows smooth scrolling directly to this section

### 3. Smooth Scrolling Support
**Feature:** Smooth scroll animation when clicking "See More Activities" button.

**`static/css/app.css`**
- Added `scroll-behavior: smooth;` to html element
- Ensures smooth page scrolling when using anchor links

### 4. Button Styling
**Design:** Styled to match the Warm Sacred Earth theme.

**`static/css/app.css`** - New classes added:

```css
.sidebar-activity-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(218, 165, 32, 0.2);
}

.sidebar-activity-see-more {
  /* Golden gradient button with hover effects */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(218, 165, 32, 0.2), rgba(160, 82, 45, 0.2));
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.sidebar-activity-see-more:hover {
  /* Lift and brighten on hover */
  background: linear-gradient(135deg, rgba(218, 165, 32, 0.3), rgba(160, 82, 45, 0.3));
  border-color: rgba(218, 165, 32, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.sidebar-activity-see-more svg {
  transition: transform 0.2s ease;
}

.sidebar-activity-see-more:hover svg {
  /* Arrow slides right on hover */
  transform: translateX(2px);
}
```

## User Experience Flow

### Before:
1. User sees 5 activities in sidebar (could be cluttered)
2. No way to easily view full activity history

### After:
1. User sees **3 most recent activities** in sidebar (clean, focused)
2. "See More Activities" button appears below the activities
3. Clicking the button:
   - Navigates to profile page
   - Smoothly scrolls to Recent Activity section
   - Shows all 15 recent activities in the profile overview
4. From profile, can click "View All" to see complete activity history (50+ activities)

## Visual Hierarchy

```
Sidebar (3 activities)
       ↓
   [See More Activities button]
       ↓
Profile Page → Recent Activity Section (15 activities)
       ↓
   [View All link]
       ↓
Full Activity Page (50+ activities with filters)
```

## Benefits

1. **Cleaner Sidebar** - Less visual clutter with only 3 activities
2. **Easy Navigation** - One-click access to more activities
3. **Better UX** - Clear path to view complete activity history
4. **Smooth Experience** - Animated scroll to exact section
5. **Consistent Design** - Button matches warm earth theme
6. **Visual Feedback** - Hover effects on button

## Technical Details

### Anchor Link Format
```
/accounts/profile/#recent-activity-section
```

### CSS Smooth Scroll
Applied globally to all anchor links on the site:
```css
html {
  scroll-behavior: smooth;
}
```

### Activity Count Summary
- **Sidebar:** 3 activities
- **Profile Overview:** 15 activities  
- **Full Activity Page:** 50 activities (with filters)

## Testing Checklist

- [x] Sidebar shows only 3 activities
- [x] "See More Activities" button appears in sidebar
- [x] Button links to profile page with anchor
- [x] Page smoothly scrolls to Recent Activity section
- [x] Button hover effects work properly
- [x] Arrow icon animates on hover
- [x] Responsive on mobile devices
- [x] Works across all pages with sidebar

## Future Enhancements

1. **Activity Count Badge** - Show total count on button (e.g., "See 12 More Activities")
2. **Dropdown Preview** - Hover to see next 5 activities without navigating
3. **Customizable Limit** - Let users choose how many activities to show (3, 5, 10)
4. **Activity Filters** - Quick filter buttons in sidebar (Posts, Churches, etc.)
5. **Live Updates** - Real-time activity updates using WebSockets
6. **Collapse/Expand** - Toggle to show/hide sidebar activities

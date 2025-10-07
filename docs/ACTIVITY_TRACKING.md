# User Activity Tracking System

## Overview

The ChurchIligan platform now has a comprehensive user activity tracking system that monitors all user interactions with posts, churches, bookings, and more.

## Features

### 1. **Activity Types Tracked**

#### Post Interactions
- **Like/Unlike Posts** - When users like or unlike church posts
- **Comment on Posts** - When users comment on posts (including replies)
- **Bookmark/Unbookmark Posts** - When users save or unsave posts
- **View Posts** - When users view posts (throttled to prevent spam)
- **Share Posts** - When users share posts

#### Church Interactions
- **Follow Church** - When users follow a church
- **Unfollow Church** - When users unfollow a church

#### Booking Activities
- **Create Booking** - When users book a service
- **Update Booking** - When users modify their bookings
- **Cancel Booking** - When users cancel bookings

#### Other Activities
- **Service Review** - When users review a church service
- **Profile Update** - When users update their profile

#### Authentication Activities (Separate Model)
- **Login Success/Failed** - User login attempts
- **Registration** - User account creation
- **Email Verification** - Email confirmation
- **Password Reset** - Password change requests

### 2. **Activity Display**

#### Sidebar (All Pages)
- Shows **recent authentication activities** (logins, registrations, profile updates)
- Displays last 5 activities
- Shows success/failure status
- Uses `UserActivity` model

#### Profile Page - Recent Activity Section
- Shows **post interactions** (likes, comments, bookmarks, views)
- Displays last 15 activities
- Click "View All" to see complete activity history
- Uses `UserInteraction` model

#### Dedicated Activities Page
- Full activity history with filters
- Filter by: All, Posts, Churches, Auth
- Shows activity statistics
- URL: `/my-activities/`

### 3. **Data Captured**

For each activity, the system captures:
- **User** - Who performed the action
- **Activity Type** - What action was performed
- **Timestamp** - When it occurred
- **Related Object** - The post, church, or booking involved
- **IP Address** - User's IP (for security/analytics)
- **User Agent** - Browser information
- **Metadata** - Additional context (JSON field)

## Implementation

### Using the Activity Tracker

The system provides a convenient `ActivityTracker` utility class for easy activity logging:

```python
from core.activity_tracker import ActivityTracker

# Track a post like
ActivityTracker.track_post_like(user=request.user, post=post, request=request)

# Track a comment with metadata
ActivityTracker.track_post_comment(
    user=request.user, 
    post=post, 
    comment_id=comment.id,
    is_reply=True,
    request=request
)

# Track a church follow
ActivityTracker.track_church_follow(user=request.user, church=church, request=request)
```

### Currently Integrated

Activity tracking is **already integrated** in these views:
- ✅ `toggle_post_like` - Tracks likes/unlikes
- ✅ `toggle_post_bookmark` - Tracks bookmarks
- ✅ `add_post_comment` - Tracks comments
- ✅ `track_post_view` - Tracks post views

### To Be Integrated

You can add activity tracking to:
- Church follow/unfollow views
- Booking creation/cancellation views
- Service review submissions
- Profile updates

Example for follow church:

```python
@login_required
def follow_church(request, church_id):
    church = get_object_or_404(Church, id=church_id)
    # ... existing follow logic ...
    
    # Add activity tracking
    from core.activity_tracker import ActivityTracker
    ActivityTracker.track_church_follow(user=request.user, church=church, request=request)
    
    return redirect('core:church_detail', slug=church.slug)
```

### Retrieving Activities

```python
from core.activity_tracker import ActivityTracker

# Get all activities for a user (last 20)
activities = ActivityTracker.get_user_activities(user=request.user, limit=20)

# Get only post interactions
post_activities = ActivityTracker.get_post_interactions(user=request.user)

# Get only church interactions
church_activities = ActivityTracker.get_church_interactions(user=request.user)

# Get activity statistics
stats = ActivityTracker.get_activity_stats(user=request.user)
# Returns: {'post_like': 45, 'post_comment': 12, 'church_follow': 3, ...}
```

## Models

### UserInteraction Model
**Location:** `core/models.py`

Tracks content interactions (posts, churches, bookings)

**Fields:**
- `user` - ForeignKey to User
- `activity_type` - CharField (choices)
- `content_type` - GenericForeignKey
- `object_id` - PositiveIntegerField
- `metadata` - JSONField
- `ip_address` - GenericIPAddressField
- `user_agent` - TextField
- `created_at` - DateTimeField

### UserActivity Model
**Location:** `accounts/models.py`

Tracks authentication-related activities

**Fields:**
- `user` - ForeignKey to User
- `email` - EmailField
- `activity_type` - CharField (choices)
- `success` - BooleanField
- `details` - TextField
- `ip_address` - GenericIPAddressField
- `user_agent` - TextField
- ... and more location/device info

## URLs

- **View all activities:** `/my-activities/`
- **Filter by posts:** `/my-activities/?filter=posts`
- **Filter by churches:** `/my-activities/?filter=churches`
- **Filter by auth:** `/my-activities/?filter=auth`

## Templates

### Sidebar Activity Display
**File:** `templates/partials/sidebar.html`
- Shows authentication activities
- Uses `recent_auth_activities` context variable

### Profile Activity Display
**File:** `templates/manage_profile.html`
- Shows post interactions
- Uses `recent_activities` context variable

## Context Variables

Views should provide:
- `recent_auth_activities` - For sidebar (UserActivity queryset)
- `recent_activities` - For page content (UserInteraction queryset)

## Best Practices

1. **Always pass the request object** when tracking activities for IP/user agent capture
2. **Use metadata for additional context** (e.g., comment ID, reply status, share platform)
3. **Track sparingly** - Don't track every single action (e.g., views are throttled)
4. **Consider privacy** - IP addresses are collected; inform users in privacy policy
5. **Use the ActivityTracker utility** - Provides consistent interface and validation

## Analytics Potential

This data can be used for:
- User engagement metrics
- Popular content identification
- User behavior analysis
- Recommendation algorithms
- Activity feeds/timelines
- Personalization

## Privacy & GDPR Compliance

- IP addresses are personal data under GDPR
- Users should be informed in privacy policy
- Consider adding data retention policies
- Provide users way to view/delete their activity data
- Consider anonymizing old activity data

## Future Enhancements

- [ ] Activity feed/timeline view
- [ ] Export activity data (JSON/CSV)
- [ ] Activity-based notifications
- [ ] Social features (see what friends are doing)
- [ ] Gamification (badges, achievements)
- [ ] Activity-based recommendations
- [ ] Admin analytics dashboard
- [ ] Data retention & cleanup policies

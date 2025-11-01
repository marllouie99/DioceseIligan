# Parish Staff Role-Based Permissions

## Overview
This document outlines the permissions for different parish staff roles.

## Roles

### 1. Parish Manager (Owner)
**Full Access** - Can do everything

### 2. Parish Secretary/Coordinator  
**Operational Management**

**Allowed Permissions:**
- `appointments` - View, approve, decline, manage bookings
- `services` - Create, edit, delete services
- `availability` - Manage service availability schedules
- `transactions` - View and manage booking transactions

**Cannot Access:**
- Events
- Content (Posts)
- Donations
- Followers
- Parish Admins
- Settings

### 3. Ministry Leader/Volunteer
**Content & Community Management**

**Allowed Permissions:**
- `events` - Create and manage events
- `content` - Create, edit, delete posts

**Cannot Access:**
- Appointments
- Services
- Availability
- Transactions
- Donations
- Followers
- Parish Admins
- Settings

## Permission Helper Function

```python
user_can_manage_church(user, church, required_permissions=None)
```

**Parameters:**
- `user`: The user to check
- `church`: The church instance
- `required_permissions`: List of permissions (e.g., ['appointments', 'services'])

**Returns:**
- `(has_permission: bool, user_role: str or None)`

**Example Usage:**
```python
# Check if user can manage services
can_manage, role = user_can_manage_church(request.user, church, ['services'])
if not can_manage:
    messages.error(request, "You don't have permission to manage services.")
    return redirect('core:home')
```

## Views That Need Updating

### Secretary Permissions (appointments, services, availability, transactions):
- ✅ `/app/manage-church/<id>/followers-list/` - For adding staff (Owner only)
- ✅ `/app/manage-church/<id>/add-staff/` - For adding staff (Owner only)
- ⚠️ Booking management views - Need to update permission checks
- ⚠️ Service CRUD views - Need to update permission checks
- ⚠️ Availability CRUD views - Need to update permission checks
- ⚠️ Transaction views - Need to update permission checks

### Volunteer Permissions (events, content):
- ⚠️ Post creation/edit views - Need to update permission checks
- ⚠️ Event creation/edit views - Need to update permission checks

## Implementation Status

**Created:**
- ✅ Permission helper function
- ✅ Role-based tab filtering in template
- ✅ Staff access to manage page

**TODO:**
- ⚠️ Update all view permission checks to use the helper function
- ⚠️ Test each role's access to their allowed features
- ⚠️ Add permission checks to AJAX endpoints
- ⚠️ Update form submission handlers

## Testing Checklist

### Parish Secretary:
- [ ] Can view appointments tab
- [ ] Can approve/decline bookings
- [ ] Can create/edit services
- [ ] Can manage availability
- [ ] Can view transactions
- [ ] Cannot access events tab
- [ ] Cannot access content tab
- [ ] Cannot access donations
- [ ] Cannot access settings

### Ministry Leader:
- [ ] Can view events tab
- [ ] Can create/edit events
- [ ] Can view content tab
- [ ] Can create/edit posts
- [ ] Cannot access appointments
- [ ] Cannot access services
- [ ] Cannot access transactions
- [ ] Cannot access settings

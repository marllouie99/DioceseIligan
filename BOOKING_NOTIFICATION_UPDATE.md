# Booking Notification & Duplication Fix

## Summary
Fixed booking duplication issue and added notification indicators for church owners when there are new booking/appointment updates.

## Changes Made

### 1. Fixed Booking Duplication Issue ✅
**File:** `core/models.py` (Booking model)

**Problem:** The `Booking.save()` method was calling `super().save()` twice - once initially and once to update the booking code. This triggered the `post_save` signal twice, causing duplicate bookings.

**Solution:** Modified the save method to use `Booking.objects.filter(pk=self.pk).update(code=self.code)` for the code update instead of calling `super().save()` again. This avoids triggering signals a second time.

**Code Changes:**
```python
def save(self, *args, **kwargs):
    is_new = self.pk is None
    if is_new and not self.code:
        # For new bookings, save first to get ID, then update code
        super().save(*args, **kwargs)
        self.code = f"APPT-{self.id:04d}"
        # Use update() to avoid triggering signals again
        Booking.objects.filter(pk=self.pk).update(code=self.code)
    else:
        # For existing bookings, just save normally
        super().save(*args, **kwargs)
```

### 2. Added Notification Indicators ✅

#### A. Updated Context Function
**File:** `core/views.py` (_app_context function)

Added `unread_booking_notifications` count to the global context, which counts unread notifications related to bookings for church owners.

**Code Changes:**
```python
# Get unread booking notifications count for church owners
unread_booking_notifications = 0
if user.is_authenticated and user.owned_churches.exists():
    from core.models import Notification, Booking
    unread_booking_notifications = Notification.objects.filter(
        user=user,
        is_read=False,
        notification_type__in=[
            Notification.TYPE_BOOKING_REQUESTED,
            Notification.TYPE_BOOKING_REVIEWED,
            Notification.TYPE_BOOKING_APPROVED,
            Notification.TYPE_BOOKING_DECLINED,
            Notification.TYPE_BOOKING_CANCELED,
            Notification.TYPE_BOOKING_COMPLETED
        ]
    ).count()
```

#### B. Added Indicator to "Manage Church" Link
**File:** `templates/partials/topbar.html`

Added a red badge showing the count of unread booking notifications on the "Manage Church" link in the topbar.

**Visual:** Red circular badge with white text showing the count (only visible when count > 0)

#### C. Added Indicator to Appointments Tab
**File:** `templates/partials/manage/tab_navigation.html`

Added a red badge showing the count of unread booking notifications on the Appointments tab button.

**Visual:** Red circular badge positioned at the top-right of the tab button (only visible when count > 0)

### 3. Auto-Mark Notifications as Read ✅
**File:** `core/views.py` (manage_church function)

When a church owner views the Appointments tab, all unread booking-related notifications are automatically marked as read, which clears the indicators.

**Code Changes:**
```python
# Mark booking notifications as read when viewing appointments tab
current_tab = request.GET.get('tab', 'overview')
if current_tab == 'appointments':
    Notification.objects.filter(
        user=request.user,
        is_read=False,
        notification_type__in=[
            Notification.TYPE_BOOKING_REQUESTED,
            Notification.TYPE_BOOKING_REVIEWED,
            Notification.TYPE_BOOKING_APPROVED,
            Notification.TYPE_BOOKING_DECLINED,
            Notification.TYPE_BOOKING_CANCELED,
            Notification.TYPE_BOOKING_COMPLETED
        ]
    ).update(is_read=True)
```

## User Experience Flow

1. **User books a service** → Booking is created (only once, no duplicates)
2. **Church owner receives notification** → Red badge appears on "Manage Church" link and "Appointments" tab
3. **Church owner clicks "Manage Church"** → Badge is visible
4. **Church owner clicks "Appointments" tab** → All unread booking notifications are marked as read, badges disappear

## Testing Recommendations

1. **Test Booking Creation:**
   - Book a service as a user
   - Verify only ONE booking is created (check database)
   - Verify church owner receives notification

2. **Test Notification Indicators:**
   - As church owner, check if red badge appears on "Manage Church" link
   - Navigate to Manage Church page
   - Verify red badge appears on "Appointments" tab
   - Click on "Appointments" tab
   - Verify badges disappear after viewing

3. **Test Multiple Bookings:**
   - Create multiple bookings from different users
   - Verify badge count increases correctly
   - Verify all notifications are marked as read when viewing appointments

## Files Modified

1. `core/models.py` - Fixed Booking.save() method
2. `core/views.py` - Added unread count to context and auto-mark as read logic
3. `templates/partials/topbar.html` - Added badge to Manage Church link
4. `templates/partials/manage/tab_navigation.html` - Added badge to Appointments tab

## Notes

- The notification badges use a red (#ef4444) circular design for high visibility
- Badges only appear when there are unread notifications (count > 0)
- The system automatically clears indicators when the church owner views the appointments tab
- No database migrations are required as we only modified logic, not models

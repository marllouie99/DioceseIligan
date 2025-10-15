# 🔧 Chat Notification Signal Fix

## Issue
500 Internal Server Error when sending messages because the notification signal was trying to use fields that don't exist in the Notification model.

## Root Cause
The signal was trying to create notifications with:
- `notification_type='message'` - Not in TYPE_CHOICES
- `priority='normal'` - Should be `PRIORITY_MEDIUM`
- `link` field - Doesn't exist in model
- `icon` field - Doesn't exist in model

## Fix Applied
Updated `core/chat_signals.py` to use correct fields:

### Before (❌ Error):
```python
Notification.objects.create(
    user=recipient,
    title=title,
    message=message,
    notification_type='message',  # ❌ Not in choices
    priority='normal',             # ❌ Wrong constant
    link=f'/app/church/{conversation.church.slug}/',  # ❌ Field doesn't exist
    icon='message'                 # ❌ Field doesn't exist
)
```

### After (✅ Fixed):
```python
Notification.objects.create(
    user=recipient,
    title=title,
    message=message,
    notification_type=Notification.TYPE_FOLLOW_REQUEST,  # ✅ Valid choice (temporary)
    priority=Notification.PRIORITY_MEDIUM,               # ✅ Correct constant
    church=conversation.church                           # ✅ Valid field
)
```

## Current Notification Model Fields

### Required Fields:
- `user` - ForeignKey to User ✅
- `notification_type` - Must be from TYPE_CHOICES ✅
- `title` - CharField ✅
- `message` - TextField ✅
- `priority` - Must be from PRIORITY_CHOICES ✅

### Optional Fields:
- `booking` - ForeignKey to Booking (optional)
- `church` - ForeignKey to Church (optional) ✅ Using this
- `is_read` - Boolean (default False)
- `read_at` - DateTime (nullable)

### Available Notification Types:
- `TYPE_BOOKING_REQUESTED`
- `TYPE_BOOKING_REVIEWED`
- `TYPE_BOOKING_APPROVED`
- `TYPE_BOOKING_DECLINED`
- `TYPE_BOOKING_CANCELED`
- `TYPE_BOOKING_COMPLETED`
- `TYPE_CHURCH_APPROVED`
- `TYPE_CHURCH_DECLINED`
- `TYPE_FOLLOW_REQUEST` ← **Using this temporarily**
- `TYPE_FOLLOW_ACCEPTED`

### Available Priority Levels:
- `PRIORITY_LOW`
- `PRIORITY_MEDIUM` ← **Using this**
- `PRIORITY_HIGH`
- `PRIORITY_URGENT`

## Temporary Solution

Currently using `TYPE_FOLLOW_REQUEST` as a placeholder for message notifications. This works but is not ideal.

## Recommended Future Enhancement

Add a proper message notification type to the Notification model:

### 1. Update Model (core/models.py):
```python
class Notification(models.Model):
    # Add to TYPE_CHOICES
    TYPE_MESSAGE_RECEIVED = 'message_received'
    
    TYPE_CHOICES = [
        # ... existing choices ...
        (TYPE_MESSAGE_RECEIVED, 'New Message'),
    ]
    
    # Add conversation field
    conversation = models.ForeignKey(
        'Conversation', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='notifications'
    )
```

### 2. Create Migration:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Update Signal (core/chat_signals.py):
```python
Notification.objects.create(
    user=recipient,
    title=title,
    message=message,
    notification_type=Notification.TYPE_MESSAGE_RECEIVED,  # ✅ Proper type
    priority=Notification.PRIORITY_MEDIUM,
    church=conversation.church,
    conversation=conversation  # ✅ Link to conversation
)
```

## Status
✅ **Fixed** - Notifications now work without errors
⚠️ **Temporary** - Using TYPE_FOLLOW_REQUEST as placeholder
📝 **Recommended** - Add proper message notification type

## Testing
- [x] Send message without error
- [x] Notification created successfully
- [x] Notification appears in topbar
- [x] Badge count updates
- [x] No 500 errors

---

**Fixed**: October 15, 2025, 5:13 PM  
**Status**: ✅ Working (with temporary type)  
**Next Step**: Add proper message notification type (optional)

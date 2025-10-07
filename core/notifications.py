"""
Notification utility functions for creating and managing notifications.
"""
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Notification, Booking, Church

User = get_user_model()


def create_notification(user, notification_type, title, message, priority=Notification.PRIORITY_MEDIUM, 
                       booking=None, church=None):
    """
    Create a new notification for a user.
    
    Args:
        user: User instance to receive the notification
        notification_type: Type of notification (from Notification.TYPE_*)
        title: Notification title
        message: Notification message
        priority: Priority level (default: medium)
        booking: Related booking instance (optional)
        church: Related church instance (optional)
    
    Returns:
        Notification instance
    """
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        priority=priority,
        booking=booking,
        church=church
    )


def create_booking_notification(booking, notification_type, title, message, priority=Notification.PRIORITY_MEDIUM):
    """
    Create a notification related to a booking.
    
    Args:
        booking: Booking instance
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        priority: Priority level
    
    Returns:
        Notification instance
    """
    return create_notification(
        user=booking.user,
        notification_type=notification_type,
        title=title,
        message=message,
        priority=priority,
        booking=booking,
        church=booking.church
    )


def create_church_notification(church_owner, notification_type, title, message, 
                              priority=Notification.PRIORITY_MEDIUM, church=None):
    """
    Create a notification for a church owner.
    
    Args:
        church_owner: User instance (church owner)
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        priority: Priority level
        church: Related church instance
    
    Returns:
        Notification instance
    """
    return create_notification(
        user=church_owner,
        notification_type=notification_type,
        title=title,
        message=message,
        priority=priority,
        church=church
    )


def get_user_unread_count(user):
    """
    Get the count of unread notifications for a user.
    
    Args:
        user: User instance
    
    Returns:
        int: Number of unread notifications
    """
    return Notification.objects.filter(user=user, is_read=False).count()


def get_user_notifications(user, limit=20, unread_only=False):
    """
    Get notifications for a user.
    
    Args:
        user: User instance
        limit: Maximum number of notifications to return
        unread_only: If True, only return unread notifications
    
    Returns:
        QuerySet of notifications
    """
    queryset = Notification.objects.filter(user=user)
    
    if unread_only:
        queryset = queryset.filter(is_read=False)
    
    return queryset.select_related('booking', 'church')[:limit]


def mark_notification_as_read(notification_id, user):
    """
    Mark a specific notification as read.
    
    Args:
        notification_id: ID of the notification
        user: User instance (for security)
    
    Returns:
        bool: True if notification was marked as read, False otherwise
    """
    try:
        notification = Notification.objects.get(id=notification_id, user=user)
        notification.mark_as_read()
        return True
    except Notification.DoesNotExist:
        return False


def mark_all_notifications_as_read(user):
    """
    Mark all notifications as read for a user.
    
    Args:
        user: User instance
    
    Returns:
        int: Number of notifications marked as read
    """
    unread_notifications = Notification.objects.filter(user=user, is_read=False)
    count = unread_notifications.count()
    
    if count > 0:
        now = timezone.now()
        unread_notifications.update(is_read=True, read_at=now)
    
    return count


# Notification templates for common scenarios
class NotificationTemplates:
    """Templates for common notification messages."""
    
    @staticmethod
    def booking_requested(booking):
        """Template for new booking request notification."""
        return {
            'title': f'New Appointment Request - {booking.church.name}',
            'message': f'{booking.user.get_full_name() or booking.user.username} has requested an appointment for \'{booking.service.name}\' on {booking.date.strftime("%b %d, %Y")}. Please review and respond.',
            'priority': Notification.PRIORITY_HIGH
        }
    
    @staticmethod
    def booking_reviewed(booking):
        """Template for booking reviewed notification (to requester)."""
        return {
            'title': f'Appointment Under Review - {booking.church.name}',
            'message': f'Your appointment for \'{booking.service.name}\' on {booking.date.strftime("%b %d, %Y")} is currently under review. We will update you soon.',
            'priority': Notification.PRIORITY_MEDIUM
        }
    
    @staticmethod
    def booking_approved(booking):
        """Template for booking approved notification."""
        return {
            'title': f'Appointment Approved - {booking.church.name}',
            'message': f'Your appointment for \'{booking.service.name}\' on {booking.date.strftime("%b %d, %Y")} has been approved. Please arrive on time.',
            'priority': Notification.PRIORITY_MEDIUM
        }
    
    @staticmethod
    def booking_declined(booking):
        """Template for booking declined notification."""
        reason = (booking.decline_reason or '').strip()
        message = (
            f"Your appointment for '{booking.service.name}' on {booking.date.strftime('%b %d, %Y')} has been declined. Reason: {reason}."
            if reason else
            f"Your appointment for '{booking.service.name}' on {booking.date.strftime('%b %d, %Y')} has been declined. Please contact the church for more information."
        )
        return {
            'title': f'Appointment Declined - {booking.church.name}',
            'message': message,
            'priority': Notification.PRIORITY_MEDIUM
        }
    
    @staticmethod
    def booking_canceled(booking):
        """Template for booking canceled notification."""
        return {
            'title': f'Appointment Canceled - {booking.church.name}',
            'message': f'Your appointment for \'{booking.service.name}\' on {booking.date.strftime("%b %d, %Y")} has been canceled. {booking.cancel_reason or "Please contact the church for more information."}',
            'priority': Notification.PRIORITY_MEDIUM
        }
    
    @staticmethod
    def booking_completed(booking):
        """Template for booking completed notification."""
        return {
            'title': f'Appointment Completed - {booking.church.name}',
            'message': f'Your appointment for \'{booking.service.name}\' on {booking.date.strftime("%b %d, %Y")} has been marked as completed. Thank you for using our services!',
            'priority': Notification.PRIORITY_LOW
        }
    
    @staticmethod
    def church_approved(church):
        """Template for church approval notification."""
        return {
            'title': f'Church Approved - {church.name}',
            'message': 'Your church has been approved and is now visible on the platform.',
            'priority': Notification.PRIORITY_HIGH
        }
    
    @staticmethod
    def church_declined(church):
        """Template for church decline notification."""
        return {
            'title': f'Church Declined - {church.name}',
            'message': 'Your church application has been declined. Please review the requirements and try again.',
            'priority': Notification.PRIORITY_HIGH
        }


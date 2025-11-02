"""
Chat Signals
Automatically create notifications for new chat messages
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Message, Notification


@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
    """
    Create a notification when a new message is sent.
    Notifies the recipient (not the sender).
    """
    if not created:
        return
    
    # Get the conversation
    conversation = instance.conversation
    
    # Determine who should receive the notification
    # If sender is the user, notify all church staff with messaging access
    # If sender is the church owner/staff, notify the user
    if instance.sender == conversation.user:
        # User sent message to church, notify all parish staff
        sender_name = instance.sender.username
        try:
            if instance.sender.get_full_name():
                sender_name = instance.sender.get_full_name()
            if hasattr(instance.sender, 'profile') and instance.sender.profile:
                if instance.sender.profile.display_name:
                    sender_name = instance.sender.profile.display_name
        except:
            pass
        
        title = f"New message from {sender_name}"
        
        if instance.attachment:
            if instance.content:
                message_text = f"{instance.content[:50]}... [Attachment]"
            else:
                message_text = f"Sent a file: {instance.attachment_name}"
        else:
            message_text = instance.content[:100] if len(instance.content) > 100 else instance.content
        
        # Notify all parish staff with messaging permissions
        from .notifications import notify_parish_staff
        from .models import ChurchStaff
        
        # Get all staff with messaging permission (secretaries have messaging by default)
        staff_with_messaging = []
        
        # Add church owner if exists
        if conversation.church.owner and conversation.church.owner != instance.sender:
            staff_with_messaging.append(conversation.church.owner)
        
        # Add secretaries (they have messaging permission)
        secretaries = ChurchStaff.objects.filter(
            church=conversation.church,
            status=ChurchStaff.STATUS_ACTIVE,
            role=ChurchStaff.ROLE_SECRETARY
        ).select_related('user')
        
        for secretary in secretaries:
            if secretary.user != instance.sender:
                staff_with_messaging.append(secretary.user)
        
        # Create notification for each staff member
        for staff_user in staff_with_messaging:
            Notification.objects.create(
                user=staff_user,
                title=title,
                message=message_text,
                notification_type=Notification.TYPE_MESSAGE_RECEIVED,
                priority=Notification.PRIORITY_MEDIUM,
                church=conversation.church
            )
    
    elif conversation.church.owner and instance.sender == conversation.church.owner:
        # Church owner sent message to user, notify user
        recipient = conversation.user
        sender_name = conversation.church.name
        
        # Create notification for user
        if recipient != instance.sender:  # Don't notify yourself
            title = f"New message from {sender_name}"
            
            if instance.attachment:
                if instance.content:
                    message = f"{instance.content[:50]}... [Attachment]"
                else:
                    message = f"Sent a file: {instance.attachment_name}"
            else:
                message = instance.content[:100] if len(instance.content) > 100 else instance.content
            
            Notification.objects.create(
                user=recipient,
                title=title,
                message=message,
                notification_type=Notification.TYPE_MESSAGE_RECEIVED,
                priority=Notification.PRIORITY_MEDIUM,
                church=conversation.church
            )
    else:
        # Staff member (or other user) sent message to conversation user
        # Check if sender is a staff member with messaging permissions
        from .models import ChurchStaff
        is_staff = ChurchStaff.objects.filter(
            user=instance.sender,
            church=conversation.church,
            status=ChurchStaff.STATUS_ACTIVE,
            role=ChurchStaff.ROLE_SECRETARY
        ).exists()
        
        if is_staff and instance.sender != conversation.user:
            # Staff sent message to user, notify user
            recipient = conversation.user
            sender_name = conversation.church.name
            
            if recipient != instance.sender:
                title = f"New message from {sender_name}"
                
                if instance.attachment:
                    if instance.content:
                        message = f"{instance.content[:50]}... [Attachment]"
                    else:
                        message = f"Sent a file: {instance.attachment_name}"
                else:
                    message = instance.content[:100] if len(instance.content) > 100 else instance.content
                
                Notification.objects.create(
                    user=recipient,
                    title=title,
                    message=message,
                    notification_type=Notification.TYPE_MESSAGE_RECEIVED,
                    priority=Notification.PRIORITY_MEDIUM,
                    church=conversation.church
                )

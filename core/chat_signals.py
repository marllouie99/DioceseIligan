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
    # If sender is the user, notify the church owner (or staff)
    # If sender is the church owner, notify the user
    if instance.sender == conversation.user:
        # User sent message to church, notify church owner
        recipient = conversation.church.owner
        
        # Allow message sending even if church has no owner (message will be stored)
        # Only create notification if recipient exists
        if recipient is not None:
            sender_name = instance.sender.username
            try:
                if instance.sender.get_full_name():
                    sender_name = instance.sender.get_full_name()
                if hasattr(instance.sender, 'profile') and instance.sender.profile:
                    if instance.sender.profile.display_name:
                        sender_name = instance.sender.profile.display_name
            except:
                pass
            
            # Create notification for church owner (don't notify yourself)
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

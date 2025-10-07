"""
Django signals for automatic notification creation.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import Booking, Church, ChurchVerificationRequest, Notification
from .notifications import create_booking_notification, create_church_notification, NotificationTemplates

User = get_user_model()

@receiver(pre_save, sender=Booking)
def cache_booking_old_status(sender, instance, **kwargs):
    """
    Cache the previous status on the instance before saving so post_save can detect changes.
    """
    if instance.pk:
        try:
            instance._old_status = Booking.objects.only('status').get(pk=instance.pk).status
        except Booking.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Booking)
def create_booking_notifications(sender, instance, created, **kwargs):
    """
    Create notifications when booking status changes.
    """
    if created:
        # New booking request - notify church owner only
        church_owner = instance.church.owner
        template = NotificationTemplates.booking_requested(instance)

        create_church_notification(
            church_owner=church_owner,
            notification_type=Notification.TYPE_BOOKING_REQUESTED,
            title=template['title'],
            message=template['message'],
            priority=template['priority'],
            church=instance.church
        )
    
    else:
        # Booking status changed - notify user
        old_status = getattr(instance, '_old_status', None)
        if old_status and old_status != instance.status:
            template = None
            
            if instance.status == Booking.STATUS_REVIEWED:
                template = NotificationTemplates.booking_reviewed(instance)
                notification_type = Notification.TYPE_BOOKING_REVIEWED
            elif instance.status == Booking.STATUS_APPROVED:
                template = NotificationTemplates.booking_approved(instance)
                notification_type = Notification.TYPE_BOOKING_APPROVED
            elif instance.status == Booking.STATUS_DECLINED:
                template = NotificationTemplates.booking_declined(instance)
                notification_type = Notification.TYPE_BOOKING_DECLINED
            elif instance.status == Booking.STATUS_CANCELED:
                template = NotificationTemplates.booking_canceled(instance)
                notification_type = Notification.TYPE_BOOKING_CANCELED
            elif instance.status == Booking.STATUS_COMPLETED:
                template = NotificationTemplates.booking_completed(instance)
                notification_type = Notification.TYPE_BOOKING_COMPLETED
            
            if template:
                create_booking_notification(
                    booking=instance,
                    notification_type=notification_type,
                    title=template['title'],
                    message=template['message'],
                    priority=template['priority']
                )


@receiver(post_save, sender=ChurchVerificationRequest)
def create_church_verification_notifications(sender, instance, created, **kwargs):
    """
    Create notifications and send emails when church verification status changes.
    """
    if not created and instance.status in [ChurchVerificationRequest.STATUS_APPROVED, ChurchVerificationRequest.STATUS_REJECTED]:
        church_owner = instance.church.owner
        template = None
        
        if instance.status == ChurchVerificationRequest.STATUS_APPROVED:
            template = NotificationTemplates.church_approved(instance.church)
            notification_type = Notification.TYPE_CHURCH_APPROVED
            
            # Send approval email
            from accounts.email_utils import send_church_verification_approved_email
            from django.urls import reverse
            
            try:
                # Build church URL
                church_url = f"http://localhost:8000{reverse('core:church_detail', kwargs={'slug': instance.church.slug})}"
                
                # Format approved date
                from django.utils import timezone
                approved_date = timezone.now().strftime("%B %d, %Y")
                
                # Get user's full name or username
                user_name = church_owner.get_full_name() or church_owner.username
                
                # Send email
                send_church_verification_approved_email(
                    user_email=church_owner.email,
                    user_name=user_name,
                    church_name=instance.church.name,
                    church_url=church_url,
                    approved_date=approved_date
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send church verification approved email: {str(e)}")
                
        elif instance.status == ChurchVerificationRequest.STATUS_REJECTED:
            template = NotificationTemplates.church_declined(instance.church)
            notification_type = Notification.TYPE_CHURCH_DECLINED
            
            # Send rejection email
            from accounts.email_utils import send_church_verification_rejected_email
            
            try:
                send_church_verification_rejected_email(
                    user_email=church_owner.email,
                    church_name=instance.church.name,
                    rejection_notes=instance.notes or ''
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send church verification rejected email: {str(e)}")
        
        if template:
            create_church_notification(
                church_owner=church_owner,
                notification_type=notification_type,
                title=template['title'],
                message=template['message'],
                priority=template['priority'],
                church=instance.church
            )

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
    Cache the previous status and payment_status on the instance before saving so post_save can detect changes.
    """
    if instance.pk:
        try:
            old_booking = Booking.objects.only('status', 'payment_status').get(pk=instance.pk)
            instance._old_status = old_booking.status
            instance._old_payment_status = old_booking.payment_status
        except Booking.DoesNotExist:
            instance._old_status = None
            instance._old_payment_status = None
    else:
        instance._old_status = None
        instance._old_payment_status = None


@receiver(post_save, sender=Booking)
def create_booking_notifications(sender, instance, created, **kwargs):
    """
    Create notifications when booking status changes.
    """
    if created:
        # New booking request - notify church owner only
        church_owner = instance.church.owner
        
        # Only create notification if church has an owner
        if church_owner:
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
                
                # If booking is canceled and payment was pending, mark payment as canceled
                if instance.payment_status == 'pending':
                    Booking.objects.filter(pk=instance.pk).update(payment_status='canceled')
            elif instance.status == Booking.STATUS_COMPLETED:
                template = NotificationTemplates.booking_completed(instance)
                notification_type = Notification.TYPE_BOOKING_COMPLETED
            
            if template:
                # Create in-app notification
                create_booking_notification(
                    booking=instance,
                    notification_type=notification_type,
                    title=template['title'],
                    message=template['message'],
                    priority=template['priority']
                )
                
                # Send email notification
                from accounts.email_utils import send_booking_status_email
                try:
                    send_booking_status_email(instance, instance.status)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Failed to send booking status email: {str(e)}")
        
        # Check if payment was just completed (payment_status changed to 'paid')
        # Auto-approve booking and notify church owner
        # Only trigger if this is an update (not creation) and payment status actually changed
        if not created:
            old_payment_status = getattr(instance, '_old_payment_status', None)
            if old_payment_status and old_payment_status != 'paid' and instance.payment_status == 'paid':
                try:
                    # Auto-approve the booking when payment is received
                    if instance.status == Booking.STATUS_REQUESTED:
                        instance.status = Booking.STATUS_APPROVED
                        # Use update to avoid triggering signals again
                        Booking.objects.filter(pk=instance.pk).update(status=Booking.STATUS_APPROVED)
                    
                    # Auto-cancel conflicting bookings (same church, same date)
                    conflicting_bookings = instance.conflicts_qs().filter(
                        payment_status='pending'
                    )
                    
                    cancelled_count = 0
                    for conflict in conflicting_bookings:
                        conflict.status = Booking.STATUS_CANCELED
                        conflict.cancel_reason = f'Another booking was confirmed for {instance.church.name} on {instance.date}'
                        conflict.save()
                        cancelled_count += 1
                    
                    import logging
                    logger = logging.getLogger(__name__)
                    if cancelled_count > 0:
                        logger.info(f"Payment received for booking {instance.code}. Cancelled {cancelled_count} conflicting bookings.")
                    
                    church_owner = instance.church.owner if instance.church else None
                    if church_owner:
                        # Notify church owner about payment received and auto-approval
                        create_church_notification(
                            church_owner=church_owner,
                            notification_type=Notification.TYPE_BOOKING_APPROVED,
                            title=f'Payment Received & Booking Confirmed - {instance.code}',
                            message=f'{instance.user.get_full_name() or instance.user.username} has paid ₱{instance.payment_amount} for {instance.service.name} on {instance.date}. The booking has been automatically confirmed.',
                            priority='high',
                            church=instance.church
                        )
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Failed to auto-approve booking or create notification: {str(e)}")


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
            from django.conf import settings
            
            try:
                # Build church URL with proper domain
                site_url = settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else 'localhost:8000'
                protocol = 'https' if 'onrender.com' in site_url else 'http'
                church_path = reverse('core:church_detail', kwargs={'slug': instance.church.slug})
                church_url = f"{protocol}://{site_url}{church_path}"
                
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

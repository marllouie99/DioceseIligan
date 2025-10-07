"""
Management command to create test notifications for development.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Notification, Church, Booking, BookableService
from core.notifications import create_notification, NotificationTemplates
from datetime import date, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Create test notifications for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Number of test notifications to create (default: 5)'
        )
        parser.add_argument(
            '--user',
            type=str,
            help='Username to create notifications for (default: first user)'
        )

    def handle(self, *args, **options):
        count = options['count']
        username = options.get('user')
        
        # Get user
        if username:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User "{username}" not found')
                )
                return
        else:
            user = User.objects.first()
            if not user:
                self.stdout.write(
                    self.style.ERROR('No users found in database')
                )
                return

        # Get or create a church for testing
        church, created = Church.objects.get_or_create(
            name='Test Church',
            defaults={
                'owner': user,
                'description': 'A test church for notifications',
                'address': '123 Test Street',
                'city': 'Test City',
                'is_active': True,
            }
        )

        # Get or create a service for testing
        service, created = BookableService.objects.get_or_create(
            church=church,
            name='Test Service',
            defaults={
                'description': 'A test service for notifications',
                'is_active': True,
            }
        )

        # Get or create a booking for testing
        booking, created = Booking.objects.get_or_create(
            user=user,
            church=church,
            service=service,
            date=date.today() + timedelta(days=7),
            defaults={
                'notes': 'Test booking for notifications',
            }
        )

        # Create test notifications
        notifications_created = 0
        
        # Booking notifications
        if count >= 1:
            create_notification(
                user=user,
                notification_type=Notification.TYPE_BOOKING_REQUESTED,
                title='New Appointment Request - Test Church',
                message='You have requested an appointment for "Test Service" on ' + 
                       (date.today() + timedelta(days=7)).strftime("%b %d, %Y") + 
                       '. Please wait for approval.',
                priority=Notification.PRIORITY_HIGH,
                booking=booking,
                church=church
            )
            notifications_created += 1

        if count >= 2:
            create_notification(
                user=user,
                notification_type=Notification.TYPE_BOOKING_APPROVED,
                title='Appointment Approved - Test Church',
                message='Your appointment for "Test Service" on ' + 
                       (date.today() + timedelta(days=7)).strftime("%b %d, %Y") + 
                       ' has been approved. Please arrive on time.',
                priority=Notification.PRIORITY_MEDIUM,
                booking=booking,
                church=church
            )
            notifications_created += 1

        if count >= 3:
            create_notification(
                user=user,
                notification_type=Notification.TYPE_CHURCH_APPROVED,
                title='Church Approved - Test Church',
                message='Your church has been approved and is now visible on the platform.',
                priority=Notification.PRIORITY_HIGH,
                church=church
            )
            notifications_created += 1

        if count >= 4:
            create_notification(
                user=user,
                notification_type=Notification.TYPE_BOOKING_COMPLETED,
                title='Appointment Completed - Test Church',
                message='Your appointment for "Test Service" has been marked as completed. Thank you for using our services!',
                priority=Notification.PRIORITY_LOW,
                booking=booking,
                church=church
            )
            notifications_created += 1

        if count >= 5:
            create_notification(
                user=user,
                notification_type=Notification.TYPE_FOLLOW_ACCEPTED,
                title='Follow Request Accepted',
                message='Your follow request for Test Church has been accepted.',
                priority=Notification.PRIORITY_MEDIUM,
                church=church
            )
            notifications_created += 1

        # Create additional random notifications if requested
        for i in range(5, count):
            notification_types = [
                Notification.TYPE_BOOKING_REQUESTED,
                Notification.TYPE_BOOKING_APPROVED,
                Notification.TYPE_BOOKING_DECLINED,
                Notification.TYPE_BOOKING_CANCELED,
                Notification.TYPE_BOOKING_COMPLETED,
                Notification.TYPE_CHURCH_APPROVED,
                Notification.TYPE_CHURCH_DECLINED,
                Notification.TYPE_FOLLOW_REQUEST,
                Notification.TYPE_FOLLOW_ACCEPTED,
            ]
            
            import random
            notification_type = random.choice(notification_types)
            
            create_notification(
                user=user,
                notification_type=notification_type,
                title=f'Test Notification {i+1}',
                message=f'This is test notification number {i+1} for development purposes.',
                priority=random.choice([
                    Notification.PRIORITY_LOW,
                    Notification.PRIORITY_MEDIUM,
                    Notification.PRIORITY_HIGH,
                    Notification.PRIORITY_URGENT,
                ]),
                booking=booking if 'booking' in notification_type else None,
                church=church
            )
            notifications_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {notifications_created} test notifications for user "{user.username}"'
            )
        )


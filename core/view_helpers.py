"""
View helper functions to break down large view functions
"""

from django.core.cache import cache
from django.db.models import Q, Count
from collections import Counter
from .models import Booking, ChurchFollow, Notification


class ChurchManagementHelpers:
    """Helper functions for church management views"""
    
    @staticmethod
    def get_church_statistics(church):
        """Get optimized church statistics"""
        # Use cached follower count
        follower_count = cache.get(f'church_{church.id}_follower_count')
        if follower_count is None:
            follower_count = church.followers.count()
            cache.set(f'church_{church.id}_follower_count', follower_count, 300)
        
        # Get recent followers
        recent_followers = church.followers.select_related('user')[:10]
        
        return {
            'follower_count': follower_count,
            'recent_followers': recent_followers,
        }
    
    @staticmethod
    def get_booking_statistics(church, appt_status='all'):
        """Get optimized booking statistics"""
        bookings_all = (
            Booking.objects
            .filter(church=church)
            .select_related('service', 'user', 'user__profile')
            .order_by('-created_at')
        )
        
        # Optimized counts using single query with conditional aggregation
        counts = bookings_all.aggregate(
            all=Count('id'),
            requested=Count('id', filter=Q(status=Booking.STATUS_REQUESTED)),
            reviewed=Count('id', filter=Q(status=Booking.STATUS_REVIEWED)),
            approved=Count('id', filter=Q(status=Booking.STATUS_APPROVED)),
            completed=Count('id', filter=Q(status=Booking.STATUS_COMPLETED)),
        )
        
        # Convert to expected format
        counts = {
            'all': counts['all'],
            Booking.STATUS_REQUESTED: counts['requested'],
            Booking.STATUS_REVIEWED: counts['reviewed'],
            Booking.STATUS_APPROVED: counts['approved'],
            Booking.STATUS_COMPLETED: counts['completed'],
        }
        
        # Filter bookings if needed
        bookings = bookings_all
        if appt_status != 'all':
            bookings = bookings.filter(status=appt_status)
        
        return {
            'bookings_all': bookings_all,
            'bookings': bookings,
            'counts': counts,
        }
    
    @staticmethod
    def detect_booking_conflicts(bookings_all):
        """Detect booking conflicts efficiently"""
        active_statuses = [Booking.STATUS_REQUESTED, Booking.STATUS_REVIEWED, Booking.STATUS_APPROVED]
        active_keys = list(
            bookings_all.filter(status__in=active_statuses)
            .values('church_id', 'date')
        )
        
        key_counter = Counter((k['church_id'], k['date']) for k in active_keys)
        conflicts = {(cid, d) for (cid, d), c in key_counter.items() if c > 1}
        
        # Mark conflicts for template usage
        booking_list = []
        for b in bookings_all:
            setattr(b, 'is_conflict', (b.church_id, b.date) in conflicts)
            booking_list.append(b)
        
        return booking_list


class NotificationHelpers:
    """Helper functions for notification views"""
    
    @staticmethod
    def get_notification_categories():
        """Get notification category mappings"""
        return {
            'bookings': [
                Notification.TYPE_BOOKING_REQUESTED,
                Notification.TYPE_BOOKING_REVIEWED,
                Notification.TYPE_BOOKING_APPROVED,
                Notification.TYPE_BOOKING_DECLINED,
                Notification.TYPE_BOOKING_CANCELED,
                Notification.TYPE_BOOKING_COMPLETED,
            ],
            'church': [
                Notification.TYPE_CHURCH_APPROVED,
                Notification.TYPE_CHURCH_DECLINED,
            ],
            'follows': [
                Notification.TYPE_FOLLOW_REQUEST,
                Notification.TYPE_FOLLOW_ACCEPTED,
            ],
        }
    
    @staticmethod
    def get_notification_counts(user, filter_type='all'):
        """Get optimized notification counts"""
        cache_key = f'user_{user.id}_notification_counts_{filter_type}'
        counts = cache.get(cache_key)
        
        if counts is None:
            category_map = NotificationHelpers.get_notification_categories()
            base_qs = Notification.objects.filter(user=user)
            
            if filter_type in category_map:
                base_qs = base_qs.filter(notification_type__in=category_map[filter_type])
            
            counts = base_qs.aggregate(
                all=Count('id'),
                unread=Count('id', filter=Q(is_read=False)),
                bookings=Count('id', filter=Q(notification_type__in=category_map['bookings'])),
                church=Count('id', filter=Q(notification_type__in=category_map['church'])),
                follows=Count('id', filter=Q(notification_type__in=category_map['follows'])),
            )
            
            # Cache for 2 minutes
            cache.set(cache_key, counts, 120)
        
        return counts


class AdminHelpers:
    """Helper functions for admin views"""
    
    @staticmethod
    def get_admin_dashboard_stats():
        """Get optimized admin dashboard statistics"""
        from django.contrib.auth import get_user_model
        from .models import Church, BookableService, Booking, ChurchVerificationRequest
        
        User = get_user_model()
        
        # Use cache for expensive queries
        stats = cache.get('admin_dashboard_stats')
        if stats is None:
            stats = {
                'users': User.objects.count(),
                'churches': Church.objects.count(),
                'services': BookableService.objects.count(),
                'bookings': Booking.objects.count(),
            }
            cache.set('admin_dashboard_stats', stats, 300)
        
        return stats
    
    @staticmethod
    def get_verification_counts():
        """Get optimized verification counts"""
        return ChurchVerificationRequest.objects.aggregate(
            pending=Count('id', filter=Q(status=ChurchVerificationRequest.STATUS_PENDING)),
            approved=Count('id', filter=Q(status=ChurchVerificationRequest.STATUS_APPROVED)),
            rejected=Count('id', filter=Q(status=ChurchVerificationRequest.STATUS_REJECTED)),
        )


class FollowHelpers:
    """Helper functions for follow/unfollow operations"""
    
    @staticmethod
    def update_follower_count(church):
        """Update follower count and cache"""
        church.follower_count = church.followers.count()
        church.save(update_fields=['follower_count'])
        
        # Update cache
        cache.set(f'church_{church.id}_follower_count', church.follower_count, 300)
        
        return church.follower_count


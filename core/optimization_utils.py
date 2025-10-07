"""
Database optimization utilities for ChurchIligan
"""

from django.db import connection
from django.core.cache import cache
from django.db.models import Count, Q
from django.conf import settings
import time


class DatabaseOptimizer:
    """Utility class for database optimization tasks"""
    
    @staticmethod
    def analyze_slow_queries():
        """Analyze slow queries in the current connection"""
        if settings.DEBUG:
            queries = connection.queries
            slow_queries = []
            
            for query in queries:
                # Convert time to float for comparison
                query_time = float(query['time'])
                if query_time > 0.1:  # Queries taking more than 100ms
                    slow_queries.append({
                        'sql': query['sql'],
                        'time': query_time
                    })
            
            return slow_queries
        return []
    
    @staticmethod
    def get_query_count():
        """Get the number of queries executed"""
        if settings.DEBUG:
            return len(connection.queries)
        return 0
    
    @staticmethod
    def optimize_booking_counts(church_id, status_filter='all'):
        """Optimized booking counts for a church"""
        from .models import Booking
        
        cache_key = f'church_{church_id}_booking_counts_{status_filter}'
        counts = cache.get(cache_key)
        
        if counts is None:
            base_qs = Booking.objects.filter(church_id=church_id)
            
            if status_filter != 'all':
                base_qs = base_qs.filter(status=status_filter)
            
            counts = base_qs.aggregate(
                all=Count('id'),
                requested=Count('id', filter=Q(status=Booking.STATUS_REQUESTED)),
                reviewed=Count('id', filter=Q(status=Booking.STATUS_REVIEWED)),
                approved=Count('id', filter=Q(status=Booking.STATUS_APPROVED)),
                completed=Count('id', filter=Q(status=Booking.STATUS_COMPLETED)),
                declined=Count('id', filter=Q(status=Booking.STATUS_DECLINED)),
                canceled=Count('id', filter=Q(status=Booking.STATUS_CANCELED)),
            )
            
            # Cache for 5 minutes
            cache.set(cache_key, counts, 300)
        
        return counts
    
    @staticmethod
    def optimize_notification_counts(user_id, filter_type='all'):
        """Optimized notification counts for a user"""
        from .models import Notification
        
        cache_key = f'user_{user_id}_notification_counts_{filter_type}'
        counts = cache.get(cache_key)
        
        if counts is None:
            base_qs = Notification.objects.filter(user_id=user_id)
            
            category_map = {
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
    
    @staticmethod
    def clear_optimization_cache():
        """Clear all optimization-related cache entries"""
        cache_keys = [
            'admin_dashboard_stats',
            'church_*_follower_count',
            'church_*_booking_counts_*',
            'user_*_notification_counts_*',
        ]
        
        # Note: This is a simplified version. In production, you'd want to use
        # cache.delete_many() or iterate through specific keys
        for pattern in cache_keys:
            if '*' in pattern:
                # For patterns with wildcards, you'd need to implement pattern matching
                # This is a placeholder for the actual implementation
                pass
            else:
                cache.delete(pattern)
    
    @staticmethod
    def get_database_stats():
        """Get database statistics for monitoring"""
        from .models import Church, Booking, Notification, ChurchFollow
        
        stats = {
            'total_churches': Church.objects.count(),
            'total_bookings': Booking.objects.count(),
            'total_notifications': Notification.objects.count(),
            'total_follows': ChurchFollow.objects.count(),
            'active_churches': Church.objects.filter(is_active=True).count(),
            'verified_churches': Church.objects.filter(is_verified=True).count(),
        }
        
        return stats


class QueryProfiler:
    """Context manager for profiling database queries"""
    
    def __init__(self, description="Query Profile"):
        self.description = description
        self.start_time = None
        self.start_queries = 0
        self.end_queries = 0
    
    def __enter__(self):
        self.start_time = time.time()
        if settings.DEBUG:
            self.start_queries = len(connection.queries)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        end_time = time.time()
        duration = end_time - self.start_time
        
        if settings.DEBUG:
            self.end_queries = len(connection.queries)
            query_count = self.end_queries - self.start_queries
            
            print(f"\n=== {self.description} ===")
            print(f"Duration: {duration:.3f}s")
            print(f"Queries: {query_count}")
            
            if query_count > 0:
                print("Queries executed:")
                for query in connection.queries[self.start_queries:]:
                    print(f"  {query['time']}s: {query['sql'][:100]}...")
        else:
            print(f"{self.description}: {duration:.3f}s")


def profile_queries(description="Query Profile"):
    """Decorator for profiling database queries"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            with QueryProfiler(description):
                return func(*args, **kwargs)
        return wrapper
    return decorator


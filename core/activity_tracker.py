"""
Activity Tracker Utility
Centralized utility for tracking user activities across the application
"""

from django.contrib.auth.models import User
from typing import Optional, Dict, Any
from .models import UserInteraction


class ActivityTracker:
    """
    Centralized utility for tracking user post interactions
    """
    
    @staticmethod
    def track_post_like(user: User, post, request=None) -> UserInteraction:
        """Track when a user likes a post"""
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_POST_LIKE,
            content_object=post,
            request=request
        )
    
    @staticmethod
    def track_post_unlike(user: User, post, request=None) -> UserInteraction:
        """Track when a user unlikes a post"""
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_POST_UNLIKE,
            content_object=post,
            request=request
        )
    
    @staticmethod
    def track_post_comment(user: User, post, comment_id: int = None, is_reply: bool = False, request=None) -> UserInteraction:
        """Track when a user comments on a post"""
        metadata = {
            'comment_id': comment_id,
            'is_reply': is_reply
        }
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_POST_COMMENT,
            content_object=post,
            metadata=metadata,
            request=request
        )
    
    @staticmethod
    def track_post_bookmark(user: User, post, request=None) -> UserInteraction:
        """Track when a user bookmarks a post"""
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_POST_BOOKMARK,
            content_object=post,
            request=request
        )
    
    @staticmethod
    def track_post_unbookmark(user: User, post, request=None) -> UserInteraction:
        """Track when a user removes a bookmark"""
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_POST_UNBOOKMARK,
            content_object=post,
            request=request
        )
    
    @staticmethod
    def track_post_view(user: User, post, request=None) -> UserInteraction:
        """Track when a user views a post"""
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_POST_VIEW,
            content_object=post,
            request=request
        )
    
    @staticmethod
    def track_post_share(user: User, post, platform: str = None, request=None) -> UserInteraction:
        """Track when a user shares a post"""
        metadata = {'platform': platform} if platform else {}
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_POST_SHARE,
            content_object=post,
            metadata=metadata,
            request=request
        )
    
    @staticmethod
    def track_church_follow(user: User, church, request=None) -> UserInteraction:
        """Track when a user follows a church"""
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_CHURCH_FOLLOW,
            content_object=church,
            request=request
        )
    
    @staticmethod
    def track_church_unfollow(user: User, church, request=None) -> UserInteraction:
        """Track when a user unfollows a church"""
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_CHURCH_UNFOLLOW,
            content_object=church,
            request=request
        )
    
    @staticmethod
    def track_booking_create(user: User, booking, request=None) -> UserInteraction:
        """Track when a user creates a booking"""
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_BOOKING_CREATE,
            content_object=booking,
            request=request
        )
    
    @staticmethod
    def track_booking_update(user: User, booking, request=None) -> UserInteraction:
        """Track when a user updates a booking"""
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_BOOKING_UPDATE,
            content_object=booking,
            request=request
        )
    
    @staticmethod
    def track_booking_cancel(user: User, booking, reason: str = None, request=None) -> UserInteraction:
        """Track when a user cancels a booking"""
        metadata = {'reason': reason} if reason else {}
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_BOOKING_CANCEL,
            content_object=booking,
            metadata=metadata,
            request=request
        )
    
    @staticmethod
    def track_service_review(user: User, service, rating: int = None, request=None) -> UserInteraction:
        """Track when a user reviews a service"""
        metadata = {'rating': rating} if rating else {}
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_SERVICE_REVIEW,
            content_object=service,
            metadata=metadata,
            request=request
        )
    
    @staticmethod
    def track_profile_update(user: User, fields_updated: list = None, request=None) -> UserInteraction:
        """Track when a user updates their profile"""
        metadata = {'fields_updated': fields_updated} if fields_updated else {}
        return UserInteraction.log_activity(
            user=user,
            activity_type=UserInteraction.ACTIVITY_PROFILE_UPDATE,
            metadata=metadata,
            request=request
        )
    
    @staticmethod
    def get_user_activities(user: User, limit: int = 20, activity_types: list = None):
        """
        Get user's recent activities
        
        Args:
            user: User instance
            limit: Maximum number of activities to return
            activity_types: Optional list of activity types to filter by
            
        Returns:
            QuerySet of UserInteraction objects
        """
        queryset = UserInteraction.objects.filter(user=user)
        
        if activity_types:
            queryset = queryset.filter(activity_type__in=activity_types)
        
        return queryset.select_related('content_type').prefetch_related('content_object').order_by('-created_at')[:limit]
    
    @staticmethod
    def get_post_interactions(user: User, limit: int = 20):
        """Get user's post-related interactions only"""
        post_types = [
            UserInteraction.ACTIVITY_POST_LIKE,
            UserInteraction.ACTIVITY_POST_UNLIKE,
            UserInteraction.ACTIVITY_POST_COMMENT,
            UserInteraction.ACTIVITY_POST_BOOKMARK,
            UserInteraction.ACTIVITY_POST_UNBOOKMARK,
            UserInteraction.ACTIVITY_POST_VIEW,
            UserInteraction.ACTIVITY_POST_SHARE,
        ]
        return ActivityTracker.get_user_activities(user, limit, post_types)
    
    @staticmethod
    def get_church_interactions(user: User, limit: int = 20):
        """Get user's church-related interactions only"""
        church_types = [
            UserInteraction.ACTIVITY_CHURCH_FOLLOW,
            UserInteraction.ACTIVITY_CHURCH_UNFOLLOW,
        ]
        return ActivityTracker.get_user_activities(user, limit, church_types)
    
    @staticmethod
    def get_activity_stats(user: User) -> Dict[str, int]:
        """
        Get statistics about user's activities
        
        Returns:
            Dictionary with activity counts by type
        """
        from django.db.models import Count
        
        stats = UserInteraction.objects.filter(user=user).values('activity_type').annotate(
            count=Count('id')
        )
        
        return {stat['activity_type']: stat['count'] for stat in stats}

"""
API views for follower management and activity tracking.
Provides endpoints for the followers tab functionality.
"""

from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, F
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.paginator import Paginator
from datetime import datetime, timedelta

from .models import (
    Church,
    ChurchFollow,
    UserInteraction,
    Booking,
    ServiceReview,
    Post,
    PostLike,
    PostComment,
    PostBookmark,
)

User = get_user_model()


@login_required
@require_http_methods(["GET"])
def follower_activity_api(request, user_id, activity_type):
    """
    API endpoint to get follower activity data.
    
    Args:
        user_id: ID of the follower
        activity_type: Type of activity (interactions, appointments, reviews, timeline)
    
    Returns:
        JSON response with activity data
    """
    # Ensure the requesting user owns a church that this user follows
    try:
        follower = get_object_or_404(User, id=user_id)
        
        # Check if the requesting user owns churches that this follower follows
        user_churches = Church.objects.filter(owner=request.user)
        if not ChurchFollow.objects.filter(
            user=follower,
            church__in=user_churches
        ).exists():
            return JsonResponse({
                'success': False,
                'error': 'You can only view activity of your church followers.'
            }, status=403)
        
        # Get activity data based on type
        if activity_type == 'interactions':
            activities = get_follower_interactions(follower, user_churches)
        elif activity_type == 'appointments':
            activities = get_follower_appointments(follower, user_churches)
        elif activity_type == 'reviews':
            activities = get_follower_reviews(follower, user_churches)
        elif activity_type == 'timeline':
            activities = get_follower_timeline(follower, user_churches)
        else:
            return JsonResponse({
                'success': False,
                'error': 'Invalid activity type.'
            }, status=400)
        
        return JsonResponse({
            'success': True,
            'activities': activities,
            'total_count': len(activities)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


def get_follower_interactions(follower, user_churches):
    """Get follower's interactions with church content (grouped by post, deduplicated)."""
    from collections import defaultdict
    
    # Get content types for filtering
    post_ct = ContentType.objects.get_for_model(Post)
    church_ct = ContentType.objects.get_for_model(Church)
    
    # Get all interactions related to the user's churches - exclude post views
    interactions = UserInteraction.objects.filter(
        user=follower,
        content_type__in=[post_ct, church_ct]
    ).exclude(
        activity_type=UserInteraction.ACTIVITY_POST_VIEW  # Exclude post views
    ).select_related('content_type').distinct().order_by('-created_at')[:100]
    
    # Group interactions by post and church
    post_interactions = defaultdict(list)
    church_activities = []
    
    for interaction in interactions:
        if interaction.content_type == post_ct:
            try:
                post = Post.objects.get(id=interaction.object_id)
                if post.church in user_churches:
                    post_interactions[post.id].append({
                        'interaction': interaction,
                        'post': post,
                        'activity_type': interaction.activity_type,
                        'created_at': interaction.created_at
                    })
            except Post.DoesNotExist:
                continue
        elif interaction.content_type == church_ct:
            try:
                church = Church.objects.get(id=interaction.object_id)
                if church in user_churches:
                    church_activities.append({
                        'title': f"{interaction.get_activity_type_display()}",
                        'description': f"Interacted with {church.name}",
                        'date': interaction.created_at.strftime('%B %d, %Y at %I:%M %p'),
                        'status': interaction.activity_type,
                        'type': 'interaction'
                    })
            except Church.DoesNotExist:
                continue
    
    # Process each post's interactions
    activities = []
    
    for post_id, interactions_list in post_interactions.items():
        # Sort interactions by date (newest first)
        interactions_list.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Deduplicate: Remove like/unlike pairs that cancel out
        deduplicated = deduplicate_interactions(interactions_list)
        
        if not deduplicated:
            continue  # Skip if all interactions cancelled out
        
        # Group remaining interactions
        post = deduplicated[0]['post']
        activities.append(create_grouped_activity(post, deduplicated))
    
    # Add church activities
    activities.extend(church_activities)
    
    # Sort all activities by date (newest first)
    activities.sort(key=lambda x: x.get('sort_date', x['date']), reverse=True)
    
    return activities[:50]  # Limit to 50 most recent


def deduplicate_interactions(interactions_list):
    """Remove like/unlike pairs that cancel each other out."""
    # Track likes and unlikes for deduplication
    likes_count = 0
    comments = []
    bookmarks_count = 0
    shares = []
    other_interactions = []
    
    for item in interactions_list:
        activity_type = item['activity_type']
        
        if activity_type == UserInteraction.ACTIVITY_POST_LIKE:
            likes_count += 1
        elif activity_type == UserInteraction.ACTIVITY_POST_UNLIKE:
            likes_count -= 1
        elif activity_type == UserInteraction.ACTIVITY_POST_COMMENT:
            comments.append(item)
        elif activity_type == UserInteraction.ACTIVITY_POST_BOOKMARK:
            bookmarks_count += 1
        elif activity_type == UserInteraction.ACTIVITY_POST_UNBOOKMARK:
            bookmarks_count -= 1
        elif activity_type == UserInteraction.ACTIVITY_POST_SHARE:
            shares.append(item)
        else:
            other_interactions.append(item)
    
    # Collect final meaningful interactions
    result = []
    
    # Add net likes (only if positive)
    if likes_count > 0:
        # Find the most recent like to use for display
        like_item = next((item for item in interactions_list 
                         if item['activity_type'] == UserInteraction.ACTIVITY_POST_LIKE), None)
        if like_item:
            result.append(like_item)
    
    # Add net bookmarks (only if positive)
    if bookmarks_count > 0:
        # Find the most recent bookmark to use for display
        bookmark_item = next((item for item in interactions_list 
                            if item['activity_type'] == UserInteraction.ACTIVITY_POST_BOOKMARK), None)
        if bookmark_item:
            result.append(bookmark_item)
    
    # Add all comments (comments don't cancel out)
    result.extend(comments)
    
    # Add all shares
    result.extend(shares)
    
    # Add other interactions
    result.extend(other_interactions)
    
    return result


def create_grouped_activity(post, interactions_list):
    """Create a grouped activity summary for a post."""
    # Count interaction types
    likes = sum(1 for item in interactions_list if item['activity_type'] == UserInteraction.ACTIVITY_POST_LIKE)
    comments = sum(1 for item in interactions_list if item['activity_type'] == UserInteraction.ACTIVITY_POST_COMMENT)
    bookmarks = sum(1 for item in interactions_list if item['activity_type'] == UserInteraction.ACTIVITY_POST_BOOKMARK)
    shares = sum(1 for item in interactions_list if item['activity_type'] == UserInteraction.ACTIVITY_POST_SHARE)
    
    # Build activity summary
    activity_parts = []
    if likes > 0:
        activity_parts.append(f"liked")
    if comments > 0:
        activity_parts.append(f"commented {comments} time{'s' if comments > 1 else ''}")
    if bookmarks > 0:
        activity_parts.append(f"bookmarked")
    if shares > 0:
        activity_parts.append(f"shared {shares} time{'s' if shares > 1 else ''}")
    
    # Get the most recent interaction for date
    most_recent = max(interactions_list, key=lambda x: x['created_at'])
    
    # Clean and format post content for display
    post_content = post.content.strip()
    if len(set(post_content)) <= 2:  # If post content is mostly repeated characters
        post_preview = f"Post #{post.id}"
    elif len(post_content) > 80:
        # Truncate at word boundaries
        words = post_content.split()
        preview_words = []
        char_count = 0
        for word in words:
            if char_count + len(word) + 1 > 80:
                break
            preview_words.append(word)
            char_count += len(word) + 1
        post_preview = ' '.join(preview_words) + "..."
    else:
        post_preview = post_content
    
    return {
        'title': f"Post Interaction",
        'description': f"User {', '.join(activity_parts)} post: \"{post_preview}\"",
        'date': most_recent['created_at'].strftime('%B %d, %Y at %I:%M %p'),
        'sort_date': most_recent['created_at'],
        'status': 'grouped_interaction',
        'type': 'interaction',
        'post_id': post.id,
        'interaction_count': len(interactions_list),
        'details': {
            'likes': likes,
            'comments': comments,
            'bookmarks': bookmarks,
            'shares': shares
        }
    }


def get_follower_appointments(follower, user_churches):
    """Get follower's appointment history with the churches."""
    activities = []
    
    bookings = Booking.objects.filter(
        user=follower,
        church__in=user_churches
    ).select_related('service', 'church').order_by('-created_at')[:50]
    
    for booking in bookings:
        status_display = {
            'requested': 'Requested',
            'reviewed': 'Under Review',
            'approved': 'Approved',
            'completed': 'Completed',
            'declined': 'Declined',
            'canceled': 'Canceled'
        }.get(booking.status, booking.status.title())
        
        activities.append({
            'title': f"Appointment: {booking.service.name}",
            'description': f"Scheduled for {booking.date.strftime('%B %d, %Y')} at {booking.church.name}",
            'date': booking.created_at.strftime('%B %d, %Y at %I:%M %p'),
            'status': status_display,
            'type': 'appointment'
        })
    
    return activities


def get_follower_reviews(follower, user_churches):
    """Get follower's reviews for church services."""
    activities = []
    
    reviews = ServiceReview.objects.filter(
        user=follower,
        church__in=user_churches,
        is_active=True
    ).select_related('service', 'church').order_by('-created_at')[:50]
    
    for review in reviews:
        activities.append({
            'title': f"Reviewed {review.service.name}",
            'description': f"\"{review.title}\" - {review.comment[:100]}{'...' if len(review.comment) > 100 else ''}",
            'date': review.created_at.strftime('%B %d, %Y at %I:%M %p'),
            'status': f"{review.rating} {'star' if review.rating == 1 else 'stars'}",
            'rating': review.rating,
            'type': 'review'
        })
    
    return activities


def get_follower_timeline(follower, user_churches):
    """Get chronological timeline of all follower activities."""
    activities = []
    
    # Get interactions
    interaction_activities = get_follower_interactions(follower, user_churches)
    
    # Get appointments
    appointment_activities = get_follower_appointments(follower, user_churches)
    
    # Get reviews
    review_activities = get_follower_reviews(follower, user_churches)
    
    # Add follow date
    follow_records = ChurchFollow.objects.filter(
        user=follower,
        church__in=user_churches
    ).select_related('church')
    
    for follow in follow_records:
        activities.append({
            'title': f"Started Following {follow.church.name}",
            'description': f"Became a follower of your church",
            'date': follow.followed_at.strftime('%B %d, %Y at %I:%M %p'),
            'status': 'followed',
            'type': 'follow'
        })
    
    # Combine all activities
    all_activities = (
        interaction_activities + 
        appointment_activities + 
        review_activities + 
        activities
    )
    
    # Sort by date (most recent first)
    try:
        all_activities.sort(
            key=lambda x: datetime.strptime(x['date'], '%B %d, %Y at %I:%M %p'),
            reverse=True
        )
    except:
        # Fallback if date parsing fails
        pass
    
    return all_activities[:50]  # Limit to 50 most recent


@login_required
@require_http_methods(["GET"])
def follower_stats_api(request, user_id):
    """
    API endpoint to get follower statistics.
    
    Returns:
        JSON with interaction counts, appointment counts, etc.
    """
    try:
        follower = get_object_or_404(User, id=user_id)
        user_churches = Church.objects.filter(owner=request.user)
        
        # Check permission
        if not ChurchFollow.objects.filter(
            user=follower,
            church__in=user_churches
        ).exists():
            return JsonResponse({
                'success': False,
                'error': 'Permission denied.'
            }, status=403)
        
        # Calculate stats
        stats = {
            'interactions_count': get_interaction_count(follower, user_churches),
            'appointments_count': get_appointments_count(follower, user_churches),
            'reviews_count': get_reviews_count(follower, user_churches),
            'last_activity': get_last_activity_date(follower, user_churches),
            'follow_date': get_follow_date(follower, user_churches),
            'total_activity_score': 0  # Will be calculated
        }
        
        # Calculate total activity score
        stats['total_activity_score'] = (
            stats['interactions_count'] + 
            (stats['appointments_count'] * 2) +  # Weight appointments more
            (stats['reviews_count'] * 3)  # Weight reviews most
        )
        
        return JsonResponse({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


def get_interaction_count(follower, user_churches):
    """Count interactions with church content (excluding post views)."""
    post_ct = ContentType.objects.get_for_model(Post)
    church_ct = ContentType.objects.get_for_model(Church)
    
    # Get post IDs from user's churches
    church_post_ids = Post.objects.filter(church__in=user_churches).values_list('id', flat=True)
    church_ids = user_churches.values_list('id', flat=True)
    
    count = UserInteraction.objects.filter(
        user=follower
    ).filter(
        Q(content_type=post_ct, object_id__in=church_post_ids) |
        Q(content_type=church_ct, object_id__in=church_ids)
    ).exclude(
        activity_type=UserInteraction.ACTIVITY_POST_VIEW  # Exclude post views from count
    ).count()
    
    return count


def get_appointments_count(follower, user_churches):
    """Count appointments with user's churches."""
    return Booking.objects.filter(
        user=follower,
        church__in=user_churches
    ).count()


def get_reviews_count(follower, user_churches):
    """Count reviews for user's church services."""
    return ServiceReview.objects.filter(
        user=follower,
        church__in=user_churches,
        is_active=True
    ).count()


def get_last_activity_date(follower, user_churches):
    """Get the date of last activity (excluding post views)."""
    # Get latest interaction
    post_ct = ContentType.objects.get_for_model(Post)
    church_ct = ContentType.objects.get_for_model(Church)
    
    church_post_ids = Post.objects.filter(church__in=user_churches).values_list('id', flat=True)
    church_ids = user_churches.values_list('id', flat=True)
    
    latest_interaction = UserInteraction.objects.filter(
        user=follower
    ).filter(
        Q(content_type=post_ct, object_id__in=church_post_ids) |
        Q(content_type=church_ct, object_id__in=church_ids)
    ).exclude(
        activity_type=UserInteraction.ACTIVITY_POST_VIEW  # Exclude post views
    ).order_by('-created_at').first()
    
    # Get latest booking
    latest_booking = Booking.objects.filter(
        user=follower,
        church__in=user_churches
    ).order_by('-created_at').first()
    
    # Get latest review
    latest_review = ServiceReview.objects.filter(
        user=follower,
        church__in=user_churches,
        is_active=True
    ).order_by('-created_at').first()
    
    # Find the most recent activity
    dates = []
    if latest_interaction:
        dates.append(latest_interaction.created_at)
    if latest_booking:
        dates.append(latest_booking.created_at)
    if latest_review:
        dates.append(latest_review.created_at)
    
    if dates:
        latest_date = max(dates)
        return latest_date.strftime('%B %d, %Y')
    
    return None


def get_follow_date(follower, user_churches):
    """Get the date when user started following."""
    follow = ChurchFollow.objects.filter(
        user=follower,
        church__in=user_churches
    ).order_by('followed_at').first()
    
    if follow:
        return follow.followed_at.strftime('%B %d, %Y')
    
    return None


@login_required
@require_http_methods(["GET"])
def followers_list_api(request):
    """
    API endpoint to get list of followers for the user's churches.
    Supports search, filtering, and pagination.
    """
    try:
        user_churches = Church.objects.filter(owner=request.user)
        
        if not user_churches.exists():
            return JsonResponse({
                'success': False,
                'error': 'You do not own any churches.'
            }, status=404)
        
        # Get all followers
        followers_qs = ChurchFollow.objects.filter(
            church__in=user_churches
        ).select_related('user', 'church').distinct('user')
        
        # Apply search filter
        search_query = request.GET.get('search', '').strip()
        if search_query:
            followers_qs = followers_qs.filter(
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(user__email__icontains=search_query)
            )
        
        # Apply time filter
        time_filter = request.GET.get('time_filter', 'all')
        if time_filter != 'all':
            now = timezone.now()
            if time_filter == 'week':
                cutoff_date = now - timedelta(days=7)
            elif time_filter == 'month':
                cutoff_date = now - timedelta(days=30)
            elif time_filter == 'quarter':
                cutoff_date = now - timedelta(days=90)
            else:
                cutoff_date = None
            
            if cutoff_date:
                followers_qs = followers_qs.filter(followed_at__gte=cutoff_date)
        
        # Apply sorting
        sort_by = request.GET.get('sort', 'recent')
        if sort_by == 'name':
            followers_qs = followers_qs.order_by('user__first_name', 'user__last_name')
        elif sort_by == 'name-desc':
            followers_qs = followers_qs.order_by('-user__first_name', '-user__last_name')
        elif sort_by == 'oldest':
            followers_qs = followers_qs.order_by('followed_at')
        else:  # recent (default)
            followers_qs = followers_qs.order_by('-followed_at')
        
        # Pagination
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        paginator = Paginator(followers_qs, per_page)
        page_obj = paginator.get_page(page)
        
        # Prepare follower data
        followers_data = []
        for follow in page_obj:
            user = follow.user
            
            # Calculate activity stats
            interaction_count = get_interaction_count(user, user_churches)
            appointment_count = get_appointments_count(user, user_churches)
            
            followers_data.append({
                'id': user.id,
                'name': user.get_full_name() or user.username,
                'email': user.email,
                'joined': follow.followed_at.strftime('%Y-%m-%d'),
                'joined_display': follow.followed_at.strftime('%B %d, %Y'),
                'interactions_count': interaction_count,
                'appointments_count': appointment_count,
                'last_activity': get_last_activity_date(user, user_churches),
                'profile_picture': user.profile.profile_picture.url if hasattr(user, 'profile') and user.profile.profile_picture else None
            })
        
        return JsonResponse({
            'success': True,
            'followers': followers_data,
            'pagination': {
                'total_count': paginator.count,
                'total_pages': paginator.num_pages,
                'current_page': page_obj.number,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
                'per_page': per_page
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required
@require_http_methods(["POST"])
def log_interaction_api(request):
    """
    API endpoint to log user interactions.
    Used by frontend to track follower activities.
    """
    try:
        import json
        data = json.loads(request.body)
        
        activity_type = data.get('activity_type')
        object_type = data.get('object_type')  # 'post', 'church', 'booking', etc.
        object_id = data.get('object_id')
        metadata = data.get('metadata', {})
        
        # Validate activity type
        valid_activities = [choice[0] for choice in UserInteraction.ACTIVITY_CHOICES]
        if activity_type not in valid_activities:
            return JsonResponse({
                'success': False,
                'error': 'Invalid activity type.'
            }, status=400)
        
        # Get content object if provided
        content_object = None
        if object_type and object_id:
            model_map = {
                'post': Post,
                'church': Church,
                'booking': Booking,
                'review': ServiceReview,
            }
            
            if object_type in model_map:
                try:
                    content_object = model_map[object_type].objects.get(id=object_id)
                except model_map[object_type].DoesNotExist:
                    return JsonResponse({
                        'success': False,
                        'error': f'{object_type.title()} not found.'
                    }, status=404)
        
        # Log the interaction
        interaction = UserInteraction.log_activity(
            user=request.user,
            activity_type=activity_type,
            content_object=content_object,
            metadata=metadata,
            request=request
        )
        
        return JsonResponse({
            'success': True,
            'interaction_id': interaction.id,
            'message': 'Interaction logged successfully.'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data.'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

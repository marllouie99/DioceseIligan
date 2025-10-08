from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.contrib import messages
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q, Count, F, Exists, OuterRef, Value, BooleanField, ExpressionWrapper, IntegerField
from django.urls import reverse
from django.utils.text import slugify
from django.core.cache import cache
from django.db import IntegrityError
from django.contrib.auth import get_user_model

User = get_user_model()
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from .models import (
    Church,
    ChurchFollow,
    BookableService,
    Availability,
    ServiceImage,
    Booking,
    Post,
    PostLike,
    PostBookmark,
    PostComment,
    PostView,
    ChurchVerificationRequest,
    ChurchVerificationDocument,
    Notification,
    DeclineReason,
    Donation,
)
from .forms import (
    ChurchCreateForm,
    ChurchUpdateForm,
    ChurchSearchForm,
    BookableServiceForm,
    AvailabilityForm,
    AvailabilityBulkForm,
    ServiceImageForm,
    BookingForm,
    PostForm,
    ChurchVerificationUploadForm,
)
from .utils import get_user_display_data, get_essential_profile_status
from django.utils import timezone
from .notifications import create_booking_notification, NotificationTemplates


def _app_context(request):
    """Common context for app pages: user display, initial, placeholder activity counts."""
    from accounts.views import ACTIVITY_COUNTS
    
    user = request.user
    try:
        profile = user.profile
    except Exception:
        profile = None
    
    user_display_name, user_initial = get_user_display_data(user, profile)
    # Compute essential profile status for global UI indicators
    try:
        essential = get_essential_profile_status(user, profile)
        essentials_incomplete = not essential.get('is_complete')
        essentials_missing = list(essential.get('missing', []))
    except Exception:
        essential = {'is_complete': False, 'missing': []}
        essentials_incomplete = True
        essentials_missing = []

    # Get recent user activities for sidebar (post interactions)
    recent_activities = []
    if user.is_authenticated:
        from core.models import UserInteraction
        recent_activities = UserInteraction.objects.filter(
            user=user
        ).select_related('content_type').prefetch_related('content_object').order_by('-created_at')[:3]

    # PayPal configuration for donation integration
    from django.conf import settings
    PAYPAL_CLIENT_ID = getattr(settings, 'PAYPAL_CLIENT_ID', '')
    PAYPAL_CURRENCY = getattr(settings, 'PAYPAL_CURRENCY', 'PHP')
    
    return {
        'user_display_name': user_display_name,
        'user_initial': user_initial,
        'activity_counts': ACTIVITY_COUNTS,
        'is_admin_mode': bool(request.session.get('super_admin_mode', False)) if getattr(user, 'is_superuser', False) else False,
        'profile_essentials_incomplete': essentials_incomplete,
        'profile_essentials_missing': essentials_missing,
        'essential_status': essential,
        'recent_activities': recent_activities,
        'PAYPAL_CLIENT_ID': PAYPAL_CLIENT_ID,
        'PAYPAL_CURRENCY': PAYPAL_CURRENCY,
    }

def home(request):
    context = {"title": "ChurchIligan"}
    return render(request, "home.html", context)


@login_required
def toggle_super_admin_mode(request):
    """Toggle or set Super Admin mode for superusers via session.
    If mode is 'admin' -> enable admin mode. If 'user' -> disable. Otherwise toggle.
    """
    if not request.user.is_superuser:
        messages.error(request, 'You do not have permission to use this feature.')
        return redirect('core:home')

    mode = request.GET.get('mode')
    if mode == 'admin':
        request.session['super_admin_mode'] = True
        messages.info(request, 'Switched to Super Admin mode.')
        # Always go to Super Admin dashboard when enabling admin mode
        return redirect('core:super_admin_dashboard')
    elif mode == 'user':
        request.session['super_admin_mode'] = False
        messages.info(request, 'Switched to User mode.')
        next_url = request.GET.get('next')
        return redirect(next_url) if next_url else redirect('dashboard')
    else:
        current = bool(request.session.get('super_admin_mode', False))
        request.session['super_admin_mode'] = not current
        messages.info(request, 'Switched mode.')
        if request.session.get('super_admin_mode'):
            # Toggled into admin mode -> go to admin dashboard
            return redirect('core:super_admin_dashboard')
        # Toggled into user mode -> honor next, else dashboard
        next_url = request.GET.get('next')
        return redirect(next_url) if next_url else redirect('dashboard')

@login_required
def discover(request):
    """Discover churches page with search and filtering."""
    search_form = ChurchSearchForm(request.GET)
    churches = Church.objects.filter(is_active=True).select_related('owner')
    
    # Apply search filters
    if search_form.is_valid():
        query = search_form.cleaned_data.get('query')
        denomination = search_form.cleaned_data.get('denomination')
        city = search_form.cleaned_data.get('city')
        size = search_form.cleaned_data.get('size')
        
        if query:
            churches = churches.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(city__icontains=query) |
                Q(denomination__icontains=query)
            )
        
        if denomination:
            churches = churches.filter(denomination=denomination)
        
        if city:
            churches = churches.filter(city__icontains=city)
        
        if size:
            churches = churches.filter(size=size)
    
    # Order by follower count and creation date
    churches = churches.annotate(
        followers_count=Count('followers')
    ).order_by('-followers_count', '-created_at')
    
    # Pagination
    paginator = Paginator(churches, 12)  # 12 churches per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Get user's followed churches for context
    user_followed_churches = set()
    if request.user.is_authenticated:
        user_followed_churches = set(
            ChurchFollow.objects.filter(user=request.user)
            .values_list('church_id', flat=True)
        )
    
    ctx = {
        'active': 'discover',
        'page_title': 'Discover Churches',
        'search_form': search_form,
        'churches': page_obj,
        'user_followed_churches': user_followed_churches,
        'total_churches': paginator.count,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/discover.html', ctx)


@login_required
def create_church(request):
    """Create a new church."""
    from core.utils import get_essential_profile_status
    from accounts.models import Profile
    
    # Check if user has completed essential profile information
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        profile = None
    
    essential_status = get_essential_profile_status(request.user, profile)
    
    if not essential_status.get('is_complete', False):
        missing_fields = essential_status.get('missing', [])
        missing_fields_text = ', '.join(missing_fields)
        messages.error(
            request, 
            f'Please complete your essential profile information before creating a church. Missing: {missing_fields_text}'
        )
        return redirect('manage_profile')
    
    if request.method == 'POST':
        form = ChurchCreateForm(request.POST, request.FILES, user=request.user)
        if form.is_valid():
            church = form.save()
            # Generate slug if not provided
            if not church.slug:
                church.slug = slugify(church.name)
                church.save(update_fields=['slug'])
            messages.success(request, f'Church "{church.name}" has been created successfully!')
            return redirect('core:church_detail', slug=church.slug)
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ChurchCreateForm(user=request.user)
    
    ctx = {
        'active': 'discover',
        'page_title': 'Create Church',
        'form': form,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/create_church.html', ctx)


@login_required
def church_detail(request, slug):
    """View church details."""
    church = get_object_or_404(Church, slug=slug, is_active=True)
    
    # Check if user is following this church
    is_following = False
    if request.user.is_authenticated:
        is_following = ChurchFollow.objects.filter(
            user=request.user, 
            church=church
        ).exists()
    
    
    # Active services for Request Appointments tab (only show if verified)
    services = []
    if church.is_verified:
        services = list(
            church.bookable_services.filter(is_active=True)
            .prefetch_related('service_images')
            .order_by('name')
        )
    
    # Posts for Posts & Updates tab (avoid N+1 for liked/bookmarked; include counts)
    post_qs = (
        church.posts
        .filter(is_active=True)
        .select_related('church')
    )
    if request.user.is_authenticated:
        post_qs = post_qs.annotate(
            is_liked=Exists(
                PostLike.objects.filter(user=request.user, post_id=OuterRef('pk'))
            ),
            is_bookmarked=Exists(
                PostBookmark.objects.filter(user=request.user, post_id=OuterRef('pk'))
            ),
        )
    else:
        post_qs = post_qs.annotate(
            is_liked=Value(False, output_field=BooleanField()),
            is_bookmarked=Value(False, output_field=BooleanField()),
        )
    post_qs = post_qs.annotate(
        likes_count=Count('likes', distinct=True),
        comments_count=Count('comments', filter=Q(comments__is_active=True), distinct=True),
    ).order_by('-created_at')[:10]
    posts = list(post_qs)
    # Note: The like_count and comment_count properties will automatically use
    # the annotated values (likes_count, comments_count) to avoid N+1 queries
    
    # Reviews for Reviews tab
    recent_reviews = church.service_reviews.filter(is_active=True).select_related(
        'user', 'service'
    ).order_by('-created_at')[:10]
    
    # Calculate overall church rating statistics (DB-level aggregation)
    all_church_reviews = church.service_reviews.filter(is_active=True)
    total_church_reviews = all_church_reviews.count()
    
    if total_church_reviews > 0:
        from django.db.models import Avg
        overall_rating = all_church_reviews.aggregate(avg=Avg('rating'))['avg'] or 0
        overall_rating = round(overall_rating, 1)
        dist_rows = all_church_reviews.values('rating').annotate(count=Count('id'))
        overall_rating_distribution = {i: 0 for i in range(1, 6)}
        for row in dist_rows:
            try:
                rating_val = int(row['rating'])
                if rating_val in overall_rating_distribution:
                    overall_rating_distribution[rating_val] = row['count']
            except Exception:
                continue
    else:
        overall_rating = 0
        overall_rating_distribution = {i: 0 for i in range(1, 6)}
    
    # Determine if the current user can request appointments
    try:
        profile = request.user.profile
    except Exception:
        profile = None
    essential = get_essential_profile_status(request.user, profile)
    can_request_appointment = bool(essential.get('is_complete'))
    essential_missing = list(essential.get('missing', []))
    
    # Get posts with images for photo gallery (limit to recent 9 photos for a 3x3 grid, can show more)
    photo_posts = church.posts.filter(
        is_active=True,
        image__isnull=False
    ).exclude(image='').order_by('-created_at')[:9]
    
    ctx = {
        'page_title': church.name,
        'church': church,
        'is_following': is_following,
        'bookable_services': services,
        'posts': posts,
        'recent_reviews': recent_reviews,
        'overall_rating': overall_rating,
        'total_church_reviews': total_church_reviews,
        'overall_rating_distribution': overall_rating_distribution,
        'can_request_appointment': can_request_appointment,
        'essential_missing': essential_missing,
        'photo_posts': photo_posts,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/church_detail.html', ctx)


@login_required
def manage_church(request):
    """Manage user's church."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')
    
    if request.method == 'POST' and request.POST.get('form_type') != 'verification':
        form = ChurchUpdateForm(request.POST, request.FILES, instance=church)
        if form.is_valid():
            # Save the form directly - Django ModelForm handles partial updates correctly
            # when initialized with instance=church
            church = form.save()
            messages.success(request, 'Church information has been updated successfully!')
            return redirect('core:manage_church')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ChurchUpdateForm(instance=church)
    
    # Verification UI form (separate submission endpoint)
    verif_form = ChurchVerificationUploadForm()

    # Get church statistics
    follower_count = church.followers.count()
    recent_followers = church.followers.select_related('user')[:10]

    # Appointments tab data
    appt_status = request.GET.get('appt_status', 'all')
    bookings_all = (
        Booking.objects
        .filter(church=church)
        .select_related('service', 'user', 'user__profile')
        .order_by('-created_at')
    )
    counts = {
        'all': bookings_all.count(),
        Booking.STATUS_REQUESTED: bookings_all.filter(status=Booking.STATUS_REQUESTED).count(),
        Booking.STATUS_REVIEWED: bookings_all.filter(status=Booking.STATUS_REVIEWED).count(),
        Booking.STATUS_APPROVED: bookings_all.filter(status=Booking.STATUS_APPROVED).count(),
        Booking.STATUS_COMPLETED: bookings_all.filter(status=Booking.STATUS_COMPLETED).count(),
    }
    bookings = bookings_all
    if appt_status != 'all':
        bookings = bookings.filter(status=appt_status)

    # Conflict detection among active statuses on same church/date
    active_statuses = [Booking.STATUS_REQUESTED, Booking.STATUS_REVIEWED, Booking.STATUS_APPROVED]
    active_keys = list(
        bookings_all.filter(status__in=active_statuses)
        .values('church_id', 'date')
    )
    from collections import Counter
    key_counter = Counter((k['church_id'], k['date']) for k in active_keys)
    conflicts = {(cid, d) for (cid, d), c in key_counter.items() if c > 1}
    # Mark conflicts for template usage
    booking_list = []
    for b in bookings:
        setattr(b, 'is_conflict', (b.church_id, b.date) in conflicts)
        booking_list.append(b)

    # Posts data for Content tab
    posts = church.posts.filter(is_active=True).order_by('-created_at')[:20]
    posts_count = church.posts.filter(is_active=True).count()
    
    # Add liked and bookmarked status to each post for consistency
    if request.user.is_authenticated:
        for post in posts:
            post.is_liked = post.is_liked_by(request.user)
            post.is_bookmarked = post.is_bookmarked_by(request.user)
    else:
        for post in posts:
            post.is_liked = False
            post.is_bookmarked = False
    
    # Analytics data for Content tab
    from django.db.models import Sum
    from datetime import datetime, timedelta
    
    # Calculate date ranges
    today = timezone.now().date()
    last_30_days = today - timedelta(days=30)
    last_7_days = today - timedelta(days=7)
    
    # Post analytics
    total_posts = posts_count
    posts_last_30_days = church.posts.filter(
        is_active=True, 
        created_at__date__gte=last_30_days
    ).count()
    posts_last_7_days = church.posts.filter(
        is_active=True, 
        created_at__date__gte=last_7_days
    ).count()
    
    # Engagement analytics
    total_likes = PostLike.objects.filter(post__church=church, post__is_active=True).count()
    total_comments = PostComment.objects.filter(post__church=church, post__is_active=True).count()
    
    # Calculate total views for all church posts
    from django.db.models import Sum
    total_views = church.posts.filter(is_active=True).aggregate(
        total_views=Sum('view_count')
    )['total_views'] or 0
    
    likes_last_30_days = PostLike.objects.filter(
        post__church=church,
        post__is_active=True,
        created_at__date__gte=last_30_days
    ).count()
    
    comments_last_30_days = PostComment.objects.filter(
        post__church=church,
        post__is_active=True,
        created_at__date__gte=last_30_days
    ).count()
    
    # Calculate views from last 30 days
    views_last_30_days = PostView.objects.filter(
        post__church=church,
        post__is_active=True,
        viewed_at__date__gte=last_30_days
    ).count()
    
    # Most engaged post and Top 5 (by views + likes + comments)
    analytics_posts_qs = church.posts.filter(is_active=True).annotate(
        likes_count=Count('likes', distinct=True),
        comments_count=Count('comments', filter=Q(comments__is_active=True), distinct=True),
    ).annotate(
        total_engagement=ExpressionWrapper(
            F('view_count') + F('likes_count') + F('comments_count'),
            output_field=IntegerField()
        )
    )
    most_engaged_post = analytics_posts_qs.order_by('-total_engagement', '-created_at').first()
    top_5_posts = list(analytics_posts_qs.order_by('-total_engagement', '-created_at')[:5])
    max_engagement = top_5_posts[0].total_engagement if top_5_posts else 0
    
    # Top performing posts (by likes + comments)
    top_posts = church.posts.filter(is_active=True).annotate(
        total_engagement=Count('likes') + Count('comments')
    ).order_by('-total_engagement')[:5]
    
    # Add engagement data to top posts
    if request.user.is_authenticated:
        for post in top_posts:
            post.is_liked = post.is_liked_by(request.user)
            post.is_bookmarked = post.is_bookmarked_by(request.user)
            post.likes_count = post.likes.count()
            post.comments_count = post.comments.count()
    else:
        for post in top_posts:
            post.is_liked = False
            post.is_bookmarked = False
            post.likes_count = post.likes.count()
            post.comments_count = post.comments.count()
    
    # Growth metrics
    followers_last_30_days = ChurchFollow.objects.filter(
        church=church,
        followed_at__date__gte=last_30_days
    ).count()
    
    bookings_last_30_days = Booking.objects.filter(
        church=church,
        created_at__date__gte=last_30_days
    ).count()
    
    # Event posts data for Events tab
    event_posts = church.posts.filter(
        is_active=True,
        post_type='event'
    ).order_by('-created_at')[:20]
    event_posts_count = church.posts.filter(
        is_active=True,
        post_type='event'
    ).count()
    
    # Add liked and bookmarked status to event posts
    if request.user.is_authenticated:
        for post in event_posts:
            post.is_liked = post.is_liked_by(request.user)
            post.is_bookmarked = post.is_bookmarked_by(request.user)
    else:
        for post in event_posts:
            post.is_liked = False
            post.is_bookmarked = False

    # Donations data for Donations tab
    from decimal import Decimal
    from django.db.models import Sum
    
    # Get all donations for this church's posts
    donations_queryset = Donation.objects.filter(
        post__church=church
    ).select_related('donor', 'donor__profile', 'post').order_by('-created_at')
    
    # Recent donations (last 20)
    recent_donations = list(donations_queryset[:20])
    
    # Add follower status to each donation
    for donation in recent_donations:
        if donation.donor:
            donation.is_follower = ChurchFollow.objects.filter(
                user=donation.donor,
                church=church
            ).exists()
        else:
            donation.is_follower = False
    
    # Donation statistics 
    total_donations = donations_queryset.filter(payment_status='completed').count()
    total_amount = donations_queryset.filter(payment_status='completed').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')
    
    # This month's donations
    current_month_start = today.replace(day=1)
    this_month_donations = donations_queryset.filter(
        payment_status='completed',
        created_at__date__gte=current_month_start
    )
    this_month_amount = this_month_donations.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    this_month_count = this_month_donations.count()
    
    # This year's donations
    current_year_start = today.replace(month=1, day=1)
    this_year_donations = donations_queryset.filter(
        payment_status='completed',
        created_at__date__gte=current_year_start
    )
    this_year_amount = this_year_donations.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    this_year_count = this_year_donations.count()
    
    # Unique donors count
    unique_donors = donations_queryset.filter(payment_status='completed').values('donor').distinct().count()
    
    # Top donors (non-anonymous) - get unique donors with totals
    from django.db.models import Subquery, OuterRef
    top_donors_data = donations_queryset.filter(
        payment_status='completed',
        is_anonymous=False,
        donor__isnull=False
    ).values('donor').annotate(
        total_donated=Sum('amount'),
        donation_count=Count('id')
    ).order_by('-total_donated')[:5]
    
    # Get the actual donor objects with profile data
    top_donors = []
    for donor_data in top_donors_data:
        donor = User.objects.select_related('profile').get(id=donor_data['donor'])
        donor.total_donated = donor_data['total_donated']
        donor.donation_count = donor_data['donation_count']
        top_donors.append(donor)

    ctx = {
        'active': 'manage',
        'page_title': 'Manage Church',
        'church': church,
        'form': form,
        'verif_form': verif_form,
        'follower_count': follower_count,
        'recent_followers': recent_followers,
        'bookings': booking_list,
        'booking_counts': counts,
        'appt_status': appt_status,
        'latest_verification': church.verification_requests.order_by('-created_at').first(),
        'decline_reasons': list(church.decline_reasons.order_by('order', 'id')),
        'posts': posts,
        'posts_count': posts_count,
        'event_posts': event_posts,
        'event_posts_count': event_posts_count,
        # Analytics data
        'analytics': {
            'total_posts': total_posts,
            'posts_last_30_days': posts_last_30_days,
            'posts_last_7_days': posts_last_7_days,
            'total_likes': total_likes,
            'total_comments': total_comments,
            'total_views': total_views,
            'likes_last_30_days': likes_last_30_days,
            'comments_last_30_days': comments_last_30_days,
            'views_last_30_days': views_last_30_days,
            # For content_sub_tabs charts and ranking
            'most_engaged_post': most_engaged_post,
            'top_5_posts': top_5_posts,
            'max_engagement': max_engagement,
            'top_posts': top_posts,
            'followers_last_30_days': followers_last_30_days,
            'bookings_last_30_days': bookings_last_30_days,
        },
        # Donations data
        'donations': {
            'recent_donations': recent_donations,
            'total_donations': total_donations,
            'total_amount': total_amount,
            'this_month_amount': this_month_amount,
            'this_month_count': this_month_count,
            'this_year_amount': this_year_amount,
            'this_year_count': this_year_count,
            'unique_donors': unique_donors,
            'top_donors': top_donors,
        },
    }
    ctx.update(_app_context(request))
    # AJAX partial for appointments list
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' and request.GET.get('partial') == 'appointments_list':
        return render(request, 'core/partials/appointments_list.html', {
            'bookings': booking_list,
        })
    return render(request, 'core/manage_church.html', ctx)


@login_required
def update_church_logo(request):
    """AJAX endpoint to update the church logo from Manage Church page."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=405)

    church = request.user.owned_churches.first()
    if not church:
        return JsonResponse({'success': False, 'message': "You don't own any church."}, status=400)

    file_obj = request.FILES.get('logo') or request.FILES.get('file') or request.FILES.get('image')
    if not file_obj:
        return JsonResponse({'success': False, 'message': 'No file uploaded.'}, status=400)

    # Basic validation
    allowed_types = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
    content_type = getattr(file_obj, 'content_type', '')
    if content_type not in allowed_types:
        return JsonResponse({'success': False, 'message': 'Unsupported file type.'}, status=400)
    max_size = 10 * 1024 * 1024  # 10MB
    if getattr(file_obj, 'size', 0) > max_size:
        return JsonResponse({'success': False, 'message': 'File too large (max 10MB).'}, status=400)

    try:
        church.logo = file_obj
        church.save(update_fields=['logo'])
        # Build URL via field storage (Cloudinary in production)
        try:
            logo_url = church.logo.storage.url(church.logo.name)
        except Exception:
            logo_url = church.logo.url if getattr(church, 'logo', None) else None
        # Debug logging
        import logging
        from django.core.files.storage import default_storage
        logger = logging.getLogger(__name__)
        logger.info(f"[Update Logo] Default storage: {default_storage.__class__.__name__}")
        try:
            field_storage_name = church.logo.storage.__class__.__name__ if church.logo else 'None'
        except Exception:
            field_storage_name = 'Unknown'
        logger.info(f"[Update Logo] Field storage: {field_storage_name}")
        logger.info(f"[Update Logo] Name: {church.logo.name if church.logo else 'None'}")
        logger.info(f"[Update Logo] URL: {logo_url}")
        return JsonResponse({'success': True, 'url': logo_url, 'message': 'Logo updated successfully.'})
    except Exception:
        return JsonResponse({'success': False, 'message': 'Failed to save logo.'}, status=500)


@login_required
def update_church_cover(request):
    """AJAX endpoint to update the church cover image from Manage Church page."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=405)

    church = request.user.owned_churches.first()
    if not church:
        return JsonResponse({'success': False, 'message': "You don't own any church."}, status=400)

    file_obj = request.FILES.get('cover_image') or request.FILES.get('file') or request.FILES.get('image')
    if not file_obj:
        return JsonResponse({'success': False, 'message': 'No file uploaded.'}, status=400)

    # Basic validation
    allowed_types = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
    content_type = getattr(file_obj, 'content_type', '')
    if content_type not in allowed_types:
        return JsonResponse({'success': False, 'message': 'Unsupported file type.'}, status=400)
    max_size = 10 * 1024 * 1024  # 10MB
    if getattr(file_obj, 'size', 0) > max_size:
        return JsonResponse({'success': False, 'message': 'File too large (max 10MB).'}, status=400)

    try:
        church.cover_image = file_obj
        church.save(update_fields=['cover_image'])
        # Build URL via field storage
        try:
            cover_url = church.cover_image.storage.url(church.cover_image.name)
        except Exception:
            cover_url = church.cover_image.url if getattr(church, 'cover_image', None) else None
        # Debug logging
        import logging
        from django.core.files.storage import default_storage
        logger = logging.getLogger(__name__)
        logger.info(f"[Update Cover] Default storage: {default_storage.__class__.__name__}")
        try:
            field_storage_name = church.cover_image.storage.__class__.__name__ if church.cover_image else 'None'
        except Exception:
            field_storage_name = 'Unknown'
        logger.info(f"[Update Cover] Field storage: {field_storage_name}")
        logger.info(f"[Update Cover] Name: {church.cover_image.name if church.cover_image else 'None'}")
        logger.info(f"[Update Cover] URL: {cover_url}")
        return JsonResponse({'success': True, 'url': cover_url, 'message': 'Cover image updated successfully.'})
    except Exception:
        return JsonResponse({'success': False, 'message': 'Failed to save cover image.'}, status=500)


@login_required
def follow_church(request, church_id):
    """Follow or unfollow a church."""
    if request.method == 'POST':
        church = get_object_or_404(Church, id=church_id, is_active=True)
        
        # Check if already following
        follow_obj, created = ChurchFollow.objects.get_or_create(
            user=request.user,
            church=church
        )
        
        if created:
            # Update follower count
            church.follower_count = church.followers.count()
            church.save(update_fields=['follower_count'])
            
            # Log activity
            from .models import UserInteraction
            UserInteraction.log_activity(
                user=request.user,
                activity_type=UserInteraction.ACTIVITY_CHURCH_FOLLOW,
                content_object=church,
                request=request
            )
            
            return JsonResponse({
                'success': True,
                'action': 'followed',
                'message': f'You are now following {church.name}',
                'follower_count': church.follower_count
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'You are already following this church'
            })
    
    return JsonResponse({'success': False, 'message': 'Invalid request'})


@login_required
def unfollow_church(request, church_id):
    """Unfollow a church."""
    if request.method == 'POST':
        church = get_object_or_404(Church, id=church_id)
        
        try:
            follow_obj = ChurchFollow.objects.get(user=request.user, church=church)
            follow_obj.delete()
            
            # Update follower count
            church.follower_count = church.followers.count()
            church.save(update_fields=['follower_count'])
            
            # Log activity
            from .models import UserInteraction
            UserInteraction.log_activity(
                user=request.user,
                activity_type=UserInteraction.ACTIVITY_CHURCH_UNFOLLOW,
                content_object=church,
                request=request
            )
            
            return JsonResponse({
                'success': True,
                'action': 'unfollowed',
                'message': f'You have unfollowed {church.name}',
                'follower_count': church.follower_count
            })
        except ChurchFollow.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'You are not following this church'
            })
    
    return JsonResponse({'success': False, 'message': 'Invalid request'})


@login_required
def events(request):
    ctx = {
        'active': 'events',
        'page_title': 'Events',
    }
    ctx.update(_app_context(request))
    return render(request, 'app/page.html', ctx)


@login_required
def appointments(request):
    """User's appointments page with status filters and counts."""
    status_filter = request.GET.get('status', 'all')
    bookings_qs = Booking.objects.filter(user=request.user).select_related('service', 'church').order_by('-created_at')

    counts = {
        'all': bookings_qs.count(),
        Booking.STATUS_REQUESTED: bookings_qs.filter(status=Booking.STATUS_REQUESTED).count(),
        Booking.STATUS_REVIEWED: bookings_qs.filter(status=Booking.STATUS_REVIEWED).count(),
        Booking.STATUS_APPROVED: bookings_qs.filter(status=Booking.STATUS_APPROVED).count(),
        Booking.STATUS_COMPLETED: bookings_qs.filter(status=Booking.STATUS_COMPLETED).count(),
    }
    if status_filter and status_filter != 'all':
        bookings_qs = bookings_qs.filter(status=status_filter)

    # Add review status for each booking
    bookings = list(bookings_qs)
    for booking in bookings:
        booking.user_has_reviewed = booking.service.has_user_reviewed(request.user)

    ctx = {
        'active': 'appointments',
        'page_title': 'My Appointments',
        'bookings': bookings,
        'counts': counts,
        'status_filter': status_filter,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/my_appointments.html', ctx)


@login_required
def following(request):
    """View churches the user is following."""
    followed_churches = Church.objects.filter(
        followers__user=request.user,
        is_active=True
    ).select_related('owner').annotate(
        followers_count=Count('followers'),
        followed_at=F('followers__followed_at')
    ).order_by('-followed_at')
    
    ctx = {
        'active': 'following',
        'page_title': 'Following',
        'followed_churches': followed_churches,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/following.html', ctx)


@login_required
def manage(request):
    """Redirect to manage church or create church."""
    if request.user.owned_churches.exists():
        return redirect('core:manage_church')
    else:
        return redirect('core:create_church')


@login_required
def settings_page(request):
    ctx = {
        'active': 'settings',
        'page_title': 'Settings',
    }
    ctx.update(_app_context(request))
    return render(request, 'app/page.html', ctx)


@login_required
def super_admin_dashboard(request):
    """Super Admin dashboard for system-wide management.
    Access is restricted to superusers.
    """
    if not request.user.is_superuser:
        messages.error(request, 'You do not have permission to access Super Admin.')
        return redirect('core:home')

    User = get_user_model()
    from django.utils import timezone
    from datetime import timedelta

    # User Statistics
    total_users = User.objects.count()
    
    # Active users (logged in within last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    active_users = User.objects.filter(last_login__gte=thirty_days_ago).count() if hasattr(User, 'last_login') else 0
    
    # New users this month
    first_day_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_users_this_month = User.objects.filter(date_joined__gte=first_day_of_month).count() if hasattr(User, 'date_joined') else 0
    
    # Recent registrations (last 10 users)
    recent_registrations = User.objects.order_by('-date_joined')[:10] if hasattr(User, 'date_joined') else User.objects.order_by('-id')[:10]
    
    # Daily active users (last 14 days)
    daily_active_users = []
    daily_labels = []
    if hasattr(User, 'last_login'):
        for i in range(13, -1, -1):  # Last 14 days
            day = timezone.now() - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            count = User.objects.filter(
                last_login__gte=day_start,
                last_login__lt=day_end
            ).count()
            
            daily_active_users.append(count)
            daily_labels.append(day.strftime('%b %d'))  # e.g., "Oct 05"
    
    # Church Statistics
    total_churches = Church.objects.count()
    
    # Verified churches (assuming there's a verification status)
    verified_churches = Church.objects.filter(is_verified=True).count() if hasattr(Church, 'is_verified') else 0
    
    # New churches this month
    new_churches_this_month = Church.objects.filter(created_at__gte=first_day_of_month).count()
    
    # Top churches by followers (Top 10)
    # Using existing follower_count field instead of annotation
    top_churches_by_followers = Church.objects.order_by('-follower_count')[:10]
    
    # Other stats
    total_services = BookableService.objects.count()
    total_bookings = Booking.objects.count()

    # Recent activity
    recent_churches = Church.objects.select_related('owner').order_by('-created_at')[:8]
    recent_users = User.objects.order_by('-date_joined')[:8] if hasattr(User, 'date_joined') else User.objects.order_by('-id')[:8]
    recent_bookings = Booking.objects.select_related('service', 'church', 'user').order_by('-created_at')[:8]

    # Booking status breakdown
    booking_by_status = list(
        Booking.objects.values('status').annotate(count=Count('id')).order_by('-count')
    )

    # Church verification snapshot for dashboard
    try:
        pending_verifications = list(
            ChurchVerificationRequest.objects
            .select_related('church', 'submitted_by')
            .filter(status=ChurchVerificationRequest.STATUS_PENDING)
            .order_by('created_at')[:5]
        )
        verif_counts = {
            'pending': ChurchVerificationRequest.objects.filter(status=ChurchVerificationRequest.STATUS_PENDING).count(),
            'approved': ChurchVerificationRequest.objects.filter(status=ChurchVerificationRequest.STATUS_APPROVED).count(),
            'rejected': ChurchVerificationRequest.objects.filter(status=ChurchVerificationRequest.STATUS_REJECTED).count(),
        }
    except Exception:
        pending_verifications = []
        verif_counts = {'pending': 0, 'approved': 0, 'rejected': 0}

    ctx = {
        'active': 'super_admin',
        'page_title': 'System Overview',
        'user_stats': {
            'total_users': total_users,
            'active_users': active_users,
            'new_users_this_month': new_users_this_month,
            'active_percentage': round((active_users / total_users * 100) if total_users > 0 else 0, 1),
            'inactive_users': max(total_users - active_users, 0),
        },
        'daily_active_users': daily_active_users,
        'daily_labels': daily_labels,
        'church_stats': {
            'total_churches': total_churches,
            'verified_churches': verified_churches,
            'new_churches_this_month': new_churches_this_month,
            'verified_percentage': round((verified_churches / total_churches * 100) if total_churches > 0 else 0, 1),
            'unverified_churches': max(total_churches - verified_churches, 0),
        },
        'top_churches_by_followers': top_churches_by_followers,
        'recent_registrations': recent_registrations,
        'stats': {
            'users': total_users,
            'churches': total_churches,
            'services': total_services,
            'bookings': total_bookings,
        },
        'booking_by_status': booking_by_status,
        'recent_churches': recent_churches,
        'recent_users': recent_users,
        'recent_bookings': recent_bookings,
        'verif': {
            'counts': verif_counts,
            'pending_list': pending_verifications,
        },
    }
    ctx.update(_app_context(request))
    return render(request, 'core/super_admin.html', ctx)


@login_required
def super_admin_profile(request):
    """Super Admin's own profile page with admin-focused info and shortcuts.
    Access is restricted to superusers.
    """
    if not request.user.is_superuser:
        messages.error(request, 'You do not have permission to access Super Admin Profile.')
        return redirect('core:home')

    user = request.user
    # Collect admin-related context
    groups = list(user.groups.values_list('name', flat=True))
    # Count direct and group-derived permissions
    try:
        from django.contrib.auth.models import Permission
        group_perm_count = Permission.objects.filter(group__user=user).distinct().count()
    except Exception:
        group_perm_count = 0
    direct_perm_count = getattr(user, 'user_permissions', None).count() if hasattr(user, 'user_permissions') else 0

    ctx = {
        'active': 'super_admin_profile',
        'page_title': 'Super Admin Profile',
        'admin_info': {
            'username': user.get_username(),
            'email': user.email,
            'last_login': user.last_login,
            'date_joined': getattr(user, 'date_joined', None),
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_active': user.is_active,
        },
        'admin_privileges': {
            'groups': groups,
            'direct_permissions_count': direct_perm_count,
            'group_permissions_count': group_perm_count,
        },
    }
    ctx.update(_app_context(request))
    return render(request, 'core/super_admin_profile.html', ctx)


# Bookable Services Management
@login_required
def manage_services(request):
    """Manage bookable services for a church."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')
    
    # Search and filter functionality
    search_query = request.GET.get('search', '')
    status_filter = request.GET.get('status', '')
    price_filter = request.GET.get('price', '')
    
    services = church.bookable_services.all()
    
    # Apply search filter
    if search_query:
        services = services.filter(
            Q(name__icontains=search_query) |
            Q(description__icontains=search_query)
        )
    
    # Apply status filter
    if status_filter == 'active':
        services = services.filter(is_active=True)
    elif status_filter == 'inactive':
        services = services.filter(is_active=False)
    
    # Apply price filter
    if price_filter == 'free':
        services = services.filter(is_free=True)
    elif price_filter == 'paid':
        services = services.filter(is_free=False)
    
    # Order by creation date
    services = services.order_by('-created_at')
    
    ctx = {
        'active': 'manage',
        'page_title': 'Manage Services',
        'church': church,
        'services': services,
        'search_query': search_query,
        'status_filter': status_filter,
        'price_filter': price_filter,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/manage_services.html', ctx)


@login_required
def create_service(request):
    """Create a new bookable service."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')
    
    if request.method == 'POST':
        form = BookableServiceForm(request.POST, request.FILES, church=church)
        if form.is_valid():
            service = form.save()
            
            # Handle multiple image uploads
            images = request.FILES.getlist('images')
            if images:
                for i, image in enumerate(images):
                    if image:  # Check if file exists
                        ServiceImage.objects.create(
                            service=service,
                            image=image,
                            order=i,
                            is_primary=(i == 0)  # First image is primary
                        )
            
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True, 
                    'message': f'Service "{service.name}" has been created successfully!',
                    'service_id': service.id
                })
            messages.success(request, f'Service "{service.name}" has been created successfully!')
            return HttpResponseRedirect(reverse('core:manage_church') + '?tab=services')
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False, 
                    'message': 'Please correct the errors below.',
                    'errors': form.errors
                })
            messages.error(request, 'Please correct the errors below.')
    else:
        form = BookableServiceForm(church=church)
    
    # Return form HTML for modal
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return render(request, 'core/partials/service_form.html', {
            'form': form,
            'church': church,
            'action': 'create'
        })
    
    ctx = {
        'active': 'manage',
        'page_title': 'Create Service',
        'church': church,
        'form': form,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/create_service.html', ctx)


@login_required
def edit_service(request, service_id):
    """Edit a bookable service."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')
    
    service = get_object_or_404(BookableService, id=service_id, church=church)
    
    if request.method == 'POST':
        form = BookableServiceForm(request.POST, request.FILES, instance=service, church=church)
        if form.is_valid():
            form.save()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True, 
                    'message': f'Service "{service.name}" has been updated successfully!',
                    'service_id': service.id
                })
            messages.success(request, f'Service "{service.name}" has been updated successfully!')
            return HttpResponseRedirect(reverse('core:manage_church') + '?tab=services')
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False, 
                    'message': 'Please correct the errors below.',
                    'errors': form.errors
                })
            messages.error(request, 'Please correct the errors below.')
    else:
        form = BookableServiceForm(instance=service, church=church)
    
    # Return form HTML for modal
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return render(request, 'core/partials/service_form.html', {
            'form': form,
            'church': church,
            'service': service,
            'action': 'edit'
        })
    
    ctx = {
        'active': 'manage',
        'page_title': f'Edit {service.name}',
        'church': church,
        'service': service,
        'form': form,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/edit_service.html', ctx)


@login_required
def delete_service(request, service_id):
    """Delete a bookable service."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')
    
    service = get_object_or_404(BookableService, id=service_id, church=church)
    
    if request.method == 'POST':
        service_name = service.name
        service.delete()
        messages.success(request, f'Service "{service_name}" has been deleted successfully!')
        return HttpResponseRedirect(reverse('core:manage_church') + '?tab=services')
    
    ctx = {
        'active': 'manage',
        'page_title': f'Delete {service.name}',
        'church': church,
        'service': service,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/delete_service.html', ctx)


# Service Image Management
@login_required
def manage_service_images(request, service_id):
    """Manage images for a specific service."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')
    
    service = get_object_or_404(BookableService, id=service_id, church=church)
    
    if request.method == 'POST':
        form = ServiceImageForm(request.POST, request.FILES)
        if form.is_valid():
            service_image = form.save(commit=False)
            service_image.service = service
            service_image.save()
            messages.success(request, f'Image added to "{service.name}" successfully!')
            return HttpResponseRedirect(reverse('core:manage_service_images', args=[service.id]))
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ServiceImageForm()
    
    ctx = {
        'active': 'manage',
        'page_title': f'Manage Images - {service.name}',
        'church': church,
        'service': service,
        'form': form,
        'images': service.get_images(),
    }
    ctx.update(_app_context(request))
    return render(request, 'core/manage_service_images.html', ctx)


@login_required
def delete_service_image(request, image_id):
    """Delete a service image."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')
    
    service_image = get_object_or_404(ServiceImage, id=image_id, service__church=church)
    service = service_image.service
    
    if request.method == 'POST':
        service_image.delete()
        messages.success(request, 'Image deleted successfully!')
        return HttpResponseRedirect(reverse('core:manage_service_images', args=[service.id]))
    
    ctx = {
        'active': 'manage',
        'page_title': f'Delete Image - {service.name}',
        'church': church,
        'service': service,
        'service_image': service_image,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/delete_service_image.html', ctx)


# Availability Management
@login_required
def manage_availability(request):
    """Manage church availability and closed dates."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')
    
    # Get availability entries for the next 3 months
    from datetime import date, timedelta
    start_date = date.today()
    end_date = start_date + timedelta(days=90)
    
    availability_entries = church.availability.filter(
        date__range=[start_date, end_date]
    ).order_by('date')
    
    ctx = {
        'active': 'manage',
        'page_title': 'Manage Availability',
        'church': church,
        'availability_entries': availability_entries,
        'start_date': start_date,
        'end_date': end_date,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/manage_availability.html', ctx)


@login_required
def api_service_images(request, service_id):
    """API endpoint to fetch service images for gallery modal."""
    try:
        service = get_object_or_404(BookableService, id=service_id, church__owner=request.user)
        images = service.get_images()
        
        images_data = []
        for image in images:
            images_data.append({
                'id': image.id,
                'url': image.image.url,
                'caption': image.caption,
                'is_primary': image.is_primary,
                'order': image.order
            })
        
        return JsonResponse({
            'success': True,
            'images': images_data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required
def service_gallery(request, service_id):
    """Display full image gallery for a service."""
    try:
        service = get_object_or_404(BookableService, id=service_id, church__owner=request.user)
        images = service.get_images()
        
        context = _app_context(request)
        context.update({
            'service': service,
            'images': images,
            'title': f'{service.name} - Image Gallery'
        })
        
        return render(request, 'core/service_gallery.html', context)
    except Exception as e:
        messages.error(request, f'Error loading gallery: {str(e)}')
        return HttpResponseRedirect(reverse('core:manage_church') + '?tab=services')


@login_required
def book_service(request, service_id):
    """Booking page for a specific service. Shows upcoming dates and allows submitting a request."""
    service = get_object_or_404(BookableService, id=service_id, is_active=True)
    church = service.church

    # Block booking when church is not verified
    if not church.is_verified:
        messages.error(request, 'This church is not yet verified and cannot accept appointment requests.')
        return redirect('core:church_detail', slug=church.slug)

    # Enforce essential profile completeness before allowing booking
    try:
        profile = request.user.profile
    except Exception:
        profile = None
    essential = get_essential_profile_status(request.user, profile)
    if not essential.get('is_complete'):
        missing = essential.get('missing', [])
        # Build a friendly missing summary (limit to first 4)
        if missing:
            summary = ', '.join(missing[:4])
            if len(missing) > 4:
                summary += f" (+{len(missing) - 4} more)"
        else:
            summary = 'required information'
        messages.error(request, f'Please complete your profile before requesting an appointment. Missing: {summary}.')
        return redirect('dashboard')

    # Calculate date range for calendar constraints
    from datetime import date, timedelta
    start_date = date.today()
    end_date = start_date + timedelta(days=service.advance_booking_days)

    form = BookingForm(request.POST or None, service=service, user=request.user)
    if request.method == 'POST':
        if form.is_valid():
            booking = form.save()
            
            # Log activity
            from .models import UserInteraction
            UserInteraction.log_activity(
                user=request.user,
                activity_type=UserInteraction.ACTIVITY_BOOKING_CREATE,
                content_object=booking,
                metadata={
                    'service_name': service.name,
                    'church_name': church.name,
                    'booking_code': booking.code,
                    'requested_date': booking.date.isoformat()
                },
                request=request
            )
            
            messages.success(request, f'Appointment request submitted. Your ID is {booking.code}.')
            return HttpResponseRedirect(reverse('core:appointments'))
        else:
            messages.error(request, 'Please fix the errors below.')

    ctx = {
        'active': 'discover',
        'page_title': f'Request Appointment - {service.name}',
        'church': church,
        'service': service,
        'form': form,
        'today': start_date,
        'max_date': end_date,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/book_service.html', ctx)


@login_required
def create_booking_api(request):
    """API endpoint for creating booking requests via AJAX."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        import json
        data = json.loads(request.body)
        service_id = data.get('service_id')
        
        if not service_id:
            return JsonResponse({'error': 'Service ID is required'}, status=400)
        
        service = get_object_or_404(BookableService, id=service_id, is_active=True)
        church = service.church
        
        # Block booking when church is not verified
        if not church.is_verified:
            return JsonResponse({
                'error': 'This church is not yet verified and cannot accept appointment requests.'
            }, status=400)
        
        # Check profile completeness
        try:
            profile = request.user.profile
        except Exception:
            profile = None
        essential = get_essential_profile_status(request.user, profile)
        if not essential.get('is_complete'):
            missing = essential.get('missing', [])
            return JsonResponse({
                'error': 'Please complete your profile before requesting an appointment.',
                'missing_fields': missing
            }, status=400)
        
        # Create form with data
        form_data = {
            'date': data.get('date'),
            'time': data.get('time'),
            'notes': data.get('notes', '')
        }
        
        form = BookingForm(form_data, service=service, user=request.user)
        if form.is_valid():
            booking = form.save()
            
            # Log activity
            from .models import UserInteraction
            UserInteraction.log_activity(
                user=request.user,
                activity_type=UserInteraction.ACTIVITY_BOOKING_CREATE,
                content_object=booking,
                metadata={
                    'service_name': service.name,
                    'church_name': church.name,
                    'booking_code': booking.code,
                    'requested_date': booking.date.isoformat(),
                    'requested_time': booking.start_time.isoformat() if booking.start_time else None
                },
                request=request
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Appointment request submitted successfully.',
                'booking_code': booking.code
            })
        else:
            return JsonResponse({
                'error': 'Please fix the form errors.',
                'form_errors': form.errors
            }, status=400)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def manage_booking(request, booking_id):
    """Owner view to review/update a single booking and handle conflicts."""
    booking = get_object_or_404(Booking.objects.select_related('service', 'church', 'user'), id=booking_id)
    if booking.church.owner != request.user:
        messages.error(request, 'You do not have permission to manage this booking.')
        return redirect('core:manage_church')

    if request.method == 'POST':
        new_status = request.POST.get('status')
        valid_statuses = {s for s, _ in Booking.STATUS_CHOICES}
        if new_status in valid_statuses and new_status != booking.status:
            # If declining, ensure a reason is provided
            if new_status == Booking.STATUS_DECLINED:
                selected = (request.POST.get('decline_reason') or '').strip()
                # If user selected custom, read from custom field
                if selected == '__custom__':
                    reason = (request.POST.get('decline_reason_custom') or '').strip()
                else:
                    reason = selected
                if not reason:
                    messages.error(request, 'Please select a reason for declining this appointment.')
                    return HttpResponseRedirect(reverse('core:manage_booking', args=[booking.id]))
                booking.decline_reason = reason[:200]

            old_status = booking.status
            booking.status = new_status
            booking.status_changed_at = timezone.now()
            # Clear cancel reason when status is changed away from canceled
            if new_status != Booking.STATUS_CANCELED:
                booking.cancel_reason = ''
            # If status changed away from declined, clear decline reason
            if new_status != Booking.STATUS_DECLINED:
                booking.decline_reason = ''
            booking.save(update_fields=['status', 'status_changed_at', 'updated_at', 'cancel_reason', 'decline_reason'])
            
            # Log activity for booking update
            from .models import UserInteraction
            UserInteraction.log_activity(
                user=booking.user,  # Log for the booking owner, not the church owner
                activity_type=UserInteraction.ACTIVITY_BOOKING_UPDATE,
                content_object=booking,
                metadata={
                    'old_status': old_status,
                    'new_status': new_status,
                    'booking_code': booking.code,
                    'service_name': booking.service.name,
                    'church_name': booking.church.name,
                    'updated_by': request.user.username,
                    'decline_reason': booking.decline_reason if new_status == Booking.STATUS_DECLINED else None
                },
                request=request
            )

            # Auto-cancel conflicts when approving
            if new_status == Booking.STATUS_APPROVED:
                conflicts = booking.conflicts_qs().filter(status__in=[Booking.STATUS_REQUESTED, Booking.STATUS_REVIEWED])
                for other in conflicts:
                    other.status = Booking.STATUS_CANCELED
                    other.cancel_reason = 'Conflicted with another approved booking. Please reschedule.'
                    other.status_changed_at = timezone.now()
                    other.save(update_fields=['status', 'cancel_reason', 'status_changed_at', 'updated_at'])
                    # Notify conflicting requester about auto-cancel
                    try:
                        tmpl = NotificationTemplates.booking_canceled(other)
                        create_booking_notification(
                            booking=other,
                            notification_type=Notification.TYPE_BOOKING_CANCELED,
                            title=tmpl['title'],
                            message=tmpl['message'],
                            priority=tmpl['priority']
                        )
                    except Exception:
                        pass

            # Send notification to requester for this booking based on new status
            try:
                if new_status == Booking.STATUS_REVIEWED:
                    tmpl = NotificationTemplates.booking_reviewed(booking)
                    create_booking_notification(
                        booking=booking,
                        notification_type=Notification.TYPE_BOOKING_REVIEWED,
                        title=tmpl['title'],
                        message=tmpl['message'],
                        priority=tmpl['priority']
                    )
                elif new_status == Booking.STATUS_APPROVED:
                    tmpl = NotificationTemplates.booking_approved(booking)
                    create_booking_notification(
                        booking=booking,
                        notification_type=Notification.TYPE_BOOKING_APPROVED,
                        title=tmpl['title'],
                        message=tmpl['message'],
                        priority=tmpl['priority']
                    )
                elif new_status == Booking.STATUS_DECLINED:
                    tmpl = NotificationTemplates.booking_declined(booking)
                    create_booking_notification(
                        booking=booking,
                        notification_type=Notification.TYPE_BOOKING_DECLINED,
                        title=tmpl['title'],
                        message=tmpl['message'],
                        priority=tmpl['priority']
                    )
                elif new_status == Booking.STATUS_CANCELED:
                    tmpl = NotificationTemplates.booking_canceled(booking)
                    create_booking_notification(
                        booking=booking,
                        notification_type=Notification.TYPE_BOOKING_CANCELED,
                        title=tmpl['title'],
                        message=tmpl['message'],
                        priority=tmpl['priority']
                    )
                elif new_status == Booking.STATUS_COMPLETED:
                    tmpl = NotificationTemplates.booking_completed(booking)
                    create_booking_notification(
                        booking=booking,
                        notification_type=Notification.TYPE_BOOKING_COMPLETED,
                        title=tmpl['title'],
                        message=tmpl['message'],
                        priority=tmpl['priority']
                    )
            except Exception:
                pass

            messages.success(request, 'Booking status updated successfully.')
            return HttpResponseRedirect(reverse('core:manage_booking', args=[booking.id]))
        else:
            messages.error(request, 'Invalid status update.')

    ctx = {
        'page_title': f'Appointment {booking.code}',
        'booking': booking,
        'decline_reasons': booking.church.decline_reasons.filter(is_active=True).order_by('order', 'id'),
    }
    ctx.update(_app_context(request))
    return render(request, 'core/manage_booking_detail.html', ctx)


@login_required
def create_decline_reason(request):
    """Create a new decline reason for the owner's church."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            if request.headers.get('Content-Type') == 'application/json':
                return JsonResponse({'success': False, 'message': 'You don\'t own any churches.'}, status=403)
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        if request.headers.get('Content-Type') == 'application/json':
            return JsonResponse({'success': False, 'message': 'You don\'t own any churches.'}, status=403)
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')

    if request.method != 'POST':
        return HttpResponseRedirect(reverse('core:manage_church') + '?tab=settings')

    # Check if this is an AJAX/JSON request
    is_ajax = request.headers.get('Content-Type') == 'application/json'
    
    if is_ajax:
        import json
        data = json.loads(request.body)
        label = (data.get('label') or '').strip()
        is_active = bool(data.get('is_active'))
    else:
        label = (request.POST.get('label') or '').strip()
        is_active = bool(request.POST.get('is_active'))
    
    if not label:
        if is_ajax:
            return JsonResponse({'success': False, 'message': 'Reason label is required.'}, status=400)
        messages.error(request, 'Reason label is required.')
        return HttpResponseRedirect(reverse('core:manage_church') + '?tab=settings')

    # Determine next order
    next_order = (church.decline_reasons.aggregate(c=Count('id'))['c'] or 0)
    try:
        reason = DeclineReason.objects.create(church=church, label=label[:200], is_active=is_active, order=next_order)
        if is_ajax:
            return JsonResponse({
                'success': True,
                'message': 'Decline reason added.',
                'reason': {
                    'id': reason.id,
                    'label': reason.label,
                    'is_active': reason.is_active
                }
            })
        messages.success(request, 'Decline reason added.')
    except IntegrityError:
        if is_ajax:
            return JsonResponse({'success': False, 'message': 'A reason with this label already exists.'}, status=400)
        messages.info(request, 'A reason with this label already exists.')
    return HttpResponseRedirect(reverse('core:manage_church') + '?tab=settings')


@login_required
def delete_decline_reason(request, reason_id):
    """Delete a decline reason belonging to the owner's church."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            if request.headers.get('Content-Type') == 'application/json':
                return JsonResponse({'success': False, 'message': 'You don\'t own any churches.'}, status=403)
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        if request.headers.get('Content-Type') == 'application/json':
            return JsonResponse({'success': False, 'message': 'You don\'t own any churches.'}, status=403)
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')

    reason = get_object_or_404(DeclineReason, id=reason_id, church=church)
    if request.method == 'POST':
        reason.delete()
        if request.headers.get('Content-Type') == 'application/json':
            return JsonResponse({'success': True, 'message': 'Decline reason removed.'})
        messages.success(request, 'Decline reason removed.')
    return HttpResponseRedirect(reverse('core:manage_church') + '?tab=settings')


@login_required
def toggle_decline_reason(request, reason_id):
    """Toggle active state of a decline reason belonging to the owner's church."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            if request.headers.get('Content-Type') == 'application/json':
                return JsonResponse({'success': False, 'message': 'You don\'t own any churches.'}, status=403)
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        if request.headers.get('Content-Type') == 'application/json':
            return JsonResponse({'success': False, 'message': 'You don\'t own any churches.'}, status=403)
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')

    reason = get_object_or_404(DeclineReason, id=reason_id, church=church)
    if request.method == 'POST':
        # Check if JSON request to parse body
        if request.headers.get('Content-Type') == 'application/json':
            import json
            data = json.loads(request.body)
            reason.is_active = bool(data.get('is_active'))
        else:
            reason.is_active = not reason.is_active
        reason.save(update_fields=['is_active', 'updated_at'])
        
        if request.headers.get('Content-Type') == 'application/json':
            return JsonResponse({
                'success': True,
                'message': f'Decline reason set to {"active" if reason.is_active else "inactive"}.',
                'is_active': reason.is_active
            })
        messages.success(request, f'Decline reason "{reason.label}" set to {"active" if reason.is_active else "inactive"}.')
    return HttpResponseRedirect(reverse('core:manage_church') + '?tab=settings')


@login_required
def booking_invoice(request, booking_id):
    """Printable invoice page for a booking. Accessible by the booking user or the church owner."""
    booking = get_object_or_404(Booking.objects.select_related('service', 'church', 'user'), id=booking_id)
    is_owner = request.user == booking.user
    is_church_owner = request.user == booking.church.owner
    if not (is_owner or is_church_owner):
        messages.error(request, 'You do not have permission to view this invoice.')
        return redirect('core:appointments')

    # Do not allow invoice viewing for canceled/declined bookings
    if booking.status in (Booking.STATUS_CANCELED, Booking.STATUS_DECLINED):
        messages.error(request, 'Invoice is not available for canceled or declined bookings.')
        return redirect('core:appointments' if is_owner else 'core:manage_church')

    can_print = booking.status == Booking.STATUS_REVIEWED or is_church_owner
    ctx = {
        'active': 'appointments' if is_owner else 'manage',
        'page_title': f'Invoice {booking.code}',
        'booking': booking,
        'can_print': can_print,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/booking_invoice.html', ctx)


# Church Verification Flow
@login_required
def request_verification(request):
    """Owner submits legal documents for church verification (requires at least 2)."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            # JSON path for AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': "You don't own any churches yet."}, status=403)
            messages.info(request, 'You do not own any churches yet. Create one to continue.')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'message': "You don't own any churches yet."}, status=403)
        messages.info(request, 'You do not own any churches yet. Create one to continue.')
        return redirect('core:create_church')

    if request.method != 'POST':
        # Redirect to settings tab where the form lives
        return HttpResponseRedirect(reverse('core:manage_church') + '?tab=settings')

    # Disallow multiple pending requests
    existing_pending = church.verification_requests.filter(status=ChurchVerificationRequest.STATUS_PENDING).first()
    if existing_pending:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'message': 'You already have a pending verification request.'}, status=400)
        messages.info(request, 'You already have a pending verification request. Our team will review it soon.')
        return HttpResponseRedirect(reverse('core:manage_church') + '?tab=settings')

    form = ChurchVerificationUploadForm(request.POST, request.FILES)
    if not form.is_valid():
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            # Flatten form errors
            errors = {field: [str(e) for e in errs] for field, errs in form.errors.items()}
            return JsonResponse({'success': False, 'message': 'Invalid submission', 'errors': errors}, status=400)
        for field, errs in form.errors.items():
            for err in errs:
                messages.error(request, f"{field}: {err}")
        return HttpResponseRedirect(reverse('core:manage_church') + '?tab=settings')

    # Create request and documents
    ver_req = ChurchVerificationRequest.objects.create(
        church=church,
        submitted_by=request.user,
        status=ChurchVerificationRequest.STATUS_PENDING,
    )
    for f in form.cleaned_data['documents']:
        ChurchVerificationDocument.objects.create(
            request=ver_req,
            file=f,
            title=getattr(f, 'name', '')[:200],
        )

    # AJAX success response
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True, 'message': 'Verification request submitted', 'request_id': ver_req.id})

    messages.success(request, 'Your verification request has been submitted. We will notify you once it is reviewed.')
    return HttpResponseRedirect(reverse('core:manage_church') + '?tab=settings')


@login_required
def super_admin_church_detail(request, church_id):
    """Detailed view of a church for super admins."""
    if not request.user.is_superuser:
        messages.error(request, 'You do not have permission to access Super Admin.')
        return redirect('core:home')
    
    church = get_object_or_404(Church.objects.select_related('owner'), id=church_id, is_active=True)
    
    # Get church services
    services = church.bookable_services.filter(is_active=True).prefetch_related('service_images').order_by('name')
    
    # Get recent posts
    posts = church.posts.filter(is_active=True).select_related('church').order_by('-created_at')[:10]
    
    # Get upcoming events (if you have events model)
    # events = church.events.filter(is_active=True, start_date__gte=timezone.now()).order_by('start_date')[:10]
    
    # Get followers count
    followers_count = ChurchFollow.objects.filter(church=church).count()
    
    # Get verification requests history with documents
    verification_requests = ChurchVerificationRequest.objects.filter(
        church=church
    ).select_related('submitted_by', 'reviewed_by').prefetch_related('documents').order_by('-created_at')
    
    ctx = {
        'active': 'super_admin_verifications',
        'page_title': f'{church.name} - Church Details',
        'church': church,
        'services': services,
        'posts': posts,
        'followers_count': followers_count,
        'verification_requests': verification_requests,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/super_admin_church_detail.html', ctx)


@login_required
def super_admin_verifications(request):
    """List and filter church verification requests for super-admins."""
    if not request.user.is_superuser:
        messages.error(request, 'You do not have permission to access Super Admin.')
        return redirect('core:home')

    from django.utils import timezone
    from datetime import timedelta

    # Default to showing all statuses when no filter is applied
    status = request.GET.get('status', 'all')
    qs = ChurchVerificationRequest.objects.select_related('church', 'submitted_by', 'reviewed_by')
    if status and status != 'all':
        qs = qs.filter(status=status)
    qs = qs.order_by('-created_at')

    # Calculate church statistics for sidebar
    total_churches = Church.objects.count()
    verified_churches = Church.objects.filter(is_verified=True).count()
    pending_verifications = ChurchVerificationRequest.objects.filter(
        status=ChurchVerificationRequest.STATUS_PENDING
    ).count()

    # Church creation over time (last 30 days)
    church_creation_data = []
    church_creation_labels = []
    for i in range(29, -1, -1):  # Last 30 days
        day = timezone.now() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        count = Church.objects.filter(
            created_at__gte=day_start,
            created_at__lt=day_end
        ).count()
        
        church_creation_data.append(count)
        church_creation_labels.append(day.strftime('%b %d'))

    # Denomination distribution (all time) — include ALL choices, even if count is zero
    denom_counts = {
        row['denomination']: row['count']
        for row in Church.objects.values('denomination').annotate(count=Count('id'))
    }
    # Preserve the order defined in Church.DENOMINATION_CHOICES
    church_denom_labels = [label for key, label in Church.DENOMINATION_CHOICES]
    church_denom_data = [denom_counts.get(key, 0) for key, _ in Church.DENOMINATION_CHOICES]

    # Iligan-specific faith categories for clearer grouping
    catholic_codes = {'catholic'}
    protestant_evangelical_codes = {
        'protestant', 'uccp', 'baptist', 'methodist', 'presbyterian',
        'lutheran', 'pentecostal', 'evangelical'
    }
    other_christian_codes = {'iglesia_ni_cristo', 'adventist', 'mormon', 'jehovah', 'orthodox'}
    islam_codes = {'islam'}
    indigenous_codes = {'indigenous'}
    other_faith_codes = {'buddhism', 'hinduism'}

    group_def = [
        ('Roman Catholic', catholic_codes),
        ('Protestant & Evangelical', protestant_evangelical_codes),
        ('Other Christian', other_christian_codes),
        ('Islam', islam_codes),
        ('Indigenous Beliefs', indigenous_codes),
        ('Other Faiths', other_faith_codes),
    ]

    # Any remaining codes not explicitly mapped go to "Other Faiths"
    mapped_codes = set().union(*(codes for _, codes in group_def))
    remaining = set(denom_counts.keys()) - mapped_codes
    if remaining:
        # Accumulate their counts into Other Faiths
        extra_other = sum(denom_counts.get(code, 0) for code in remaining)
        if extra_other:
            # If Other Faiths already exists, we'll add to it later
            pass

    church_denom_group_labels = []
    church_denom_group_data = []
    other_index = None
    for label, codes in group_def:
        count = sum(denom_counts.get(code, 0) for code in codes)
        if label == 'Other Faiths':
            other_index = len(church_denom_group_labels)
        if count > 0:
            church_denom_group_labels.append(label)
            church_denom_group_data.append(count)

    # Add remaining unmapped counts into Other Faiths if present, else create it
    if remaining:
        extra_other = sum(denom_counts.get(code, 0) for code in remaining)
        if extra_other:
            if other_index is not None and other_index < len(church_denom_group_data):
                church_denom_group_data[other_index] += extra_other
            else:
                church_denom_group_labels.append('Other Faiths')
                church_denom_group_data.append(extra_other)

    # Calculate additional insights
    # Verification rate
    verification_rate = round((verified_churches / total_churches * 100) if total_churches > 0 else 0, 1)
    
    # Average churches created per day (last 30 days)
    total_created_30_days = sum(church_creation_data)
    avg_daily_growth = round(total_created_30_days / 30, 1)
    
    # Most popular category
    most_popular_category = 'N/A'
    if church_denom_group_data:
        max_count = max(church_denom_group_data)
        max_index = church_denom_group_data.index(max_count)
        most_popular_category = church_denom_group_labels[max_index]

    # Fetch churches for management table with filters
    search_query = request.GET.get('search', '')
    verified_filter = request.GET.get('verified', '')
    denom_filter = request.GET.get('denomination', '')
    
    churches_qs = Church.objects.select_related('owner').annotate(
        follower_total=Count('followers', distinct=True)
    )
    
    if search_query:
        churches_qs = churches_qs.filter(
            Q(name__icontains=search_query) | 
            Q(city__icontains=search_query) |
            Q(owner__email__icontains=search_query)
        )
    
    if verified_filter == 'verified':
        churches_qs = churches_qs.filter(is_verified=True)
    elif verified_filter == 'unverified':
        churches_qs = churches_qs.filter(is_verified=False)
    
    if denom_filter:
        churches_qs = churches_qs.filter(denomination=denom_filter)
    
    churches_qs = churches_qs.order_by('-created_at')
    
    # Paginate churches (5 per page)
    paginator = Paginator(churches_qs, 5)
    page_number = request.GET.get('page', 1)
    churches_page = paginator.get_page(page_number)

    ctx = {
        'active': 'super_admin_verifications',
        'page_title': 'Church Management',
        'requests': qs,
        'status_filter': status,
        'total_churches': total_churches,
        'verified_churches': verified_churches,
        'pending_verifications': pending_verifications,
        'church_creation_data': church_creation_data,
        'church_creation_labels': church_creation_labels,
        'church_denom_labels': church_denom_labels,
        'church_denom_data': church_denom_data,
        'church_denom_group_labels': church_denom_group_labels,
        'church_denom_group_data': church_denom_group_data,
        'verification_rate': verification_rate,
        'avg_daily_growth': avg_daily_growth,
        'most_popular_category': most_popular_category,
        'churches_page': churches_page,
        'search_query': search_query,
        'verified_filter': verified_filter,
        'denom_filter': denom_filter,
        'denomination_choices': Church.DENOMINATION_CHOICES,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/super_admin_verifications.html', ctx)


@login_required
def approve_verification(request, request_id):
    """Approve a verification request and mark the church as verified."""
    if not request.user.is_superuser:
        messages.error(request, 'You do not have permission to access Super Admin.')
        return redirect('core:home')

    ver_req = get_object_or_404(ChurchVerificationRequest, id=request_id)
    if request.method != 'POST':
        return redirect('core:super_admin_verifications')
    if ver_req.status != ChurchVerificationRequest.STATUS_PENDING:
        messages.info(request, 'This request has already been processed.')
        return redirect('core:super_admin_verifications')

    ver_req.status = ChurchVerificationRequest.STATUS_APPROVED
    ver_req.reviewed_by = request.user
    ver_req.notes = request.POST.get('notes', '')
    ver_req.save(update_fields=['status', 'reviewed_by', 'notes', 'updated_at'])

    # Mark church as verified
    church = ver_req.church
    if not church.is_verified:
        church.is_verified = True
        church.save(update_fields=['is_verified', 'updated_at'])
    messages.success(request, f'Verification for "{church.name}" approved.')
    return redirect('core:super_admin_verifications')


@login_required
def reject_verification(request, request_id):
    """Reject a verification request and keep the church unverified."""
    if not request.user.is_superuser:
        messages.error(request, 'You do not have permission to access Super Admin.')
        return redirect('core:home')

    ver_req = get_object_or_404(ChurchVerificationRequest, id=request_id)
    if request.method != 'POST':
        return redirect('core:super_admin_verifications')
    if ver_req.status != ChurchVerificationRequest.STATUS_PENDING:
        messages.info(request, 'This request has already been processed.')
        return redirect('core:super_admin_verifications')

    ver_req.status = ChurchVerificationRequest.STATUS_REJECTED
    ver_req.reviewed_by = request.user
    ver_req.notes = request.POST.get('notes', '') or 'Rejected'
    ver_req.save(update_fields=['status', 'reviewed_by', 'notes', 'updated_at'])

    # Ensure church remains unverified
    church = ver_req.church
    if church.is_verified:
        church.is_verified = False
        church.save(update_fields=['is_verified', 'updated_at'])
    messages.warning(request, f'Verification for "{church.name}" rejected.')
    return redirect('core:super_admin_verifications')

@login_required
def create_availability(request):
    """Create a new availability entry."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')
    
    if request.method == 'POST':
        form = AvailabilityForm(request.POST, church=church)
        if form.is_valid():
            try:
                availability = form.save()
                messages.success(request, f'Availability entry for {availability.date} has been created successfully!')
                return HttpResponseRedirect(reverse('core:manage_church') + '?tab=availability')
            except IntegrityError:
                # Handle duplicate entry - redirect to edit existing entry
                existing_availability = Availability.objects.get(church=church, date=form.cleaned_data['date'])
                messages.info(request, f'An availability entry for {form.cleaned_data["date"]} already exists. Redirecting to edit...')
                return HttpResponseRedirect(reverse('core:edit_availability', args=[existing_availability.id]))
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        # Check if date parameter is provided in the URL
        initial_data = {}
        date_param = request.GET.get('date')
        if date_param and date_param != '0':
            try:
                # Validate the date format
                from datetime import datetime, date
                parsed_date = datetime.strptime(date_param, '%Y-%m-%d').date()
                
                # Check if the date is in the past
                if parsed_date < date.today():
                    messages.error(request, 'Cannot create availability entries for past dates.')
                    return HttpResponseRedirect(reverse('core:manage_church') + '?tab=availability')
                
                initial_data['date'] = parsed_date
            except ValueError:
                pass  # Invalid date format, ignore
        
        form = AvailabilityForm(church=church, initial=initial_data)
    
    ctx = {
        'active': 'manage',
        'page_title': 'Create Availability Entry',
        'church': church,
        'form': form,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/create_availability.html', ctx)


@login_required
def edit_availability(request, availability_id):
    """Edit an availability entry."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')
    
    availability = get_object_or_404(Availability, id=availability_id, church=church)
    
    if request.method == 'POST':
        form = AvailabilityForm(request.POST, instance=availability, church=church)
        if form.is_valid():
            form.save()
            messages.success(request, f'Availability entry for {availability.date} has been updated successfully!')
            return HttpResponseRedirect(reverse('core:manage_church') + '?tab=availability')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = AvailabilityForm(instance=availability, church=church)
    
    ctx = {
        'active': 'manage',
        'page_title': f'Edit Availability for {availability.date}',
        'church': church,
        'availability': availability,
        'form': form,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/edit_availability.html', ctx)


@login_required
def delete_availability(request, availability_id):
    """Delete an availability entry."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')
    
    availability = get_object_or_404(Availability, id=availability_id, church=church)
    
    if request.method == 'POST':
        availability_date = availability.date
        availability.delete()
        messages.success(request, f'Availability entry for {availability_date} has been deleted successfully!')
        return HttpResponseRedirect(reverse('core:manage_church') + '?tab=availability')
    
    ctx = {
        'active': 'manage',
        'page_title': f'Delete Availability for {availability.date}',
        'church': church,
        'availability': availability,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/delete_availability.html', ctx)


@login_required
def bulk_availability(request):
    """Handle bulk availability management."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            messages.info(request, 'You don\'t own any churches. Create one to get started!')
            return redirect('core:create_church')
    except Church.DoesNotExist:
        messages.info(request, 'You don\'t own any churches. Create one to get started!')
        return redirect('core:create_church')
    
    if request.method == 'POST':
        form = AvailabilityBulkForm(request.POST)
        if form.is_valid():
            dates_str = form.cleaned_data['dates']
            action = form.cleaned_data['action']
            start_time = form.cleaned_data.get('start_time')
            end_time = form.cleaned_data.get('end_time')
            reason = form.cleaned_data.get('reason')
            notes = form.cleaned_data.get('notes')
            
            # Parse dates
            from datetime import datetime
            dates = [datetime.strptime(d.strip(), '%Y-%m-%d').date() for d in dates_str.split(',') if d.strip()]
            
            created_count = 0
            for date in dates:
                availability, created = Availability.objects.get_or_create(
                    church=church,
                    date=date,
                    defaults={
                        'type': 'closed_date' if action == 'close' else 'special_hours',
                        'is_closed': action == 'close',
                        'start_time': start_time if action == 'special_hours' else None,
                        'end_time': end_time if action == 'special_hours' else None,
                        'reason': reason,
                        'notes': notes,
                    }
                )
                if created:
                    created_count += 1
                else:
                    # Update existing entry
                    availability.type = 'closed_date' if action == 'close' else 'special_hours'
                    availability.is_closed = action == 'close'
                    if action == 'special_hours':
                        availability.start_time = start_time
                        availability.end_time = end_time
                    else:
                        availability.start_time = None
                        availability.end_time = None
                    availability.reason = reason
                    availability.notes = notes
                    availability.save()
            
            messages.success(request, f'Successfully updated availability for {created_count} dates!')
            return HttpResponseRedirect(reverse('core:manage_church') + '?tab=availability')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = AvailabilityBulkForm()
    
    ctx = {
        'active': 'manage',
        'page_title': 'Bulk Availability Management',
        'church': church,
        'form': form,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/bulk_availability.html', ctx)


@login_required
def create_post(request, church_slug):
    """Create a new post for a church."""
    church = get_object_or_404(Church, slug=church_slug, is_active=True)
    
    # Check if user owns this church
    if church.owner != request.user:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'message': 'You do not have permission to create posts for this church.'}, status=403)
        messages.error(request, 'You do not have permission to create posts for this church.')
        return redirect('core:church_detail', slug=church.slug)
    
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES, church=church)
        if form.is_valid():
            try:
                post = form.save(commit=False)
                post.church = church
                post.save()
                
                # Return JSON for AJAX requests
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': True,
                        'message': 'Post created successfully!',
                        'post': {
                            'id': post.id,
                            'content': post.content,
                            'post_type': post.post_type,
                            'image_url': post.image.url if post.image else None,
                            'created_at': post.created_at.strftime('%B %d, %Y at %I:%M %p')
                        }
                    })
                
                messages.success(request, 'Post created successfully!')
                return redirect('core:church_detail', slug=church.slug)
            except Exception as e:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'message': f'An error occurred: {str(e)}'}, status=500)
                messages.error(request, f'An error occurred: {str(e)}')
        else:
            # Return form errors for AJAX requests
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                errors = []
                for field, field_errors in form.errors.items():
                    for error in field_errors:
                        errors.append(f"{field}: {error}")
                return JsonResponse({'success': False, 'message': ' '.join(errors)}, status=400)
            messages.error(request, 'Please correct the errors below.')
    else:
        form = PostForm(church=church)
    
    ctx = {
        'page_title': f'Create Post - {church.name}',
        'church': church,
        'form': form,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/create_post.html', ctx)


@login_required
def edit_post(request, post_id):
    """Edit an existing post."""
    post = get_object_or_404(Post, id=post_id, is_active=True)
    
    # Check if user owns this church
    if post.church.owner != request.user:
        return JsonResponse({'success': False, 'message': 'You do not have permission to edit this post.'}, status=403)
    
    if request.method == 'POST':
        content = request.POST.get('content', '').strip()
        remove_image = request.POST.get('remove_image') == 'true'
        
        if not content:
            return JsonResponse({'success': False, 'message': 'Post content cannot be empty.'}, status=400)
        
        if len(content) > 1000:
            return JsonResponse({'success': False, 'message': 'Post content is too long (max 1000 characters).'}, status=400)
        
        try:
            # Update content
            post.content = content
            
            # Handle image updates
            if remove_image and post.image:
                # Remove current image
                post.image.delete()
                post.image = None
            
            # Handle new image upload
            if 'image' in request.FILES:
                new_image = request.FILES['image']
                # Validate image
                if new_image.size > 10 * 1024 * 1024:  # 10MB limit
                    return JsonResponse({'success': False, 'message': 'Image size must be less than 10MB.'}, status=400)
                
                # Remove old image if exists
                if post.image:
                    post.image.delete()
                
                post.image = new_image
            
            post.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Post updated successfully!',
                'post': {
                    'id': post.id,
                    'content': post.content,
                    'image_url': post.image.url if post.image else None,
                    'updated_at': post.updated_at.strftime('%B %d, %Y at %I:%M %p')
                }
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'message': 'An error occurred while updating the post.'}, status=500)
    
    elif request.method == 'GET':
        # Return post data for editing
        return JsonResponse({
            'success': True,
            'post': {
                'id': post.id,
                'content': post.content,
                'image_url': post.image.url if post.image else None,
                'created_at': post.created_at.strftime('%B %d, %Y at %I:%M %p')
            }
        })
    
    return JsonResponse({'success': False, 'message': 'Invalid request method.'}, status=405)


# Notification Views
@login_required
def notifications(request):
    """Display user's notifications page."""
    
    # Get filter parameters (category-based)
    filter_type = request.GET.get('type', 'all')
    # Backward compatibility: also respect unread=true query param
    unread_only = request.GET.get('unread', 'false').lower() == 'true' or filter_type == 'unread'

    # Category groupings for common filters
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

    # Base queryset
    base_queryset = Notification.objects.filter(user=request.user).select_related('booking', 'church')

    # Apply filters
    if unread_only:
        base_queryset = base_queryset.filter(is_read=False)

    if filter_type in category_map:
        base_queryset = base_queryset.filter(notification_type__in=category_map[filter_type])

    # Get notifications with limit
    notifications_qs = base_queryset[:50]

    # Get counts for categories (fresh queryset)
    all_notifications = Notification.objects.filter(user=request.user)
    counts = {
        'all': all_notifications.count(),
        'unread': all_notifications.filter(is_read=False).count(),
        'bookings': all_notifications.filter(notification_type__in=category_map['bookings']).count(),
        'church': all_notifications.filter(notification_type__in=category_map['church']).count(),
        'follows': all_notifications.filter(notification_type__in=category_map['follows']).count(),
    }

    ctx = {
        'active': 'notifications',
        'page_title': 'Notifications',
        'notifications': notifications_qs,
        'counts': counts,
        'filter_type': filter_type,
        'unread_only': unread_only,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/notifications.html', ctx)


@login_required
def notification_dropdown(request):
    """AJAX endpoint for notification dropdown content."""
    from .notifications import get_user_notifications, get_user_unread_count
    
    # Get recent notifications (both read and unread) for display
    notifications = get_user_notifications(request.user, limit=20, unread_only=False)
    unread_count = get_user_unread_count(request.user)
    
    # Compute a target URL for each notification
    def _target_url(n):
        try:
            # Booking-related
            if n.notification_type == Notification.TYPE_BOOKING_REQUESTED:
                # If current user is the church owner -> manage appointments tab
                if n.church and n.church.owner_id == request.user.id:
                    return reverse('core:manage_church') + '?tab=appointments'
                # Fallback for any other case
                return reverse('core:appointments')
            elif n.notification_type in (
                Notification.TYPE_BOOKING_REVIEWED,
                Notification.TYPE_BOOKING_APPROVED,
                Notification.TYPE_BOOKING_DECLINED,
                Notification.TYPE_BOOKING_CANCELED,
                Notification.TYPE_BOOKING_COMPLETED,
            ):
                # Requester views their appointments
                return reverse('core:appointments')
            # Church verification/admin notifications
            elif n.notification_type in (
                Notification.TYPE_CHURCH_APPROVED,
                Notification.TYPE_CHURCH_DECLINED,
            ):
                return reverse('core:manage_church') + '?tab=settings'
            # Fallbacks
            if n.church and getattr(n.church, 'slug', None):
                return reverse('core:church_detail', args=[n.church.slug])
        except Exception:
            pass
        return reverse('core:notifications')

    dropdown_items = [
        {'notification': n, 'url': _target_url(n)}
        for n in notifications
    ]
    
    return render(request, 'core/partials/notification_dropdown.html', {
        'dropdown_items': dropdown_items,
        'unread_count': unread_count,
    })


@login_required
def mark_notification_read(request, notification_id):
    """Mark a specific notification as read."""
    from .notifications import mark_notification_as_read
    
    success = mark_notification_as_read(notification_id, request.user)
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': success})
    else:
        if success:
            messages.success(request, 'Notification marked as read.')
        else:
            messages.error(request, 'Notification not found.')
        return redirect('core:notifications')


@login_required
def mark_all_notifications_read(request):
    """Mark all notifications as read for the current user."""
    from .notifications import mark_all_notifications_as_read
    
    count = mark_all_notifications_as_read(request.user)
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'success': True,
            'count': count,
            'message': f'{count} notifications marked as read.'
        })
    else:
        messages.success(request, f'{count} notifications marked as read.')
        return redirect('core:notifications')


def notification_count(request):
    """AJAX endpoint to get unread notification count."""
    if not request.user.is_authenticated:
        return JsonResponse({'count': 0, 'authenticated': False})
    
    try:
        from .notifications import get_user_unread_count
        count = get_user_unread_count(request.user)
        return JsonResponse({'count': count, 'authenticated': True})
    except Exception as e:
        # Log the error and return a safe response
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error getting notification count for user {request.user}: {str(e)}")
        return JsonResponse({'count': 0, 'authenticated': True, 'error': 'Failed to fetch count'})


# Service API - Test endpoint
def api_test(request):
    """Simple test endpoint to verify API routing works."""
    return JsonResponse({
        'success': True,
        'message': 'API is working!',
        'user': str(request.user),
        'authenticated': request.user.is_authenticated
    })

def api_get_service(request, service_id):
    """API endpoint to fetch service data for booking modal."""
    # Add CORS headers for debugging
    from django.http import JsonResponse
    
    # Always return JSON, even for errors
    try:
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return JsonResponse({
                'success': False,
                'error': 'Authentication required.'
            }, status=401)
            
        service = get_object_or_404(BookableService, id=service_id, is_active=True)
        church = service.church
        
        # Check if church is verified (required for bookings)
        if not church.is_verified:
            return JsonResponse({
                'success': False,
                'error': 'This church is not yet verified and cannot accept appointment requests.'
            }, status=400)
        
        # Prepare service data
        service_data = {
            'id': service.id,
            'name': service.name,
            'description': service.description or 'No description provided.',
            'duration': service.duration_display,
            'price': service.price_display,
            'advance_booking_days': service.advance_booking_days,
            'is_free': service.is_free,
            'currency': service.currency,
            'raw_price': float(service.price) if service.price else 0.0,
            'duration_minutes': service.duration
        }
        
        # Prepare church data
        church_data = {
            'id': church.id,
            'name': church.name,
            'slug': church.slug,
            'is_verified': church.is_verified
        }
        
        return JsonResponse({
            'success': True,
            'service': service_data,
            'church': church_data
        }, status=200)
        
    except BookableService.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Service not found or is not active.'
        }, status=404)
        
    except Exception as e:
        logger.error(f'API Service fetch error: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': 'An error occurred while fetching service data.'
        }, status=500)


def api_get_church_services(request, church_id):
    """API endpoint to fetch all bookable services for a specific church."""
    try:
        church = get_object_or_404(Church, id=church_id, is_active=True)
        
        # Get all active bookable services for this church
        services = church.bookable_services.filter(is_active=True).prefetch_related('service_images').order_by('name')
        
        services_data = []
        for service in services:
            # Get the first image if available
            images = service.get_images()
            image_url = images[0].image.url if images else None
            
            services_data.append({
                'id': service.id,
                'name': service.name,
                'description': service.description or 'No description provided.',
                'duration': service.duration_display,
                'price': service.price_display,
                'is_free': service.is_free,
                'currency': service.currency,
                'image_url': image_url,
                'advance_booking_days': service.advance_booking_days,
            })
        
        return JsonResponse({
            'success': True,
            'church_id': church.id,
            'church_name': church.name,
            'services': services_data,
            'total': len(services_data)
        }, status=200)
        
    except Church.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Church not found.'
        }, status=404)
        
    except Exception as e:
        logger.error(f'API Church Services fetch error: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': 'An error occurred while fetching church services.'
        }, status=500)


@login_required
def toggle_post_like(request, post_id):
    """AJAX endpoint to toggle like on a post."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=405)
    
    try:
        post = get_object_or_404(Post, id=post_id, is_active=True)
        
        # Check if user already liked the post
        like, created = PostLike.objects.get_or_create(
            user=request.user,
            post=post
        )
        
        if created:
            # User liked the post
            action = 'liked'
            message = 'Post liked'
            # Log activity
            from .models import UserInteraction
            UserInteraction.log_activity(
                user=request.user,
                activity_type=UserInteraction.ACTIVITY_POST_LIKE,
                content_object=post,
                request=request
            )
        else:
            # User already liked, so unlike it
            like.delete()
            action = 'unliked'
            message = 'Post unliked'
            # Log activity
            from .models import UserInteraction
            UserInteraction.log_activity(
                user=request.user,
                activity_type=UserInteraction.ACTIVITY_POST_UNLIKE,
                content_object=post,
                request=request
            )
        
        return JsonResponse({
            'success': True,
            'action': action,
            'message': message,
            'like_count': post.like_count,
            'is_liked': post.is_liked_by(request.user)
        })
        
    except Post.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Post not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': 'An error occurred'}, status=500)


@login_required
def add_post_comment(request, post_id):
    """AJAX endpoint to add a comment to a post."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=405)
    
    try:
        post = get_object_or_404(Post, id=post_id, is_active=True)
        content = request.POST.get('content', '').strip()
        parent_id = request.POST.get('parent_id')
        
        if not content:
            return JsonResponse({'success': False, 'message': 'Comment content is required'}, status=400)
        
        if len(content) > 500:
            return JsonResponse({'success': False, 'message': 'Comment is too long (max 500 characters)'}, status=400)
        
        # Handle reply to another comment
        parent_comment = None
        if parent_id:
            try:
                parent_comment = PostComment.objects.get(id=parent_id, post=post, is_active=True)
            except PostComment.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Parent comment not found'}, status=404)
        
        # Create the comment
        comment = PostComment.objects.create(
            user=request.user,
            post=post,
            content=content,
            parent=parent_comment
        )
        
        # Log activity
        from .models import UserInteraction
        UserInteraction.log_activity(
            user=request.user,
            activity_type=UserInteraction.ACTIVITY_POST_COMMENT,
            content_object=post,
            metadata={
                'comment_id': comment.id,
                'is_reply': parent_comment is not None,
                'parent_comment_id': parent_comment.id if parent_comment else None
            },
            request=request
        )
        
        # Get user display data
        user_display_name, user_initial = get_user_display_data(request.user, getattr(request.user, 'profile', None))
        
        return JsonResponse({
            'success': True,
            'message': 'Comment added successfully',
            'comment': {
                'id': comment.id,
                'content': comment.content,
                'user_name': user_display_name,
                'user_initial': user_initial,
                'created_at': comment.created_at.isoformat(),
                'is_reply': comment.is_reply,
                'parent_id': parent_comment.id if parent_comment else None
            },
            'comment_count': post.comment_count
        })
        
    except Post.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Post not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': 'An error occurred'}, status=500)


@login_required
def get_post_comments(request, post_id):
    """AJAX endpoint to get comments for a post."""
    try:
        post = get_object_or_404(Post, id=post_id, is_active=True)
        
        # Get all top-level comments (not replies)
        comments = PostComment.objects.filter(
            post=post, 
            is_active=True, 
            parent__isnull=True
        ).select_related('user', 'user__profile').order_by('created_at')
        
        comments_data = []
        for comment in comments:
            user_display_name, user_initial = get_user_display_data(comment.user, getattr(comment.user, 'profile', None))
            
            # Get replies for this comment
            replies = comment.replies.filter(is_active=True).select_related('user', 'user__profile').order_by('created_at')
            replies_data = []
            
            for reply in replies:
                reply_user_display_name, reply_user_initial = get_user_display_data(reply.user, getattr(reply.user, 'profile', None))
                replies_data.append({
                    'id': reply.id,
                    'content': reply.content,
                    'user_name': reply_user_display_name,
                    'user_initial': reply_user_initial,
                    'created_at': reply.created_at.isoformat(),
                    'is_reply': True,
                    'parent_id': comment.id
                })
            
            comments_data.append({
                'id': comment.id,
                'content': comment.content,
                'user_name': user_display_name,
                'user_initial': user_initial,
                'created_at': comment.created_at.isoformat(),
                'is_reply': False,
                'replies': replies_data,
                'reply_count': len(replies_data)
            })
        
        return JsonResponse({
            'success': True,
            'comments': comments_data,
            'comment_count': len(comments_data)
        })
        
    except Post.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Post not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': 'An error occurred'}, status=500)


@login_required 
def share_post(request, post_id):
    """AJAX endpoint to handle post sharing (future implementation for social sharing)."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=405)
    
    try:
        post = get_object_or_404(Post, id=post_id, is_active=True)
        
        # For now, just return the share URL
        # In the future, this could track share counts or create notifications
        share_url = request.build_absolute_uri(f'/posts/{post.id}/')
        
        return JsonResponse({
            'success': True,
            'message': 'Share link generated',
            'share_url': share_url,
            'post_title': f"{post.church.name}'s post"
        })
        
    except Post.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Post not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': 'An error occurred'}, status=500)


def track_post_view(request, post_id):
    """AJAX endpoint to track post views."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=405)
    
    try:
        post = get_object_or_404(Post, id=post_id, is_active=True)
        
        # Get client info
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
        user = request.user if request.user.is_authenticated else None
        
        # Check if this view should be counted (prevent spam)
        should_count = True
        
        # For authenticated users, check if they viewed this post in the last hour
        if user:
            recent_view = PostView.objects.filter(
                post=post,
                user=user,
                viewed_at__gte=timezone.now() - timezone.timedelta(hours=1)
            ).exists()
            should_count = not recent_view
        else:
            # For anonymous users, check by IP in the last hour
            recent_view = PostView.objects.filter(
                post=post,
                ip_address=ip_address,
                viewed_at__gte=timezone.now() - timezone.timedelta(hours=1)
            ).exists()
            should_count = not recent_view
        
        if should_count:
            # Create view record
            PostView.objects.create(
                post=post,
                user=user,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # Increment post view count
            post.view_count = F('view_count') + 1
            post.save(update_fields=['view_count'])
            
            # Refresh to get updated count
            post.refresh_from_db()
            
            # Log activity for authenticated users
            if user:
                from .models import UserInteraction
                UserInteraction.log_activity(
                    user=user,
                    activity_type=UserInteraction.ACTIVITY_POST_VIEW,
                    content_object=post,
                    request=request
                )
        
        return JsonResponse({
            'success': True,
            'view_count': post.view_count,
            'counted': should_count
        })
        
    except Post.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Post not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


def get_client_ip(request):
    """Helper function to get client IP address."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


@login_required
@require_POST
def toggle_post_bookmark(request, post_id):
    """Toggle bookmark status for a post via AJAX."""
    try:
        post = get_object_or_404(Post, id=post_id)
        
        # Check if user already bookmarked this post
        bookmark = PostBookmark.objects.filter(user=request.user, post=post).first()
        
        if bookmark:
            # Remove bookmark
            bookmark.delete()
            is_bookmarked = False
            action = 'unbookmarked'
            message = 'Post removed from saved posts'
            # Log activity
            from .models import UserInteraction
            UserInteraction.log_activity(
                user=request.user,
                activity_type=UserInteraction.ACTIVITY_POST_UNBOOKMARK,
                content_object=post,
                request=request
            )
        else:
            # Add bookmark
            PostBookmark.objects.create(user=request.user, post=post)
            is_bookmarked = True
            action = 'bookmarked'
            message = 'Post saved successfully!'
            # Log activity
            from .models import UserInteraction
            UserInteraction.log_activity(
                user=request.user,
                activity_type=UserInteraction.ACTIVITY_POST_BOOKMARK,
                content_object=post,
                request=request
            )
        
        # Debug logging
        print(f"User {request.user.username} {action} post {post.id}")
        
        return JsonResponse({
            'success': True,
            'is_bookmarked': is_bookmarked,
            'bookmark_count': post.bookmark_count,
            'action': action,
            'message': message
        })
        
    except Post.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Post not found'}, status=404)
    except Exception as e:
        print(f"Bookmark error: {str(e)}")
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@login_required
def super_admin_user_activities(request):
    """Super Admin page to display user activity registration including verification codes, IP addresses, and device info."""
    if not request.user.is_superuser:
        messages.error(request, 'You do not have permission to access Super Admin.')
        return redirect('dashboard')

    # Import the models from accounts
    from accounts.models import UserActivity, EmailVerification

    # Get filter parameters
    activity_type_filter = request.GET.get('activity_type', '')
    success_filter = request.GET.get('success', '')
    days_filter = request.GET.get('days', '30')  # Default to 30 days
    search_query = request.GET.get('search', '')
    
    # Convert days filter to integer
    try:
        days = int(days_filter) if days_filter else 30
    except ValueError:
        days = 30

    # Base queryset for user activities
    activities_qs = UserActivity.objects.select_related('user').all()
    
    # Apply date filter
    if days > 0:
        from datetime import timedelta
        cutoff_date = timezone.now() - timedelta(days=days)
        activities_qs = activities_qs.filter(created_at__gte=cutoff_date)
    
    # Apply activity type filter
    if activity_type_filter:
        activities_qs = activities_qs.filter(activity_type=activity_type_filter)
    
    # Apply success filter
    if success_filter:
        if success_filter == 'success':
            activities_qs = activities_qs.filter(success=True)
        elif success_filter == 'failed':
            activities_qs = activities_qs.filter(success=False)
    
    # Apply search filter
    if search_query:
        activities_qs = activities_qs.filter(
            Q(email__icontains=search_query) |
            Q(user__username__icontains=search_query) |
            Q(user__first_name__icontains=search_query) |
            Q(user__last_name__icontains=search_query) |
            Q(ip_address__icontains=search_query) |
            Q(verification_code__icontains=search_query)
        )

    # Get email verifications with additional tracking info
    verifications_qs = EmailVerification.objects.all()
    
    # Apply date filter to verifications
    if days > 0:
        verifications_qs = verifications_qs.filter(created_at__gte=cutoff_date)
    
    # Apply search filter to verifications
    if search_query:
        verifications_qs = verifications_qs.filter(
            Q(email__icontains=search_query) |
            Q(code__icontains=search_query) |
            Q(ip_address__icontains=search_query)
        )

    # Pagination for activities
    activities_paginator = Paginator(activities_qs, 50)  # 50 per page
    activities_page = request.GET.get('activities_page', 1)
    try:
        activities = activities_paginator.page(activities_page)
    except:
        activities = activities_paginator.page(1)

    # Pagination for verifications  
    verifications_paginator = Paginator(verifications_qs, 50)  # 50 per page
    verifications_page = request.GET.get('verifications_page', 1)
    try:
        verifications = verifications_paginator.page(verifications_page)
    except:
        verifications = verifications_paginator.page(1)

    # Activity type choices for filter dropdown
    activity_type_choices = UserActivity.ACTIVITY_TYPE_CHOICES

    # Statistics
    total_activities = activities_qs.count()
    total_verifications = verifications_qs.count()
    
    # Success/failure stats for activities
    success_count = activities_qs.filter(success=True).count()
    failed_count = activities_qs.filter(success=False).count()
    
    # Verification stats
    used_verifications = verifications_qs.filter(is_used=True).count()
    unused_verifications = verifications_qs.filter(is_used=False).count()
    expired_verifications = verifications_qs.filter(expires_at__lt=timezone.now()).count()

    # Recent activity breakdown
    activity_breakdown = {}
    for activity_type, display_name in activity_type_choices:
        count = activities_qs.filter(activity_type=activity_type).count()
        activity_breakdown[display_name] = count

    ctx = {
        'active': 'super_admin_activities',
        'page_title': 'User Activity Registration',
        'activities': activities,
        'verifications': verifications,
        'activity_type_choices': activity_type_choices,
        'now': timezone.now(),
        'current_filters': {
            'activity_type': activity_type_filter,
            'success': success_filter,
            'days': days_filter,
            'search': search_query,
        },
        'stats': {
            'total_activities': total_activities,
            'total_verifications': total_verifications,
            'success_count': success_count,
            'failed_count': failed_count,
            'used_verifications': used_verifications,
            'unused_verifications': unused_verifications,
            'expired_verifications': expired_verifications,
        },
        'activity_breakdown': activity_breakdown,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/super_admin_user_activities.html', ctx)


# Service Review Views

@login_required
def create_service_review(request, service_id):
    """Create a review for a service (only available to users with completed bookings)."""
    from .models import ServiceReview, BookableService, UserInteraction, Booking
    from django.http import JsonResponse
    
    service = get_object_or_404(BookableService, id=service_id, is_active=True)
    church = service.church
    
    # Check if user has any completed bookings for this service
    completed_bookings = Booking.objects.filter(
        user=request.user,
        service=service,
        status=Booking.STATUS_COMPLETED
    ).order_by('-updated_at')
    
    if not completed_bookings.exists():
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': False,
                'message': 'You can only review services after completing a booking.'
            })
        messages.error(request, 'You can only review services after completing a booking.')
        return redirect('core:church_detail', slug=church.slug)
    
    # Check if user has already reviewed this service
    if service.has_user_reviewed(request.user):
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': False,
                'message': 'You have already reviewed this service.'
            })
        messages.warning(request, 'You have already reviewed this service.')
        return redirect('core:church_detail', slug=church.slug)
    
    if request.method == 'POST':
        try:
            # Get form data
            rating = int(request.POST.get('rating', 0))
            title = request.POST.get('title', '').strip()
            comment = request.POST.get('comment', '').strip()
            
            # Optional ratings
            staff_rating = request.POST.get('staff_rating')
            facility_rating = request.POST.get('facility_rating')
            value_rating = request.POST.get('value_rating')
            
            is_anonymous = request.POST.get('is_anonymous') == 'on'
            
            # Basic validation
            if not rating or rating < 1 or rating > 5:
                error_msg = 'Please provide a rating between 1 and 5 stars.'
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'message': error_msg})
                messages.error(request, error_msg)
                return redirect('core:church_detail', slug=church.slug)
            
            if not title or len(title) < 5:
                error_msg = 'Please provide a review title with at least 5 characters.'
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'message': error_msg})
                messages.error(request, error_msg)
                return redirect('core:church_detail', slug=church.slug)
            
            if not comment or len(comment) < 10:
                error_msg = 'Please provide a review comment with at least 10 characters.'
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'message': error_msg})
                messages.error(request, error_msg)
                return redirect('core:church_detail', slug=church.slug)
            
            # Use the most recent completed booking for this review
            booking = completed_bookings.first()
            
            # Create review
            review_data = {
                'user': request.user,
                'service': service,
                'church': church,
                'booking': booking,
                'rating': rating,
                'title': title,
                'comment': comment,
                'is_anonymous': is_anonymous,
            }
            
            # Add optional ratings if provided
            if staff_rating:
                try:
                    review_data['staff_rating'] = int(staff_rating)
                except ValueError:
                    pass
            
            if facility_rating:
                try:
                    review_data['facility_rating'] = int(facility_rating)
                except ValueError:
                    pass
            
            if value_rating:
                try:
                    review_data['value_rating'] = int(value_rating)
                except ValueError:
                    pass
            
            review = ServiceReview.objects.create(**review_data)
            
            # Log activity
            UserInteraction.log_activity(
                user=request.user,
                activity_type=UserInteraction.ACTIVITY_SERVICE_REVIEW,
                content_object=review,
                metadata={
                    'service_name': service.name,
                    'church_name': church.name,
                    'rating': rating,
                    'title': title,
                },
                request=request
            )
            
            # Handle AJAX request
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.content_type == 'application/json':
                return JsonResponse({
                    'success': True,
                    'message': f'Thank you for your review of {service.name}!'
                })
            
            messages.success(request, f'Thank you for your review of {service.name}!')
            return redirect('core:service_reviews', service_id=service.id)
            
        except Exception as e:
            error_message = f'Error creating review: {str(e)}'
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': error_message
                })
            messages.error(request, error_message)
            return redirect('core:church_detail', slug=church.slug)
    
    return redirect('core:church_detail', slug=church.slug)


@login_required
def service_reviews(request, service_id):
    """View all reviews for a specific service."""
    from .models import ServiceReview, BookableService
    
    service = get_object_or_404(BookableService, id=service_id, is_active=True)
    church = service.church
    
    # Get all reviews for this service
    reviews = service.reviews.filter(is_active=True).select_related(
        'user', 'booking'
    ).order_by('-created_at')
    
    # Check if current user has reviewed this service and can review
    user_review = None
    can_review = False
    completed_bookings = None
    if request.user.is_authenticated:
        try:
            user_review = reviews.filter(user=request.user).first()
            can_review = service.can_user_review(request.user)
            if can_review:
                completed_bookings = service.get_user_completed_bookings(request.user)
        except:
            pass
    
    # Rating statistics
    total_reviews = reviews.count()
    average_rating = service.average_rating
    rating_distribution = service.rating_distribution
    
    ctx = {
        'page_title': f'{service.name} Reviews',
        'service': service,
        'church': church,
        'reviews': reviews,
        'user_review': user_review,
        'can_review': can_review,
        'completed_bookings': completed_bookings,
        'total_reviews': total_reviews,
        'average_rating': average_rating,
        'rating_distribution': rating_distribution,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/service_reviews.html', ctx)


@login_required
def toggle_review_helpful(request, review_id):
    """Toggle helpful vote for a review (AJAX)."""
    from .models import ServiceReview, ServiceReviewHelpful
    from django.http import JsonResponse
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST required'})
    
    try:
        review = get_object_or_404(ServiceReview, id=review_id, is_active=True)
        
        # Check if user has already voted
        helpful_vote, created = ServiceReviewHelpful.objects.get_or_create(
            user=request.user,
            review=review
        )
        
        if not created:
            # Remove vote
            helpful_vote.delete()
            is_helpful = False
            action = 'removed'
        else:
            # Add vote
            is_helpful = True
            action = 'added'
        
        # Update helpful votes count
        review.helpful_votes = review.helpful_votes_records.count()
        review.save(update_fields=['helpful_votes'])
        
        return JsonResponse({
            'success': True,
            'is_helpful': is_helpful,
            'helpful_count': review.helpful_votes,
            'action': action,
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


def service_images_api(request, service_id):
    """API endpoint to fetch all images for a service"""
    try:
        service = get_object_or_404(BookableService, id=service_id)
        
        # Get all images for the service
        images = []
        
        # Add primary image if exists
        if service.get_primary_image():
            images.append({
                'url': service.get_primary_image().image.url,
                'is_primary': True
            })
        
        # Add all other service images
        for service_image in service.service_images.all().order_by('order', 'created_at'):
            # Skip if this is already the primary image
            if service.get_primary_image() and service_image == service.get_primary_image():
                continue
                
            images.append({
                'url': service_image.image.url,
                'is_primary': False
            })
        
        # Fallback to single service image if no ServiceImage objects exist
        if not images and service.image:
            images.append({
                'url': service.image.url,
                'is_primary': True
            })
        
        return JsonResponse({
            'success': True,
            'service_name': service.name,
            'images': images,
            'total_count': len(images)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


def api_get_church_availability(request, church_id):
    """API endpoint to fetch church availability (closed dates) for booking modal."""
    from django.http import JsonResponse
    
    try:
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return JsonResponse({
                'success': False,
                'error': 'Authentication required.'
            }, status=401)
            
        church = get_object_or_404(Church, id=church_id, is_verified=True)
        
        # Get all availability entries for the church
        # Only get future dates (today and onwards)
        from datetime import date
        today = date.today()
        availability_entries = church.availability.filter(date__gte=today).order_by('date')
        
        # Prepare availability data
        closed_dates = []
        special_hours = []
        
        for entry in availability_entries:
            date_str = entry.date.strftime('%Y-%m-%d')
            entry_data = {
                'date': date_str,
                'reason': entry.reason or '',
                'notes': entry.notes or ''
            }
            
            if entry.is_closed:
                closed_dates.append(entry_data)
            else:
                entry_data.update({
                    'start_time': entry.start_time.strftime('%H:%M') if entry.start_time else '',
                    'end_time': entry.end_time.strftime('%H:%M') if entry.end_time else ''
                })
                special_hours.append(entry_data)
        
        return JsonResponse({
            'success': True,
            'church_id': church.id,
            'church_name': church.name,
            'closed_dates': closed_dates,
            'special_hours': special_hours
        }, status=200)
        
    except Church.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Church not found or is not verified.'
        }, status=404)
        
    except Exception as e:
        logger.error(f'API Church availability fetch error: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': 'An error occurred while fetching church availability data.'
        }, status=500)


@login_required
@require_POST
def dashboard_create_post(request):
    """Create a new post from the dashboard for one of user's owned churches."""
    import json
    
    try:
        # Get form data
        church_id = request.POST.get('church_id')
        content = request.POST.get('content', '').strip()
        image = request.FILES.get('image')
        post_type = request.POST.get('post_type', 'general')
        
        # Get event-specific fields
        event_title = request.POST.get('event_title', '').strip()
        event_start_date = request.POST.get('event_start_date')
        event_end_date = request.POST.get('event_end_date')
        event_location = request.POST.get('event_location', '').strip()
        max_participants = request.POST.get('max_participants')
        
        # Get donation fields
        enable_donation = request.POST.get('enable_donation') == 'on' or request.POST.get('enable_donation') == 'true'
        donation_goal = request.POST.get('donation_goal', '').strip()
        
        if not church_id:
            return JsonResponse({'success': False, 'message': 'Church selection is required.'}, status=400)
        
        if not content:
            return JsonResponse({'success': False, 'message': 'Post content cannot be empty.'}, status=400)
        
        # Validate content length
        if len(content) > 1000:
            return JsonResponse({'success': False, 'message': 'Post content is too long (max 1000 characters).'}, status=400)
        
        # Validate event post fields
        if post_type == 'event':
            if not event_title:
                return JsonResponse({'success': False, 'message': 'Event title is required for event posts.'}, status=400)
            if not event_start_date:
                return JsonResponse({'success': False, 'message': 'Event start date is required for event posts.'}, status=400)
            if not event_end_date:
                return JsonResponse({'success': False, 'message': 'Event end date is required for event posts.'}, status=400)
        
        # Get the church and verify ownership
        try:
            church = Church.objects.get(id=church_id, is_active=True)
        except Church.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Church not found.'}, status=404)
        
        # Check if user owns this church
        if church.owner != request.user:
            return JsonResponse({'success': False, 'message': 'You do not have permission to post for this church.'}, status=403)
        
        # Validate PayPal email is set if donations are enabled
        if enable_donation and not church.paypal_email:
            return JsonResponse({
                'success': False,
                'message': 'Please set up your PayPal email in Church Profile settings before enabling donations. This is required to receive donation payments directly.'
            }, status=400)
        
        # Create the post with all fields
        post_data = {
            'church': church,
            'content': content,
            'post_type': post_type,
        }
        
        # Add image if provided
        if image:
            post_data['image'] = image
        
        # Add event-specific fields if it's an event post
        if post_type == 'event':
            post_data['event_title'] = event_title
            post_data['event_start_date'] = event_start_date
            post_data['event_end_date'] = event_end_date
            if event_location:
                post_data['event_location'] = event_location
            if max_participants:
                try:
                    post_data['max_participants'] = int(max_participants)
                except (ValueError, TypeError):
                    pass
        
        # Add donation fields
        post_data['enable_donation'] = enable_donation
        if enable_donation and donation_goal:
            try:
                post_data['donation_goal'] = float(donation_goal)
            except (ValueError, TypeError):
                pass
        
        post = Post.objects.create(**post_data)
        
        # Return success response with post data
        return JsonResponse({
            'success': True,
            'message': 'Post created successfully!',
            'post': {
                'id': post.id,
                'content': post.content,
                'post_type': post.post_type,
                'church_name': church.name,
                'time_ago': post.time_ago,
                'created_at': post.created_at.isoformat(),
            }
        })
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Dashboard post creation error: {str(e)}')
        return JsonResponse({'success': False, 'message': 'An error occurred while creating the post.'}, status=500)


@login_required
@require_POST
def report_post(request, post_id):
    """Report a post for inappropriate content."""
    from .models import PostReport
    
    try:
        post = get_object_or_404(Post, id=post_id)
        
        # Check if user already reported this post
        if PostReport.objects.filter(user=request.user, post=post).exists():
            return JsonResponse({
                'success': False,
                'message': 'You have already reported this post.'
            }, status=400)
        
        # Get report data
        reason = request.POST.get('reason')
        description = request.POST.get('description', '').strip()
        
        if not reason:
            return JsonResponse({
                'success': False,
                'message': 'Please select a reason for reporting.'
            }, status=400)
        
        if not description:
            return JsonResponse({
                'success': False,
                'message': 'Please provide additional details.'
            }, status=400)
        
        # Create the report
        report = PostReport.objects.create(
            user=request.user,
            post=post,
            reason=reason,
            description=description
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Thank you for your report. We will review it shortly.'
        })
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Post report error: {str(e)}')
        return JsonResponse({
            'success': False,
            'message': 'An error occurred while submitting your report.'
        }, status=500)


@login_required
@require_POST
def delete_post(request, post_id):
    """Delete a post."""
    try:
        post = get_object_or_404(Post, id=post_id)
        
        # Check if user owns the church
        if post.church.owner != request.user:
            return JsonResponse({
                'success': False,
                'message': 'You do not have permission to delete this post.'
            }, status=403)
        
        # Store post info before deletion
        post_type = post.post_type
        
        # Delete the post
        post.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'{"Event" if post_type == "event" else "Post"} deleted successfully.'
        })
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Post deletion error: {str(e)}')
        return JsonResponse({
            'success': False,
            'message': 'An error occurred while deleting the post.'
        }, status=500)


@login_required
def get_post_data(request, post_id):
    """Get post data for editing."""
    try:
        post = get_object_or_404(Post, id=post_id)
        
        # Check if user owns the church
        if post.church.owner != request.user:
            return JsonResponse({
                'success': False,
                'message': 'You do not have permission to edit this post.'
            }, status=403)
        
        return JsonResponse({
            'success': True,
            'post': {
                'id': post.id,
                'content': post.content,
                'post_type': post.post_type,
                'event_title': post.event_title or '',
                'event_start_date': post.event_start_date.isoformat() if post.event_start_date else '',
                'event_end_date': post.event_end_date.isoformat() if post.event_end_date else '',
                'event_start_time': post.event_start_time.strftime('%H:%M') if post.event_start_time else '',
                'event_end_time': post.event_end_time.strftime('%H:%M') if post.event_end_time else '',
                'event_location': post.event_location or '',
                'has_image': bool(post.image),
                'image_url': post.image.url if post.image else None,
            }
        })
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Get post data error: {str(e)}')
        return JsonResponse({
            'success': False,
            'message': 'An error occurred while fetching post data.'
        }, status=500)


@login_required
@require_POST
def update_post(request, post_id):
    """Update an existing post."""
    try:
        post = get_object_or_404(Post, id=post_id)
        
        # Check if user owns the church
        if post.church.owner != request.user:
            return JsonResponse({
                'success': False,
                'message': 'You do not have permission to edit this post.'
            }, status=403)
        
        # Get form data
        content = request.POST.get('content', '').strip()
        post_type = request.POST.get('post_type', 'general')
        
        if not content:
            return JsonResponse({
                'success': False,
                'message': 'Post content cannot be empty.'
            }, status=400)
        
        # Validate content length
        if len(content) > 1000:
            return JsonResponse({
                'success': False,
                'message': 'Post content is too long (max 1000 characters).'
            }, status=400)
        
        # Update basic fields
        post.content = content
        post.post_type = post_type
        
        # Handle event fields
        if post_type == 'event':
            event_title = request.POST.get('event_title', '').strip()
            event_start_date = request.POST.get('event_start_date')
            
            if not event_title:
                return JsonResponse({
                    'success': False,
                    'message': 'Event title is required for event posts.'
                }, status=400)
            
            if not event_start_date:
                return JsonResponse({
                    'success': False,
                    'message': 'Event start date is required for event posts.'
                }, status=400)
            
            post.event_title = event_title
            post.event_start_date = event_start_date
            post.event_end_date = request.POST.get('event_end_date') or None
            post.event_start_time = request.POST.get('event_start_time') or None
            post.event_end_time = request.POST.get('event_end_time') or None
            post.event_location = request.POST.get('event_location', '').strip() or None
        else:
            # Clear event fields if not an event post
            post.event_title = None
            post.event_start_date = None
            post.event_end_date = None
            post.event_start_time = None
            post.event_end_time = None
            post.event_location = None
        
        # Handle image update
        if 'image' in request.FILES:
            post.image = request.FILES['image']
        elif request.POST.get('remove_image') == 'true':
            post.image = None
        
        post.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Post updated successfully!'
        })
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Post update error: {str(e)}')
        return JsonResponse({
            'success': False,
            'message': 'An error occurred while updating the post.'
        }, status=500)


@login_required
def user_activities(request):
    """
    Display all user activities (post interactions, church follows, bookings, etc.)
    """
    from .activity_tracker import ActivityTracker
    from accounts.models import UserActivity
    
    # Get filter parameter
    activity_filter = request.GET.get('filter', 'all')
    
    # Get post interactions
    if activity_filter == 'posts':
        activities = ActivityTracker.get_post_interactions(request.user, limit=50)
    elif activity_filter == 'churches':
        activities = ActivityTracker.get_church_interactions(request.user, limit=50)
    elif activity_filter == 'auth':
        # Get authentication activities instead
        activities = UserActivity.objects.filter(user=request.user).order_by('-created_at')[:50]
    else:
        # Get all interactions
        activities = ActivityTracker.get_user_activities(request.user, limit=50)
    
    # Get activity statistics
    stats = ActivityTracker.get_activity_stats(request.user)
    
    # Get recent authentication activities for sidebar
    recent_auth_activities = UserActivity.objects.filter(
        user=request.user
    ).order_by('-created_at')[:3]
    
    context = {
        'activities': activities,
        'activity_filter': activity_filter,
        'stats': stats,
        'recent_auth_activities': recent_auth_activities,
        'active': 'activities',
        'is_admin_mode': bool(request.session.get('super_admin_mode', False)) if getattr(request.user, 'is_superuser', False) else False,
    }
    
    return render(request, 'user_activities.html', context)
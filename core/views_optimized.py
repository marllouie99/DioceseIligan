"""
Optimized views with improved database queries and performance
This file contains optimized versions of the most performance-critical views
"""

from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Count, F, Prefetch
from django.urls import reverse
from django.utils.text import slugify
from django.core.cache import cache
from django.db import IntegrityError
from django.contrib.auth import get_user_model

from .models import (
    Church,
    ChurchFollow,
    BookableService,
    Availability,
    ServiceImage,
    Booking,
    Post,
    ChurchVerificationRequest,
    ChurchVerificationDocument,
    Notification,
    DeclineReason,
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
        essentials_incomplete = False
        essentials_missing = []

    return {
        'user_display_name': user_display_name,
        'user_initial': user_initial,
        'activity_counts': ACTIVITY_COUNTS,
        'is_admin_mode': bool(request.session.get('super_admin_mode', False)) if getattr(user, 'is_superuser', False) else False,
        'profile_essentials_incomplete': essentials_incomplete,
        'profile_essentials_missing': essentials_missing,
    }


@login_required
def discover_optimized(request):
    """Optimized discover churches page with better query performance."""
    search_form = ChurchSearchForm(request.GET)
    
    # Base queryset with optimized select_related
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
    
    # Optimized ordering with annotation
    churches = churches.annotate(
        followers_count=Count('followers')
    ).order_by('-followers_count', '-created_at')
    
    # Pagination
    paginator = Paginator(churches, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Optimized user followed churches query
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
def manage_church_optimized(request):
    """Optimized manage church view with better query performance."""
    try:
        church = request.user.owned_churches.first()
        if not church:
            if request.user.is_superuser:
                return redirect('core:super_admin_create_church')
            messages.info(request, "You don't own any churches yet. Please contact a Super Admin to create one and assign you as manager.")
            return redirect('core:home')
    except Church.DoesNotExist:
        if request.user.is_superuser:
            return redirect('core:super_admin_create_church')
        messages.info(request, "You don't own any churches yet. Please contact a Super Admin to create one and assign you as manager.")
        return redirect('core:home')
    
    if request.method == 'POST' and request.POST.get('form_type') != 'verification':
        form = ChurchUpdateForm(request.POST, request.FILES, instance=church)
        if form.is_valid():
            form.save()
            messages.success(request, 'Church information has been updated successfully!')
            return redirect('core:manage_church')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ChurchUpdateForm(instance=church)
    
    # Verification UI form (separate submission endpoint)
    verif_form = ChurchVerificationUploadForm()

    # Optimized church statistics - use cached follower count
    follower_count = cache.get(f'church_{church.id}_follower_count')
    if follower_count is None:
        follower_count = church.followers.count()
        cache.set(f'church_{church.id}_follower_count', follower_count, 300)  # Cache for 5 minutes
    
    # Optimized recent followers query
    recent_followers = church.followers.select_related('user')[:10]

    # Optimized appointments tab data
    appt_status = request.GET.get('appt_status', 'all')
    bookings_all = (
        Booking.objects
        .filter(church=church)
        .select_related('service', 'user', 'user__profile')
        .order_by('-created_at')
    )
    
    # Optimized counts using single query with conditional aggregation
    from django.db.models import Case, When, IntegerField
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
    
    bookings = bookings_all
    if appt_status != 'all':
        bookings = bookings.filter(status=appt_status)

    # Optimized conflict detection
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
    }
    ctx.update(_app_context(request))
    
    # AJAX partial for appointments list
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' and request.GET.get('partial') == 'appointments_list':
        return render(request, 'core/partials/appointments_list.html', {
            'bookings': booking_list,
        })
    return render(request, 'core/manage_church.html', ctx)


@login_required
def appointments_optimized(request):
    """Optimized appointments page with better query performance."""
    status_filter = request.GET.get('status', 'all')
    bookings_qs = Booking.objects.filter(user=request.user).select_related('service', 'church').order_by('-created_at')

    # Optimized counts using single query with conditional aggregation
    counts = bookings_qs.aggregate(
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
    
    if status_filter and status_filter != 'all':
        bookings_qs = bookings_qs.filter(status=status_filter)

    ctx = {
        'active': 'appointments',
        'page_title': 'My Appointments',
        'bookings': bookings_qs,
        'counts': counts,
        'status_filter': status_filter,
    }
    ctx.update(_app_context(request))
    return render(request, 'core/my_appointments.html', ctx)


@login_required
def super_admin_dashboard_optimized(request):
    """Optimized super admin dashboard with better query performance."""
    if not request.user.is_superuser:
        messages.error(request, 'You do not have permission to access Super Admin.')
        return redirect('core:home')

    User = get_user_model()

    # Optimized summary stats using single query
    stats = cache.get('admin_dashboard_stats')
    if stats is None:
        stats = {
            'users': User.objects.count(),
            'churches': Church.objects.count(),
            'services': BookableService.objects.count(),
            'bookings': Booking.objects.count(),
        }
        cache.set('admin_dashboard_stats', stats, 300)  # Cache for 5 minutes

    # Optimized recent activity queries
    recent_churches = Church.objects.select_related('owner').order_by('-created_at')[:8]
    recent_users = User.objects.order_by('-date_joined')[:8] if hasattr(User, 'date_joined') else User.objects.order_by('-id')[:8]
    recent_bookings = Booking.objects.select_related('service', 'church', 'user').order_by('-created_at')[:8]

    # Optimized booking status breakdown
    booking_by_status = list(
        Booking.objects.values('status').annotate(count=Count('id')).order_by('-count')
    )

    # Optimized church verification queries
    try:
        pending_verifications = list(
            ChurchVerificationRequest.objects
            .select_related('church', 'submitted_by')
            .filter(status=ChurchVerificationRequest.STATUS_PENDING)
            .order_by('created_at')[:5]
        )
        
        # Optimized verification counts using single query
        verif_counts = ChurchVerificationRequest.objects.aggregate(
            pending=Count('id', filter=Q(status=ChurchVerificationRequest.STATUS_PENDING)),
            approved=Count('id', filter=Q(status=ChurchVerificationRequest.STATUS_APPROVED)),
            rejected=Count('id', filter=Q(status=ChurchVerificationRequest.STATUS_REJECTED)),
        )
    except Exception:
        pending_verifications = []
        verif_counts = {'pending': 0, 'approved': 0, 'rejected': 0}

    ctx = {
        'active': 'super_admin',
        'page_title': 'Super Admin Dashboard',
        'stats': stats,
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
def notifications_optimized(request):
    """Optimized notifications page with better query performance."""
    
    # Get filter parameters (category-based)
    filter_type = request.GET.get('type', 'all')
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

    # Base queryset with optimized select_related
    base_queryset = Notification.objects.filter(user=request.user).select_related('booking', 'church')

    # Apply filters
    if unread_only:
        base_queryset = base_queryset.filter(is_read=False)

    if filter_type in category_map:
        base_queryset = base_queryset.filter(notification_type__in=category_map[filter_type])

    # Get notifications with limit
    notifications_qs = base_queryset[:50]

    # Optimized counts using single query with conditional aggregation
    all_notifications = Notification.objects.filter(user=request.user)
    counts = all_notifications.aggregate(
        all=Count('id'),
        unread=Count('id', filter=Q(is_read=False)),
        bookings=Count('id', filter=Q(notification_type__in=category_map['bookings'])),
        church=Count('id', filter=Q(notification_type__in=category_map['church'])),
        follows=Count('id', filter=Q(notification_type__in=category_map['follows'])),
    )

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


def follow_church_optimized(request, church_id):
    """Optimized follow church with better performance."""
    if request.method == 'POST':
        church = get_object_or_404(Church, id=church_id, is_active=True)
        
        # Check if already following
        follow_obj, created = ChurchFollow.objects.get_or_create(
            user=request.user,
            church=church
        )
        
        if created:
            # Update follower count in background (could use Celery for this)
            church.follower_count = church.followers.count()
            church.save(update_fields=['follower_count'])
            
            # Update cache
            cache.set(f'church_{church.id}_follower_count', church.follower_count, 300)
            
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


def unfollow_church_optimized(request, church_id):
    """Optimized unfollow church with better performance."""
    if request.method == 'POST':
        church = get_object_or_404(Church, id=church_id)
        
        try:
            follow_obj = ChurchFollow.objects.get(user=request.user, church=church)
            follow_obj.delete()
            
            # Update follower count in background
            church.follower_count = church.followers.count()
            church.save(update_fields=['follower_count'])
            
            # Update cache
            cache.set(f'church_{church.id}_follower_count', church.follower_count, 300)
            
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


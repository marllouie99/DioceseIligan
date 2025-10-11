from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods, require_POST
from django.conf import settings
from django.utils import timezone
from django.contrib.messages import get_messages
from django.core.cache import cache
import json
import logging
from django.contrib.staticfiles import finders
from django.templatetags.static import static as static_url
import os

from .forms import LoginForm, SignupForm, ProfileForm, EmailVerificationForm, ForgotPasswordForm, PasswordResetCodeForm, SetNewPasswordForm, LoginWithCodeForm, LoginCodeVerificationForm
from .models import Profile, UserActivity
from .email_utils import send_verification_code, has_recent_verification, send_password_reset_code, has_recent_password_reset, send_login_code, verify_login_code, has_recent_login_code
from core.utils import get_user_display_data, get_profile_completeness_data, get_essential_profile_status
from core.models import PostBookmark, Post


@ensure_csrf_cookie
def landing(request: HttpRequest) -> HttpResponse:
    """
    Landing page with Sign In / Sign Up forms toggled by a segmented control.
    """
    # Debug information removed for production
    active_tab = 'signin'
    login_form = LoginForm()
    signup_form = SignupForm()

    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'signin':
            login_form = LoginForm(request.POST)
            active_tab = 'signin'
            if login_form.is_valid():
                user = login_form.cleaned_data['user']
                login(request, user)
                # If a next= is provided, honor it. Otherwise route superusers to Super Admin.
                redirect_to = request.GET.get('next')
                if not redirect_to:
                    if user.is_superuser:
                        request.session['super_admin_mode'] = True
                    redirect_to = reverse('core:super_admin_dashboard') if user.is_superuser else reverse('dashboard')
                return redirect(redirect_to)
            else:
                messages.error(request, 'Unable to sign in. Please check your credentials.')

        elif action == 'signup':
            signup_form = SignupForm(request.POST)
            active_tab = 'signup'
            if signup_form.is_valid():
                # Instead of creating user immediately, send verification email
                email = signup_form.cleaned_data['email']
                
                # Check if verification was sent recently to prevent spam
                if has_recent_verification(email):
                    messages.error(request, 'A verification code was sent recently. Please wait 30 seconds before requesting another.')
                else:
                    # Send verification code
                    verification = send_verification_code(email)
                    if verification:
                        # Store signup data in session for after verification
                        request.session['pending_signup'] = {
                            'full_name': signup_form.cleaned_data['full_name'],
                            'email': signup_form.cleaned_data['email'],
                            'password': signup_form.cleaned_data['password'],
                            'confirm_password': signup_form.cleaned_data['confirm_password'],
                        }
                        request.session['verification_email'] = email
                        
                        messages.success(request, f'A verification code has been sent to {email}. Please check your email.')
                        return redirect('verify_email')
                    else:
                        messages.error(request, 'Failed to send verification email. Please try again.')
            else:
                messages.error(request, 'Please correct the errors below.')

    # Determine active tab based on form data or URL parameter  
    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'signup':
            active_tab = 'signup'
    elif request.GET.get('tab') == 'signup':
        active_tab = 'signup'

    # Check if Google OAuth is configured
    client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', '').strip()
    client_secret = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', '').strip()
    redirect_uri = getattr(settings, 'GOOGLE_OAUTH_REDIRECT_URI', '').strip()
    
    # OAuth is configured if all three values are present and not empty
    google_oauth_configured = bool(
        client_id and 
        client_secret and
        redirect_uri and
        len(client_id) > 10 and  # Valid client IDs are much longer
        len(client_secret) > 10  # Valid secrets are much longer
    )

    context = {
        'login_form': login_form,
        'signup_form': signup_form,
        'active_tab': active_tab,
        'debug': settings.DEBUG,
        'google_oauth_configured': google_oauth_configured,
    }
    
    return render(request, 'landing.html', context)


def static_debug(request: HttpRequest) -> JsonResponse:
    """Simple runtime diagnostics for static files without shell access."""
    targets = [
        'css/pages/landing.css',
        'js/landing.js',
        'js/hero-carousel.js',
        'js/utils/clock-sync.js',
        'admin/css/base.css',
    ]
    data = {
        'STATIC_URL': settings.STATIC_URL,
        'STATIC_ROOT': str(settings.STATIC_ROOT),
        'STATICFILES_DIRS': [str(d) for d in settings.STATICFILES_DIRS],
        'DEBUG': settings.DEBUG,
        'results': {}
    }
    for path in targets:
        abs_path = finders.find(path)
        root_path = os.path.normpath(os.path.join(str(settings.STATIC_ROOT), path))
        data['results'][path] = {
            'found_by_finders': bool(abs_path),
            'abs_path': str(abs_path) if abs_path else None,
            'served_url': static_url(path),
            'exists_in_STATIC_ROOT': os.path.exists(root_path),
            'static_root_path': root_path,
            'size_in_STATIC_ROOT': (os.path.getsize(root_path) if os.path.exists(root_path) else None),
        }
    # include directory listings for quick visibility (first 50 entries)
    listing = []
    try:
        for root, dirs, files in os.walk(str(settings.STATIC_ROOT)):
            rel = os.path.relpath(root, str(settings.STATIC_ROOT))
            listing.append({'dir': rel, 'files': sorted(files)[:20]})
            if len(listing) >= 5:
                break
    except Exception:
        pass
    data['sample_listing'] = listing
    return JsonResponse(data)

def logout_view(request: HttpRequest) -> HttpResponse:
    logout(request)
    # Clear any queued messages from the previous session so they don't appear on landing
    list(get_messages(request))
    return redirect('landing')


ACTIVITY_COUNTS = {
    'following': 1,
    'upcoming_events': 1,
}


# Helper functions moved to core.utils


def _get_cached_profile_data(user_id):
    """Get cached profile data or return None if not cached."""
    cache_key = f"profile_data_{user_id}"
    return cache.get(cache_key)


def _set_cached_profile_data(user_id, profile_data, timeout=300):
    """Cache profile data for 5 minutes."""
    cache_key = f"profile_data_{user_id}"
    cache.set(cache_key, profile_data, timeout)


def _invalidate_profile_cache(user_id):
    """Invalidate cached profile data."""
    cache_key = f"profile_data_{user_id}"
    cache.delete(cache_key)


@login_required
def dashboard(request: HttpRequest) -> HttpResponse:
    from core.models import Post, ChurchFollow, Church
    from core.forms import PostForm
    from django.db.models import Q
    
    # Get profile with select_related for optimization
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        profile = None

    # Compute profile completeness
    profile_status = get_profile_completeness_data(request.user, profile)
    # Compute essential profile status used for booking requirement/banner
    essential_status = get_essential_profile_status(request.user, profile)
    
    # Get user display data
    user_display_name, user_initial = get_user_display_data(request.user, profile)

    # Get churches owned by the user
    owned_churches = Church.objects.filter(owner=request.user, is_active=True)
    
    # Initialize post form for church owners
    post_form = None
    if owned_churches.exists():
        post_form = PostForm()

    # Get community feed from followed churches AND owned churches
    community_feed = []
    if request.user.is_authenticated:
        # Get churches the user follows
        followed_churches = ChurchFollow.objects.filter(user=request.user).values_list('church_id', flat=True)
        
        # Get churches the user owns
        owned_church_ids = owned_churches.values_list('id', flat=True)
        
        # Combine followed and owned churches (remove duplicates)
        all_church_ids = set(followed_churches) | set(owned_church_ids)
        
        # Get recent posts from followed AND owned churches, limited to last 20 posts
        recent_posts = Post.objects.filter(
            church_id__in=all_church_ids,
            is_active=True
        ).select_related('church').order_by('-created_at')[:20]
        
        # Add liked and bookmarked status to each post
        for post in recent_posts:
            post.is_liked = post.is_liked_by(request.user)
            post.is_bookmarked = post.is_bookmarked_by(request.user)
        
        community_feed = recent_posts

    # Get recent user activities for sidebar (post interactions)
    recent_activities = []
    if request.user.is_authenticated:
        from core.models import UserInteraction
        recent_activities = UserInteraction.objects.filter(
            user=request.user
        ).select_related('content_type').prefetch_related('content_object').order_by('-created_at')[:3]

    # Get upcoming events from all churches (not just followed)
    from django.utils import timezone
    upcoming_events = []
    if request.user.is_authenticated:
        now = timezone.now()
        upcoming_events = Post.objects.filter(
            post_type='event',
            is_active=True,
            church__is_active=True,  # Only from active churches
            event_start_date__gte=now  # Only future events
        ).select_related('church').order_by('event_start_date')[:5]  # Get next 5 upcoming events
        
        # Add interaction status to each event
        for event in upcoming_events:
            event.is_liked = event.is_liked_by(request.user)
            event.is_bookmarked = event.is_bookmarked_by(request.user)

    # Get PayPal configuration for donation integration
    PAYPAL_CLIENT_ID = getattr(settings, 'PAYPAL_CLIENT_ID', '')
    PAYPAL_CURRENCY = getattr(settings, 'PAYPAL_CURRENCY', 'PHP')
    
    context = {
        'profile_status': profile_status,
        'essential_status': essential_status,
        'profile_essentials_incomplete': not essential_status.get('is_complete', False),
        'profile_essentials_missing': list(essential_status.get('missing', [])),
        'user_display_name': user_display_name,
        'user_initial': user_initial,
        'activity_counts': ACTIVITY_COUNTS,
        'community_feed': community_feed,
        'owned_churches': owned_churches,
        'post_form': post_form,
        'recent_activities': recent_activities,
        'upcoming_events': upcoming_events,
        'active': 'home',
        'is_admin_mode': bool(request.session.get('super_admin_mode', False)) if getattr(request.user, 'is_superuser', False) else False,
        'PAYPAL_CLIENT_ID': PAYPAL_CLIENT_ID,
        'PAYPAL_CURRENCY': PAYPAL_CURRENCY,
    }
    return render(request, 'dashboard.html', context)


@login_required
def manage_profile(request: HttpRequest) -> HttpResponse:
    """
    Profile management page where users can update their personal information.
    """
    # Get or create profile with select_related optimization
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=request.user)
    # Compute a robust image URL via the active storage backend (Cloudinary in prod)
    try:
        from django.core.files.storage import default_storage
        profile_image_url = (
            profile.profile_image.storage.url(profile.profile_image.name)
            if getattr(profile, 'profile_image', None) and getattr(profile.profile_image, 'name', '')
            else None
        )
    except Exception:
        profile_image_url = None

    if request.method == 'POST':
        form = ProfileForm(request.POST, request.FILES, instance=profile, user=request.user)
        if form.is_valid():
            form.save()
            
            # Invalidate cache after successful update
            _invalidate_profile_cache(request.user.id)
            
            # Check if this is an AJAX request
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                # Refresh profile from database to get updated image path (Cloudinary)
                profile.refresh_from_db()
                
                # Get updated user display data
                user_display_name, user_initial = get_user_display_data(request.user, profile)
                
                # Prepare optimized profile data for JSON response
                profile_data = {
                    'display_name': user_display_name,
                    'email': request.user.email,
                    'bio': profile.bio or '',
                    # Use storage-derived URL (Cloudinary in prod)
                    'profile_image': (
                        profile.profile_image.storage.url(profile.profile_image.name)
                        if getattr(profile, 'profile_image', None) and getattr(profile.profile_image, 'name', '')
                        else None
                    ),
                    'user_initial': user_initial,
                }
                
                # Debug logging for Cloudinary verification
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"[Profile Save] Default storage: {default_storage.__class__.__name__}")
                try:
                    field_storage_name = profile.profile_image.storage.__class__.__name__ if profile.profile_image else 'None'
                except Exception:
                    field_storage_name = 'Unknown'
                logger.info(f"[Profile Save] Field storage: {field_storage_name}")
                logger.info(f"[Profile Save] Image name: {profile.profile_image.name if profile.profile_image else 'None'}")
                logger.info(f"[Profile Save] Image URL: {profile_data.get('profile_image')}")
                
                # Cache the updated profile data
                _set_cached_profile_data(request.user.id, profile_data)
                
                return JsonResponse({
                    'success': True,
                    'profile_data': profile_data,
                    'message': 'Your profile has been updated successfully!'
                })
            else:
                # Regular form submission
                messages.success(request, 'Your profile has been updated successfully!')
                return redirect('manage_profile')
        else:
            # Check if this is an AJAX request
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'errors': form.errors
                })
            else:
                messages.error(request, 'Please correct the errors below.')
    else:
        form = ProfileForm(instance=profile, user=request.user)

    # Get user display data using helper function
    user_display_name, user_initial = get_user_display_data(request.user, profile)
    # Essential status for UI indicators
    essential_status = get_essential_profile_status(request.user, profile)
    # Map of specific fields missing for the edit profile modal indicators
    try:
        has_first = bool((request.user.first_name or '').strip())
        has_last = bool((request.user.last_name or '').strip())
        has_display = bool((getattr(profile, 'display_name', '') or '').strip())
        # Display name is only flagged when both first and last are empty (since Full Name OR Display Name is acceptable)
        display_name_missing = (not has_display) and (not has_first and not has_last)
        essential_missing_map = {
            'display_name': display_name_missing,
            'phone': not bool((getattr(profile, 'phone', '') or '').strip()),
            'address': not bool((getattr(profile, 'address', '') or '').strip()),
            'date_of_birth': not bool(getattr(profile, 'date_of_birth', None)),
        }
    except Exception:
        essential_missing_map = {
            'display_name': False,
            'phone': False,
            'address': False,
            'date_of_birth': False,
        }

    # Counts per section for header chips
    personal_missing_count = 1 if essential_missing_map.get('display_name') else 0
    contact_missing_count = int(bool(essential_missing_map.get('phone'))) + int(bool(essential_missing_map.get('address')))
    additional_missing_count = int(bool(essential_missing_map.get('date_of_birth')))

    # Get user's saved posts
    saved_posts = Post.objects.filter(
        bookmarks__user=request.user
    ).select_related('church').prefetch_related('likes', 'comments').order_by('-bookmarks__created_at')[:10]
    
    # Get user's post interaction activities
    from core.models import UserInteraction
    
    # For sidebar - limit to 3
    recent_activities = UserInteraction.objects.filter(
        user=request.user
    ).select_related('content_type').prefetch_related('content_object').order_by('-created_at')[:3]
    
    # For profile page content - show 15
    profile_activities = UserInteraction.objects.filter(
        user=request.user
    ).select_related('content_type').prefetch_related('content_object').order_by('-created_at')[:15]

    context = {
        'form': form,
        'profile': profile,
        'profile_image_url': profile_image_url,
        'user_display_name': user_display_name,
        'user_initial': user_initial,
        'active': 'profile',
        'essential_status': essential_status,
        'profile_essentials_incomplete': not essential_status.get('is_complete', False),
        'profile_essentials_missing': list(essential_status.get('missing', [])),
        'essential_missing_map': essential_missing_map,
        'personal_missing_count': personal_missing_count,
        'contact_missing_count': contact_missing_count,
        'additional_missing_count': additional_missing_count,
        'saved_posts': saved_posts,
        'recent_activities': recent_activities,  # 3 activities for sidebar
        'profile_activities': profile_activities,  # 15 activities for profile page content
        'is_admin_mode': bool(request.session.get('super_admin_mode', False)) if getattr(request.user, 'is_superuser', False) else False,
    }
    return render(request, 'manage_profile.html', context)


def verify_email(request: HttpRequest) -> HttpResponse:
    """
    Email verification page where users enter the verification code
    """
    # Check if there's a pending verification
    email = request.session.get('verification_email')
    pending_signup = request.session.get('pending_signup')
    
    if not email or not pending_signup:
        messages.error(request, 'No pending verification found. Please start the signup process again.')
        return redirect('landing')
    
    form = None  # Initialize form variable
    
    if request.method == 'POST':
        action = request.POST.get('action')
        
        if action == 'verify':
            form = EmailVerificationForm(request.POST)
            if form.is_valid():
                # Verification successful, create the user account
                try:
                    # Create user using the stored signup data
                    signup_form = SignupForm(pending_signup)
                    if signup_form.is_valid():
                        user = signup_form.save()
                        
                        # Set the authentication backend for the user
                        # This is required when logging in a user without authenticate()
                        from django.contrib.auth import get_backends
                        backend = get_backends()[0]
                        user.backend = f'{backend.__module__}.{backend.__class__.__name__}'
                        
                        # Clear session data
                        del request.session['pending_signup']
                        del request.session['verification_email']
                        
                        # Log the user in
                        login(request, user)
                        
                        # Log the successful registration
                        UserActivity.log_activity(
                            activity_type='registration_completed',
                            email=user.email,
                            user=user,
                            ip_address=request.META.get('REMOTE_ADDR'),
                            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                            success=True,
                            details='User registered and verified email successfully'
                        )
                        
                        messages.success(request, 'Email verified successfully! Welcome to ChurchConnect.')
                        
                        # Redirect based on user type
                        redirect_to = request.GET.get('next')
                        if not redirect_to:
                            if user.is_superuser:
                                request.session['super_admin_mode'] = True
                            redirect_to = reverse('core:super_admin_dashboard') if user.is_superuser else reverse('dashboard')
                        return redirect(redirect_to)
                    else:
                        # Log the form errors for debugging
                        logging.getLogger(__name__).error(f"Signup form validation failed: {signup_form.errors}")
                        messages.error(request, 'There was an error creating your account. Please try again.')
                        return redirect('landing')
                        
                except Exception as e:
                    logging.getLogger(__name__).error(f"Error creating user account: {str(e)}", exc_info=True)
                    messages.error(request, 'There was an error creating your account. Please try again.')
                    return redirect('landing')
            # If form is invalid, it will be rendered with errors below
                
        elif action == 'resend':
            # Resend verification code
            if has_recent_verification(email):
                messages.error(request, 'Please wait 30 seconds before requesting another code.')
            else:
                verification = send_verification_code(email)
                if verification:
                    messages.success(request, 'A new verification code has been sent to your email.')
                else:
                    messages.error(request, 'Failed to send verification code. Please try again.')
            # Create a fresh form after resend action
            form = EmailVerificationForm(initial={'email': email})
    
    # Create form if not already created (GET request or resend action)
    if form is None:
        form = EmailVerificationForm(initial={'email': email})
    
    context = {
        'form': form,
        'email': email,
        'masked_email': f"{email[:2]}***@{email.split('@')[1]}" if email else '',
    }
    return render(request, 'verify_email.html', context)


def resend_verification_code(request: HttpRequest) -> HttpResponse:
    """
    AJAX endpoint to resend verification code
    """
    if request.method == 'POST':
        email = request.session.get('verification_email')
        
        if not email:
            return JsonResponse({'success': False, 'message': 'No pending verification found.'})
        
        if has_recent_verification(email):
            return JsonResponse({
                'success': False, 
                'message': 'Please wait 30 seconds before requesting another code.'
            })
        
        verification = send_verification_code(email)
        if verification:
            return JsonResponse({
                'success': True, 
                'message': 'A new verification code has been sent to your email.'
            })
        else:
            return JsonResponse({
                'success': False, 
                'message': 'Failed to send verification code. Please try again.'
            })
    
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})


def forgot_password(request: HttpRequest) -> HttpResponse:
    """
    Forgot password page where users enter their email to receive reset code
    """
    if request.method == 'POST':
        form = ForgotPasswordForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            
            # Check if password reset was sent recently to prevent spam
            if has_recent_password_reset(email):
                messages.error(request, 'A password reset code was sent recently. Please wait 30 seconds before requesting another.')
            else:
                # Send password reset code
                reset = send_password_reset_code(email)
                if reset:
                    # Log the password reset request
                    UserActivity.log_activity(
                        activity_type='password_reset_request',
                        email=email,
                        ip_address=request.META.get('REMOTE_ADDR'),
                        user_agent=request.META.get('HTTP_USER_AGENT'),
                        success=True,
                        details=f"Password reset code sent to {email}"
                    )
                    
                    # Store email in session for the reset process
                    request.session['password_reset_email'] = email
                    messages.success(request, f'A password reset code has been sent to {email}.')
                    return redirect('password_reset_verify')
                else:
                    messages.error(request, 'Failed to send password reset code. Please try again.')
        else:
            # Form has errors, display them
            pass
    else:
        form = ForgotPasswordForm()
    
    context = {
        'form': form,
    }
    return render(request, 'accounts/forgot_password.html', context)


def password_reset_verify(request: HttpRequest) -> HttpResponse:
    """
    Password reset verification page where users enter the reset code
    """
    # Check if there's a pending password reset
    email = request.session.get('password_reset_email')
    
    if not email:
        messages.error(request, 'No password reset request found. Please start the process again.')
        return redirect('forgot_password')
    
    if request.method == 'POST':
        action = request.POST.get('action')
        
        if action == 'verify':
            form = PasswordResetCodeForm(request.POST)
            if form.is_valid():
                # Code verification successful, proceed to password reset
                request.session['password_reset_verified'] = True
                messages.success(request, 'Code verified! Please set your new password.')
                return redirect('password_reset_confirm')
            else:
                # Form has errors, show them
                # Debug: Print form errors
                import logging
                logger = logging.getLogger(__name__)
                logger.error("=== PASSWORD RESET FORM ERRORS ===")
                logger.error(f"Form data: {request.POST}")
                logger.error(f"Form errors: {form.errors}")
                logger.error(f"Non-field errors: {form.non_field_errors()}")
                logger.error("===================================")
                messages.error(request, 'Please check the code and try again.')
                
        elif action == 'resend':
            # Resend password reset code
            if has_recent_password_reset(email):
                messages.error(request, 'Please wait 30 seconds before requesting another code.')
            else:
                reset = send_password_reset_code(email)
                if reset:
                    messages.success(request, 'A new password reset code has been sent to your email.')
                else:
                    messages.error(request, 'Failed to send reset code. Please try again.')
            # Create form for display after resend action
            form = PasswordResetCodeForm(initial={'email': email})
        else:
            # Unknown action, create fresh form
            form = PasswordResetCodeForm(initial={'email': email})
    else:
        form = PasswordResetCodeForm(initial={'email': email})
    
    context = {
        'form': form,
        'email': email,
        'masked_email': f"{email[:2]}***@{email.split('@')[1]}" if email else '',
    }
    return render(request, 'accounts/password_reset_verify.html', context)


def password_reset_confirm(request: HttpRequest) -> HttpResponse:
    """
    Password reset confirmation page where users set their new password
    """
    # Check if there's a pending password reset and it's been verified
    email = request.session.get('password_reset_email')
    verified = request.session.get('password_reset_verified', False)
    
    if not email or not verified:
        messages.error(request, 'Invalid password reset session. Please start the process again.')
        return redirect('forgot_password')
    
    if request.method == 'POST':
        form = SetNewPasswordForm(request.POST)
        if form.is_valid():
            # Update user's password
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                
                user = User.objects.get(email__iexact=email)
                new_password = form.cleaned_data['new_password']
                user.set_password(new_password)
                user.save()
                
                # Log the successful password reset
                UserActivity.log_activity(
                    activity_type='password_reset_completed',
                    email=email,
                    user=user,
                    ip_address=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT'),
                    success=True,
                    details="Password successfully reset"
                )
                
                # Clear session data
                if 'password_reset_email' in request.session:
                    del request.session['password_reset_email']
                if 'password_reset_verified' in request.session:
                    del request.session['password_reset_verified']
                
                messages.success(request, 'Your password has been reset successfully! You can now sign in with your new password.')
                return redirect('landing')
                
            except User.DoesNotExist:
                messages.error(request, 'User account not found. Please contact support.')
                return redirect('forgot_password')
            except Exception as e:
                messages.error(request, 'An error occurred while resetting your password. Please try again.')
                return redirect('forgot_password')
        else:
            # Form has errors, display them
            pass
    else:
        form = SetNewPasswordForm(initial={'email': email})
    
    context = {
        'form': form,
        'email': email,
    }
    return render(request, 'accounts/password_reset_confirm.html', context)


def resend_password_reset_code(request: HttpRequest) -> HttpResponse:
    """
    AJAX endpoint to resend password reset code
    """
    if request.method == 'POST':
        email = request.session.get('password_reset_email')
        
        if not email:
            return JsonResponse({'success': False, 'message': 'No pending password reset found.'})
        
        if has_recent_password_reset(email):
            return JsonResponse({
                'success': False, 
                'message': 'Please wait 30 seconds before requesting another code.'
            })
        
        reset = send_password_reset_code(email)
        if reset:
            return JsonResponse({
                'success': True, 
                'message': 'A new password reset code has been sent to your email.'
            })
        else:
            return JsonResponse({
                'success': False, 
                'message': 'Failed to send reset code. Please try again.'
            })
    
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})


def login_with_code(request: HttpRequest) -> HttpResponse:
    """
    Login with code page where users enter their email to receive a login code
    """
    # Get email from URL parameter for pre-filling
    prefill_email = request.GET.get('email', '').strip()
    
    if request.method == 'POST':
        form = LoginWithCodeForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            
            # Check rate limiting
            if has_recent_login_code(email):
                messages.error(request, 'Please wait 2 minutes before requesting another login code.')
            else:
                # Send login code
                login_code = send_login_code(email)
                if login_code:
                    # Store email in session for next step
                    request.session['login_code_email'] = email
                    
                    # Log activity
                    UserActivity.objects.create(
                        email=email,
                        activity_type='login_code_request',
                        ip_address=request.META.get('REMOTE_ADDR'),
                        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                        success=True
                    )
                    
                    messages.success(request, 'A login code has been sent to your email address.')
                    return redirect('login_code_verify')
                else:
                    messages.error(request, 'Failed to send login code. Please try again.')
    else:
        # Pre-fill form with email from URL parameter if available
        initial_data = {}
        if prefill_email:
            initial_data['email'] = prefill_email
        form = LoginWithCodeForm(initial=initial_data)
    
    context = {
        'form': form,
        'prefill_email': prefill_email,
    }
    return render(request, 'accounts/login_with_code.html', context)


def login_code_verify(request: HttpRequest) -> HttpResponse:
    """
    Login code verification page where users enter the login code
    """
    # Check if there's a pending login code request
    email = request.session.get('login_code_email')
    
    if not email:
        messages.error(request, 'No login code request found. Please start the process again.')
        return redirect('login_with_code')
    
    if request.method == 'POST':
        action = request.POST.get('action')
        
        if action == 'verify':
            form = LoginCodeVerificationForm(request.POST)
            if form.is_valid():
                # Code verification successful, log the user in
                from django.contrib.auth import get_user_model
                User = get_user_model()
                
                try:
                    user = User.objects.get(email=email)
                    login(request, user)
                    
                    # Clear session data (use pop to avoid KeyError)
                    request.session.pop('login_code_email', None)
                    
                    # Log successful login
                    UserActivity.objects.create(
                        user=user,
                        email=email,
                        activity_type='login_code_success',
                        ip_address=request.META.get('REMOTE_ADDR'),
                        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                        success=True
                    )
                    
                    messages.success(request, 'Successfully logged in!')
                    return redirect('dashboard')
                except User.DoesNotExist:
                    messages.error(request, 'Account not found.')
            else:
                # Log failed login attempt
                UserActivity.objects.create(
                    email=email,
                    activity_type='login_code_failed',
                    ip_address=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                    success=False
                )
                # Form has errors, show them
                import logging
                logger = logging.getLogger(__name__)
                logger.error("=== LOGIN CODE FORM ERRORS ===")
                logger.error(f"Form data: {request.POST}")
                logger.error(f"Form errors: {form.errors}")
                logger.error(f"Non-field errors: {form.non_field_errors()}")
                logger.error("===================================")
                messages.error(request, 'Please check the code and try again.')
                
        elif action == 'resend':
            # Resend login code
            if has_recent_login_code(email):
                messages.error(request, 'Please wait 2 minutes before requesting another code.')
            else:
                login_code = send_login_code(email)
                if login_code:
                    messages.success(request, 'A new login code has been sent to your email.')
                else:
                    messages.error(request, 'Failed to send login code. Please try again.')
            # Create form for display after resend action
            form = LoginCodeVerificationForm(initial={'email': email})
        else:
            # Unknown action, create fresh form
            form = LoginCodeVerificationForm(initial={'email': email})
    else:
        form = LoginCodeVerificationForm(initial={'email': email})
    
    context = {
        'form': form,
        'email': email,
        'masked_email': f"{email[:2]}***@{email.split('@')[1]}" if email else '',
    }
    return render(request, 'accounts/login_code_verify.html', context)


@require_POST
def resend_login_code(request):
    """
    AJAX endpoint to resend login code
    """
    email = request.session.get('login_code_email')
    
    if not email:
        return JsonResponse({
            'success': False,
            'message': 'No login code request found.'
        })
    
    if has_recent_login_code(email):
        return JsonResponse({
            'success': False,
            'message': 'Please wait 2 minutes before requesting another code.'
        })
    else:
        login_code = send_login_code(email)
        if login_code:
            return JsonResponse({
                'success': True,
                'message': 'A new login code has been sent to your email.'
            })
        else:
            return JsonResponse({
                'success': False, 
                'message': 'Failed to send login code. Please try again.'
            })
    
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})


# Google OAuth Views
def google_login(request):
    """
    Initiate Google OAuth login flow
    """
    try:
        # Allow HTTP for local development (ONLY for development!)
        import os
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
        
        from google_auth_oauthlib import flow
        import json
        
        # Get Google OAuth credentials from settings
        from django.conf import settings
        client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
        client_secret = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', None)
        redirect_uri = getattr(settings, 'GOOGLE_OAUTH_REDIRECT_URI', None)
        
        if not client_id or not client_secret or not redirect_uri:
            messages.warning(request, 'Google OAuth is not yet configured. Please set up Google OAuth credentials to use this feature.')
            return redirect('landing')
        
        # Create OAuth flow
        client_config = {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri]
            }
        }
        
        oauth_flow = flow.Flow.from_client_config(
            client_config=client_config,
            scopes=[
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile', 
                'openid'
            ]
        )
        oauth_flow.redirect_uri = redirect_uri
        
        # Generate state parameter for security
        import secrets
        state = secrets.token_urlsafe(32)
        request.session['oauth_state'] = state
        
        # Get authorization URL
        authorization_url, _ = oauth_flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state
        )
        
        return redirect(authorization_url)
        
    except ImportError:
        messages.error(request, 'Google OAuth library not installed. Please contact support.')
        return redirect('landing')
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Google OAuth login error: {str(e)}")
        messages.error(request, 'Failed to initiate Google login. Please try again.')
        return redirect('landing')


def google_callback(request):
    """
    Handle Google OAuth callback
    """
    try:
        # Allow HTTP for local development (ONLY for development!)
        import os
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
        
        from google_auth_oauthlib import flow
        from google.auth.transport import requests as google_requests
        import json
        
        # Check state parameter for security
        state = request.GET.get('state')
        stored_state = request.session.get('oauth_state')
        
        if not state or not stored_state or state != stored_state:
            messages.error(request, 'Invalid OAuth state. Please try logging in again.')
            return redirect('landing')
        
        # Clean up state from session
        request.session.pop('oauth_state', None)
        
        # Check for error from Google
        error = request.GET.get('error')
        if error:
            messages.error(request, 'Google login was cancelled or failed.')
            return redirect('landing')
        
        # Get authorization code
        code = request.GET.get('code')
        if not code:
            messages.error(request, 'No authorization code received from Google.')
            return redirect('landing')
        
        # Get Google OAuth credentials from settings
        from django.conf import settings
        client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
        client_secret = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', None)
        redirect_uri = getattr(settings, 'GOOGLE_OAUTH_REDIRECT_URI', None)
        
        if not client_id or not client_secret or not redirect_uri:
            messages.error(request, 'Google OAuth is not configured properly.')
            return redirect('landing')
        
        client_config = {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri]
            }
        }
        
        oauth_flow = flow.Flow.from_client_config(
            client_config=client_config,
            scopes=[
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile', 
                'openid'
            ]
        )
        oauth_flow.redirect_uri = redirect_uri
        
        # Exchange authorization code for tokens
        oauth_flow.fetch_token(authorization_response=request.build_absolute_uri())
        
        # Get user info from Google
        credentials = oauth_flow.credentials
        request_session = google_requests.Request()
        
        # Use credentials to get user info
        import google.oauth2.id_token
        try:
            id_info = google.oauth2.id_token.verify_oauth2_token(
                credentials.id_token, request_session, client_id,
                clock_skew_in_seconds=10  # Add 10 seconds tolerance for clock sync issues
            )
        except ValueError as e:
            if "Token used too early" in str(e):
                messages.error(request, 'Clock synchronization issue. Please sync your system clock and try again.')
                return redirect('landing')
            else:
                messages.error(request, f'Google authentication failed: {str(e)}')
                return redirect('landing')
        
        # Extract user information
        email = id_info.get('email')
        name = id_info.get('name', '')
        google_id = id_info.get('sub')
        
        if not email:
            messages.error(request, 'Could not get email from Google account.')
            return redirect('landing')
        
        # Check if user exists
        from django.contrib.auth.models import User
        from .models import Profile
        
        try:
            user = User.objects.get(email=email)
            # User exists, ensure they have a profile
            try:
                profile = user.profile
            except Profile.DoesNotExist:
                # Create profile if it doesn't exist
                Profile.objects.create(
                    user=user,
                    display_name=name
                )
            
            # Log them in
            login(request, user)
            
            # Log activity
            UserActivity.objects.create(
                user=user,
                email=email,
                activity_type='google_login',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                success=True
            )
            
            messages.success(request, f'Welcome back, {user.get_full_name() or user.email}!')
            return redirect('dashboard')
            
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create_user(
                email=email,
                username=email,  # Use email as username
                first_name=name.split(' ')[0] if name else '',
                last_name=' '.join(name.split(' ')[1:]) if name and len(name.split(' ')) > 1 else ''
            )
            
            # Create profile for new user
            Profile.objects.create(
                user=user,
                display_name=name
            )
            
            # Log them in
            login(request, user)
            
            # Log activity
            UserActivity.objects.create(
                user=user,
                email=email,
                activity_type='google_signup',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                success=True
            )
            
            messages.success(request, f'Welcome to ChurchConnect, {name or email}! Your account has been created.')
            return redirect('dashboard')
            
    except Exception as e:
        print(f"GOOGLE_CALLBACK ERROR: Unexpected error - {str(e)}")
        messages.error(request, 'An unexpected error occurred during Google login.')
        return redirect('landing')


def server_time(request):
    """
    API endpoint to get current server time for clock sync checking
    """
    try:
        return JsonResponse({
            'server_time': timezone.now().isoformat(),
            'timestamp': timezone.now().timestamp()
        })
    except Exception as e:
        print(f"SERVER_TIME ERROR: {type(e).__name__}: {str(e)}")
        print(f"SERVER_TIME ERROR: Full traceback:")
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'error': str(e)
        }, status=500)

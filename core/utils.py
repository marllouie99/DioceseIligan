"""
Utility functions for the ChurchIligan application.
"""
from PIL import Image
import os
from django.core.files.base import ContentFile
from io import BytesIO


def optimize_image(image_field, max_size=(800, 600), quality=85, format='JPEG'):
    """
    Optimize image for web display.
    
    Args:
        image_field: The image field to optimize
        max_size: Tuple of (width, height) for maximum size
        quality: JPEG quality (1-100)
        format: Output format ('JPEG', 'PNG', etc.)
    
    Returns:
        ContentFile: Optimized image file
    """
    if not image_field:
        return image_field
    
    # Open image
    img = Image.open(image_field)
    
    # Convert to RGB if necessary
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGB')
    
    # Resize if too large
    if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    # Save optimized image
    output = BytesIO()
    img.save(output, format=format, quality=quality, optimize=True)
    output.seek(0)
    
    # Create new file name using ONLY the basename to avoid duplicating upload_to paths
    # e.g., if upload_to='profiles/' and original name is 'profiles/avatar.jpg',
    # we must not include 'profiles/' in the returned ContentFile name, otherwise
    # Django will prepend upload_to again -> 'profiles/profiles/avatar_optimized.jpg'.
    original_name = getattr(image_field, 'name', 'image.jpg')
    base = os.path.splitext(os.path.basename(original_name))[0]
    # Avoid double _optimized suffix if already optimized
    if base.endswith('_optimized'):
        new_name = f"{base}.jpg"
    else:
        new_name = f"{base}_optimized.jpg"
    return ContentFile(output.getvalue(), name=new_name)


def get_user_display_data(user, profile):
    """
    Get user display name and initial for UI.
    
    Args:
        user: User instance
        profile: Profile instance (can be None)
    
    Returns:
        tuple: (display_name, user_initial)
    """
    display_name = None
    if profile and profile.display_name:
        display_name = profile.display_name
    elif user.get_full_name():
        display_name = user.get_full_name()
    else:
        display_name = user.get_username()
    
    user_initial = (display_name[:1] or user.get_username()[:1]).upper()
    
    return display_name, user_initial


def get_profile_completeness_data(user, profile):
    """
    Compute profile completeness data for UI display.
    
    Args:
        user: User instance
        profile: Profile instance (can be None)
    
    Returns:
        dict: Profile completeness data
    """
    profile_fields = [
        ('Phone Number', bool(profile.phone) if profile else False),
        ('Address', bool(profile.address) if profile else False),
        ('Bio/About Me', bool(profile.bio) if profile else False),
        ('Date of Birth', bool(profile.date_of_birth) if profile else False),
        ('Profile Photo', bool(profile.profile_image) if profile else False),
        ('Display Name', bool(profile.display_name) if profile else False),
        ('Full Name', bool(user.get_full_name())),
    ]
    
    total = len(profile_fields)
    completed = sum(1 for _, is_complete in profile_fields if is_complete)
    missing = [label for label, is_complete in profile_fields if not is_complete]
    percent = int(round((completed / total) * 100)) if total else 0
    
    return {
        'total': total,
        'completed': completed,
        'percent': percent,
        'missing': missing,
    }


def get_essential_profile_status(user, profile):
    """
    Determine if the user's essential profile information is complete.

    Essentials are the minimal fields required to request an appointment:
    - Full Name (or Display Name)
    - Phone Number
    - Address (structured fields: region, province, city, barangay OR legacy address field)
    - Date of Birth

    Returns a dict with:
    - is_complete: bool
    - missing: list[str]
    - required_count: int
    """
    # Name can come from either the user's full_name or the profile's display_name
    name_ok = False
    try:
        full_name = (user.get_full_name() or '').strip()
    except Exception:
        full_name = ''
    try:
        display_name = (getattr(profile, 'display_name', '') or '').strip()
    except Exception:
        display_name = ''
    name_ok = bool(full_name or display_name)

    # Address can be either structured fields or legacy address field
    address_ok = False
    try:
        # Check if structured address fields are filled (at least region and city)
        region = (getattr(profile, 'region', '') or '').strip()
        city = (getattr(profile, 'city_municipality', '') or '').strip()
        legacy_address = (getattr(profile, 'address', '') or '').strip()
        
        # Address is OK if either structured fields have region+city OR legacy address exists
        address_ok = bool((region and city) or legacy_address)
    except Exception:
        address_ok = False

    essentials = [
        ('Full Name', name_ok),
        ('Phone Number', bool(getattr(profile, 'phone', None))),
        ('Address', address_ok),
        ('Date of Birth', bool(getattr(profile, 'date_of_birth', None))),
    ]

    missing = [label for label, ok in essentials if not ok]
    return {
        'is_complete': len(missing) == 0,
        'missing': missing,
        'required_count': len(essentials),
    }

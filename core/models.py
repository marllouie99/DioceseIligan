from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.core.validators import RegexValidator
from django.utils import timezone
from django.utils.text import slugify
from .utils import optimize_image
import os

User = get_user_model()


class Church(models.Model):
    """Model representing a church organization."""
    
    DENOMINATION_CHOICES = [
        # Roman Catholic Church - Diocese of Iligan
        ('catholic', 'Roman Catholic Church'),
        ('parish', 'Roman Catholic Parish'),
        ('chapel', 'Roman Catholic Chapel'),
        ('shrine', 'Roman Catholic Shrine'),
        ('cathedral', 'Roman Catholic Cathedral'),
        ('basilica', 'Roman Catholic Basilica'),
        ('other', 'Other Catholic Community'),
    ]
    
    SIZE_CHOICES = [
        ('small', 'Small (1-50 members)'),
        ('medium', 'Medium (51-200 members)'),
        ('large', 'Large (201-1000 members)'),
        ('mega', 'Mega (1000+ members)'),
    ]
    
    # Basic Information
    name = models.CharField(max_length=200, help_text="Church name")
    slug = models.SlugField(max_length=200, unique=True, help_text="URL-friendly version of the name")
    description = models.TextField(help_text="Brief description of the church")
    denomination = models.CharField(max_length=20, choices=DENOMINATION_CHOICES, default='parish')
    size = models.CharField(max_length=10, choices=SIZE_CHOICES, default='medium')
    
    # Contact Information
    email = models.EmailField(help_text="Primary contact email")
    phone = models.CharField(
        max_length=20, 
        validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Enter a valid phone number.')],
        help_text="Primary contact phone number"
    )
    website = models.URLField(blank=True, null=True, help_text="Church website URL")
    
    # Location - Philippine Address Structure
    region = models.CharField(max_length=200, blank=True, help_text="Region (e.g., Region X - Northern Mindanao)")
    province = models.CharField(max_length=200, blank=True, help_text="Province")
    city_municipality = models.CharField(max_length=200, blank=True, help_text="City or Municipality")
    barangay = models.CharField(max_length=200, blank=True, help_text="Barangay")
    street_address = models.CharField(max_length=300, blank=True, help_text="Street, Building, Unit No.")
    postal_code = models.CharField(max_length=4, blank=True, help_text="4-digit Postal/ZIP code")
    
    # Legacy location fields (for backward compatibility)
    address = models.TextField(blank=True, help_text="Street address (legacy)")
    city = models.CharField(max_length=100, blank=True, help_text="City (legacy)")
    state = models.CharField(max_length=100, blank=True, help_text="State/Province (legacy)")
    country = models.CharField(max_length=100, default="Philippines", help_text="Country")
    
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Latitude for mapping")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Longitude for mapping")
    
    # Leadership
    pastor_name = models.CharField(max_length=100, help_text="Lead pastor/minister name")
    pastor_email = models.EmailField(blank=True, null=True, help_text="Pastor's email")
    pastor_phone = models.CharField(
        max_length=20, 
        validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Enter a valid phone number.')],
        blank=True, 
        null=True,
        help_text="Pastor's phone number"
    )
    
    # Media
    logo = models.ImageField(upload_to='churches/logos/', null=True, blank=True, help_text="Church logo")
    cover_image = models.ImageField(upload_to='churches/covers/', null=True, blank=True, help_text="Cover image for church profile")
    
    # Services and Activities
    service_times = models.TextField(help_text="Service times and schedule (e.g., Sunday 9:00 AM, 11:00 AM)")
    special_services = models.TextField(blank=True, help_text="Special services or events")
    ministries = models.TextField(blank=True, help_text="Available ministries and programs")
    
    # Social Media
    facebook_url = models.URLField(blank=True, null=True, help_text="Facebook page URL")
    instagram_url = models.URLField(blank=True, null=True, help_text="Instagram profile URL")
    youtube_url = models.URLField(blank=True, null=True, help_text="YouTube channel URL")
    twitter_url = models.URLField(blank=True, null=True, help_text="Twitter profile URL")
    
    # Payment Information (for receiving donations)
    paypal_email = models.EmailField(blank=True, null=True, help_text="PayPal email address for receiving donations (required to enable donations on posts)")
    
    # Status and Ownership
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_churches', null=True, blank=True, help_text="User who created/manages this church (can be null for managerless churches)")
    is_verified = models.BooleanField(default=False, help_text="Whether this church is verified by administrators")
    is_active = models.BooleanField(default=True, help_text="Whether this church is currently active")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Statistics
    member_count = models.PositiveIntegerField(default=0, help_text="Approximate number of members")
    follower_count = models.PositiveIntegerField(default=0, help_text="Number of users following this church")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Church"
        verbose_name_plural = "Churches"
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        # Generate slug if not provided
        if not self.slug:
            self.slug = slugify(self.name)
            # Ensure uniqueness
            original_slug = self.slug
            counter = 1
            while Church.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        
        # Optimize and normalize images before saving
        from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
        
        if self.logo:
            try:
                logo_name = getattr(self.logo, 'name', '') or ''
                logo_base = os.path.splitext(os.path.basename(logo_name))[0]
                is_new_upload = isinstance(getattr(self.logo, 'file', None), (InMemoryUploadedFile, TemporaryUploadedFile))
                if is_new_upload and '_optimized' not in logo_base:
                    try:
                        optimized = optimize_image(self.logo, max_size=(400, 400))
                        # Assign optimized content; upload_to will prefix correctly on save
                        self.logo = optimized
                    except Exception as e:
                        logger.warning(f"Failed to optimize logo image: {e}")
                        # Continue with original image
            except Exception as e:
                logger.error(f"Error processing logo: {e}")
            # Normalize stored name (strip leading media/ and collapse duplicate paths)
            try:
                n = (self.logo.name or '').replace('\\', '/').lstrip('/')
                if n.startswith('media/'):
                    n = n[len('media/'):]
                while n.startswith('churches/logos/churches/logos/'):
                    n = n[len('churches/logos/') :]
                self.logo.name = n
            except Exception as e:
                logger.error(f"Error normalizing logo name: {e}")
        
        if self.cover_image:
            try:
                cover_name = getattr(self.cover_image, 'name', '') or ''
                cover_base = os.path.splitext(os.path.basename(cover_name))[0]
                is_new_upload = isinstance(getattr(self.cover_image, 'file', None), (InMemoryUploadedFile, TemporaryUploadedFile))
                if is_new_upload and '_optimized' not in cover_base:
                    try:
                        optimized = optimize_image(self.cover_image, max_size=(800, 600))
                        # Assign optimized content; upload_to will prefix correctly on save
                        self.cover_image = optimized
                    except Exception as e:
                        logger.warning(f"Failed to optimize cover image: {e}")
                        # Continue with original image
            except Exception as e:
                logger.error(f"Error processing cover image: {e}")
            # Normalize stored name
            try:
                n = (self.cover_image.name or '').replace('\\', '/').lstrip('/')
                if n.startswith('media/'):
                    n = n[len('media/'):]
                while n.startswith('churches/covers/churches/covers/'):
                    n = n[len('churches/covers/') :]
                self.cover_image.name = n
            except Exception as e:
                logger.error(f"Error normalizing cover image name: {e}")
        
        try:
            super().save(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error saving Church instance: {e}")
            raise
    
    @property
    def full_address(self):
        """Return formatted full address using new Philippine address structure."""
        # Use new structured address if available
        if self.region or self.province or self.city_municipality:
            parts = []
            if self.street_address:
                parts.append(self.street_address)
            if self.barangay:
                parts.append(f"Brgy. {self.barangay}")
            if self.city_municipality:
                parts.append(self.city_municipality)
            if self.province:
                parts.append(self.province)
            if self.region:
                parts.append(self.region)
            if self.postal_code:
                parts.append(self.postal_code)
            if self.country:
                parts.append(self.country)
            return ", ".join(parts) if parts else "No address provided"
        
        # Fallback to legacy address format
        if self.address or self.city or self.state:
            return f"{self.address}, {self.city}, {self.state} {self.postal_code}, {self.country}"
        
        return "No address provided"
    
    @property
    def street_location(self):
        """Return only the street address for display."""
        if self.street_address:
            return self.street_address
        # Fallback to legacy address if no street_address
        if self.address:
            return self.address
        return "No street address"
    
    @property
    def initial(self):
        """Return first letter of church name for avatar."""
        return self.name[0].upper() if self.name else 'C'
    
    def get_absolute_url(self):
        """Return URL for church detail view."""
        from django.urls import reverse
        return reverse('core:church_detail', kwargs={'slug': self.slug})


class ChurchFollow(models.Model):
    """Model for users following churches."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='church_follows')
    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name='followers')
    followed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'church']
        ordering = ['-followed_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} follows {self.church.name}"


class ServiceCategory(models.Model):
    """Model for categorizing church services (e.g., Parish Family, In-Person Services)."""
    
    name = models.CharField(max_length=100, unique=True, help_text="Category name (e.g., Parish Family, In-Person Services)")
    slug = models.SlugField(max_length=100, unique=True, help_text="URL-friendly version of the name")
    description = models.TextField(blank=True, help_text="Description of the category")
    icon = models.CharField(max_length=50, blank=True, help_text="Icon class or emoji for the category")
    color = models.CharField(max_length=7, default='#3B82F6', help_text="Hex color code for the category")
    order = models.PositiveIntegerField(default=0, help_text="Display order (0 = first)")
    is_active = models.BooleanField(default=True, help_text="Whether this category is active")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = "Service Category"
        verbose_name_plural = "Service Categories"
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Generate slug if not provided
        if not self.slug:
            self.slug = slugify(self.name)
            # Ensure uniqueness
            original_slug = self.slug
            counter = 1
            while ServiceCategory.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        super().save(*args, **kwargs)
    
    @property
    def service_count(self):
        """Get total number of services in this category."""
        return self.services.filter(is_active=True).count()


class BookableService(models.Model):
    """Model for church services that can be booked."""
    
    DURATION_CHOICES = [
        (15, '15 minutes'),
        (30, '30 minutes'),
        (45, '45 minutes'),
        (60, '1 hour'),
        (90, '1.5 hours'),
        (120, '2 hours'),
        (180, '3 hours'),
    ]
    
    CURRENCY_CHOICES = [
        ('PHP', 'Philippine Peso (₱)'),
        ('USD', 'US Dollar ($)'),
        ('EUR', 'Euro (€)'),
        ('GBP', 'British Pound (£)'),
        ('JPY', 'Japanese Yen (¥)'),
        ('KRW', 'South Korean Won (₩)'),
        ('SGD', 'Singapore Dollar (S$)'),
        ('AUD', 'Australian Dollar (A$)'),
        ('CAD', 'Canadian Dollar (C$)'),
    ]
    
    # Basic Information
    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name='bookable_services')
    category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='services', help_text="Service category")
    name = models.CharField(max_length=200, help_text="Service name (e.g., Counseling Session, Baptism)")
    description = models.TextField(blank=True, help_text="Description of the service (optional)")
    image = models.ImageField(upload_to='services/images/', null=True, blank=True, help_text="Service image")
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Service price")
    is_free = models.BooleanField(default=True, help_text="Whether this service is free")
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='PHP', help_text="Currency for pricing")
    
    # Scheduling
    duration = models.PositiveIntegerField(choices=DURATION_CHOICES, default=60, help_text="Service duration in minutes")
    max_bookings_per_day = models.PositiveIntegerField(default=10, help_text="Maximum number of bookings per day")
    advance_booking_days = models.PositiveIntegerField(default=30, help_text="How many days in advance can this be booked")
    
    # Availability
    is_active = models.BooleanField(default=True, help_text="Whether this service is available for booking")
    requires_approval = models.BooleanField(default=False, help_text="Whether bookings require church approval")
    
    # Instructions
    preparation_notes = models.TextField(blank=True, help_text="Notes for people booking this service")
    cancellation_policy = models.TextField(blank=True, help_text="Cancellation policy for this service")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Bookable Service"
        verbose_name_plural = "Bookable Services"
    
    def __str__(self):
        return f"{self.name} - {self.church.name}"
    
    @property
    def duration_display(self):
        """Return human-readable duration."""
        hours = self.duration // 60
        minutes = self.duration % 60
        
        if hours > 0 and minutes > 0:
            return f"{hours}h {minutes}m"
        elif hours > 0:
            return f"{hours}h"
        else:
            return f"{minutes}m"
    
    @property
    def price_display(self):
        """Return formatted price with currency."""
        if self.is_free:
            return "Free"
        elif self.price:
            return f"{self.currency} {self.price:,.2f}"
        else:
            return "Price not set"
    
    def get_images(self):
        """Get all images for this service."""
        return self.service_images.all().order_by('order', 'created_at')
    
    def get_primary_image(self):
        """Get the primary image for this service."""
        try:
            return self.service_images.filter(is_primary=True).first()
        except:
            return None
    
    @property
    def average_rating(self):
        """Get average rating for this service."""
        reviews = self.reviews.filter(is_active=True)
        if not reviews.exists():
            return 0
        total_rating = sum(review.rating for review in reviews)
        return round(total_rating / reviews.count(), 1)
    
    @property
    def review_count(self):
        """Get total number of reviews for this service."""
        return self.reviews.filter(is_active=True).count()
    
    @property
    def rating_distribution(self):
        """Get rating distribution (1-5 stars)."""
        reviews = self.reviews.filter(is_active=True)
        distribution = {i: 0 for i in range(1, 6)}
        for review in reviews:
            distribution[review.rating] += 1
        return distribution
    
    def has_user_reviewed(self, user):
        """Check if user has already reviewed this service."""
        if not user.is_authenticated:
            return False
        return self.reviews.filter(user=user, is_active=True).exists()
    
    def can_user_review(self, user):
        """Check if user can review this service (has completed booking but hasn't reviewed yet)."""
        if not user.is_authenticated:
            return False
        
        # Check if user has already reviewed
        if self.has_user_reviewed(user):
            return False
        
        # Check if user has completed bookings for this service
        from .models import Booking
        return Booking.objects.filter(
            user=user,
            service=self,
            status=Booking.STATUS_COMPLETED
        ).exists()
    
    def get_user_completed_bookings(self, user):
        """Get user's completed bookings for this service."""
        if not user.is_authenticated:
            return None
        
        from .models import Booking
        return Booking.objects.filter(
            user=user,
            service=self,
            status=Booking.STATUS_COMPLETED
        ).order_by('-updated_at')


class ServiceImage(models.Model):
    """Model for multiple images per service."""
    
    service = models.ForeignKey(BookableService, on_delete=models.CASCADE, related_name='service_images')
    image = models.ImageField(upload_to='services/gallery/', help_text="Service image")
    caption = models.CharField(max_length=200, blank=True, help_text="Image caption (optional)")
    order = models.PositiveIntegerField(default=0, help_text="Display order (0 = first)")
    is_primary = models.BooleanField(default=False, help_text="Primary image for service card")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = "Service Image"
        verbose_name_plural = "Service Images"
    
    def __str__(self):
        return f"{self.service.name} - Image {self.order + 1}"
    
    def save(self, *args, **kwargs):
        # If this is set as primary, unset other primary images for this service
        if self.is_primary:
            ServiceImage.objects.filter(service=self.service, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)


class Availability(models.Model):
    """Model for church availability and closed dates."""
    
    TYPE_CHOICES = [
        ('closed_date', 'Closed Date'),
        ('reduced_hours', 'Reduced Hours'),
        ('special_hours', 'Special Hours'),
    ]
    
    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name='availability')
    date = models.DateField(help_text="Date for this availability entry")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='closed_date')
    
    # For closed dates
    is_closed = models.BooleanField(default=True, help_text="Whether the church is closed on this date")
    
    # For reduced/special hours
    start_time = models.TimeField(null=True, blank=True, help_text="Start time for special hours")
    end_time = models.TimeField(null=True, blank=True, help_text="End time for special hours")
    
    # Description
    reason = models.CharField(max_length=200, blank=True, help_text="Reason for closure or special hours")
    notes = models.TextField(blank=True, help_text="Additional notes")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['church', 'date']
        ordering = ['-date']
        verbose_name = "Availability"
        verbose_name_plural = "Availability"
    
    def __str__(self):
        if self.is_closed:
            return f"{self.church.name} - Closed on {self.date}"
        else:
            return f"{self.church.name} - {self.start_time}-{self.end_time} on {self.date}"
    
    @property
    def is_available(self):
        """Check if church is available on this date."""
        return not self.is_closed
    
    @property
    def display_text(self):
        """Return display text for this availability entry."""
        if self.is_closed:
            return f"Closed - {self.reason}" if self.reason else "Closed"
        else:
            return f"{self.start_time}-{self.end_time} - {self.reason}" if self.reason else f"{self.start_time}-{self.end_time}"


class DeclineReason(models.Model):
    """Customizable decline reasons per church for booking decisions."""
    church = models.ForeignKey('Church', on_delete=models.CASCADE, related_name='decline_reasons')
    label = models.CharField(max_length=200, help_text="Reason label shown when declining a booking")
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0, help_text="Sorting order (0 first)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['church', 'label']
        ordering = ['order', 'id']
        verbose_name = 'Decline Reason'
        verbose_name_plural = 'Decline Reasons'

    def __str__(self):
        return self.label


class Booking(models.Model):
    """Model for service booking/appointment requests."""
    STATUS_REQUESTED = 'requested'
    STATUS_REVIEWED = 'reviewed'
    STATUS_APPROVED = 'approved'
    STATUS_COMPLETED = 'completed'
    STATUS_DECLINED = 'declined'
    STATUS_CANCELED = 'canceled'
    STATUS_CHOICES = [
        (STATUS_REQUESTED, 'Requested'),
        (STATUS_REVIEWED, 'Reviewed'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_DECLINED, 'Declined'),
        (STATUS_CANCELED, 'Canceled'),
    ]

    code = models.CharField(max_length=20, unique=True, blank=True, help_text="Human-readable appointment ID e.g., APPT-0001")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name='bookings')
    service = models.ForeignKey(BookableService, on_delete=models.CASCADE, related_name='bookings')
    date = models.DateField(help_text="Requested date")
    start_time = models.TimeField(null=True, blank=True, help_text="Optional start time (slots to be implemented)")
    end_time = models.TimeField(null=True, blank=True, help_text="Optional end time")
    notes = models.TextField(blank=True, help_text="Notes provided by requester")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_REQUESTED)
    cancel_reason = models.CharField(max_length=200, blank=True, help_text="Reason when canceled/auto-canceled")
    decline_reason = models.CharField(max_length=200, blank=True, help_text="Reason when declined")
    
    # Payment fields
    payment_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('canceled', 'Canceled'),
        ('refunded', 'Refunded'),
    ], default='pending', help_text="Payment status")
    payment_method = models.CharField(max_length=20, choices=[
        ('paypal', 'PayPal'),
        ('stripe', 'Credit Card'),
        ('gcash', 'GCash'),
    ], blank=True, null=True, help_text="Payment method used")
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Payment amount")
    payment_transaction_id = models.CharField(max_length=200, blank=True, null=True, help_text="Payment gateway transaction ID")
    payment_date = models.DateTimeField(blank=True, null=True, help_text="Date when payment was completed")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status_changed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['service', 'date', 'status']),
            models.Index(fields=['church', 'status']),
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.code or 'APPT'} - {self.service.name} on {self.date} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new and not self.code:
            # Generate a unique code before saving
            # Get the highest existing ID to avoid conflicts
            last_booking = Booking.objects.order_by('-id').first()
            next_id = (last_booking.id + 1) if last_booking else 1
            self.code = f"APPT-{next_id:04d}"
            
            # Try to save, if code exists, increment and retry
            max_attempts = 10
            for attempt in range(max_attempts):
                try:
                    super().save(*args, **kwargs)
                    break
                except Exception as e:
                    if 'UNIQUE constraint failed' in str(e) and attempt < max_attempts - 1:
                        # Code already exists, increment and try again
                        next_id += 1
                        self.code = f"APPT-{next_id:04d}"
                    else:
                        raise
        else:
            # For existing bookings, just save normally
            super().save(*args, **kwargs)

    @property
    def conflict_key(self):
        """Key used to detect conflicts (same church and date)."""
        return (self.church_id, self.date)

    def conflicts_qs(self):
        """Return other active bookings on same church/date considered conflicting."""
        active_statuses = [
            self.STATUS_REQUESTED,
            self.STATUS_REVIEWED,
            self.STATUS_APPROVED,
        ]
        return Booking.objects.filter(
            church=self.church,
            date=self.date,
            status__in=active_statuses
        ).exclude(pk=self.pk)


class Post(models.Model):
    POST_TYPE_CHOICES = [
        ('general', 'General Post'),
        ('photo', 'Photo Post'),
        ('event', 'Event Post'),
        ('prayer', 'Prayer Request'),
    ]
    
    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='posts/images/', blank=True, null=True)
    post_type = models.CharField(max_length=20, choices=POST_TYPE_CHOICES, default='general')
    
    # Event-specific fields
    event_title = models.CharField(max_length=200, blank=True, null=True, help_text="Title of the event")
    event_start_date = models.DateTimeField(blank=True, null=True, help_text="Event start date and time")
    event_end_date = models.DateTimeField(blank=True, null=True, help_text="Event end date and time")
    event_location = models.CharField(max_length=300, blank=True, null=True, help_text="Event location/venue")
    max_participants = models.PositiveIntegerField(blank=True, null=True, help_text="Maximum number of participants (optional)")
    
    # Donation
    enable_donation = models.BooleanField(default=False, help_text="Enable donations for this post")
    donation_goal = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Optional donation goal amount")
    
    view_count = models.PositiveIntegerField(default=0, help_text="Number of times this post has been viewed")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.church.name} - {self.content[:50]}..."
    
    def save(self, *args, **kwargs):
        """Override save to optimize post images before saving."""
        # Optimize image if present (max 1080px width x 1350px height, similar to Facebook feed)
        if self.image:
            # Check if this is a new upload (image has changed)
            if self.pk:
                try:
                    old_instance = Post.objects.get(pk=self.pk)
                    # Only optimize if the image has changed
                    if old_instance.image != self.image:
                        self.image = optimize_image(
                            self.image,
                            max_size=(1080, 1350),
                            quality=85,
                            format='JPEG'
                        )
                except Post.DoesNotExist:
                    # New post, optimize the image
                    self.image = optimize_image(
                        self.image,
                        max_size=(1080, 1350),
                        quality=85,
                        format='JPEG'
                    )
            else:
                # New post (no pk yet), optimize the image
                self.image = optimize_image(
                    self.image,
                    max_size=(1080, 1350),
                    quality=85,
                    format='JPEG'
                )
        
        super().save(*args, **kwargs)

    @property
    def time_ago(self):
        from django.utils import timezone
        now = timezone.now()
        diff = now - self.created_at

        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"
    
    @property
    def like_count(self):
        """Return the number of likes for this post."""
        # Use annotated value if available (optimization), otherwise count
        return getattr(self, 'likes_count', self.likes.count())
    
    @property
    def comment_count(self):
        """Return the number of comments for this post."""
        # Use annotated value if available (optimization), otherwise count
        return getattr(self, 'comments_count', self.comments.filter(is_active=True).count())
    
    def is_liked_by(self, user):
        """Check if the post is liked by a specific user."""
        if not user.is_authenticated:
            return False
        return self.likes.filter(user=user).exists()
    
    def is_bookmarked_by(self, user):
        """Check if the post is bookmarked by a specific user."""
        if not user.is_authenticated:
            return False
        return self.bookmarks.filter(user=user).exists()
    
    @property
    def bookmark_count(self):
        """Return the number of bookmarks for this post."""
        # Use annotated value if available (optimization), otherwise count
        return getattr(self, 'bookmarks_count', self.bookmarks.count())
    
    def get_donation_stats(self):
        """Get donation statistics for this post."""
        from django.db.models import Sum, Count
        
        completed_donations = self.donations.filter(payment_status='completed')
        
        stats = completed_donations.aggregate(
            total_raised=Sum('amount'),
            donor_count=Count('id', distinct=True)
        )
        
        total_raised = stats['total_raised'] or 0
        donor_count = stats['donor_count'] or 0
        
        progress_percentage = 0
        if self.donation_goal:
            progress_percentage = min((total_raised / self.donation_goal) * 100, 100)
        
        return {
            'total_raised': total_raised,
            'donor_count': donor_count,
            'goal': self.donation_goal,
            'progress_percentage': progress_percentage,
        }


class PostLike(models.Model):
    """Model for post likes."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'post']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} likes {self.post.church.name}'s post"


class PostBookmark(models.Model):
    """Model for post bookmarks/saved posts."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_bookmarks')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'post']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['post', 'created_at']),
        ]
        verbose_name = "Post Bookmark"
        verbose_name_plural = "Post Bookmarks"
    
    def __str__(self):
        return f"{self.user.get_full_name()} bookmarked {self.post.church.name}'s post"


class PostComment(models.Model):
    """Model for post comments."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField(max_length=500, help_text="Comment content")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', 'is_active']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} on {self.post.church.name}'s post"
    
    @property
    def is_reply(self):
        """Check if this comment is a reply to another comment."""
        return self.parent is not None
    
    @property
    def reply_count(self):
        """Return the number of replies to this comment."""
        return self.replies.filter(is_active=True).count()
    
    @property
    def time_ago(self):
        """Return human-readable time since comment was created."""
        from django.utils import timezone
        now = timezone.now()
        diff = now - self.created_at

        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"


class CommentLike(models.Model):
    """Model for comment likes."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_likes')
    comment = models.ForeignKey(PostComment, on_delete=models.CASCADE, related_name='comment_likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'comment']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['comment', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} likes comment by {self.comment.user.get_full_name()}"


class PostView(models.Model):
    """Model to track individual post views and prevent duplicate counting."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_views', null=True, blank=True)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='post_views')
    ip_address = models.GenericIPAddressField(help_text="IP address of the viewer")
    user_agent = models.TextField(max_length=500, help_text="User agent string")
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['post', 'viewed_at']),
            models.Index(fields=['user', 'viewed_at']),
            models.Index(fields=['ip_address', 'viewed_at']),
        ]
    
    def __str__(self):
        user_info = self.user.get_full_name() if self.user else f'Anonymous ({self.ip_address})'
        return f"{user_info} viewed {self.post.church.name}'s post"


class PostReport(models.Model):
    """Model for users reporting inappropriate posts."""
    
    REASON_CHOICES = [
        ('spam', 'Spam or misleading'),
        ('inappropriate', 'Inappropriate content'),
        ('harassment', 'Harassment or hate speech'),
        ('violence', 'Violence or dangerous content'),
        ('false_info', 'False information'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('reviewed', 'Reviewed'),
        ('dismissed', 'Dismissed'),
        ('action_taken', 'Action Taken'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_reports')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reports')
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField(help_text="Additional details about the report")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_reports')
    admin_notes = models.TextField(blank=True, help_text="Admin notes on the report")
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'post']  # Prevent duplicate reports from same user
        indexes = [
            models.Index(fields=['post', 'status']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} reported post by {self.post.church.name} - {self.get_reason_display()}"


class CommentReport(models.Model):
    """Model for users reporting inappropriate comments."""
    
    REASON_CHOICES = [
        ('spam', 'Spam or misleading'),
        ('inappropriate', 'Inappropriate content'),
        ('harassment', 'Harassment or hate speech'),
        ('violence', 'Violence or dangerous content'),
        ('false_info', 'False information'),
        ('offensive', 'Offensive language'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('reviewed', 'Reviewed'),
        ('dismissed', 'Dismissed'),
        ('action_taken', 'Action Taken'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_reports')
    comment = models.ForeignKey(PostComment, on_delete=models.CASCADE, related_name='reports')
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField(help_text="Additional details about the report")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_comment_reports')
    admin_notes = models.TextField(blank=True, help_text="Admin notes on the report")
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'comment']  # Prevent duplicate reports from same user
        indexes = [
            models.Index(fields=['comment', 'status']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} reported comment by {self.comment.user.get_full_name()} - {self.get_reason_display()}"


class ChurchVerificationRequest(models.Model):
    """A verification request submitted by a church owner with legal documents."""
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name='verification_requests')
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='church_verification_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    notes = models.TextField(blank=True, help_text='Admin review notes or rejection reason')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_verifications')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Church Verification Request'
        verbose_name_plural = 'Church Verification Requests'

    def __str__(self):
        return f"Verification for {self.church.name} ({self.get_status_display()})"


def verification_document_path(instance, filename):
    return f"churches/{instance.request.church.id}/verification/{filename}"


class ChurchVerificationDocument(models.Model):
    """Uploaded document for a ChurchVerificationRequest."""
    request = models.ForeignKey(ChurchVerificationRequest, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to=verification_document_path)
    title = models.CharField(max_length=200, blank=True, help_text='Optional document label')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']
        verbose_name = 'Church Verification Document'
        verbose_name_plural = 'Church Verification Documents'

    def __str__(self):
        return self.title or self.file.name


class Notification(models.Model):
    """Model for storing user notifications."""
    
    # Notification types
    TYPE_BOOKING_REQUESTED = 'booking_requested'
    TYPE_BOOKING_REVIEWED = 'booking_reviewed'
    TYPE_BOOKING_APPROVED = 'booking_approved'
    TYPE_BOOKING_DECLINED = 'booking_declined'
    TYPE_BOOKING_CANCELED = 'booking_canceled'
    TYPE_BOOKING_COMPLETED = 'booking_completed'
    TYPE_CHURCH_APPROVED = 'church_approved'
    TYPE_CHURCH_DECLINED = 'church_declined'
    TYPE_CHURCH_ASSIGNMENT = 'church_assignment'
    TYPE_FOLLOW_REQUEST = 'follow_request'
    TYPE_FOLLOW_ACCEPTED = 'follow_accepted'
    TYPE_MESSAGE_RECEIVED = 'message_received'
    
    TYPE_CHOICES = [
        (TYPE_BOOKING_REQUESTED, 'New Booking Request'),
        (TYPE_BOOKING_REVIEWED, 'Booking Reviewed'),
        (TYPE_BOOKING_APPROVED, 'Booking Approved'),
        (TYPE_BOOKING_DECLINED, 'Booking Declined'),
        (TYPE_BOOKING_CANCELED, 'Booking Canceled'),
        (TYPE_BOOKING_COMPLETED, 'Booking Completed'),
        (TYPE_CHURCH_APPROVED, 'Church Approved'),
        (TYPE_CHURCH_DECLINED, 'Church Declined'),
        (TYPE_CHURCH_ASSIGNMENT, 'Church Manager Assignment'),
        (TYPE_FOLLOW_REQUEST, 'Follow Request'),
        (TYPE_FOLLOW_ACCEPTED, 'Follow Accepted'),
        (TYPE_MESSAGE_RECEIVED, 'New Message'),
    ]
    
    # Priority levels
    PRIORITY_LOW = 'low'
    PRIORITY_MEDIUM = 'medium'
    PRIORITY_HIGH = 'high'
    PRIORITY_URGENT = 'urgent'
    
    PRIORITY_CHOICES = [
        (PRIORITY_LOW, 'Low'),
        (PRIORITY_MEDIUM, 'Medium'),
        (PRIORITY_HIGH, 'High'),
        (PRIORITY_URGENT, 'Urgent'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)
    
    # Related objects (optional)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    church = models.ForeignKey(Church, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    
    # Notification state
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'notification_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    @property
    def icon_class(self):
        """Return CSS class for notification icon based on type."""
        icon_map = {
            self.TYPE_BOOKING_REQUESTED: 'calendar-plus',
            self.TYPE_BOOKING_REVIEWED: 'check-circle',
            self.TYPE_BOOKING_APPROVED: 'check-circle',
            self.TYPE_BOOKING_DECLINED: 'x-circle',
            self.TYPE_BOOKING_CANCELED: 'calendar-x',
            self.TYPE_BOOKING_COMPLETED: 'check-circle-2',
            self.TYPE_CHURCH_APPROVED: 'church',
            self.TYPE_CHURCH_DECLINED: 'alert-circle',
            self.TYPE_FOLLOW_REQUEST: 'user-plus',
            self.TYPE_FOLLOW_ACCEPTED: 'users',
            self.TYPE_MESSAGE_RECEIVED: 'message-circle',
        }
        return icon_map.get(self.notification_type, 'bell')
    
    @property
    def color_class(self):
        """Return CSS class for notification color based on type and priority."""
        if self.priority == self.PRIORITY_URGENT:
            return 'urgent'
        elif self.priority == self.PRIORITY_HIGH:
            return 'high'
        elif self.notification_type in [self.TYPE_BOOKING_APPROVED, self.TYPE_CHURCH_APPROVED, self.TYPE_FOLLOW_ACCEPTED]:
            return 'success'
        elif self.notification_type in [self.TYPE_BOOKING_DECLINED, self.TYPE_CHURCH_DECLINED]:
            return 'error'
        elif self.notification_type in [self.TYPE_BOOKING_REQUESTED, self.TYPE_FOLLOW_REQUEST]:
            return 'info'
        else:
            return 'default'


class ServiceReview(models.Model):
    """Model for user reviews and ratings of church services."""
    
    RATING_CHOICES = [
        (1, '1 Star - Poor'),
        (2, '2 Stars - Fair'),
        (3, '3 Stars - Good'),
        (4, '4 Stars - Very Good'),
        (5, '5 Stars - Excellent'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='service_reviews')
    service = models.ForeignKey(BookableService, on_delete=models.CASCADE, related_name='reviews')
    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name='service_reviews')
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='review')
    
    rating = models.PositiveIntegerField(choices=RATING_CHOICES, help_text="Rating from 1 to 5 stars")
    title = models.CharField(max_length=200, help_text="Review title/summary")
    comment = models.TextField(help_text="Detailed review comment")
    
    # Optional additional ratings
    staff_rating = models.PositiveIntegerField(choices=RATING_CHOICES, null=True, blank=True, help_text="Staff friendliness")
    facility_rating = models.PositiveIntegerField(choices=RATING_CHOICES, null=True, blank=True, help_text="Facility quality")
    value_rating = models.PositiveIntegerField(choices=RATING_CHOICES, null=True, blank=True, help_text="Value for money")
    
    # Review status
    is_active = models.BooleanField(default=True, help_text="Whether this review is visible")
    is_anonymous = models.BooleanField(default=False, help_text="Hide reviewer name")
    
    # Helpful votes
    helpful_votes = models.PositiveIntegerField(default=0, help_text="Number of helpful votes")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'service']  # One review per user per service (but must have completed booking)
        indexes = [
            models.Index(fields=['service', '-created_at']),
            models.Index(fields=['church', '-created_at']),
            models.Index(fields=['rating', '-created_at']),
            models.Index(fields=['booking']),
        ]
        verbose_name = "Service Review"
        verbose_name_plural = "Service Reviews"
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.service.name} ({self.rating} stars)"
    
    @property
    def star_display(self):
        """Return star display for rating."""
        filled_stars = '★' * self.rating
        empty_stars = '☆' * (5 - self.rating)
        return filled_stars + empty_stars
    
    @property
    def reviewer_name(self):
        """Return reviewer name (anonymous if needed)."""
        if self.is_anonymous:
            return "Anonymous"
        return self.user.get_full_name() or self.user.username
    
    @property
    def is_verified_customer(self):
        """Check if this review is from a verified customer (has completed booking)."""
        return self.booking is not None and self.booking.status == 'completed'
    
    @property
    def reviewer_display_name(self):
        """Return reviewer name with verification status."""
        name = self.reviewer_name
        if self.is_verified_customer:
            return f"{name} (Verified Customer)"
        return name
    
    @property
    def average_rating(self):
        """Calculate average of all ratings."""
        ratings = [self.rating]
        if self.staff_rating:
            ratings.append(self.staff_rating)
        if self.facility_rating:
            ratings.append(self.facility_rating)
        if self.value_rating:
            ratings.append(self.value_rating)
        return sum(ratings) / len(ratings)


class ServiceReviewHelpful(models.Model):
    """Track helpful votes for service reviews."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='review_helpful_votes')
    review = models.ForeignKey(ServiceReview, on_delete=models.CASCADE, related_name='helpful_votes_records')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'review']
        verbose_name = "Review Helpful Vote"
        verbose_name_plural = "Review Helpful Votes"
    
    def __str__(self):
        return f"{self.user.username} found {self.review.id} helpful"


class UserInteraction(models.Model):
    """Track user interactions with posts, churches, and bookings."""
    
    # Activity Types
    ACTIVITY_POST_LIKE = 'post_like'
    ACTIVITY_POST_UNLIKE = 'post_unlike'
    ACTIVITY_POST_COMMENT = 'post_comment'
    ACTIVITY_POST_BOOKMARK = 'post_bookmark'
    ACTIVITY_POST_UNBOOKMARK = 'post_unbookmark'
    ACTIVITY_POST_VIEW = 'post_view'
    ACTIVITY_POST_SHARE = 'post_share'
    ACTIVITY_CHURCH_FOLLOW = 'church_follow'
    ACTIVITY_CHURCH_UNFOLLOW = 'church_unfollow'
    ACTIVITY_BOOKING_CREATE = 'booking_create'
    ACTIVITY_BOOKING_UPDATE = 'booking_update'
    ACTIVITY_BOOKING_CANCEL = 'booking_cancel'
    ACTIVITY_SERVICE_REVIEW = 'service_review'
    ACTIVITY_PROFILE_UPDATE = 'profile_update'
    ACTIVITY_LOGIN = 'login'
    ACTIVITY_LOGOUT = 'logout'
    
    ACTIVITY_CHOICES = [
        (ACTIVITY_POST_LIKE, 'Liked Post'),
        (ACTIVITY_POST_UNLIKE, 'Unliked Post'),
        (ACTIVITY_POST_COMMENT, 'Commented on Post'),
        (ACTIVITY_POST_BOOKMARK, 'Bookmarked Post'),
        (ACTIVITY_POST_UNBOOKMARK, 'Unbookmarked Post'),
        (ACTIVITY_POST_VIEW, 'Viewed Post'),
        (ACTIVITY_POST_SHARE, 'Shared Post'),
        (ACTIVITY_CHURCH_FOLLOW, 'Followed Church'),
        (ACTIVITY_CHURCH_UNFOLLOW, 'Unfollowed Church'),
        (ACTIVITY_BOOKING_CREATE, 'Created Booking'),
        (ACTIVITY_BOOKING_UPDATE, 'Updated Booking'),
        (ACTIVITY_BOOKING_CANCEL, 'Cancelled Booking'),
        (ACTIVITY_SERVICE_REVIEW, 'Reviewed Service'),
        (ACTIVITY_PROFILE_UPDATE, 'Updated Profile'),
        (ACTIVITY_LOGIN, 'Logged In'),
        (ACTIVITY_LOGOUT, 'Logged Out'),
    ]
    
    # Fields
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interactions')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional related objects (use Generic Foreign Key for flexibility)
    content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Additional context data (JSON field for metadata)
    metadata = models.JSONField(default=dict, blank=True)
    
    # IP address and user agent for tracking
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User Interaction'
        verbose_name_plural = 'User Interactions'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['activity_type', '-created_at']),
            models.Index(fields=['content_type', 'object_id']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_activity_type_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def activity_description(self):
        """Return a human-readable description of the activity."""
        descriptions = {
            self.ACTIVITY_POST_LIKE: "liked a post",
            self.ACTIVITY_POST_UNLIKE: "unliked a post", 
            self.ACTIVITY_POST_COMMENT: "commented on a post",
            self.ACTIVITY_POST_BOOKMARK: "saved a post",
            self.ACTIVITY_POST_UNBOOKMARK: "removed a saved post",
            self.ACTIVITY_POST_VIEW: "viewed a post",
            self.ACTIVITY_POST_SHARE: "shared a post",
            self.ACTIVITY_CHURCH_FOLLOW: "followed a church",
            self.ACTIVITY_CHURCH_UNFOLLOW: "unfollowed a church",
            self.ACTIVITY_BOOKING_CREATE: "created a booking",
            self.ACTIVITY_BOOKING_UPDATE: "updated a booking",
            self.ACTIVITY_BOOKING_CANCEL: "cancelled a booking",
            self.ACTIVITY_SERVICE_REVIEW: "reviewed a service",
            self.ACTIVITY_PROFILE_UPDATE: "updated their profile",
            self.ACTIVITY_LOGIN: "logged in",
            self.ACTIVITY_LOGOUT: "logged out",
        }
        return descriptions.get(self.activity_type, self.activity_type)
    
    @property
    def icon_class(self):
        """Return CSS icon class for the activity type."""
        icons = {
            self.ACTIVITY_POST_LIKE: 'heart',
            self.ACTIVITY_POST_UNLIKE: 'heart',
            self.ACTIVITY_POST_COMMENT: 'message-circle',
            self.ACTIVITY_POST_BOOKMARK: 'bookmark',
            self.ACTIVITY_POST_UNBOOKMARK: 'bookmark',
            self.ACTIVITY_POST_VIEW: 'eye',
            self.ACTIVITY_POST_SHARE: 'share',
            self.ACTIVITY_CHURCH_FOLLOW: 'user-plus',
            self.ACTIVITY_CHURCH_UNFOLLOW: 'user-minus',
            self.ACTIVITY_BOOKING_CREATE: 'calendar-plus',
            self.ACTIVITY_BOOKING_UPDATE: 'edit',
            self.ACTIVITY_BOOKING_CANCEL: 'calendar-x',
            self.ACTIVITY_SERVICE_REVIEW: 'star',
            self.ACTIVITY_PROFILE_UPDATE: 'user',
            self.ACTIVITY_LOGIN: 'log-in',
            self.ACTIVITY_LOGOUT: 'log-out',
        }
        return icons.get(self.activity_type, 'activity')
    
    @classmethod
    def log_activity(cls, user, activity_type, content_object=None, metadata=None, request=None):
        """
        Convenience method to log user activity.
        
        Args:
            user: User instance
            activity_type: Activity type from ACTIVITY_CHOICES
            content_object: Related object (Post, Church, Booking, etc.)
            metadata: Additional data as dict
            request: HTTP request for IP and user agent tracking
        """
        from django.contrib.contenttypes.models import ContentType
        
        activity_data = {
            'user': user,
            'activity_type': activity_type,
            'metadata': metadata or {},
        }
        
        # Add content object if provided
        if content_object:
            activity_data['content_type'] = ContentType.objects.get_for_model(content_object)
            activity_data['object_id'] = content_object.pk
        
        # Add request info if provided
        if request:
            activity_data['ip_address'] = cls._get_client_ip(request)
            activity_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')[:1000]  # Limit length
        
        return cls.objects.create(**activity_data)
    
    @staticmethod
    def _get_client_ip(request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class Donation(models.Model):
    """Model to track donations made to posts."""
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('paypal', 'PayPal'),
        ('stripe', 'Credit Card'),
        ('gcash', 'GCash'),
        ('paymongo', 'PayMongo'),
        ('bank', 'Bank Transfer'),
    ]
    
    # Core fields
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='donations')
    donor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='donations_made')
    
    # Donation details
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Donation amount")
    currency = models.CharField(max_length=3, default='PHP')
    message = models.TextField(blank=True, help_text="Optional message from donor")
    is_anonymous = models.BooleanField(default=False, help_text="Hide donor name from public")
    
    # Payment details
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='paypal')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # PayPal specific fields
    paypal_order_id = models.CharField(max_length=255, blank=True, null=True, unique=True, db_index=True)
    paypal_payer_id = models.CharField(max_length=255, blank=True, null=True)
    paypal_payer_email = models.EmailField(blank=True, null=True)
    paypal_transaction_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    
    # Stripe specific fields
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True, unique=True, db_index=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_payment_method_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['post', 'payment_status']),
        ]
        verbose_name = 'Donation'
        verbose_name_plural = 'Donations'
    
    def __str__(self):
        donor_name = self.get_donor_name()
        return f"{donor_name} donated ₱{self.amount} to {self.post.church.name}"
    
    def get_donor_name(self):
        """Get donor display name."""
        if self.is_anonymous:
            return "Anonymous"
        elif self.donor:
            # Try profile display_name first
            profile = getattr(self.donor, 'profile', None)
            if profile and profile.display_name:
                return profile.display_name
            # Fallback to user's full name if available
            if self.donor.first_name or self.donor.last_name:
                return self.donor.get_full_name().strip()
            # Final fallback to username
            return self.donor.username
        elif self.paypal_payer_email:
            return self.paypal_payer_email.split('@')[0]
        return "Anonymous"
    
    @property
    def is_completed(self):
        """Check if donation is completed."""
        return self.payment_status == 'completed'
    
    def mark_as_completed(self):
        """Mark donation as completed."""
        if self.payment_status != 'completed':
            self.payment_status = 'completed'
            self.completed_at = timezone.now()
            self.save(update_fields=['payment_status', 'completed_at', 'updated_at'])


class Conversation(models.Model):
    """Model representing a conversation between a user and a church."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'church']
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['-updated_at']),
            models.Index(fields=['user', 'church']),
        ]
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'
    
    def __str__(self):
        return f"{self.user.username} - {self.church.name}"
    
    def get_unread_count(self, user):
        """Get count of unread messages for a specific user."""
        return self.messages.filter(is_read=False).exclude(sender=user).count()
    
    def get_last_message(self):
        """Get the last message in this conversation."""
        return self.messages.last()


class Message(models.Model):
    """Model representing a message in a conversation."""
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(max_length=1000, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # File attachments
    attachment = models.FileField(upload_to='chat_attachments/%Y/%m/%d/', blank=True, null=True)
    attachment_type = models.CharField(max_length=20, blank=True, null=True, choices=[
        ('image', 'Image'),
        ('document', 'Document'),
        ('other', 'Other'),
    ])
    attachment_name = models.CharField(max_length=255, blank=True, null=True)
    attachment_size = models.IntegerField(blank=True, null=True)  # Size in bytes
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['conversation', 'is_read']),
        ]
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
    
    def __str__(self):
        if self.attachment:
            return f"{self.sender.username}: [Attachment] {self.content[:30]}"
        return f"{self.sender.username}: {self.content[:50]}"
    
    def mark_as_read(self):
        """Mark this message as read."""
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read'])
    
    def get_attachment_type(self):
        """Determine attachment type based on file extension."""
        if not self.attachment:
            return None
        
        ext = os.path.splitext(self.attachment.name)[1].lower()
        image_exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
        document_exts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt']
        
        if ext in image_exts:
            return 'image'
        elif ext in document_exts:
            return 'document'
        else:
            return 'other'
    
    def save(self, *args, **kwargs):
        """Auto-detect attachment type and name on save."""
        if self.attachment and not self.attachment_type:
            self.attachment_type = self.get_attachment_type()
        if self.attachment and not self.attachment_name:
            self.attachment_name = os.path.basename(self.attachment.name)
        if self.attachment and not self.attachment_size:
            try:
                self.attachment_size = self.attachment.size
            except:
                pass
        super().save(*args, **kwargs)
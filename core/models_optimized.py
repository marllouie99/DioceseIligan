"""
Optimized models with better performance and organization
This file contains optimized versions of the models with improved queries and structure
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from django.utils import timezone
from django.utils.text import slugify
from django.core.cache import cache
from .utils import optimize_image
import os

User = get_user_model()


class OptimizedChurch(models.Model):
    """Optimized Church model with better performance"""
    
    DENOMINATION_CHOICES = [
        ('catholic', 'Catholic'),
        ('protestant', 'Protestant'),
        ('baptist', 'Baptist'),
        ('methodist', 'Methodist'),
        ('presbyterian', 'Presbyterian'),
        ('lutheran', 'Lutheran'),
        ('pentecostal', 'Pentecostal'),
        ('evangelical', 'Evangelical'),
        ('orthodox', 'Orthodox'),
        ('adventist', 'Seventh-day Adventist'),
        ('mormon', 'Latter-day Saints'),
        ('jehovah', 'Jehovah\'s Witnesses'),
        ('other', 'Other'),
    ]
    
    SIZE_CHOICES = [
        ('small', 'Small (1-50 members)'),
        ('medium', 'Medium (51-200 members)'),
        ('large', 'Large (201-1000 members)'),
        ('mega', 'Mega (1000+ members)'),
    ]
    
    # Basic Information
    name = models.CharField(max_length=200, help_text="Church name", db_index=True)
    slug = models.SlugField(unique=True, help_text="URL-friendly version of the name", db_index=True)
    description = models.TextField(help_text="Brief description of the church")
    denomination = models.CharField(max_length=20, choices=DENOMINATION_CHOICES, default='other', db_index=True)
    size = models.CharField(max_length=10, choices=SIZE_CHOICES, default='medium', db_index=True)
    
    # Contact Information
    email = models.EmailField(help_text="Primary contact email", db_index=True)
    phone = models.CharField(
        max_length=20, 
        validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Enter a valid phone number.')],
        help_text="Primary contact phone number"
    )
    website = models.URLField(blank=True, null=True, help_text="Church website URL")
    
    # Location
    address = models.TextField(help_text="Street address")
    city = models.CharField(max_length=100, help_text="City", db_index=True)
    state = models.CharField(max_length=100, help_text="State/Province", db_index=True)
    country = models.CharField(max_length=100, default="Philippines", help_text="Country", db_index=True)
    postal_code = models.CharField(max_length=20, help_text="Postal/ZIP code", db_index=True)
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
    
    # Status and Ownership
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_churches', help_text="User who created/manages this church", db_index=True)
    is_verified = models.BooleanField(default=False, help_text="Whether this church is verified by administrators", db_index=True)
    is_active = models.BooleanField(default=True, help_text="Whether this church is currently active", db_index=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Statistics (cached)
    member_count = models.PositiveIntegerField(default=0, help_text="Approximate number of members")
    follower_count = models.PositiveIntegerField(default=0, help_text="Number of users following this church")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Church"
        verbose_name_plural = "Churches"
        indexes = [
            models.Index(fields=['is_active', 'is_verified']),
            models.Index(fields=['city', 'state']),
            models.Index(fields=['denomination', 'is_active']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Generate slug if not provided
        if not self.slug:
            self.slug = slugify(self.name)
            # Ensure uniqueness
            original_slug = self.slug
            counter = 1
            while OptimizedChurch.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        
        # Optimize images before saving
        if self.logo:
            logo_name = getattr(self.logo, 'name', '') or ''
            logo_base = os.path.splitext(os.path.basename(logo_name))[0]
            if '_optimized' not in logo_base:
                self.logo = optimize_image(self.logo, max_size=(400, 400))
        if self.cover_image:
            cover_name = getattr(self.cover_image, 'name', '') or ''
            cover_base = os.path.splitext(os.path.basename(cover_name))[0]
            if '_optimized' not in cover_base:
                self.cover_image = optimize_image(self.cover_image, max_size=(800, 600))
        
        super().save(*args, **kwargs)
        
        # Clear related caches
        cache.delete(f'church_{self.id}_follower_count')
        cache.delete(f'church_{self.id}_booking_counts_*')
    
    @property
    def full_address(self):
        """Return formatted full address."""
        return f"{self.address}, {self.city}, {self.state} {self.postal_code}, {self.country}"
    
    @property
    def initial(self):
        """Return first letter of church name for avatar."""
        return self.name[0].upper() if self.name else 'C'
    
    def get_absolute_url(self):
        """Return URL for church detail view."""
        from django.urls import reverse
        return reverse('core:church_detail', kwargs={'slug': self.slug})
    
    def get_cached_follower_count(self):
        """Get cached follower count"""
        cache_key = f'church_{self.id}_follower_count'
        count = cache.get(cache_key)
        if count is None:
            count = self.followers.count()
            cache.set(cache_key, count, 300)  # Cache for 5 minutes
        return count
    
    def update_follower_count(self):
        """Update follower count and cache"""
        self.follower_count = self.followers.count()
        self.save(update_fields=['follower_count'])
        cache.set(f'church_{self.id}_follower_count', self.follower_count, 300)
        return self.follower_count


class OptimizedBooking(models.Model):
    """Optimized Booking model with better performance"""
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

    code = models.CharField(max_length=20, unique=True, blank=True, help_text="Human-readable appointment ID e.g., APPT-0001", db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings', db_index=True)
    church = models.ForeignKey(OptimizedChurch, on_delete=models.CASCADE, related_name='bookings', db_index=True)
    service = models.ForeignKey('BookableService', on_delete=models.CASCADE, related_name='bookings', db_index=True)
    date = models.DateField(help_text="Requested date", db_index=True)
    start_time = models.TimeField(null=True, blank=True, help_text="Optional start time (slots to be implemented)")
    end_time = models.TimeField(null=True, blank=True, help_text="Optional end time")
    notes = models.TextField(blank=True, help_text="Notes provided by requester")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_REQUESTED, db_index=True)
    cancel_reason = models.CharField(max_length=200, blank=True, help_text="Reason when canceled/auto-canceled")
    decline_reason = models.CharField(max_length=200, blank=True, help_text="Reason when declined")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    status_changed_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['service', 'date', 'status']),
            models.Index(fields=['church', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['date', 'status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.code or 'APPT'} - {self.service.name} on {self.date} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.code:
            # Generate code after first save so 'id' is available
            self.code = f"APPT-{self.id:04d}"
            super().save(update_fields=['code'])
        
        # Clear related caches
        cache.delete(f'church_{self.church.id}_booking_counts_*')

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
        return OptimizedBooking.objects.filter(
            church=self.church,
            date=self.date,
            status__in=active_statuses
        ).exclude(pk=self.pk)


class OptimizedNotification(models.Model):
    """Optimized Notification model with better performance"""
    
    # Notification types
    TYPE_BOOKING_REQUESTED = 'booking_requested'
    TYPE_BOOKING_REVIEWED = 'booking_reviewed'
    TYPE_BOOKING_APPROVED = 'booking_approved'
    TYPE_BOOKING_DECLINED = 'booking_declined'
    TYPE_BOOKING_CANCELED = 'booking_canceled'
    TYPE_BOOKING_COMPLETED = 'booking_completed'
    TYPE_CHURCH_APPROVED = 'church_approved'
    TYPE_CHURCH_DECLINED = 'church_declined'
    TYPE_FOLLOW_REQUEST = 'follow_request'
    TYPE_FOLLOW_ACCEPTED = 'follow_accepted'
    
    TYPE_CHOICES = [
        (TYPE_BOOKING_REQUESTED, 'New Booking Request'),
        (TYPE_BOOKING_REVIEWED, 'Booking Reviewed'),
        (TYPE_BOOKING_APPROVED, 'Booking Approved'),
        (TYPE_BOOKING_DECLINED, 'Booking Declined'),
        (TYPE_BOOKING_CANCELED, 'Booking Canceled'),
        (TYPE_BOOKING_COMPLETED, 'Booking Completed'),
        (TYPE_CHURCH_APPROVED, 'Church Approved'),
        (TYPE_CHURCH_DECLINED, 'Church Declined'),
        (TYPE_FOLLOW_REQUEST, 'Follow Request'),
        (TYPE_FOLLOW_ACCEPTED, 'Follow Accepted'),
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
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', db_index=True)
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES, db_index=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM, db_index=True)
    
    # Related objects (optional)
    booking = models.ForeignKey(OptimizedBooking, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications', db_index=True)
    church = models.ForeignKey(OptimizedChurch, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications', db_index=True)
    
    # Notification state
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'notification_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['priority', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
            
            # Clear related caches
            cache.delete(f'user_{self.user.id}_notification_counts_*')
    
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


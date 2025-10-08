from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import os
import random
import string
from datetime import timedelta
from core.utils import optimize_image

User = get_user_model()


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    bio = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['user__username']

    def __str__(self) -> str:
        return self.display_name or self.user.get_username()
    
    def save(self, *args, **kwargs):
        import logging
        from django.conf import settings
        from django.core.files.storage import default_storage
        
        logger = logging.getLogger(__name__)
        logger.error(f"[Profile.save] Starting save - DEFAULT_FILE_STORAGE: {settings.DEFAULT_FILE_STORAGE}")
        
        # Optimize profile image before saving
        if self.profile_image and hasattr(self.profile_image, 'file'):
            # Only optimize if not already optimized (avoid repeated processing and name growth)
            name = getattr(self.profile_image, 'name', '') or ''
            base = os.path.splitext(os.path.basename(name))[0]
            logger.error(f"[Profile.save] Image name: {name}, base: {base}")
            
            if '_optimized' not in base:
                try:
                    logger.error("[Profile.save] Optimizing image...")
                    optimized_content = optimize_image(self.profile_image, max_size=(400, 400))
                    
                    # Save using field's save method which uses the field's storage backend
                    logger.error(f"[Profile.save] Saving optimized image: {optimized_content.name}")
                    self.profile_image.save(optimized_content.name, optimized_content, save=False)
                    logger.error(f"[Profile.save] Image saved successfully!")
                except Exception as e:
                    logger.error(f"[Profile.save] ERROR optimizing image: {e}", exc_info=True)
        
        super().save(*args, **kwargs)
        
        # Log final URL
        if self.profile_image:
            logger.error(f"[Profile.save] Final image URL: {self.profile_image.url}")


class EmailVerification(models.Model):
    """Model for email verification codes during registration"""
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    ip_address = models.GenericIPAddressField(null=True, blank=True, help_text="IP address when code was generated")
    user_agent = models.TextField(max_length=500, blank=True, help_text="User agent string")
    device_info = models.CharField(max_length=200, blank=True, help_text="Device information")
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Set expiration time to 15 minutes from creation
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=15)
        super().save(*args, **kwargs)
    
    @classmethod
    def generate_code(cls, email):
        """Generate a new verification code for an email"""
        # Clean up old codes for this email (case-insensitive)
        cls.objects.filter(email__iexact=email, created_at__lt=timezone.now() - timedelta(hours=1)).delete()
        
        # Generate 6-digit code
        code = ''.join(random.choices(string.digits, k=6))
        
        # Create verification record
        verification = cls.objects.create(
            email=email,
            code=code
        )
        return verification
    
    def is_valid(self):
        """Check if the verification code is still valid"""
        return (
            not self.is_used and 
            timezone.now() < self.expires_at and
            self.attempts < 5  # Maximum 5 attempts
        )
    
    def mark_used(self):
        """Mark the verification code as used"""
        self.is_used = True
        self.save(update_fields=['is_used'])
    
    def increment_attempts(self):
        """Increment the number of verification attempts"""
        self.attempts += 1
        self.save(update_fields=['attempts'])
    
    @classmethod
    def verify_code(cls, email, code):
        """Verify a code for an email"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            verification = cls.objects.filter(
                email__iexact=email,
                code=code,
                is_used=False
            ).latest('created_at')
            
            logger.info(f"=== EMAIL VERIFICATION CODE CHECK ===")
            logger.info(f"Email: {email}")
            logger.info(f"Code: {code}")
            logger.info(f"Found verification: {verification}")
            logger.info(f"Is valid: {verification.is_valid()}")
            logger.info(f"Is used: {verification.is_used}")
            logger.info(f"Attempts: {verification.attempts}")
            logger.info(f"Expires at: {verification.expires_at}")
            logger.info(f"Current time: {timezone.now()}")
            logger.info("======================================")
            
            verification.increment_attempts()
            
            if verification.is_valid():
                verification.mark_used()
                logger.info(f"Verification code for {email} verified successfully")
                return True
            
            logger.warning(f"Verification code for {email} is invalid: is_used={verification.is_used}, expired={timezone.now() >= verification.expires_at}, attempts={verification.attempts}")
            return False
            
        except cls.DoesNotExist:
            logger.error(f"=== EMAIL VERIFICATION CODE NOT FOUND ===")
            logger.error(f"Email: {email}")
            logger.error(f"Code: {code}")
            # Show all recent codes for this email for debugging
            recent_codes = cls.objects.filter(email=email).order_by('-created_at')[:5]
            logger.error(f"Recent codes for this email: {list(recent_codes.values_list('code', 'is_used', 'created_at'))}")
            logger.error("==========================================")
            return False
    
    def __str__(self):
        return f"Verification for {self.email} - {self.code}"


class PasswordReset(models.Model):
    """Model for password reset codes"""
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    ip_address = models.GenericIPAddressField(null=True, blank=True, help_text="IP address when code was generated")
    user_agent = models.TextField(max_length=500, blank=True, help_text="User agent string")
    device_info = models.CharField(max_length=200, blank=True, help_text="Device information")
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Set expiration time to 15 minutes from creation
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=15)
        super().save(*args, **kwargs)
    
    @classmethod
    def generate_code(cls, email):
        """Generate a new password reset code for an email"""
        # Clean up old codes for this email
        cls.objects.filter(email=email, created_at__lt=timezone.now() - timedelta(hours=1)).delete()
        
        # Generate 6-digit code
        code = ''.join(random.choices(string.digits, k=6))
        
        # Create password reset record
        reset = cls.objects.create(
            email=email,
            code=code
        )
        return reset
    
    def is_valid(self):
        """Check if the password reset code is still valid"""
        return (
            not self.is_used and 
            timezone.now() < self.expires_at and
            self.attempts < 5  # Maximum 5 attempts
        )
    
    def mark_used(self):
        """Mark the password reset code as used"""
        self.is_used = True
        self.save(update_fields=['is_used'])
    
    def increment_attempts(self):
        """Increment the number of reset attempts"""
        self.attempts += 1
        self.save(update_fields=['attempts'])
    
    @classmethod
    def verify_code(cls, email, code):
        """Verify a password reset code for an email"""
        from django.conf import settings
        try:
            reset = cls.objects.filter(
                email=email,
                code=code,
                is_used=False
            ).latest('created_at')
            
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"=== PASSWORD RESET CODE VERIFICATION ===")
            logger.error(f"Email: {email}")
            logger.error(f"Code: {code}")
            logger.error(f"Found reset object: {reset}")
            logger.error(f"Is valid: {reset.is_valid()}")
            logger.error(f"Is used: {reset.is_used}")
            logger.error(f"Attempts: {reset.attempts}")
            logger.error(f"Expires at: {reset.expires_at}")
            logger.error("==========================================")
            
            reset.increment_attempts()
            
            if reset.is_valid():
                reset.mark_used()
                return True
            return False
            
        except cls.DoesNotExist:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"=== PASSWORD RESET CODE NOT FOUND ===")
            logger.error(f"Email: {email}")
            logger.error(f"Code: {code}")
            logger.error("=====================================")
            return False
    
    def __str__(self):
        return f"Password Reset for {self.email} - {self.code}"


class LoginCode(models.Model):
    """Model for passwordless login codes"""
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    ip_address = models.GenericIPAddressField(null=True, blank=True, help_text="IP address when code was generated")
    user_agent = models.TextField(max_length=500, blank=True, help_text="User agent string")
    device_info = models.CharField(max_length=200, blank=True, help_text="Device information")
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Set expiration time to 15 minutes from creation
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=15)
        super().save(*args, **kwargs)
    
    @classmethod
    def generate_code(cls, email):
        """Generate a new login code for an email"""
        # Clean up old codes for this email
        cls.objects.filter(email=email, created_at__lt=timezone.now() - timedelta(hours=1)).delete()
        
        # Generate 6-digit code
        code = ''.join(random.choices(string.digits, k=6))
        
        # Create login code record
        login_code = cls.objects.create(
            email=email,
            code=code
        )
        return login_code
    
    def is_valid(self):
        """Check if the login code is still valid"""
        return (
            not self.is_used and 
            timezone.now() < self.expires_at and
            self.attempts < 5  # Maximum 5 attempts
        )
    
    def mark_used(self):
        """Mark the login code as used"""
        self.is_used = True
        self.save(update_fields=['is_used'])
    
    def increment_attempts(self):
        """Increment the number of login attempts"""
        self.attempts += 1
        self.save(update_fields=['attempts'])
    
    @classmethod
    def verify_code(cls, email, code):
        """Verify a login code for an email"""
        try:
            login_code = cls.objects.filter(
                email=email,
                code=code,
                is_used=False
            ).latest('created_at')
            
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"=== LOGIN CODE VERIFICATION ===")
            logger.error(f"Email: {email}")
            logger.error(f"Code: {code}")
            logger.error(f"Found login code object: {login_code}")
            logger.error(f"Is valid: {login_code.is_valid()}")
            logger.error(f"Is used: {login_code.is_used}")
            logger.error(f"Attempts: {login_code.attempts}")
            logger.error(f"Expires at: {login_code.expires_at}")
            logger.error("================================")
            
            login_code.increment_attempts()
            
            if login_code.is_valid():
                login_code.mark_used()
                return True
            return False
            
        except cls.DoesNotExist:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"=== LOGIN CODE NOT FOUND ===")
            logger.error(f"Email: {email}")
            logger.error(f"Code: {code}")
            logger.error("=============================")
            return False
    
    def __str__(self):
        return f"Login Code for {self.email} - {self.code}"


class UserActivity(models.Model):
    """Model to track user registration and login activities"""
    
    ACTIVITY_TYPE_CHOICES = [
        ('registration_started', 'Registration Started'),
        ('email_verification_sent', 'Email Verification Sent'),
        ('email_verification_completed', 'Email Verification Completed'),
        ('registration_completed', 'Registration Completed'),
        ('login_success', 'Login Success'),
        ('login_failed', 'Login Failed'),
        ('password_reset_request', 'Password Reset Request'),
        ('password_reset_completed', 'Password Reset Completed'),
        ('login_code_request', 'Login Code Request'),
        ('login_code_success', 'Login Code Success'),
        ('login_code_failed', 'Login Code Failed'),
        ('profile_updated', 'Profile Updated'),
    ]
    
    # User information
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    email = models.EmailField(help_text="Email associated with the activity")
    
    # Activity details
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPE_CHOICES)
    success = models.BooleanField(default=True, help_text="Whether the activity was successful")
    details = models.TextField(blank=True, help_text="Additional activity details or error messages")
    
    # Request information
    ip_address = models.GenericIPAddressField(help_text="IP address of the request")
    user_agent = models.TextField(max_length=500, help_text="User agent string")
    device_info = models.CharField(max_length=200, blank=True, help_text="Parsed device information")
    browser_info = models.CharField(max_length=200, blank=True, help_text="Browser information")
    os_info = models.CharField(max_length=200, blank=True, help_text="Operating system information")
    
    # Location information (optional)
    country = models.CharField(max_length=100, blank=True, help_text="Country based on IP")
    city = models.CharField(max_length=100, blank=True, help_text="City based on IP")
    
    # Verification code tracking
    verification_code = models.CharField(max_length=6, blank=True, help_text="Associated verification code if any")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['email', 'created_at']),
            models.Index(fields=['ip_address', 'created_at']),
            models.Index(fields=['activity_type', 'created_at']),
        ]
        verbose_name = "User Activity"
        verbose_name_plural = "User Activities"
    
    def __str__(self):
        user_info = self.user.get_full_name() if self.user else self.email
        return f"{user_info} - {self.get_activity_type_display()} ({self.created_at})"
    
    @property
    def display_name(self):
        """Return display name for the user"""
        if self.user:
            return self.user.get_full_name() or self.user.username
        return self.email
    
    @property
    def status_display(self):
        """Return success/failure status display"""
        return "Success" if self.success else "Failed"
    
    @classmethod
    def log_activity(cls, activity_type, email, ip_address=None, user_agent=None, user=None, 
                     success=True, details="", verification_code="", **kwargs):
        """Helper method to log user activities"""
        activity = cls.objects.create(
            user=user,
            email=email,
            activity_type=activity_type,
            success=success,
            details=details,
            ip_address=ip_address or '127.0.0.1',
            user_agent=user_agent or '',
            verification_code=verification_code,
            device_info=kwargs.get('device_info', ''),
            browser_info=kwargs.get('browser_info', ''),
            os_info=kwargs.get('os_info', ''),
            country=kwargs.get('country', ''),
            city=kwargs.get('city', ''),
        )
        return activity

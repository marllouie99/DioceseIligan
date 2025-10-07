from django.contrib import admin
from .models import (
    Profile,
    EmailVerification,
    PasswordReset,
    LoginCode,
    UserActivity,
)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        'user_username', 'user_email', 'display_name', 'phone', 'date_of_birth', 'created_at',
    )
    search_fields = (
        'user__username', 'user__email', 'display_name', 'phone',
    )
    list_filter = ('date_of_birth', 'created_at')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('user',)

    def user_username(self, obj):
        return obj.user.get_username()

    user_username.short_description = 'Username'

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'


@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('email', 'code', 'is_used', 'attempts', 'created_at', 'expires_at', 'is_expired')
    list_filter = ('is_used', 'created_at', 'expires_at')
    search_fields = ('email', 'code', 'ip_address')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    def is_expired(self, obj):
        from django.utils import timezone
        return timezone.now() > obj.expires_at
    is_expired.boolean = True
    is_expired.short_description = 'Expired'
    
    fieldsets = (
        ('Verification Details', {
            'fields': ('email', 'code', 'is_used', 'attempts')
        }),
        ('Request Info', {
            'fields': ('ip_address', 'user_agent', 'device_info'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at')
        }),
    )


@admin.register(PasswordReset)
class PasswordResetAdmin(admin.ModelAdmin):
    list_display = ('email', 'code', 'is_used', 'created_at', 'expires_at', 'is_expired')
    list_filter = ('is_used', 'created_at', 'expires_at')
    search_fields = ('email', 'code')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    def is_expired(self, obj):
        from django.utils import timezone
        return timezone.now() > obj.expires_at
    is_expired.boolean = True
    is_expired.short_description = 'Expired'
    
    fieldsets = (
        ('Reset Details', {
            'fields': ('email', 'code', 'is_used')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at')
        }),
    )


@admin.register(LoginCode)
class LoginCodeAdmin(admin.ModelAdmin):
    list_display = ('email', 'code', 'is_used', 'created_at', 'expires_at', 'is_expired')
    list_filter = ('is_used', 'created_at', 'expires_at')
    search_fields = ('email', 'code')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    def is_expired(self, obj):
        from django.utils import timezone
        return timezone.now() > obj.expires_at
    is_expired.boolean = True
    is_expired.short_description = 'Expired'
    
    fieldsets = (
        ('Login Code Details', {
            'fields': ('email', 'code', 'is_used')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at')
        }),
    )


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'email', 'activity_type', 'ip_address', 'user_agent_short', 'success', 'created_at')
    list_filter = ('activity_type', 'success', 'created_at')
    search_fields = ('user__username', 'user__email', 'email', 'ip_address', 'user_agent', 'details')
    autocomplete_fields = ('user',)
    readonly_fields = ('created_at',)
    list_select_related = ('user',)
    ordering = ('-created_at',)
    
    def user_agent_short(self, obj):
        return obj.user_agent[:60] if obj.user_agent else ''
    user_agent_short.short_description = 'User Agent'
    
    fieldsets = (
        ('Activity Information', {
            'fields': ('user', 'email', 'activity_type', 'success', 'details')
        }),
        ('Session Details', {
            'fields': ('ip_address', 'user_agent', 'device_info', 'browser_info', 'os_info'),
            'classes': ('collapse',)
        }),
        ('Location', {
            'fields': ('country', 'city'),
            'classes': ('collapse',)
        }),
        ('Additional Info', {
            'fields': ('verification_code',),
            'classes': ('collapse',)
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )

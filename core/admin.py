from django.contrib import admin
from .models import (
    Church,
    ChurchFollow,
    BookableService,
    ServiceImage,
    Availability,
    DeclineReason,
    Booking,
    Post,
    PostLike,
    PostBookmark,
    PostComment,
    PostView,
    PostReport,
    ChurchVerificationRequest,
    ChurchVerificationDocument,
    Notification,
    ServiceReview,
    ServiceReviewHelpful,
    UserInteraction,
    Donation,
)


@admin.register(Church)
class ChurchAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'city', 'state', 'owner', 'paypal_email', 'is_verified', 'is_active', 'created_at',
    )
    search_fields = (
        'name', 'city', 'state', 'email', 'paypal_email', 'owner__username',
    )
    list_filter = (
        'is_verified', 'is_active', 'denomination', 'size', 'city', 'created_at',
    )
    readonly_fields = ('created_at', 'updated_at')
    prepopulated_fields = { 'slug': ('name',) }
    autocomplete_fields = ('owner',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'denomination', 'size', 'owner')
        }),
        ('Contact Information', {
            'fields': ('email', 'phone', 'website')
        }),
        ('Location', {
            'fields': ('address', 'city', 'state', 'country', 'postal_code', 'latitude', 'longitude')
        }),
        ('Leadership', {
            'fields': ('pastor_name', 'pastor_email', 'pastor_phone')
        }),
        ('Media', {
            'fields': ('logo', 'cover_image')
        }),
        ('Services & Programs', {
            'fields': ('service_times', 'special_services', 'ministries')
        }),
        ('Social Media', {
            'fields': ('facebook_url', 'instagram_url', 'youtube_url', 'twitter_url')
        }),
        ('Payment & Donations', {
            'fields': ('paypal_email',),
            'description': 'PayPal email address for receiving donations from posts'
        }),
        ('Status & Metrics', {
            'fields': ('is_verified', 'is_active', 'member_count', 'follower_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class ServiceImageInline(admin.TabularInline):
    model = ServiceImage
    extra = 1


@admin.register(BookableService)
class BookableServiceAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'church', 'is_active', 'is_free', 'price', 'duration', 'created_at',
    )
    search_fields = ('name', 'church__name')
    list_filter = ('is_active', 'is_free', 'duration', 'church', 'created_at')
    autocomplete_fields = ('church',)
    inlines = [ServiceImageInline]


@admin.register(ServiceImage)
class ServiceImageAdmin(admin.ModelAdmin):
    list_display = ('service', 'order', 'is_primary', 'caption')
    list_filter = ('is_primary', 'service')
    search_fields = ('service__name', 'caption')
    autocomplete_fields = ('service',)


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ('church', 'date', 'type', 'is_closed')
    list_filter = ('type', 'is_closed', 'date', 'church')
    search_fields = ('church__name', 'reason', 'notes')
    autocomplete_fields = ('church',)


@admin.register(DeclineReason)
class DeclineReasonAdmin(admin.ModelAdmin):
    list_display = ('label', 'church', 'is_active', 'order', 'created_at')
    list_filter = ('is_active', 'church', 'created_at')
    search_fields = ('label', 'church__name')
    autocomplete_fields = ('church',)
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('church', 'order', 'id')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('church', 'label', 'is_active', 'order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'code', 'service', 'church', 'user', 'date', 'status', 'created_at',
    )
    list_filter = ('status', 'date', 'church', 'service', 'created_at')
    search_fields = ('code', 'service__name', 'church__name', 'user__username', 'user__email')
    autocomplete_fields = ('service', 'church', 'user')
    list_select_related = ('service', 'church', 'user')


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('church', 'short_content', 'is_active', 'created_at')
    list_filter = ('is_active', 'church', 'created_at')
    search_fields = ('church__name', 'content')
    autocomplete_fields = ('church',)

    def short_content(self, obj):
        return (obj.content or '')[:60]
    short_content.short_description = 'Content'


@admin.register(PostReport)
class PostReportAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'reason', 'status', 'created_at')
    list_filter = ('status', 'reason', 'created_at')
    search_fields = ('user__username', 'user__email', 'post__content', 'description')
    autocomplete_fields = ('user', 'post', 'reviewed_by')
    readonly_fields = ('created_at',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'post', 'post__church')


@admin.register(ChurchVerificationRequest)
class ChurchVerificationRequestAdmin(admin.ModelAdmin):
    list_display = ('church', 'status', 'submitted_by', 'reviewed_by', 'created_at')
    list_filter = ('status', 'church', 'created_at')
    search_fields = ('church__name', 'submitted_by__username', 'submitted_by__email', 'notes')
    autocomplete_fields = ('church', 'submitted_by', 'reviewed_by')
    date_hierarchy = 'created_at'


@admin.register(ChurchVerificationDocument)
class ChurchVerificationDocumentAdmin(admin.ModelAdmin):
    list_display = ('request', 'title', 'file', 'uploaded_at')
    search_fields = ('title', 'file')
    autocomplete_fields = ('request',)


@admin.register(ChurchFollow)
class ChurchFollowAdmin(admin.ModelAdmin):
    list_display = ('user', 'church', 'followed_at')
    list_filter = ('church', 'followed_at')
    search_fields = ('user__username', 'user__email', 'church__name')
    autocomplete_fields = ('user', 'church')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'notification_type', 'priority', 'is_read', 'created_at')
    list_filter = ('notification_type', 'priority', 'is_read', 'created_at')
    search_fields = ('user__username', 'user__email', 'title', 'message')
    autocomplete_fields = ('user', 'booking', 'church')
    list_select_related = ('user', 'booking', 'church')
    readonly_fields = ('created_at', 'updated_at', 'read_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'booking', 'church')


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'get_church', 'created_at')
    list_filter = ('created_at', 'post__church')
    search_fields = ('user__username', 'user__email', 'post__church__name', 'post__content')
    autocomplete_fields = ('user', 'post')
    readonly_fields = ('created_at',)
    list_select_related = ('user', 'post', 'post__church')
    
    def get_church(self, obj):
        return obj.post.church.name
    get_church.short_description = 'Church'
    get_church.admin_order_field = 'post__church__name'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'post', 'post__church')


@admin.register(PostBookmark)
class PostBookmarkAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'get_church', 'created_at')
    list_filter = ('created_at', 'post__church')
    search_fields = ('user__username', 'user__email', 'post__church__name', 'post__content')
    autocomplete_fields = ('user', 'post')
    readonly_fields = ('created_at',)
    list_select_related = ('user', 'post', 'post__church')
    
    def get_church(self, obj):
        return obj.post.church.name
    get_church.short_description = 'Church'
    get_church.admin_order_field = 'post__church__name'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'post', 'post__church')


@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'get_church', 'short_comment', 'parent', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at', 'post__church')
    search_fields = ('user__username', 'user__email', 'comment', 'post__church__name', 'post__content')
    autocomplete_fields = ('user', 'post', 'parent')
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('user', 'post', 'post__church', 'parent')
    
    def short_comment(self, obj):
        return obj.comment[:60] if obj.comment else ''
    short_comment.short_description = 'Comment'
    
    def get_church(self, obj):
        return obj.post.church.name
    get_church.short_description = 'Church'
    get_church.admin_order_field = 'post__church__name'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'post', 'post__church', 'parent')


@admin.register(PostView)
class PostViewAdmin(admin.ModelAdmin):
    list_display = ('get_user_info', 'post', 'get_church', 'ip_address', 'viewed_at')
    list_filter = ('viewed_at', 'post__church')
    search_fields = ('user__username', 'user__email', 'ip_address', 'post__church__name', 'session_key')
    autocomplete_fields = ('user', 'post')
    readonly_fields = ('viewed_at',)
    list_select_related = ('user', 'post', 'post__church')
    
    def get_user_info(self, obj):
        return obj.user.username if obj.user else f'Anonymous ({obj.ip_address})'
    get_user_info.short_description = 'User'
    
    def get_church(self, obj):
        return obj.post.church.name
    get_church.short_description = 'Church'
    get_church.admin_order_field = 'post__church__name'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'post', 'post__church')


@admin.register(ServiceReview)
class ServiceReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'service', 'church', 'rating', 'is_verified_customer', 'is_active', 'helpful_votes', 'created_at')
    list_filter = ('rating', 'is_active', 'is_anonymous', 'created_at', 'church', 'service')
    search_fields = ('user__username', 'user__email', 'service__name', 'church__name', 'title', 'comment')
    autocomplete_fields = ('user', 'service', 'church', 'booking')
    readonly_fields = ('created_at', 'updated_at', 'helpful_votes')
    list_select_related = ('user', 'service', 'church', 'booking')
    
    fieldsets = (
        ('Review Information', {
            'fields': ('user', 'service', 'church', 'booking', 'rating', 'title', 'comment', 'is_active', 'is_anonymous')
        }),
        ('Additional Ratings', {
            'fields': ('staff_rating', 'facility_rating', 'value_rating'),
            'classes': ('collapse',)
        }),
        ('Engagement', {
            'fields': ('helpful_votes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_verified_customer(self, obj):
        return obj.is_verified_customer
    is_verified_customer.boolean = True
    is_verified_customer.short_description = 'Verified'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'service', 'church', 'booking')


@admin.register(ServiceReviewHelpful)
class ServiceReviewHelpfulAdmin(admin.ModelAdmin):
    list_display = ('user', 'review', 'get_service', 'created_at')
    list_filter = ('created_at', 'review__service', 'review__church')
    search_fields = ('user__username', 'user__email', 'review__service__name', 'review__church__name')
    autocomplete_fields = ('user', 'review')
    readonly_fields = ('created_at',)
    list_select_related = ('user', 'review', 'review__service', 'review__church')
    
    def get_service(self, obj):
        return obj.review.service.name
    get_service.short_description = 'Service'
    get_service.admin_order_field = 'review__service__name'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'review', 'review__service', 'review__church')


@admin.register(UserInteraction)
class UserInteractionAdmin(admin.ModelAdmin):
    list_display = ('user', 'activity_type', 'get_related_object', 'ip_address', 'created_at')
    list_filter = ('activity_type', 'created_at')
    search_fields = ('user__username', 'user__email', 'ip_address', 'user_agent')
    autocomplete_fields = ('user',)
    readonly_fields = ('created_at', 'content_type', 'object_id', 'content_object')
    list_select_related = ('user', 'content_type')
    
    fieldsets = (
        ('Activity Information', {
            'fields': ('user', 'activity_type', 'created_at')
        }),
        ('Related Object', {
            'fields': ('content_type', 'object_id', 'content_object'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata', 'ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
    )
    
    def get_related_object(self, obj):
        if obj.content_object:
            return f'{obj.content_type.model}: {obj.content_object}'
        return 'N/A'
    get_related_object.short_description = 'Related To'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'content_type')


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_donor_name', 'amount', 'currency', 'post_church', 'payment_status', 'payment_method', 'created_at')
    list_filter = ('payment_status', 'payment_method', 'is_anonymous', 'created_at', 'currency')
    search_fields = ('donor__username', 'donor__email', 'post__church__name', 'paypal_transaction_id', 'paypal_payer_email')
    readonly_fields = ('created_at', 'updated_at', 'completed_at', 'paypal_order_id', 'paypal_transaction_id')
    autocomplete_fields = ('donor', 'post')
    list_select_related = ('donor', 'post', 'post__church')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Donation Information', {
            'fields': ('post', 'donor', 'amount', 'currency', 'message', 'is_anonymous')
        }),
        ('Payment Details', {
            'fields': ('payment_method', 'payment_status', 'paypal_order_id', 
                      'paypal_payer_id', 'paypal_transaction_id', 'paypal_payer_email')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def post_church(self, obj):
        """Get the church name from the post."""
        return obj.post.church.name
    post_church.short_description = 'Church'
    post_church.admin_order_field = 'post__church__name'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('donor', 'post', 'post__church')

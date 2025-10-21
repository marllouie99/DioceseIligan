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
    CommentLike,
    PostView,
    PostReport,
    ChurchVerificationRequest,
    ChurchVerificationDocument,
    Notification,
    ServiceReview,
    ServiceReviewHelpful,
    UserInteraction,
    Donation,
    Conversation,
    Message,
)


@admin.register(Church)
class ChurchAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'city_municipality', 'province', 'owner', 'paypal_email', 'is_verified', 'is_active', 'created_at',
    )
    search_fields = (
        'name', 'city_municipality', 'province', 'barangay', 'email', 'paypal_email', 'owner__username',
    )
    list_filter = (
        'is_verified', 'is_active', 'denomination', 'size', 'region', 'province', 'created_at',
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
        ('Location (Philippine Address)', {
            'fields': ('region', 'province', 'city_municipality', 'barangay', 'street_address', 'postal_code', 'latitude', 'longitude'),
            'description': 'New Philippine address structure used by the create church form'
        }),
        ('Location (Legacy)', {
            'fields': ('address', 'city', 'state', 'country'),
            'classes': ('collapse',),
            'description': 'Legacy address fields for backward compatibility - use Philippine Address fields above instead'
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
        'code', 'service', 'church', 'user', 'date', 'status', 'payment_status', 'payment_method', 'created_at',
    )
    list_filter = ('status', 'payment_status', 'payment_method', 'date', 'church', 'service', 'created_at')
    search_fields = ('code', 'service__name', 'church__name', 'user__username', 'user__email', 'payment_transaction_id')
    autocomplete_fields = ('service', 'church', 'user')
    list_select_related = ('service', 'church', 'user')
    fieldsets = (
        ('Booking Information', {
            'fields': ('code', 'user', 'church', 'service', 'date', 'start_time', 'end_time', 'notes')
        }),
        ('Status', {
            'fields': ('status', 'cancel_reason', 'decline_reason', 'status_changed_at')
        }),
        ('Payment Information', {
            'fields': ('payment_status', 'payment_method', 'payment_amount', 'payment_transaction_id', 'payment_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('code', 'payment_transaction_id', 'payment_date', 'created_at', 'updated_at', 'status_changed_at')


class DonationInline(admin.TabularInline):
    model = Donation
    extra = 0
    fields = ('donor', 'amount', 'currency', 'payment_status', 'payment_method', 'is_anonymous', 'created_at')
    readonly_fields = ('created_at',)
    autocomplete_fields = ('donor',)
    can_delete = False
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('donor')


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('church', 'short_content', 'enable_donation', 'total_donations', 'is_active', 'created_at')
    list_filter = ('is_active', 'enable_donation', 'church', 'created_at')
    search_fields = ('church__name', 'content')
    autocomplete_fields = ('church',)
    inlines = [DonationInline]

    def short_content(self, obj):
        return (obj.content or '')[:60]
    short_content.short_description = 'Content'
    
    def total_donations(self, obj):
        """Show total donations for this post."""
        stats = obj.get_donation_stats()
        if stats['total_raised']:
            return f"₱{stats['total_raised']:,.2f} ({stats['donor_count']} donors)"
        return "No donations yet"
    total_donations.short_description = 'Donations'


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


@admin.register(CommentLike)
class CommentLikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_comment_preview', 'get_post', 'get_church', 'created_at')
    list_filter = ('created_at', 'comment__post__church')
    search_fields = ('user__username', 'user__email', 'comment__content', 'comment__post__church__name')
    autocomplete_fields = ('user', 'comment')
    readonly_fields = ('created_at',)
    list_select_related = ('user', 'comment', 'comment__post', 'comment__post__church')
    
    def get_comment_preview(self, obj):
        return f"{obj.comment.content[:50]}..." if len(obj.comment.content) > 50 else obj.comment.content
    get_comment_preview.short_description = 'Comment'
    
    def get_post(self, obj):
        return f"{obj.comment.post.content[:40]}..."
    get_post.short_description = 'Post'
    
    def get_church(self, obj):
        return obj.comment.post.church.name
    get_church.short_description = 'Church'
    get_church.admin_order_field = 'comment__post__church__name'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'comment', 'comment__post', 'comment__post__church')


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


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ('sender', 'content', 'is_read', 'created_at')
    can_delete = False
    fields = ('sender', 'content', 'is_read', 'created_at')
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'church', 'message_count', 'unread_count_display', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'user__email', 'church__name')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('user', 'church')
    list_select_related = ('user', 'church')
    date_hierarchy = 'created_at'
    inlines = [MessageInline]
    
    fieldsets = (
        ('Conversation', {
            'fields': ('user', 'church')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def message_count(self, obj):
        """Get total message count."""
        return obj.messages.count()
    message_count.short_description = 'Messages'
    
    def unread_count_display(self, obj):
        """Get unread message count for user."""
        count = obj.get_unread_count(obj.user)
        if count > 0:
            return f'{count} unread'
        return 'All read'
    unread_count_display.short_description = 'Status'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'church').prefetch_related('messages')


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation_display', 'sender', 'content_preview', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('sender__username', 'content', 'conversation__user__username', 'conversation__church__name')
    readonly_fields = ('created_at',)
    autocomplete_fields = ('conversation', 'sender')
    list_select_related = ('conversation', 'conversation__user', 'conversation__church', 'sender')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Message', {
            'fields': ('conversation', 'sender', 'content', 'is_read')
        }),
        ('Timestamp', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def conversation_display(self, obj):
        """Display conversation participants."""
        return f"{obj.conversation.user.username} ↔ {obj.conversation.church.name}"
    conversation_display.short_description = 'Conversation'
    
    def content_preview(self, obj):
        """Show preview of message content."""
        if len(obj.content) > 50:
            return f"{obj.content[:50]}..."
        return obj.content
    content_preview.short_description = 'Content'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'conversation', 'conversation__user', 'conversation__church', 'sender'
        )

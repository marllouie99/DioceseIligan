from django.urls import path
from . import views
from . import api_views
from . import donation_views
from . import booking_payment_views
from . import chat_api

app_name = 'core'

urlpatterns = [
    path('', views.home, name='home'),
    path('discover/', views.discover, name='discover'),
    path('create-church/', views.create_church, name='create_church'),
    path('church/<slug:slug>/', views.church_detail, name='church_detail'),
    path('select-church/', views.select_church, name='select_church'),
    path('manage-church/', views.manage_church, name='manage_church'),
    path('manage-church/<int:church_id>/', views.manage_church, name='manage_church'),
    path('follow-church/<int:church_id>/', views.follow_church, name='follow_church'),
    path('unfollow-church/<int:church_id>/', views.unfollow_church, name='unfollow_church'),
    path('events/', views.events, name='events'),
    path('appointments/', views.appointments, name='appointments'),
    path('following/', views.following, name='following'),
    path('manage/', views.manage, name='manage'),
    path('settings/', views.settings_page, name='settings_page'),
    # Super Admin
    path('super-admin/', views.super_admin_dashboard, name='super_admin_dashboard'),
    path('super-admin/export/<str:format_type>/', views.super_admin_export, name='super_admin_export'),
    path('super-admin/profile/', views.super_admin_profile, name='super_admin_profile'),
    path('super-admin/toggle-mode/', views.toggle_super_admin_mode, name='toggle_super_admin_mode'),
    path('super-admin/churches/', views.super_admin_churches, name='super_admin_churches'),
    path('super-admin/churches/export/<str:format_type>/', views.super_admin_churches_export, name='super_admin_churches_export'),
    path('super-admin/churches/create/', views.super_admin_create_church, name='super_admin_create_church'),
    path('super-admin/churches/<int:church_id>/edit/', views.super_admin_edit_church, name='super_admin_edit_church'),
    path('api/user/<int:user_id>/profile/', views.api_user_profile, name='api_user_profile'),
    path('super-admin/users/', views.super_admin_users, name='super_admin_users'),
    path('super-admin/user-activities/', views.super_admin_user_activities, name='super_admin_user_activities'),
    path('super-admin/posts/', views.super_admin_posts, name='super_admin_posts'),
    path('super-admin/posts/engagement-data/', views.super_admin_posts_engagement_data, name='super_admin_posts_engagement_data'),
    path('super-admin/posts/stats-data/', views.super_admin_posts_stats_data, name='super_admin_posts_stats_data'),
    path('super-admin/posts/<int:post_id>/', views.super_admin_post_detail, name='super_admin_post_detail'),
    path('super-admin/posts/<int:post_id>/toggle-active/', views.super_admin_toggle_post_active, name='super_admin_toggle_post_active'),
    path('super-admin/posts/<int:post_id>/delete/', views.super_admin_delete_post, name='super_admin_delete_post'),
    path('super-admin/services/', views.super_admin_services, name='super_admin_services'),
    path('super-admin/services/booking-data/', views.super_admin_services_booking_data, name='super_admin_services_booking_data'),
    path('super-admin/services/stats-data/', views.super_admin_services_stats_data, name='super_admin_services_stats_data'),
    path('super-admin/categories/', views.super_admin_categories, name='super_admin_categories'),
    path('super-admin/categories/create/', views.super_admin_create_category, name='super_admin_create_category'),
    path('super-admin/categories/<int:category_id>/edit/', views.super_admin_edit_category, name='super_admin_edit_category'),
    path('super-admin/categories/<int:category_id>/delete/', views.super_admin_delete_category, name='super_admin_delete_category'),
    path('super-admin/categories/<int:category_id>/toggle/', views.super_admin_toggle_category, name='super_admin_toggle_category'),
    path('super-admin/categories/<int:category_id>/services/', views.super_admin_category_services, name='super_admin_category_services'),
    path('super-admin/bookings/', views.super_admin_bookings, name='super_admin_bookings'),
    path('super-admin/bookings/chart-data/', views.super_admin_bookings_chart_data, name='super_admin_bookings_chart_data'),
    path('super-admin/donations/', views.super_admin_donations, name='super_admin_donations'),
    path('super-admin/moderation/', views.super_admin_moderation, name='super_admin_moderation'),
    
    # Media updates (AJAX)
    path('settings/update-logo/', views.update_church_logo, name='update_church_logo'),
    path('settings/update-cover/', views.update_church_cover, name='update_church_cover'),
    # Verification (owner)
    path('verification/request/', views.request_verification, name='request_verification'),
    # Verification (super-admin)
    path('super-admin/verifications/', views.super_admin_verifications, name='super_admin_verifications'),
    path('super-admin/church/<int:church_id>/', views.super_admin_church_detail, name='super_admin_church_detail'),
    path('super-admin/verifications/<int:request_id>/approve/', views.approve_verification, name='approve_verification'),
    path('super-admin/verifications/<int:request_id>/reject/', views.reject_verification, name='reject_verification'),
    
    # Decline Reasons Management (owner)
    path('settings/decline-reasons/create/', views.create_decline_reason, name='create_decline_reason'),
    path('settings/decline-reasons/<int:reason_id>/delete/', views.delete_decline_reason, name='delete_decline_reason'),
    path('settings/decline-reasons/<int:reason_id>/toggle/', views.toggle_decline_reason, name='toggle_decline_reason'),
    
    # Bookable Services Management
    path('manage-services/', views.manage_services, name='manage_services'),
    path('create-service/', views.create_service, name='create_service'),
    path('edit-service/<int:service_id>/', views.edit_service, name='edit_service'),
    path('delete-service/<int:service_id>/', views.delete_service, name='delete_service'),
    path('manage-service-images/<int:service_id>/', views.manage_service_images, name='manage_service_images'),
    path('delete-service-image/<int:image_id>/', views.delete_service_image, name='delete_service_image'),
    path('service-gallery/<int:service_id>/', views.service_gallery, name='service_gallery'),
    path('book-service/<int:service_id>/', views.book_service, name='book_service'),
    path('manage-booking/<int:booking_id>/', views.manage_booking, name='manage_booking'),
    path('booking-invoice/<int:booking_id>/', views.booking_invoice, name='booking_invoice'),
    path('api/test/', views.api_test, name='api_test'),
    path('api/bookings/create/', views.create_booking_api, name='create_booking_api'),
    path('api/service/<int:service_id>/', views.api_get_service, name='api_get_service'),
    path('api/service-images/<int:service_id>/', views.api_service_images, name='api_service_images'),
    path('api/church/<int:church_id>/availability/', views.api_get_church_availability, name='api_get_church_availability'),
    path('api/church/<int:church_id>/services/', views.api_get_church_services, name='api_get_church_services'),
    
    # Availability Management
    path('manage-availability/', views.manage_availability, name='manage_availability'),
    path('create-availability/', views.create_availability, name='create_availability'),
    path('edit-availability/<int:availability_id>/', views.edit_availability, name='edit_availability'),
    path('delete-availability/<int:availability_id>/', views.delete_availability, name='delete_availability'),
    path('bulk-availability/', views.bulk_availability, name='bulk_availability'),
    
    # Posts
    path('create-post/<slug:church_slug>/', views.create_post, name='create_post'),
    path('dashboard/create-post/', views.dashboard_create_post, name='dashboard_create_post'),
    path('edit-post/<int:post_id>/', views.edit_post, name='edit_post'),
    path('posts/<int:post_id>/data/', views.get_post_data, name='get_post_data'),
    path('posts/<int:post_id>/analytics/', views.get_post_analytics, name='get_post_analytics'),
    path('posts/<int:post_id>/update/', views.update_post, name='update_post'),
    path('posts/<int:post_id>/delete/', views.delete_post, name='delete_post'),
    path('posts/<int:post_id>/report/', views.report_post, name='report_post'),
    
    # Post Interactions (AJAX)
    path('posts/<int:post_id>/like/', views.toggle_post_like, name='toggle_post_like'),
    path('posts/<int:post_id>/bookmark/', views.toggle_post_bookmark, name='toggle_post_bookmark'),
    path('posts/<int:post_id>/comment/', views.add_post_comment, name='add_post_comment'),
    path('posts/<int:post_id>/comments/', views.get_post_comments, name='get_post_comments'),
    path('posts/<int:post_id>/share/', views.share_post, name='share_post'),
    path('posts/<int:post_id>/view/', views.track_post_view, name='track_post_view'),
    path('comments/report/', views.report_comment, name='report_comment'),
    path('comments/<int:comment_id>/delete/', views.delete_reported_comment, name='delete_reported_comment'),
    path('comment-reports/<int:report_id>/dismiss/', views.dismiss_comment_report, name='dismiss_comment_report'),
    
    # Service Reviews
    path('service/<int:service_id>/review/', views.create_service_review, name='create_service_review'),
    path('service/<int:service_id>/reviews/', views.service_reviews, name='service_reviews'),
    path('review/<int:review_id>/helpful/', views.toggle_review_helpful, name='toggle_review_helpful'),
    
    # Notifications
    path('notifications/', views.notifications, name='notifications'),
    path('notifications/dropdown/', views.notification_dropdown, name='notification_dropdown'),
    path('notifications/<int:notification_id>/mark-read/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
    path('notifications/count/', views.notification_count, name='notification_count'),
    
    # User Activities
    path('my-activities/', views.user_activities, name='user_activities'),
    
    # API endpoints
    path('api/service/<int:service_id>/images/', views.service_images_api, name='service_images_api'),
    
    # Follower Management API endpoints
    path('api/followers/', api_views.followers_list_api, name='followers_list_api'),
    path('api/followers/<int:user_id>/stats/', api_views.follower_stats_api, name='follower_stats_api'),
    path('api/followers/<int:user_id>/activity/<str:activity_type>/', api_views.follower_activity_api, name='follower_activity_api'),
    path('api/interactions/log/', api_views.log_interaction_api, name='log_interaction_api'),
    path('api/followers/growth-chart/', api_views.follower_growth_chart_api, name='follower_growth_chart_api'),
    path('api/followers/engagement-chart/', api_views.engagement_levels_chart_api, name='engagement_levels_chart_api'),
    
    # Transaction/Revenue API endpoints
    path('api/transactions/revenue-chart/', api_views.revenue_trend_chart_api, name='revenue_trend_chart_api'),
    path('api/transactions/payment-methods-chart/', api_views.payment_methods_chart_api, name='payment_methods_chart_api'),
    
    # Donation API endpoints
    path('api/donations/trends-chart/', api_views.donation_trends_chart_api, name='donation_trends_chart_api'),
    
    # Content/Engagement API endpoints
    path('api/content/engagement-trends/', api_views.engagement_trends_chart_api, name='engagement_trends_chart_api'),
    
    # Booking/Appointments API endpoints
    path('api/bookings/trends-chart/', api_views.booking_trends_chart_api, name='booking_trends_chart_api'),
    path('api/bookings/popular-services-chart/', api_views.popular_services_chart_api, name='popular_services_chart_api'),
    
    # Overview API endpoints
    path('api/overview/follower-growth-chart/', api_views.overview_follower_growth_chart_api, name='overview_follower_growth_chart_api'),
    path('api/overview/weekly-engagement-chart/', api_views.overview_weekly_engagement_chart_api, name='overview_weekly_engagement_chart_api'),
    path('api/overview/revenue-chart/', api_views.overview_revenue_chart_api, name='overview_revenue_chart_api'),
    
    # Donation URLs (Orders API v2)
    path('donations/create/<int:post_id>/', donation_views.create_donation_order, name='create_donation'),
    path('donations/capture/<int:post_id>/', donation_views.capture_donation, name='capture_donation'),
    path('donations/cancel/<int:post_id>/', donation_views.cancel_donation, name='cancel_donation'),
    path('donations/success/<int:post_id>/', donation_views.donation_success, name='donation_success'),
    path('donations/failed/<int:post_id>/', donation_views.donation_failed, name='donation_failed'),
    path('donations/cancelled/<int:post_id>/', donation_views.donation_cancelled, name='donation_cancelled'),
    path('donations/webhook/', donation_views.paypal_webhook, name='paypal_webhook'),
    # Legacy (kept for backward compatibility)
    path('donations/execute/<int:post_id>/', donation_views.execute_donation, name='execute_donation'),
    
    # Stripe Donation URLs
    path('donations/stripe/create/<int:post_id>/', donation_views.create_stripe_payment_intent, name='create_stripe_payment'),
    path('donations/stripe/confirm/<int:post_id>/', donation_views.confirm_stripe_payment, name='confirm_stripe_payment'),
    path('donations/stripe/webhook/', donation_views.stripe_webhook, name='stripe_webhook'),
    
    # Chat API endpoints
    path('api/conversations/', chat_api.conversations_api, name='conversations_api'),
    path('api/conversations/<int:conversation_id>/messages/', chat_api.conversation_messages_api, name='conversation_messages_api'),
    path('api/conversations/<int:conversation_id>/read/', chat_api.mark_conversation_read, name='mark_conversation_read'),
    path('api/conversations/<int:conversation_id>/typing/', chat_api.conversation_typing, name='conversation_typing'),
    
    # Payment URLs (deprecated - keeping for backward compatibility)
    path('payment/gcash/<int:booking_id>/', views.gcash_payment, name='gcash_payment'),
    path('payment/paypal/<int:booking_id>/', views.paypal_payment, name='paypal_payment'),
    
    # Booking Payment API (PayPal)
    path('api/booking/<int:booking_id>/payment/create/', booking_payment_views.create_booking_payment_order, name='create_booking_payment'),
    path('api/booking/<int:booking_id>/payment/capture/', booking_payment_views.capture_booking_payment, name='capture_booking_payment'),
    
    # Booking Payment API (Stripe)
    path('api/booking/<int:booking_id>/payment/stripe/create/', booking_payment_views.create_stripe_booking_payment, name='create_stripe_booking_payment'),
    path('api/booking/<int:booking_id>/payment/stripe/confirm/', booking_payment_views.confirm_stripe_booking_payment, name='confirm_stripe_booking_payment'),
]

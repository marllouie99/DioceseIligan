from django.urls import path
from . import views
from . import ph_address_api

urlpatterns = [
    path('', views.landing, name='landing'),
    # Runtime static diagnostics (safe to keep for student project; can remove later)
    path('__static_debug__', views.static_debug, name='static_debug'),
    path('verify-email/', views.verify_email, name='verify_email'),
    path('resend-code/', views.resend_verification_code, name='resend_verification_code'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('password-reset-verify/', views.password_reset_verify, name='password_reset_verify'),
    path('password-reset-confirm/', views.password_reset_confirm, name='password_reset_confirm'),
    path('resend-reset-code/', views.resend_password_reset_code, name='resend_password_reset_code'),
    # Login with code (passwordless login)
    path('login-with-code/', views.login_with_code, name='login_with_code'),
    path('login-code-verify/', views.login_code_verify, name='login_code_verify'),
    path('resend-login-code/', views.resend_login_code, name='resend_login_code'),
    # Google OAuth
    path('google/', views.google_login, name='google_login'),
    path('google/callback/', views.google_callback, name='google_callback'),
    # API endpoints
    path('api/server-time/', views.server_time, name='server_time'),
    path('api/load-more-activities/', views.load_more_activities, name='load_more_activities'),
    # Philippine Address API
    path('api/ph-regions/', ph_address_api.get_regions, name='ph_regions'),
    path('api/ph-provinces/', ph_address_api.get_provinces, name='ph_provinces'),
    path('api/ph-cities/', ph_address_api.get_cities_municipalities, name='ph_cities'),
    path('api/ph-barangays/', ph_address_api.get_barangays, name='ph_barangays'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('profile/', views.manage_profile, name='manage_profile'),
    path('logout/', views.logout_view, name='app_logout'),
]

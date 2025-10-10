"""
Production settings for ChurchIligan project.
"""
from .base import *
import cloudinary
import cloudinary.uploader
import cloudinary.api

# Security settings
DEBUG = False
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HTTPS settings (uncomment when using HTTPS)
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True

# Static files for production - use WhiteNoise
# For Django 5.2+, STORAGES takes precedence over STATICFILES_STORAGE
# Make sure "staticfiles" storage uses WhiteNoise in production
try:
    STORAGES["staticfiles"]["BACKEND"] = 'whitenoise.storage.CompressedStaticFilesStorage'
except Exception:
    try:
        STORAGES
    except NameError:
        STORAGES = {}
    STORAGES = {
        **{
            "default": STORAGES.get("default", {"BACKEND": 'django.core.files.storage.FileSystemStorage'}),
        },
        **STORAGES,
        "staticfiles": {"BACKEND": 'whitenoise.storage.CompressedStaticFilesStorage'},
    }
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# Cache configuration for production
# Use local memory cache for Render free tier (no Redis available)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Email configuration for production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_USE_SSL = env.bool('EMAIL_USE_SSL', default=False)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
EMAIL_TIMEOUT = env.int('EMAIL_TIMEOUT', default=30)
# DEFAULT_FROM_EMAIL is set in base.py and loaded from environment

# Brevo API key for HTTP-based email (works better on restricted hosts like Render)
BREVO_API_KEY = env('BREVO_API_KEY', default='')

# Google OAuth configuration
GOOGLE_OAUTH_CLIENT_ID = env('GOOGLE_OAUTH_CLIENT_ID', default='')
GOOGLE_OAUTH_CLIENT_SECRET = env('GOOGLE_OAUTH_CLIENT_SECRET', default='')
GOOGLE_OAUTH_REDIRECT_URI = env('GOOGLE_OAUTH_REDIRECT_URI', default='')

# PayPal configuration
PAYPAL_CLIENT_ID = env('PAYPAL_CLIENT_ID', default='')
PAYPAL_CLIENT_SECRET = env('PAYPAL_CLIENT_SECRET', default='')
PAYPAL_MODE = env('PAYPAL_MODE', default='sandbox')  # 'sandbox' or 'live'
PAYPAL_CURRENCY = env('PAYPAL_CURRENCY', default='PHP')

# Cloudinary configuration for media storage (prevents file loss on Render deployments)
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': env('CLOUDINARY_CLOUD_NAME', default=''),
    'API_KEY': env('CLOUDINARY_API_KEY', default=''),
    'API_SECRET': env('CLOUDINARY_API_SECRET', default=''),
}

# Configure Cloudinary
cloudinary.config(
    cloud_name=CLOUDINARY_STORAGE['CLOUD_NAME'],
    api_key=CLOUDINARY_STORAGE['API_KEY'],
    api_secret=CLOUDINARY_STORAGE['API_SECRET'],
    secure=True
)

# Use Cloudinary for media files if configured
if CLOUDINARY_STORAGE['CLOUD_NAME']:
    # Important for Django 5.2+: STORAGES overrides DEFAULT_FILE_STORAGE
    try:
        STORAGES["default"]["BACKEND"] = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    except Exception:
        STORAGES = {
            "default": {"BACKEND": 'cloudinary_storage.storage.MediaCloudinaryStorage'},
            "staticfiles": STORAGES.get("staticfiles", {"BACKEND": 'django.contrib.staticfiles.storage.StaticFilesStorage'}),
        }
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    print(f"[Cloudinary] ✓ Configured with cloud_name: {CLOUDINARY_STORAGE['CLOUD_NAME']}")
    print(f"[Cloudinary] ✓ API_KEY: {CLOUDINARY_STORAGE['API_KEY'][:10]}...")
    print(f"[Cloudinary] ✓ DEFAULT_FILE_STORAGE: {DEFAULT_FILE_STORAGE}")
else:
    print("[Cloudinary] ✗ WARNING: Cloudinary not configured - CLOUDINARY_CLOUD_NAME is empty!")
    print(f"[Cloudinary] ✗ CLOUD_NAME value: '{CLOUDINARY_STORAGE['CLOUD_NAME']}'")

# Logging for production
LOGGING['handlers']['file'] = {
    'class': 'logging.FileHandler',
    'filename': BASE_DIR / 'logs' / 'django.log',
    'formatter': 'verbose',
}

LOGGING['root']['handlers'] = ['file', 'console']
LOGGING['loggers']['django']['handlers'] = ['file', 'console']
LOGGING['loggers']['django']['level'] = 'WARNING'

# Create logs directory if it doesn't exist
import os
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

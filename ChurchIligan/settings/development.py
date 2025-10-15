"""
Development settings for ChurchIligan project.
"""
from .base import *

# Debug settings
DEBUG = True

# Additional development apps
INSTALLED_APPS += [
    'django_extensions',
    'debug_toolbar',
]

# Additional development middleware
MIDDLEWARE += [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

# Debug toolbar configuration
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

"""
Email settings for development

By default, we use the console backend so emails print to the terminal.
If you want to send real emails locally (e.g., for login codes), set in .env:
  EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
and provide EMAIL_HOST, EMAIL_PORT, EMAIL_USE_TLS, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, DEFAULT_FROM_EMAIL.
"""

# Respect EMAIL_BACKEND from environment for flexibility
EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')

# If SMTP is selected, configure from environment variables
if EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
    EMAIL_HOST = env('EMAIL_HOST', default='smtp-relay.brevo.com')
    EMAIL_PORT = env.int('EMAIL_PORT', default=587)
    EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
    EMAIL_USE_SSL = env.bool('EMAIL_USE_SSL', default=False)
    EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
    EMAIL_TIMEOUT = env.int('EMAIL_TIMEOUT', default=10)
    DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER or 'webmaster@localhost')

# Disable cache in development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Logging for development
LOGGING['loggers']['django']['level'] = 'DEBUG'
LOGGING['loggers']['core'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
    'propagate': False,
}
LOGGING['loggers']['accounts'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
    'propagate': False,
}

# PayPal configuration for development
PAYPAL_CLIENT_ID = env('PAYPAL_CLIENT_ID', default='')
PAYPAL_CLIENT_SECRET = env('PAYPAL_CLIENT_SECRET', default='')
PAYPAL_MODE = env('PAYPAL_MODE', default='sandbox')
PAYPAL_CURRENCY = env('PAYPAL_CURRENCY', default='PHP')

# Stripe configuration for development
STRIPE_PUBLISHABLE_KEY = env('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_SECRET_KEY = env('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = env('STRIPE_WEBHOOK_SECRET', default='')

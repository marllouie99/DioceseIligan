from django.conf import settings


def static_version(request):
    """Expose STATIC_VERSION to templates for cache-busting static assets."""
    return {
        'STATIC_VERSION': getattr(settings, 'STATIC_VERSION', '1')
    }

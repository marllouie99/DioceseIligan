from django import template
from django.utils import timezone

register = template.Library()

@register.filter(name="compact_timesince")
def compact_timesince(value):
    """
    Compact relative time formatter.
    Examples: 1s, 10s, 1m, 15m, 1hr, 5hr, 1D, 3w, 2mo, 1y
    """
    if not value:
        return ""

    try:
        now = timezone.now()
        dt = value
        # Make aware if naive
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, timezone.get_current_timezone())
        delta = now - dt
        # Handle future gracefully
        total_seconds = int(abs(delta.total_seconds()))

        if total_seconds < 60:
            return f"{total_seconds}s"

        minutes = total_seconds // 60
        if minutes < 60:
            return f"{minutes}m"

        hours = minutes // 60
        if hours < 24:
            return f"{hours}hr"

        days = hours // 24
        if days < 7:
            return f"{days}D"

        weeks = days // 7
        if weeks < 5:
            return f"{weeks}w"

        months = days // 30
        if months < 12:
            return f"{months}mo"

        years = days // 365
        return f"{years}y"
    except Exception:
        # Fallback to blank on any parsing/formatting error
        return ""

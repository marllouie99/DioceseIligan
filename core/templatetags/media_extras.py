from django import template

register = template.Library()


def _normalize_name(name: str) -> str:
    try:
        n = (name or '').replace('\\', '/').lstrip('/')
        if n.startswith('media/'):
            n = n[len('media/') :]
        # Collapse doubled segments for churches paths
        while n.startswith('churches/logos/churches/logos/'):
            n = n[len('churches/logos/') :]
        while n.startswith('churches/covers/churches/covers/'):
            n = n[len('churches/covers/') :]
        return n
    except Exception:
        return name or ''


@register.filter(name='storage_url')
def storage_url(image_field):
    """
    Return robust URL using the field's storage after normalizing bad stored names.
    Usage: {{ church.logo|storage_url }}
    """
    try:
        f = image_field
        name = getattr(f, 'name', '')
        if not name:
            return ''
        normalized = _normalize_name(name)
        storage = getattr(f, 'storage', None)
        if storage:
            return storage.url(normalized)
    except Exception:
        pass
    # Fallbacks
    try:
        return image_field.url
    except Exception:
        return ''

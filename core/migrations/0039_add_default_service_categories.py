# Generated migration for adding default service categories

from django.db import migrations


def create_default_categories(apps, schema_editor):
    """Create default service categories."""
    ServiceCategory = apps.get_model('core', 'ServiceCategory')
    
    default_categories = [
        {
            'name': 'Sacraments',
            'slug': 'sacraments',
            'description': 'Sacred ceremonies and rituals including Baptism, Confirmation, Holy Communion, and more',
            'icon': '✝️',
            'color': '#8B5CF6',
            'order': 0,
            'is_active': True,
        },
        {
            'name': 'Counseling & Guidance',
            'slug': 'counseling-guidance',
            'description': 'Spiritual counseling, marriage preparation, and personal guidance sessions',
            'icon': '🤝',
            'color': '#3B82F6',
            'order': 1,
            'is_active': True,
        },
        {
            'name': 'Ceremonies & Events',
            'slug': 'ceremonies-events',
            'description': 'Wedding ceremonies, funeral services, blessing ceremonies, and special events',
            'icon': '🎊',
            'color': '#F59E0B',
            'order': 2,
            'is_active': True,
        },
        {
            'name': 'Educational Programs',
            'slug': 'educational-programs',
            'description': 'Bible study, catechism classes, religious education, and faith formation programs',
            'icon': '📖',
            'color': '#10B981',
            'order': 3,
            'is_active': True,
        },
        {
            'name': 'Prayer Services',
            'slug': 'prayer-services',
            'description': 'Mass intentions, prayer requests, novenas, and special prayer services',
            'icon': '🙏',
            'color': '#EC4899',
            'order': 4,
            'is_active': True,
        },
        {
            'name': 'Community Outreach',
            'slug': 'community-outreach',
            'description': 'Charitable activities, community service, and outreach programs',
            'icon': '❤️',
            'color': '#EF4444',
            'order': 5,
            'is_active': True,
        },
        {
            'name': 'Facility Rentals',
            'slug': 'facility-rentals',
            'description': 'Church hall rentals, venue bookings, and facility usage',
            'icon': '🏛️',
            'color': '#6366F1',
            'order': 6,
            'is_active': True,
        },
        {
            'name': 'Youth Ministry',
            'slug': 'youth-ministry',
            'description': 'Youth programs, activities, and faith formation for young people',
            'icon': '🌟',
            'color': '#14B8A6',
            'order': 7,
            'is_active': True,
        },
    ]
    
    for category_data in default_categories:
        # Only create if doesn't exist
        if not ServiceCategory.objects.filter(slug=category_data['slug']).exists():
            ServiceCategory.objects.create(**category_data)


def remove_default_categories(apps, schema_editor):
    """Remove default categories (reverse migration)."""
    ServiceCategory = apps.get_model('core', 'ServiceCategory')
    
    default_slugs = [
        'sacraments',
        'counseling-guidance',
        'ceremonies-events',
        'educational-programs',
        'prayer-services',
        'community-outreach',
        'facility-rentals',
        'youth-ministry',
    ]
    
    ServiceCategory.objects.filter(slug__in=default_slugs).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0038_add_service_category'),
    ]

    operations = [
        migrations.RunPython(create_default_categories, remove_default_categories),
    ]

"""
Migration to optimize database performance
Adds indexes and optimizes existing models for better query performance
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_booking_decline_reason_and_more'),
    ]

    operations = [
        # Add indexes for Church model
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_church_active_verified ON core_church(is_active, is_verified);",
            reverse_sql="DROP INDEX IF EXISTS idx_church_active_verified;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_church_city_state ON core_church(city, state);",
            reverse_sql="DROP INDEX IF EXISTS idx_church_city_state;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_church_denomination_active ON core_church(denomination, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_church_denomination_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_church_created_at ON core_church(created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_church_created_at;"
        ),
        
        # Add indexes for Booking model
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_booking_church_status ON core_booking(church_id, status);",
            reverse_sql="DROP INDEX IF EXISTS idx_booking_church_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_booking_user_status ON core_booking(user_id, status);",
            reverse_sql="DROP INDEX IF EXISTS idx_booking_user_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_booking_date_status ON core_booking(date, status);",
            reverse_sql="DROP INDEX IF EXISTS idx_booking_date_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_booking_created_at ON core_booking(created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_booking_created_at;"
        ),
        
        # Add indexes for Notification model
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_notification_user_read ON core_notification(user_id, is_read);",
            reverse_sql="DROP INDEX IF EXISTS idx_notification_user_read;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_notification_user_type ON core_notification(user_id, notification_type);",
            reverse_sql="DROP INDEX IF EXISTS idx_notification_user_type;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_notification_created_at ON core_notification(created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_notification_created_at;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_notification_priority_created ON core_notification(priority, created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_notification_priority_created;"
        ),
        
        # Add indexes for ChurchFollow model
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_churchfollow_user ON core_churchfollow(user_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_churchfollow_user;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_churchfollow_church ON core_churchfollow(church_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_churchfollow_church;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_churchfollow_followed_at ON core_churchfollow(followed_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_churchfollow_followed_at;"
        ),
        
        # Add indexes for BookableService model
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_bookableservice_church_active ON core_bookableservice(church_id, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_bookableservice_church_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_bookableservice_is_free ON core_bookableservice(is_free);",
            reverse_sql="DROP INDEX IF EXISTS idx_bookableservice_is_free;"
        ),
        
        # Add indexes for Post model
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_post_church_active ON core_post(church_id, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_post_church_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_post_created_at ON core_post(created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_post_created_at;"
        ),
        
        # Add indexes for ChurchVerificationRequest model
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_verification_status ON core_churchverificationrequest(status);",
            reverse_sql="DROP INDEX IF EXISTS idx_verification_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_verification_created_at ON core_churchverificationrequest(created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_verification_created_at;"
        ),
        
        # Add indexes for Availability model
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_availability_church_date ON core_availability(church_id, date);",
            reverse_sql="DROP INDEX IF EXISTS idx_availability_church_date;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_availability_is_closed ON core_availability(is_closed);",
            reverse_sql="DROP INDEX IF EXISTS idx_availability_is_closed;"
        ),
    ]


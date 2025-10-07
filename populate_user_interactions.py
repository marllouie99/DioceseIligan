#!/usr/bin/env python3
"""
Script to populate sample user interactions for testing the activity tracking system.
"""

import os
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import UserInteraction, Post, Church, Booking

User = get_user_model()

def create_sample_interactions():
    """Create sample user interactions for testing."""
    
    # Get some users and content objects
    users = list(User.objects.all()[:5])  # Get first 5 users
    posts = list(Post.objects.all()[:10])  # Get first 10 posts
    churches = list(Church.objects.all()[:5])  # Get first 5 churches
    bookings = list(Booking.objects.all()[:3])  # Get first 3 bookings
    
    if not users:
        print("No users found. Please create some users first.")
        return
    
    if not posts:
        print("No posts found. Please create some posts first.")
        return
        
    print(f"Found {len(users)} users, {len(posts)} posts, {len(churches)} churches, {len(bookings)} bookings")
    
    # Activity types and their weights (higher weight = more likely)
    activity_types = [
        (UserInteraction.ACTIVITY_POST_VIEW, 10),
        (UserInteraction.ACTIVITY_POST_LIKE, 8),
        (UserInteraction.ACTIVITY_POST_BOOKMARK, 5),
        (UserInteraction.ACTIVITY_POST_COMMENT, 6),
        (UserInteraction.ACTIVITY_CHURCH_FOLLOW, 4),
        (UserInteraction.ACTIVITY_BOOKING_CREATE, 2),
        (UserInteraction.ACTIVITY_POST_UNBOOKMARK, 2),
        (UserInteraction.ACTIVITY_POST_UNLIKE, 3),
        (UserInteraction.ACTIVITY_CHURCH_UNFOLLOW, 1),
    ]
    
    # Create activities for each user
    interactions_created = 0
    
    for user in users:
        # Create 10-20 activities per user
        num_activities = random.randint(10, 20)
        
        for _ in range(num_activities):
            # Choose random activity type based on weights
            activity_type = random.choices(
                [act[0] for act in activity_types],
                weights=[act[1] for act in activity_types]
            )[0]
            
            # Choose appropriate content object
            content_object = None
            metadata = {}
            
            if activity_type.startswith('post_'):
                if posts:
                    content_object = random.choice(posts)
                    if activity_type == UserInteraction.ACTIVITY_POST_COMMENT:
                        metadata = {
                            'comment_id': random.randint(1, 100),
                            'is_reply': random.choice([True, False])
                        }
            elif activity_type.startswith('church_'):
                if churches:
                    content_object = random.choice(churches)
            elif activity_type.startswith('booking_'):
                if bookings:
                    content_object = random.choice(bookings)
                    metadata = {
                        'booking_code': f'APPT-{random.randint(1000, 9999)}',
                        'service_name': 'Sample Service',
                        'church_name': content_object.church.name if hasattr(content_object, 'church') else 'Sample Church'
                    }
            
            # Generate random timestamp within last 30 days
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            created_at = timezone.now() - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
            
            # Create the interaction
            try:
                interaction = UserInteraction(
                    user=user,
                    activity_type=activity_type,
                    created_at=created_at,
                    metadata=metadata,
                    ip_address=f"192.168.1.{random.randint(1, 255)}",
                    user_agent="Mozilla/5.0 (Test Browser)"
                )
                
                if content_object:
                    from django.contrib.contenttypes.models import ContentType
                    interaction.content_type = ContentType.objects.get_for_model(content_object)
                    interaction.object_id = content_object.pk
                
                interaction.save()
                interactions_created += 1
                
            except Exception as e:
                print(f"Error creating interaction: {e}")
                continue
    
    print(f"\n✅ Successfully created {interactions_created} user interactions!")
    print(f"📊 Activity breakdown:")
    
    # Show breakdown by activity type
    for activity_type, _ in activity_types:
        count = UserInteraction.objects.filter(activity_type=activity_type).count()
        display_name = dict(UserInteraction.ACTIVITY_CHOICES)[activity_type]
        print(f"   • {display_name}: {count}")
    
    print(f"\n🔍 Recent activities for first user:")
    if users:
        recent = UserInteraction.objects.filter(user=users[0]).order_by('-created_at')[:5]
        for activity in recent:
            print(f"   • {activity.activity_description} - {activity.created_at}")


if __name__ == '__main__':
    print("🚀 Creating sample user interactions...")
    create_sample_interactions()
    print("✨ Done!")

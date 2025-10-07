#!/usr/bin/env python
"""
Script to create sample user activities for testing the dashboard sidebar.
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import UserActivity
from django.utils import timezone

User = get_user_model()

def create_sample_activities():
    """Create sample user activities for testing."""
    
    # Get the first user (or create one if none exists)
    try:
        user = User.objects.first()
        if not user:
            print("No users found. Please create a user first.")
            return
    except Exception as e:
        print(f"Error getting user: {e}")
        return
    
    # Clear existing activities for this user
    UserActivity.objects.filter(user=user).delete()
    
    # Create sample activities with different timestamps
    activities = [
        {
            'activity_type': 'login_success',
            'success': True,
            'details': 'User logged in successfully',
            'created_at': timezone.now() - timedelta(minutes=30)
        },
        {
            'activity_type': 'profile_updated',
            'success': True,
            'details': 'Profile information updated',
            'created_at': timezone.now() - timedelta(hours=2)
        },
        {
            'activity_type': 'login_success',
            'success': True,
            'details': 'User logged in successfully',
            'created_at': timezone.now() - timedelta(hours=6)
        },
        {
            'activity_type': 'password_reset_request',
            'success': True,
            'details': 'Password reset requested',
            'created_at': timezone.now() - timedelta(days=1)
        },
        {
            'activity_type': 'login_failed',
            'success': False,
            'details': 'Invalid credentials provided',
            'created_at': timezone.now() - timedelta(days=2)
        },
    ]
    
    created_count = 0
    for activity_data in activities:
        try:
            activity = UserActivity.objects.create(
                user=user,
                email=user.email,
                activity_type=activity_data['activity_type'],
                success=activity_data['success'],
                details=activity_data['details'],
                ip_address='127.0.0.1',
                user_agent='Test User Agent',
                created_at=activity_data['created_at']
            )
            created_count += 1
            print(f"Created activity: {activity.get_activity_type_display()} - {activity.created_at}")
        except Exception as e:
            print(f"Error creating activity: {e}")
    
    print(f"\nSuccessfully created {created_count} sample activities for user: {user.username}")

if __name__ == '__main__':
    create_sample_activities()

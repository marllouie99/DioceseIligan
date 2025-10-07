#!/usr/bin/env python
"""
Script to populate sample user activities and email verification data for testing the super admin page.
Run this from the Django project root: python populate_sample_activities.py
"""

import os
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import UserActivity, EmailVerification

User = get_user_model()

def create_sample_data():
    """Create sample user activities and email verification records."""
    
    print("Creating sample user activity data...")
    
    # Sample IP addresses and user agents
    sample_ips = [
        '192.168.1.100', '203.177.44.55', '172.16.0.15', '10.0.0.25',
        '8.8.8.8', '1.1.1.1', '123.45.67.89', '98.76.54.32'
    ]
    
    sample_user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Android 11; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
    ]
    
    sample_emails = [
        'user1@example.com', 'user2@gmail.com', 'test@yahoo.com', 
        'demo@outlook.com', 'sample@hotmail.com', 'church@example.org'
    ]
    
    # Get or create some users
    users = []
    for i, email in enumerate(sample_emails):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': f'user{i+1}',
                'first_name': f'User{i+1}',
                'last_name': f'Test',
                'is_active': True
            }
        )
        users.append(user)
        if created:
            print(f"Created user: {user.username}")
    
    # Create sample user activities
    activities_created = 0
    for i in range(50):  # Create 50 sample activities
        user = users[i % len(users)]
        activity_type = [
            'registration_started', 'email_verification_sent', 'email_verification_completed',
            'registration_completed', 'login_success', 'login_failed', 'profile_updated'
        ][i % 7]
        
        ip_address = sample_ips[i % len(sample_ips)]
        user_agent = sample_user_agents[i % len(sample_user_agents)]
        
        # Vary the success rate
        success = i % 4 != 0  # 75% success rate
        
        # Create activity from various times in the past 30 days
        created_at = timezone.now() - timedelta(days=(i % 30), hours=(i % 24), minutes=(i % 60))
        
        activity = UserActivity.objects.create(
            user=user,
            email=user.email,
            activity_type=activity_type,
            success=success,
            details=f"Sample activity {i+1}" if not success else "",
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=f"Device {i % 5 + 1}",
            browser_info=f"Chrome {90 + (i % 10)}" if 'Chrome' in user_agent else f"Firefox {80 + (i % 10)}",
            os_info="Windows 10" if 'Windows' in user_agent else "macOS" if 'Mac' in user_agent else "Mobile",
            country="Philippines" if i % 3 == 0 else "United States" if i % 3 == 1 else "Canada",
            city="Iligan City" if i % 3 == 0 else "New York" if i % 3 == 1 else "Toronto",
            verification_code=f"{100000 + i}" if activity_type in ['email_verification_sent', 'email_verification_completed'] else ""
        )
        activity.created_at = created_at
        activity.save(update_fields=['created_at'])
        activities_created += 1
    
    # Create sample email verifications
    verifications_created = 0
    for i in range(30):  # Create 30 sample verifications
        email = sample_emails[i % len(sample_emails)]
        ip_address = sample_ips[i % len(sample_ips)]
        user_agent = sample_user_agents[i % len(sample_user_agents)]
        
        # Vary the status
        is_used = i % 3 != 0  # 67% used rate
        attempts = 1 if is_used else (i % 5)  # Vary attempts for unused ones
        
        # Create verification from various times in the past 30 days
        created_at = timezone.now() - timedelta(days=(i % 30), hours=(i % 24), minutes=(i % 60))
        expires_at = created_at + timedelta(minutes=15)
        
        verification = EmailVerification.objects.create(
            email=email,
            code=f"{100000 + i:06d}",
            is_used=is_used,
            attempts=attempts,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=f"Device {i % 5 + 1}"
        )
        verification.created_at = created_at
        verification.expires_at = expires_at
        verification.save(update_fields=['created_at', 'expires_at'])
        verifications_created += 1
    
    print(f"✅ Created {activities_created} user activities")
    print(f"✅ Created {verifications_created} email verifications")
    print(f"✅ Sample data population completed!")
    print(f"\nYou can now access the super admin page to view the user activities:")
    print(f"1. Login as a superuser")
    print(f"2. Switch to Super Admin mode")
    print(f"3. Navigate to 'User Activities' in the sidebar")

if __name__ == "__main__":
    create_sample_data()

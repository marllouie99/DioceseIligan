#!/usr/bin/env python
"""
Quick Sample Service Reviews Creation
Run this to create sample reviews and see star ratings in action.
"""
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import ServiceReview, BookableService, UserInteraction
from django.utils import timezone
import random

User = get_user_model()

def create_sample_reviews():
    """Create a few sample reviews to demonstrate star ratings."""
    
    # Get first service and first few users
    try:
        service = BookableService.objects.filter(is_active=True).first()
        users = list(User.objects.all()[:3])
        
        if not service:
            print("No services found. Please create a service first.")
            return
            
        if not users:
            print("No users found. Please create some users first.")
            return
        
        print(f"Creating sample reviews for: {service.name}")
        
        # Sample reviews with different ratings
        sample_reviews = [
            {
                'user': users[0],
                'rating': 5,
                'title': 'Excellent service!',
                'comment': 'Really helpful and professional. Highly recommend!',
                'staff_rating': 5,
                'facility_rating': 4,
                'value_rating': 5
            },
            {
                'user': users[1] if len(users) > 1 else users[0],
                'rating': 4,
                'title': 'Very good experience',
                'comment': 'Great service, only minor issues with parking.',
                'staff_rating': 4,
                'facility_rating': 3,
                'value_rating': 4
            },
            {
                'user': users[2] if len(users) > 2 else users[0],
                'rating': 3,
                'title': 'Good but could improve',
                'comment': 'Decent service but room for improvement.',
                'staff_rating': 3,
                'facility_rating': 3,
                'value_rating': 3
            }
        ]
        
        created_count = 0
        for review_data in sample_reviews:
            # Check if user already reviewed this service
            if ServiceReview.objects.filter(user=review_data['user'], service=service).exists():
                continue
                
            review = ServiceReview.objects.create(
                user=review_data['user'],
                service=service,
                church=service.church,
                rating=review_data['rating'],
                title=review_data['title'],
                comment=review_data['comment'],
                staff_rating=review_data.get('staff_rating'),
                facility_rating=review_data.get('facility_rating'),
                value_rating=review_data.get('value_rating')
            )
            
            # Log activity
            UserInteraction.log_activity(
                user=review_data['user'],
                activity_type=UserInteraction.ACTIVITY_SERVICE_REVIEW,
                content_object=review,
                metadata={
                    'service_name': service.name,
                    'church_name': service.church.name,
                    'rating': review.rating,
                    'title': review.title,
                }
            )
            
            created_count += 1
            print(f"Created {review.rating} star review by {review.user.get_full_name() or review.user.username}")
        
        print(f"\nCreated {created_count} sample reviews!")
        print(f"Service average rating: {service.average_rating} stars")
        print(f"Total reviews: {service.review_count}")
        print(f"\nCheck it out at: /app/church/{service.church.slug}/")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    create_sample_reviews()

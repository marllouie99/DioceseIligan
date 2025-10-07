#!/usr/bin/env python
"""
Sample Service Reviews Population Script
Creates realistic service reviews for testing the review system.
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import ServiceReview, BookableService, Church, UserInteraction
from django.utils import timezone

User = get_user_model()

# Sample review data
REVIEW_TEMPLATES = [
    {
        'title': 'Excellent counseling service',
        'comment': 'Pastor John provided exceptional guidance during our session. Very compassionate and understanding. The facility was clean and comfortable. Highly recommend this service to anyone seeking spiritual counseling.',
        'rating': 5,
        'staff_rating': 5,
        'facility_rating': 4,
        'value_rating': 5
    },
    {
        'title': 'Very helpful marriage guidance',
        'comment': 'My spouse and I attended a marriage counseling session and it was incredibly helpful. The pastor was very professional and provided practical advice. The session was longer than expected which was great value.',
        'rating': 4,
        'staff_rating': 5,
        'facility_rating': 4,
        'value_rating': 4
    },
    {
        'title': 'Great baptism ceremony',
        'comment': 'Our daughter\'s baptism was beautifully conducted. The pastor explained everything clearly and made the ceremony very meaningful. The church facilities are well-maintained.',
        'rating': 5,
        'staff_rating': 5,
        'facility_rating': 5,
        'value_rating': 5
    },
    {
        'title': 'Good experience overall',
        'comment': 'The prayer session was peaceful and the pastor was very welcoming. The church has a nice atmosphere. Only minor issue was parking was a bit limited.',
        'rating': 4,
        'staff_rating': 4,
        'facility_rating': 3,
        'value_rating': 4
    },
    {
        'title': 'Wonderful wedding ceremony',
        'comment': 'Pastor Sarah conducted our wedding ceremony and it was perfect! She worked with us for months to prepare and made our special day memorable. The church is beautiful for ceremonies.',
        'rating': 5,
        'staff_rating': 5,
        'facility_rating': 5,
        'value_rating': 4
    },
    {
        'title': 'Decent counseling service',
        'comment': 'The counseling session was okay. The pastor listened well and provided some good advice. The facility could use some updating but it was clean.',
        'rating': 3,
        'staff_rating': 4,
        'facility_rating': 3,
        'value_rating': 3
    },
    {
        'title': 'Amazing spiritual guidance',
        'comment': 'I was going through a difficult time and the pastor provided excellent spiritual support. Very knowledgeable about scripture and gave practical life advice. Felt much better after our sessions.',
        'rating': 5,
        'staff_rating': 5,
        'facility_rating': 4,
        'value_rating': 5
    },
    {
        'title': 'Professional and caring',
        'comment': 'The pastor was very professional throughout our appointment. Showed genuine care for our situation and provided helpful resources. The church environment is very peaceful.',
        'rating': 4,
        'staff_rating': 5,
        'facility_rating': 4,
        'value_rating': 4
    },
    {
        'title': 'Good value service',
        'comment': 'For a free service, this was excellent quality. The pastor spent adequate time with us and didn\'t rush the session. Would definitely return if needed.',
        'rating': 4,
        'staff_rating': 4,
        'facility_rating': 4,
        'value_rating': 5
    },
    {
        'title': 'Could be improved',
        'comment': 'The service was satisfactory but I felt like it could have been more personalized. The facilities are fine but could use some modern updates.',
        'rating': 3,
        'staff_rating': 3,
        'facility_rating': 2,
        'value_rating': 3
    }
]

def create_sample_reviews():
    """Create sample service reviews."""
    print("Creating sample service reviews...")
    
    # Get all active services and users
    services = list(BookableService.objects.filter(is_active=True))
    users = list(User.objects.all()[:20])  # Use first 20 users
    
    if not services:
        print("No active services found. Please create some services first.")
        return
    
    if not users:
        print("No users found. Please create some users first.")
        return
    
    created_count = 0
    
    # Create reviews for each service
    for service in services:
        # Random number of reviews per service (1-4)
        num_reviews = random.randint(1, min(4, len(users)))
        selected_users = random.sample(users, num_reviews)
        
        for i, user in enumerate(selected_users):
            # Check if user already reviewed this service
            if ServiceReview.objects.filter(user=user, service=service).exists():
                continue
            
            # Select a random review template
            template = random.choice(REVIEW_TEMPLATES)
            
            # Create review with some variation
            review_data = {
                'user': user,
                'service': service,
                'church': service.church,
                'rating': template['rating'],
                'title': template['title'],
                'comment': template['comment'],
                'staff_rating': template.get('staff_rating'),
                'facility_rating': template.get('facility_rating'),
                'value_rating': template.get('value_rating'),
                'is_anonymous': random.choice([True, False]),  # 50% chance of anonymous
            }
            
            # Add some variation to ratings (±1 sometimes)
            if random.random() < 0.3:  # 30% chance to vary rating
                variation = random.choice([-1, 1])
                review_data['rating'] = max(1, min(5, review_data['rating'] + variation))
            
            try:
                review = ServiceReview.objects.create(**review_data)
                
                # Create older timestamps for variety
                days_ago = random.randint(1, 90)
                old_created_at = timezone.now() - timedelta(days=days_ago)
                review.created_at = old_created_at
                review.save(update_fields=['created_at'])
                
                # Log user activity
                UserInteraction.log_activity(
                    user=user,
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
                print(f"Created review: {user.get_full_name() or user.username} -> {service.name} ({review.rating} stars)")
                
            except Exception as e:
                print(f"Error creating review for {service.name}: {e}")
    
    print(f"\n✅ Successfully created {created_count} service reviews!")
    return created_count

def add_helpful_votes():
    """Add some helpful votes to reviews."""
    print("\nAdding helpful votes to reviews...")
    
    from core.models import ServiceReviewHelpful
    
    reviews = list(ServiceReview.objects.filter(is_active=True))
    users = list(User.objects.all()[:15])  # Use subset of users
    
    created_votes = 0
    
    for review in reviews:
        # Random chance for users to find this review helpful
        for user in users:
            if user == review.user:  # Users can't vote on their own reviews
                continue
                
            if random.random() < 0.3:  # 30% chance to vote helpful
                helpful_vote, created = ServiceReviewHelpful.objects.get_or_create(
                    user=user,
                    review=review
                )
                if created:
                    created_votes += 1
    
    # Update helpful votes count for all reviews
    for review in reviews:
        review.helpful_votes = review.helpful_votes_records.count()
        review.save(update_fields=['helpful_votes'])
    
    print(f"✅ Added {created_votes} helpful votes!")
    return created_votes

def main():
    """Main function to populate sample data."""
    print("🌟 Populating Service Reviews Sample Data")
    print("=" * 50)
    
    # Create reviews
    review_count = create_sample_reviews()
    
    # Add helpful votes
    vote_count = add_helpful_votes()
    
    print("\n" + "=" * 50)
    print("📊 SUMMARY:")
    print(f"✅ Created {review_count} service reviews")
    print(f"✅ Added {vote_count} helpful votes")
    print("\n🎉 Sample data population complete!")
    print("\n💡 You can now test the review system by:")
    print("1. Going to any church detail page")
    print("2. Clicking on the 'Reviews' tab")
    print("3. Clicking 'Reviews' button on any service")
    print("4. Testing the review submission form")

if __name__ == '__main__':
    main()

#!/usr/bin/env python
"""
Script to populate sample post bookmarks for testing the bookmark functionality.
Run this from the Django project root: python populate_bookmarks.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Post, PostBookmark, Church

User = get_user_model()

def create_sample_bookmarks():
    """Create sample post bookmarks for existing users and posts."""
    
    print("Creating sample post bookmarks...")
    
    # Get existing users (excluding superusers)
    users = User.objects.filter(is_superuser=False)[:5]
    if not users:
        print("No regular users found. Please create some users first.")
        return
    
    # Get existing posts
    posts = Post.objects.select_related('church')[:10]
    if not posts:
        print("No posts found. Please create some posts first.")
        return
    
    bookmarks_created = 0
    
    # Create bookmarks for each user
    for user in users:
        # Each user bookmarks 2-4 random posts
        import random
        num_bookmarks = random.randint(2, min(4, len(posts)))
        user_posts = random.sample(list(posts), num_bookmarks)
        
        for post in user_posts:
            # Check if bookmark already exists
            if not PostBookmark.objects.filter(user=user, post=post).exists():
                PostBookmark.objects.create(user=user, post=post)
                bookmarks_created += 1
                print(f"✅ {user.get_full_name() or user.username} bookmarked '{post.content[:50]}...' from {post.church.name}")
    
    print(f"\n✅ Created {bookmarks_created} post bookmarks")
    print("You can now test the bookmark functionality:")
    print("1. Login as one of the test users")
    print("2. Visit the profile page to see saved posts")
    print("3. Try bookmarking/unbookmarking posts from the dashboard")

if __name__ == "__main__":
    create_sample_bookmarks()

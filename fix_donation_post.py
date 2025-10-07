"""
Utility script to enable donations on an existing post.
Run this with: python manage.py shell < fix_donation_post.py
"""

from core.models import Post

# Find the most recent post with "Please donate!" content
try:
    post = Post.objects.filter(content__icontains="donate").order_by('-created_at').first()
    
    if post:
        print(f"Found post: {post.id} - {post.content[:50]}")
        print(f"Current enable_donation: {post.enable_donation}")
        print(f"Current donation_goal: {post.donation_goal}")
        
        # Enable donations
        post.enable_donation = True
        post.donation_goal = None  # You can set a specific goal here if needed
        post.save()
        
        print(f"\n✅ Post updated successfully!")
        print(f"New enable_donation: {post.enable_donation}")
        print(f"New donation_goal: {post.donation_goal}")
        print(f"\nRefresh your page to see the donation card!")
    else:
        print("❌ No post found with 'donate' in content")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")

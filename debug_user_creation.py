#!/usr/bin/env python
"""
Debug user creation process
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from accounts.forms import SignupForm
from accounts.models import EmailVerification
from django.contrib.auth import get_user_model

User = get_user_model()

def test_user_creation():
    """Test the user creation process"""
    
    # Test data similar to what would be in session (NOW WITH confirm_password)
    pending_signup = {
        'full_name': 'Test User',
        'email': 'newtest@example.com',
        'password': 'testpassword123',
        'confirm_password': 'testpassword123',
    }
    
    print("🔍 Testing user creation process...")
    print(f"Pending signup data: {pending_signup}")
    
    try:
        # Test if user already exists
        existing_user = User.objects.filter(email=pending_signup['email']).first()
        if existing_user:
            print(f"❌ User already exists: {existing_user.email}")
            print("This might be causing the error!")
            return False
            
        # Test form validation
        signup_form = SignupForm(pending_signup)
        print(f"Form is valid: {signup_form.is_valid()}")
        
        if not signup_form.is_valid():
            print(f"Form errors: {signup_form.errors}")
            return False
            
        # Test user creation (dry run)
        print("✅ Form validation passed")
        print("User creation should work!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
        return False

if __name__ == '__main__':
    test_user_creation()

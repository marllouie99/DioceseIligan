#!/usr/bin/env python
"""
Debug the exact verification flow that's causing errors
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from accounts.models import EmailVerification
from accounts.forms import SignupForm, EmailVerificationForm
from django.contrib.auth import get_user_model

User = get_user_model()

def debug_verification_step_by_step():
    """Debug each step of the verification process"""
    
    # Use the last verification for dumbass1111@example.com
    email = 'dumbass1111@example.com'
    
    print(f"🔍 Debugging verification flow for: {email}")
    
    # Step 1: Find verification records
    verifications = EmailVerification.objects.filter(email=email).order_by('-created_at')
    
    if not verifications:
        print("❌ No verification records found")
        return
    
    latest_verification = verifications.first()
    print(f"\n📧 Latest verification:")
    print(f"  Code: {latest_verification.code}")
    print(f"  Created: {latest_verification.created_at}")
    print(f"  Expires: {latest_verification.expires_at}")
    print(f"  Used: {latest_verification.is_used}")
    print(f"  Attempts: {latest_verification.attempts}")
    print(f"  Valid: {latest_verification.is_valid()}")
    
    # Step 2: Test EmailVerificationForm
    print(f"\n🧪 Testing EmailVerificationForm...")
    
    form_data = {
        'verification_code': latest_verification.code,
        'email': email
    }
    
    form = EmailVerificationForm(form_data)
    print(f"  Form is valid: {form.is_valid()}")
    
    if not form.is_valid():
        print(f"  Form errors: {form.errors}")
        return
    
    # Step 3: Test SignupForm with session data
    print(f"\n🧪 Testing SignupForm with typical session data...")
    
    # Simulate what would be in session
    pending_signup = {
        'full_name': 'Test User',
        'email': email,
        'password': 'testpass123',
        'confirm_password': 'testpass123'
    }
    
    signup_form = SignupForm(pending_signup)
    print(f"  Signup form is valid: {signup_form.is_valid()}")
    
    if not signup_form.is_valid():
        print(f"  Signup form errors: {signup_form.errors}")
        return
    
    # Step 4: Check if user already exists
    existing_user = User.objects.filter(email=email).first()
    if existing_user:
        print(f"\n✅ User already exists: {existing_user.email}")
        print(f"  Username: {existing_user.username}")
        print(f"  Created: {existing_user.date_joined}")
        print(f"  Is active: {existing_user.is_active}")
        
        print(f"\n🎯 CONCLUSION: The verification process worked!")
        print(f"   The user was created successfully, even though you saw error messages.")
        print(f"   The issue might be in the redirect or success message handling.")
    else:
        print(f"\n❌ No user found - this would be the real error")

if __name__ == '__main__':
    debug_verification_step_by_step()

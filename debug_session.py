#!/usr/bin/env python
"""
Debug session and verification issues
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from django.test import Client
from accounts.models import EmailVerification
from django.contrib.auth import get_user_model

User = get_user_model()

def test_complete_flow():
    """Test the complete registration flow"""
    
    client = Client()
    
    # Step 1: Get landing page
    print("🔍 Step 1: Getting landing page...")
    response = client.get('/')
    print(f"Status: {response.status_code}")
    
    # Step 2: Submit signup form
    print("\n🔍 Step 2: Submitting signup form...")
    
    # Get CSRF token from the response
    csrf_token = response.context['csrf_token'] if 'csrf_token' in response.context else ''
    
    signup_data = {
        'action': 'signup',
        'full_name': 'Debug Test User',
        'email': 'debugtest@example.com',
        'password': 'debugpass123',
        'confirm_password': 'debugpass123',
        'csrfmiddlewaretoken': csrf_token
    }
    
    response = client.post('/', data=signup_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 302:
        print(f"✅ Redirected to: {response.url}")
        
        # Check if verification was created
        verification = EmailVerification.objects.filter(email='debugtest@example.com').first()
        if verification:
            print(f"✅ Verification created: {verification.code}")
            
            # Step 3: Check session data
            print("\n🔍 Step 3: Checking session...")
            session = client.session
            print(f"Session keys: {list(session.keys())}")
            
            if 'pending_signup' in session:
                print(f"✅ Pending signup data found: {session['pending_signup']}")
            else:
                print("❌ No pending signup data in session!")
            
            if 'verification_email' in session:
                print(f"✅ Verification email found: {session['verification_email']}")
            else:
                print("❌ No verification email in session!")
            
            # Step 4: Try verification
            print(f"\n🔍 Step 4: Testing verification with code {verification.code}...")
            
            verify_data = {
                'action': 'verify',
                'verification_code': verification.code,
                'email': 'debugtest@example.com',
                'csrfmiddlewaretoken': csrf_token
            }
            
            response = client.post('/verify-email/', data=verify_data)
            print(f"Verification response status: {response.status_code}")
            
            if response.status_code == 302:
                print(f"✅ Verification succeeded, redirected to: {response.url}")
                
                # Check if user was created
                user = User.objects.filter(email='debugtest@example.com').first()
                if user:
                    print(f"✅ User created: {user.email}")
                else:
                    print("❌ User was not created!")
            else:
                print(f"❌ Verification failed")
                if hasattr(response, 'content'):
                    print("Response content:", response.content.decode()[:500])
        else:
            print("❌ No verification record created!")
    else:
        print(f"❌ Signup failed with status {response.status_code}")

if __name__ == '__main__':
    # Clean up any existing test data
    EmailVerification.objects.filter(email='debugtest@example.com').delete()
    User.objects.filter(email='debugtest@example.com').delete()
    
    test_complete_flow()

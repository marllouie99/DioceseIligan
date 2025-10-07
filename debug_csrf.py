#!/usr/bin/env python
"""
Debug script to test CSRF functionality
Run this with: python debug_csrf.py
"""

import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from django.test import Client
from django.urls import reverse

def test_csrf():
    """Test CSRF token generation and validation"""
    client = Client()
    
    print("🔍 Testing CSRF functionality...")
    
    # Test landing page
    print("\n1. Testing landing page access:")
    response = client.get('/')
    print(f"   Status: {response.status_code}")
    if 'csrfmiddlewaretoken' in response.content.decode():
        print("   ✅ CSRF token found in landing page")
    else:
        print("   ❌ CSRF token NOT found in landing page")
    
    # Test signup with CSRF token
    print("\n2. Testing signup form submission:")
    csrf_token = client.get('/').context['csrf_token']
    signup_data = {
        'action': 'signup',
        'full_name': 'Test User',
        'email': 'test@example.com',
        'password': 'testpass123',
        'confirm_password': 'testpass123',
        'csrfmiddlewaretoken': csrf_token
    }
    
    response = client.post('/', data=signup_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 302:
        print(f"   ✅ Redirect to: {response.url}")
    elif response.status_code == 403:
        print("   ❌ CSRF verification failed")
    else:
        print(f"   ⚠️ Unexpected response: {response.status_code}")
    
    # Test verification page access
    print("\n3. Testing verification page:")
    session = client.session
    session['verification_email'] = 'test@example.com'
    session['pending_signup'] = signup_data
    session.save()
    
    response = client.get('/verify-email/')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ Verification page accessible")
    else:
        print(f"   ❌ Verification page error: {response.status_code}")

if __name__ == '__main__':
    test_csrf()

#!/usr/bin/env python
"""
Debug verification process
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from accounts.models import EmailVerification
from accounts.email_utils import verify_email_code

def debug_verification():
    """Debug the verification process"""
    
    email = input("Enter the email you registered with: ")
    code = input("Enter the verification code: ")
    
    print(f"\n🔍 Debugging verification for {email} with code {code}")
    
    # Check if verification record exists
    verifications = EmailVerification.objects.filter(email=email).order_by('-created_at')
    
    if not verifications:
        print("❌ No verification records found for this email")
        return
        
    print(f"📋 Found {verifications.count()} verification records:")
    
    for i, verification in enumerate(verifications[:5]):  # Show last 5
        print(f"  {i+1}. Code: {verification.code}")
        print(f"     Created: {verification.created_at}")
        print(f"     Expires: {verification.expires_at}")
        print(f"     Used: {verification.is_used}")
        print(f"     Attempts: {verification.attempts}")
        print(f"     Valid: {verification.is_valid()}")
        print()
    
    # Test the verification
    print("🧪 Testing verification...")
    result = verify_email_code(email, code)
    print(f"Verification result: {result}")
    
    if not result:
        latest = verifications.first()
        if latest:
            print(f"\n🔍 Latest verification details:")
            print(f"  Code matches: {latest.code == code}")
            print(f"  Is used: {latest.is_used}")
            print(f"  Is expired: {latest.expires_at < django.utils.timezone.now()}")
            print(f"  Too many attempts: {latest.attempts >= 5}")

if __name__ == '__main__':
    debug_verification()

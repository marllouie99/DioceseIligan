#!/usr/bin/env python
"""
Email Configuration Diagnostic Script
Run this to check if your email setup is correct
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from django.conf import settings
from accounts.brevo_email import send_email_via_brevo_api

def check_config():
    """Check email configuration"""
    print("=" * 60)
    print("ChurchConnect Email Configuration Check")
    print("=" * 60)
    print()
    
    # Check Brevo API Key
    brevo_key = getattr(settings, 'BREVO_API_KEY', None)
    if brevo_key:
        print(f"✓ BREVO_API_KEY: Configured ({brevo_key[:15]}...)")
    else:
        print("✗ BREVO_API_KEY: NOT CONFIGURED")
        print("  → Set BREVO_API_KEY in your environment variables")
        print("  → Get key from: https://app.brevo.com/settings/keys/api")
        return False
    
    # Check Default From Email
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)
    if from_email:
        print(f"✓ DEFAULT_FROM_EMAIL: {from_email}")
    else:
        print("✗ DEFAULT_FROM_EMAIL: NOT CONFIGURED")
        print("  → Set DEFAULT_FROM_EMAIL in your environment variables")
        return False
    
    # Check Email Backend
    backend = getattr(settings, 'EMAIL_BACKEND', None)
    print(f"  EMAIL_BACKEND: {backend}")
    
    print()
    print("-" * 60)
    print("Configuration looks good! Testing email send...")
    print("-" * 60)
    print()
    
    # Ask for test email
    test_email = input("Enter your email address to test (or press Enter to skip): ").strip()
    
    if test_email:
        print(f"\nSending test email to {test_email}...")
        success = send_email_via_brevo_api(
            to_email=test_email,
            subject="ChurchConnect Email Test",
            html_content="<h1>Success!</h1><p>Your email configuration is working correctly.</p>",
            plain_content="Success! Your email configuration is working correctly."
        )
        
        if success:
            print("✓ Test email sent successfully!")
            print("  → Check your inbox (and spam folder)")
            print("  → Check Brevo dashboard: https://app.brevo.com/")
        else:
            print("✗ Test email failed to send")
            print("  → Check the error messages above")
            print("  → Verify your API key is valid")
            print("  → Check Brevo dashboard for issues")
    else:
        print("Skipping email test.")
    
    print()
    print("=" * 60)
    print("Diagnostic Complete")
    print("=" * 60)
    return True

if __name__ == '__main__':
    try:
        check_config()
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

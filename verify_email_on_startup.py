"""
Startup verification script - checks email configuration
Add this to your Render start command to verify config on deploy
"""
import os
import sys

def verify_email_config():
    """Verify email configuration on startup"""
    print("\n" + "="*60)
    print("Email Configuration Verification")
    print("="*60)
    
    brevo_key = os.environ.get('BREVO_API_KEY', '')
    from_email = os.environ.get('DEFAULT_FROM_EMAIL', '')
    
    if not brevo_key:
        print("❌ CRITICAL: BREVO_API_KEY not set!")
        print("   Emails will NOT be sent (login codes, verification, etc.)")
        print("   → Add BREVO_API_KEY to Render environment variables")
        print("   → Get key from: https://app.brevo.com/settings/keys/api")
        return False
    
    if not from_email:
        print("⚠️  WARNING: DEFAULT_FROM_EMAIL not set")
        print("   Using default sender email")
    
    print(f"✓ BREVO_API_KEY: {brevo_key[:20]}...")
    print(f"✓ DEFAULT_FROM_EMAIL: {from_email}")
    print("✓ Email configuration looks good!")
    print("="*60 + "\n")
    return True

if __name__ == '__main__':
    if not verify_email_config():
        print("\n⚠️  Email not configured properly. Continuing anyway...\n")

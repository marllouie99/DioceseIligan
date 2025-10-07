#!/usr/bin/env python
"""
Test Gmail SMTP connection directly
"""

import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from django.core.mail import send_mail
from django.core.mail.backends.smtp import EmailBackend
import smtplib

def test_gmail_connection():
    """Test Gmail SMTP connection"""
    print("🔍 Testing Gmail SMTP connection...")
    
    # Get settings
    email_backend = settings.EMAIL_BACKEND
    email_host = settings.EMAIL_HOST
    email_port = settings.EMAIL_PORT
    email_user = settings.EMAIL_HOST_USER
    email_password = settings.EMAIL_HOST_PASSWORD
    
    print(f"Backend: {email_backend}")
    print(f"Host: {email_host}")
    print(f"Port: {email_port}")
    print(f"User: {email_user}")
    print(f"Password: {'*' * len(email_password) if email_password else 'NOT SET'}")
    
    if not email_user or not email_password:
        print("❌ Gmail credentials not configured!")
        return False
    
    # Test SMTP connection
    try:
        print("\n📧 Testing SMTP connection...")
        backend = EmailBackend(
            host=email_host,
            port=email_port,
            username=email_user,
            password=email_password,
            use_tls=True
        )
        
        connection = backend.open()
        if connection:
            print("✅ SMTP connection successful!")
            backend.close()
            
            # Test sending actual email
            print("\n📬 Testing email send...")
            result = send_mail(
                subject='Test Email from ChurchConnect',
                message='This is a test email to verify SMTP configuration.',
                from_email=f'ChurchConnect <{email_user}>',
                recipient_list=['danero6367@camjoint.com'],
                fail_silently=False,
            )
            
            if result:
                print("✅ Email sent successfully!")
                return True
            else:
                print("❌ Email send failed!")
                return False
        else:
            print("❌ SMTP connection failed!")
            return False
            
    except Exception as e:
        print(f"❌ SMTP Error: {str(e)}")
        return False

if __name__ == '__main__':
    test_gmail_connection()

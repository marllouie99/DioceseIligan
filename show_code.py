#!/usr/bin/env python
"""
Quick script to generate and show verification code
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings')
django.setup()

from accounts.models import EmailVerification

email = input("Enter email address: ")
verification = EmailVerification.generate_code(email)
print(f"\n🎯 VERIFICATION CODE FOR {email}: {verification.code}")
print(f"⏰ Expires at: {verification.expires_at}")
print(f"\nUse this code on the verification page!")

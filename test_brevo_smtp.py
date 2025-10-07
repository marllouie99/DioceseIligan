#!/usr/bin/env python
"""
Test Brevo SMTP connection and email sending
Run this to diagnose email delivery issues
"""
import os
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_smtp_connection():
    """Test SMTP connection to Brevo"""
    
    # Read from environment or use hardcoded values for testing
    SMTP_HOST = os.getenv('EMAIL_HOST', 'smtp-relay.brevo.com')
    SMTP_PORT = int(os.getenv('EMAIL_PORT', '587'))
    SMTP_USER = os.getenv('EMAIL_HOST_USER', '979d0a001@smtp-brevo.com')
    SMTP_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
    FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'marllouie4@gmail.com')
    
    print("=" * 60)
    print("BREVO SMTP CONNECTION TEST")
    print("=" * 60)
    print(f"Host: {SMTP_HOST}")
    print(f"Port: {SMTP_PORT}")
    print(f"User: {SMTP_USER}")
    print(f"Password: {'*' * len(SMTP_PASSWORD) if SMTP_PASSWORD else '[NOT SET]'}")
    print(f"From Email: {FROM_EMAIL}")
    print("=" * 60)
    
    if not SMTP_PASSWORD:
        print("❌ ERROR: EMAIL_HOST_PASSWORD environment variable not set!")
        print("Please set it before running this test.")
        return False
    
    try:
        print("\n1. Connecting to SMTP server...")
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        print("✓ Connected successfully")
        
        print("\n2. Starting TLS...")
        server.starttls()
        print("✓ TLS started successfully")
        
        print("\n3. Authenticating...")
        server.login(SMTP_USER, SMTP_PASSWORD)
        print("✓ Authentication successful")
        
        print("\n4. Preparing test email...")
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'ChurchConnect - SMTP Test'
        msg['From'] = FROM_EMAIL
        
        # Ask for recipient email
        to_email = input("\nEnter recipient email address for test (press Enter to skip): ").strip()
        
        if to_email:
            msg['To'] = to_email
            
            # Create plain text and HTML versions
            text = "This is a test email from ChurchConnect to verify SMTP configuration."
            html = """
            <html>
              <body>
                <h2>ChurchConnect SMTP Test</h2>
                <p>This is a test email to verify SMTP configuration.</p>
                <p>If you received this, your email settings are working correctly!</p>
              </body>
            </html>
            """
            
            part1 = MIMEText(text, 'plain')
            part2 = MIMEText(html, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            print(f"\n5. Sending test email to {to_email}...")
            server.sendmail(FROM_EMAIL, [to_email], msg.as_string())
            print(f"✓ Test email sent successfully to {to_email}")
            print("\nPlease check the inbox (and spam folder) of the recipient.")
        else:
            print("\n5. Skipping test email send.")
        
        print("\n6. Closing connection...")
        server.quit()
        print("✓ Connection closed")
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        print("\nYour SMTP configuration is working correctly.")
        print("If emails still aren't being received, check:")
        print("1. Sender email is verified in Brevo dashboard")
        print("2. Brevo account has available email credits")
        print("3. Recipient's spam folder")
        print("4. Brevo logs for delivery status")
        
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"\n❌ Authentication failed: {e}")
        print("\nPossible issues:")
        print("- Incorrect SMTP username or password")
        print("- SMTP user should be: 979d0a001@smtp-brevo.com")
        print("- Check your Brevo SMTP keys in dashboard")
        return False
        
    except smtplib.SMTPException as e:
        print(f"\n❌ SMTP error: {e}")
        return False
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\nThis script tests your Brevo SMTP configuration.")
    print("It will read settings from environment variables or use defaults.\n")
    
    success = test_smtp_connection()
    sys.exit(0 if success else 1)

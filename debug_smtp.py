#!/usr/bin/env python
"""
Detailed SMTP debugging script
"""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_gmail_smtp_direct():
    """Test Gmail SMTP connection directly without Django"""
    
    # Gmail SMTP configuration
    smtp_server = "smtp.gmail.com"
    port = 587
    sender_email = "marllouie4@gmail.com"
    password = "YOUR_NEW_APP_PASSWORD_HERE"  # New app password
    receiver_email = "marllouie4@gmail.com"  # Send to yourself
    
    print("🔍 Testing Gmail SMTP connection directly...")
    print(f"Server: {smtp_server}:{port}")
    print(f"From: {sender_email}")
    print(f"To: {receiver_email}")
    print(f"Password: {'*' * len(password)}")
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = "ChurchConnect SMTP Test"
        message["From"] = sender_email
        message["To"] = receiver_email
        
        # Create the HTML content
        html = f"""
        <html>
        <body>
            <h2>SMTP Test Successful!</h2>
            <p>This email was sent directly via Gmail SMTP to test the connection.</p>
            <p><strong>Test Code:</strong> 123456</p>
        </body>
        </html>
        """
        
        # Turn these into plain/html MIMEText objects
        text = "SMTP Test Successful! Test Code: 123456"
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        
        # Add HTML/plain-text parts to MIMEMultipart message
        message.attach(part1)
        message.attach(part2)
        
        print("\n📧 Connecting to SMTP server...")
        
        # Create SMTP session
        server = smtplib.SMTP(smtp_server, port)
        server.set_debuglevel(1)  # Enable debug output
        
        print("📧 Starting TLS encryption...")
        server.starttls()  # Enable security
        
        print("📧 Logging in...")
        server.login(sender_email, password)
        
        print("📧 Sending email...")
        text = message.as_string()
        result = server.sendmail(sender_email, receiver_email, text)
        server.quit()
        
        print("✅ Email sent successfully!")
        print(f"Result: {result}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ SMTP Authentication Error: {e}")
        print("🔧 Check your Gmail app password!")
        return False
        
    except smtplib.SMTPRecipientsRefused as e:
        print(f"❌ Recipients Refused: {e}")
        return False
        
    except smtplib.SMTPServerDisconnected as e:
        print(f"❌ Server Disconnected: {e}")
        return False
        
    except smtplib.SMTPException as e:
        print(f"❌ SMTP Error: {e}")
        return False
        
    except Exception as e:
        print(f"❌ General Error: {e}")
        return False

if __name__ == '__main__':
    test_gmail_smtp_direct()

#!/usr/bin/env python
"""
Quick test for Brevo API email sending
"""
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

# Your Brevo API key
BREVO_API_KEY = "xkeysib-c682c49e5d1e314451da615b7fa04b149f1dd2fade128415e1656744490e-DtDQNBvwyBnxMrSd"

def test_brevo_api():
    print("=" * 60)
    print("BREVO HTTP API TEST")
    print("=" * 60)
    
    try:
        # Configure API client
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = BREVO_API_KEY
        
        # Create API instance
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )
        
        # Get recipient email
        to_email = input("\nEnter recipient email address: ").strip()
        
        if not to_email:
            print("❌ No email provided")
            return
        
        # Create test email
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email}],
            sender={"name": "ChurchConnect", "email": "marllouie4@gmail.com"},
            subject="ChurchConnect - Test Email from Brevo API",
            html_content="""
            <html>
              <body>
                <h2>✅ Brevo API Test Successful!</h2>
                <p>This email was sent using Brevo's HTTP API.</p>
                <p>If you received this, your email configuration is working correctly!</p>
              </body>
            </html>
            """,
            text_content="Brevo API Test - If you received this, it's working!"
        )
        
        # Send email
        print(f"\n📧 Sending test email to {to_email}...")
        api_response = api_instance.send_transac_email(send_smtp_email)
        
        print(f"✅ Email sent successfully!")
        print(f"   Message ID: {api_response.message_id}")
        print(f"\n📬 Check {to_email} inbox (and spam folder)")
        
    except ApiException as e:
        print(f"\n❌ Brevo API error: {e}")
        print("\nPossible issues:")
        print("- API key is invalid")
        print("- Sender email not verified in Brevo")
        print("- Daily sending limit reached")
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")


if __name__ == "__main__":
    test_brevo_api()

"""
Brevo (Sendinblue) HTTP API email backend
Works better than SMTP on restricted hosting environments like Render
"""
import logging
from django.conf import settings
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

logger = logging.getLogger(__name__)


def send_email_via_brevo_api(to_email, subject, html_content, plain_content=None):
    """
    Send email using Brevo's HTTP API instead of SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML email content
        plain_content: Plain text email content (optional)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Get Brevo API key from settings
        brevo_api_key = getattr(settings, 'BREVO_API_KEY', None)
        if not brevo_api_key:
            logger.error("BREVO_API_KEY not configured in settings")
            return False
        
        # Configure API client
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = brevo_api_key
        
        # Create API instance
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        # Get sender email from settings
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@churchiligan.com')
        
        # Parse sender name and email if in format "Name <email@example.com>"
        if '<' in from_email and '>' in from_email:
            sender_name = from_email.split('<')[0].strip()
            sender_email = from_email.split('<')[1].split('>')[0].strip()
        else:
            sender_name = "ChurchConnect"
            sender_email = from_email
        
        # Debug logging
        logger.info(f"Brevo sender: name='{sender_name}', email='{sender_email}'")
        
        # Create email object
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email}],
            sender={"name": sender_name, "email": sender_email},
            subject=subject,
            html_content=html_content,
            text_content=plain_content or html_content
        )
        
        # Send email
        logger.info(f"Sending email via Brevo API to {to_email}")
        api_response = api_instance.send_transac_email(send_smtp_email)
        logger.info(f"✓ Email sent successfully via Brevo API to {to_email} (Message ID: {api_response.message_id})")
        return True
        
    except ApiException as e:
        logger.error(f"✗ Brevo API error: {e}")
        logger.error(f"✗ Brevo API response body: {e.body if hasattr(e, 'body') else 'No body'}")
        return False
    except Exception as e:
        logger.error(f"✗ Failed to send email via Brevo API: {str(e)}")
        return False

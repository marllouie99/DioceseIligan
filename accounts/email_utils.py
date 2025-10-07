from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import EmailVerification, PasswordReset, LoginCode
import logging

logger = logging.getLogger(__name__)


def send_verification_email(email, code):
    """
    Send verification email with the provided code
    """
    try:
        subject = 'ChurchConnect - Verify Your Email'
        
        # Create HTML content
        html_message = render_to_string('emails/verification_code.html', {
            'code': code,
            'email': email
        })
        
        # Create plain text version
        plain_message = strip_tags(html_message)
        
        # Send email via Brevo SMTP (temporary override)
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        
        try:
            # Brevo SMTP configuration
            smtp_server = 'smtp-relay.brevo.com'
            port = 587
            smtp_username = '979d0a001@smtp-brevo.com'
            smtp_password = 'OrM1ztRFCjEm2bks'
            sender_email = 'Church Iligan Connect <marllouie4@gmail.com>'
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = sender_email
            msg['To'] = email
            
            # Add both plain text and HTML parts
            part1 = MIMEText(plain_message, 'plain')
            part2 = MIMEText(html_message, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send via SMTP
            server = smtplib.SMTP(smtp_server, port)
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            server.quit()
            
        except Exception as smtp_error:
            logger.error(f"Brevo SMTP failed: {smtp_error}, falling back to Django send_mail")
            # Fallback to Django's send_mail if SMTP fails
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
        
        logger.info(f"Verification email sent successfully to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {str(e)}")
        return False


def send_verification_code(email):
    """
    Generate and send a verification code to the specified email
    """
    try:
        # Generate verification code
        verification = EmailVerification.generate_code(email)
        
        # Send email
        success = send_verification_email(email, verification.code)
        
        if not success:
            # Delete the verification record if email failed
            verification.delete()
            return None
            
        return verification
        
    except Exception as e:
        logger.error(f"Failed to send verification code to {email}: {str(e)}")
        return None


def verify_email_code(email, code):
    """
    Verify the email verification code
    """
    return EmailVerification.verify_code(email, code)


def has_recent_verification(email, minutes=2):
    """
    Check if a verification code was sent recently to prevent spam
    """
    from django.utils import timezone
    from datetime import timedelta
    
    recent_time = timezone.now() - timedelta(minutes=minutes)
    return EmailVerification.objects.filter(
        email__iexact=email,
        created_at__gte=recent_time
    ).exists()


def send_password_reset_email(email, code):
    """
    Send password reset email with the provided code
    """
    try:
        subject = 'ChurchConnect - Password Reset Code'
        
        # Create HTML content
        html_message = render_to_string('emails/password_reset_code.html', {
            'code': code,
            'email': email
        })
        
        # Create plain text version
        plain_message = strip_tags(html_message)
        
        # Send email via Brevo SMTP (temporary override)
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        
        try:
            # Brevo SMTP configuration
            smtp_server = 'smtp-relay.brevo.com'
            port = 587
            smtp_username = '979d0a001@smtp-brevo.com'
            smtp_password = 'OrM1ztRFCjEm2bks'
            sender_email = 'Church Iligan Connect <marllouie4@gmail.com>'
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = sender_email
            msg['To'] = email
            
            # Add both plain text and HTML parts
            part1 = MIMEText(plain_message, 'plain')
            part2 = MIMEText(html_message, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send via SMTP
            server = smtplib.SMTP(smtp_server, port)
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            server.quit()
            
        except Exception as smtp_error:
            logger.error(f"Brevo SMTP failed: {smtp_error}, falling back to Django send_mail")
            # Fallback to Django's send_mail if SMTP fails
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
        
        logger.info(f"Password reset email sent successfully to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        return False


def send_password_reset_code(email):
    """
    Generate and send a password reset code to the specified email
    """
    try:
        # Generate password reset code
        reset = PasswordReset.generate_code(email)
        
        # Send email
        success = send_password_reset_email(email, reset.code)
        
        if not success:
            # Delete the reset record if email failed
            reset.delete()
            return None
            
        return reset
        
    except Exception as e:
        logger.error(f"Failed to send password reset code to {email}: {str(e)}")
        return None


def verify_password_reset_code(email, code):
    """
    Verify the password reset code
    """
    return PasswordReset.verify_code(email, code)


def has_recent_password_reset(email, minutes=2):
    """
    Check if a password reset code was sent recently to prevent spam
    """
    from django.utils import timezone
    from datetime import timedelta
    
    recent_time = timezone.now() - timedelta(minutes=minutes)
    return PasswordReset.objects.filter(
        email=email,
        created_at__gte=recent_time
    ).exists()


def send_login_code_email(email, code):
    """
    Send login code email with the provided code
    """
    try:
        subject = 'ChurchConnect - Your Login Code'
        
        # Create HTML content
        html_message = render_to_string('emails/login_code.html', {
            'code': code,
            'email': email
        })
        
        # Create plain text version
        plain_message = strip_tags(html_message)
        
        # Send email via Brevo SMTP (temporary override)
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        
        try:
            # Brevo SMTP configuration
            smtp_server = 'smtp-relay.brevo.com'
            port = 587
            smtp_username = '979d0a001@smtp-brevo.com'
            smtp_password = 'OrM1ztRFCjEm2bks'
            sender_email = 'Church Iligan Connect <marllouie4@gmail.com>'
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = sender_email
            msg['To'] = email
            
            # Add both plain text and HTML parts
            part1 = MIMEText(plain_message, 'plain')
            part2 = MIMEText(html_message, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send via SMTP
            server = smtplib.SMTP(smtp_server, port)
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            server.quit()
            
        except Exception as smtp_error:
            logger.error(f"Brevo SMTP failed: {smtp_error}, falling back to Django send_mail")
            # Fallback to Django's send_mail if SMTP fails
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
        
        logger.info(f"Login code email sent successfully to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send login code email to {email}: {str(e)}")
        return False


def send_login_code(email):
    """
    Generate and send a login code to the specified email
    """
    try:
        # Generate login code
        login_code = LoginCode.generate_code(email)
        
        # Send email
        success = send_login_code_email(email, login_code.code)
        
        if not success:
            # Delete the code record if email failed
            login_code.delete()
            return None
            
        return login_code
        
    except Exception as e:
        logger.error(f"Failed to send login code to {email}: {str(e)}")
        return None


def verify_login_code(email, code):
    """
    Verify the login code
    """
    return LoginCode.verify_code(email, code)


def has_recent_login_code(email, minutes=2):
    """
    Check if a login code was sent recently to prevent spam
    """
    from django.utils import timezone
    from datetime import timedelta
    
    recent_time = timezone.now() - timedelta(minutes=minutes)
    return LoginCode.objects.filter(
        email=email,
        created_at__gte=recent_time
    ).exists()


def send_church_verification_approved_email(user_email, user_name, church_name, church_url, approved_date):
    """
    Send email notification when church verification is approved
    
    Args:
        user_email: Church owner's email address
        user_name: Church owner's full name
        church_name: Name of the church
        church_url: URL to the church profile page
        approved_date: Date when verification was approved
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        subject = f'ChurchConnect - {church_name} Verification Approved! 🎉'
        
        # Create HTML content
        html_message = render_to_string('emails/church_verification_approved.html', {
            'user_name': user_name,
            'church_name': church_name,
            'church_url': church_url,
            'approved_date': approved_date,
        })
        
        # Create plain text version
        plain_message = strip_tags(html_message)
        
        # Send email via Brevo SMTP
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        
        try:
            # Brevo SMTP configuration
            smtp_server = 'smtp-relay.brevo.com'
            port = 587
            smtp_username = '979d0a001@smtp-brevo.com'
            smtp_password = 'OrM1ztRFCjEm2bks'
            sender_email = 'Church Iligan Connect <marllouie4@gmail.com>'
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = sender_email
            msg['To'] = user_email
            
            # Add both plain text and HTML parts
            part1 = MIMEText(plain_message, 'plain')
            part2 = MIMEText(html_message, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send via SMTP
            server = smtplib.SMTP(smtp_server, port)
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Church verification approved email sent successfully to {user_email}")
            return True
            
        except Exception as smtp_error:
            logger.error(f"Brevo SMTP failed: {smtp_error}, falling back to Django send_mail")
            # Fallback to Django's send_mail if SMTP fails
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user_email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Church verification approved email sent successfully to {user_email} via fallback")
            return True
        
    except Exception as e:
        logger.error(f"Failed to send church verification approved email to {user_email}: {str(e)}")
        return False


def send_church_verification_rejected_email(user_email, church_name, rejection_notes=''):
    """
    Send email notification when church verification is rejected
    
    Args:
        user_email: Church owner's email address
        church_name: Name of the church
        rejection_notes: Notes explaining why verification was rejected
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        subject = f'ChurchConnect - {church_name} Verification Status Update'
        
        # Create HTML content
        html_message = render_to_string('emails/church_verification_rejected.html', {
            'church_name': church_name,
            'rejection_notes': rejection_notes,
        })
        
        # Create plain text version
        plain_message = strip_tags(html_message)
        
        # Send email via Brevo SMTP
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        
        try:
            # Brevo SMTP configuration
            smtp_server = 'smtp-relay.brevo.com'
            port = 587
            smtp_username = '979d0a001@smtp-brevo.com'
            smtp_password = 'OrM1ztRFCjEm2bks'
            sender_email = 'Church Iligan Connect <marllouie4@gmail.com>'
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = sender_email
            msg['To'] = user_email
            
            # Add both plain text and HTML parts
            part1 = MIMEText(plain_message, 'plain')
            part2 = MIMEText(html_message, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send via SMTP
            server = smtplib.SMTP(smtp_server, port)
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Church verification rejected email sent successfully to {user_email}")
            return True
            
        except Exception as smtp_error:
            logger.error(f"Brevo SMTP failed: {smtp_error}, falling back to Django send_mail")
            # Fallback to Django's send_mail if SMTP fails
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user_email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Church verification rejected email sent successfully to {user_email} via fallback")
            return True
        
    except Exception as e:
        logger.error(f"Failed to send church verification rejected email to {user_email}: {str(e)}")
        return False

from django.core.management.base import BaseCommand
from accounts.email_utils import send_verification_code

class Command(BaseCommand):
    help = 'Test email verification system'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email address to test')

    def handle(self, *args, **options):
        email = options['email']
        self.stdout.write(f'Testing email verification for: {email}')
        
        verification = send_verification_code(email)
        
        if verification:
            self.stdout.write(
                self.style.SUCCESS(f'✅ Verification code sent: {verification.code}')
            )
            self.stdout.write(f'Code expires at: {verification.expires_at}')
        else:
            self.stdout.write(
                self.style.ERROR('❌ Failed to send verification code')
            )

from django.core.management.base import BaseCommand
from accounts.email_utils import send_login_code

class Command(BaseCommand):
    help = 'Test login code email system'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email address to test')

    def handle(self, *args, **options):
        email = options['email']
        self.stdout.write(f'Testing login code email for: {email}')
        
        login_code = send_login_code(email)
        
        if login_code:
            self.stdout.write(
                self.style.SUCCESS(f'✅ Login code sent: {login_code.code}')
            )
            self.stdout.write(f'Code expires at: {login_code.expires_at}')
        else:
            self.stdout.write(
                self.style.ERROR('❌ Failed to send login code')
            )

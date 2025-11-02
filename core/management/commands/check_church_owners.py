"""
Management command to check for churches without owners.
Usage: python manage.py check_church_owners
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Church

User = get_user_model()


class Command(BaseCommand):
    help = 'Check for churches without owners and optionally assign them'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Automatically assign the first superuser as owner to churches without owners',
        )
        parser.add_argument(
            '--assign-user',
            type=int,
            help='User ID to assign as owner for churches without owners',
        )

    def handle(self, *args, **options):
        churches_without_owner = Church.objects.filter(owner__isnull=True)
        count = churches_without_owner.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('✓ All churches have owners assigned.'))
            return
        
        self.stdout.write(
            self.style.WARNING(f'Found {count} church(es) without owners:')
        )
        
        for church in churches_without_owner:
            self.stdout.write(f'  - {church.name} (ID: {church.id})')
        
        # If fix option is provided
        if options['fix']:
            # Get superuser to assign
            if options['assign_user']:
                try:
                    owner = User.objects.get(id=options['assign_user'])
                    if not owner.is_superuser and not owner.is_staff:
                        self.stdout.write(
                            self.style.ERROR(
                                f'User {owner.username} is not a superuser or staff. '
                                'Please provide a valid admin user ID.'
                            )
                        )
                        return
                except User.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(f'User with ID {options["assign_user"]} not found.')
                    )
                    return
            else:
                # Get first superuser
                owner = User.objects.filter(is_superuser=True).first()
                if not owner:
                    self.stdout.write(
                        self.style.ERROR(
                            'No superuser found. Please create a superuser first or '
                            'specify a user ID with --assign-user <user_id>'
                        )
                    )
                    return
            
            # Assign owner to all churches without owners
            updated = churches_without_owner.update(owner=owner)
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Assigned {owner.username} as owner to {updated} church(es).'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    '\nTo fix this issue, run:\n'
                    '  python manage.py check_church_owners --fix\n'
                    'Or specify a user:\n'
                    '  python manage.py check_church_owners --assign-user <user_id>'
                )
            )

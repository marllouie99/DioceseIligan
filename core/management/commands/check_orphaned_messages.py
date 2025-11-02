"""
Management command to check for messages in conversations where the church has no owner.
These messages are stored but have no recipient to notify.
Usage: python manage.py check_orphaned_messages
"""
from django.core.management.base import BaseCommand
from django.db.models import Count, Q
from core.models import Conversation, Message, Church


class Command(BaseCommand):
    help = 'Check for messages in conversations where church has no owner'

    def add_arguments(self, parser):
        parser.add_argument(
            '--detailed',
            action='store_true',
            help='Show detailed information about each orphaned conversation',
        )

    def handle(self, *args, **options):
        # Find conversations where church has no owner
        orphaned_conversations = Conversation.objects.filter(
            church__owner__isnull=True
        ).select_related('church', 'user').annotate(
            message_count=Count('messages')
        ).filter(message_count__gt=0)
        
        count = orphaned_conversations.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('✓ No orphaned messages found. All conversations have church owners.')
            )
            return
        
        # Count total unread messages
        total_messages = sum(conv.message_count for conv in orphaned_conversations)
        
        self.stdout.write(
            self.style.WARNING(
                f'\n⚠ Found {count} conversation(s) with {total_messages} message(s) '
                f'where the church has no owner:\n'
            )
        )
        
        for conv in orphaned_conversations:
            self.stdout.write(
                f'  • Church: {conv.church.name} (ID: {conv.church.id})'
            )
            self.stdout.write(
                f'    User: {conv.user.username} ({conv.user.get_full_name() or "No name"})'
            )
            self.stdout.write(
                f'    Messages: {conv.message_count}'
            )
            
            if options['detailed']:
                # Show recent messages
                recent_messages = conv.messages.order_by('-created_at')[:3]
                for msg in recent_messages:
                    sender = "User" if msg.sender == conv.user else "Church"
                    preview = msg.content[:50] + "..." if len(msg.content) > 50 else msg.content
                    self.stdout.write(
                        f'      - [{sender}] {preview} ({msg.created_at.strftime("%Y-%m-%d %H:%M")})'
                    )
            
            self.stdout.write('')  # Empty line
        
        self.stdout.write(
            self.style.WARNING(
                '\n📝 Action Required:\n'
                '  1. Assign owners to these churches using:\n'
                '     python manage.py check_church_owners --fix\n'
                '  2. Or assign specific owners using:\n'
                '     python manage.py check_church_owners --assign-user <user_id>\n\n'
                '  Once owners are assigned, they will be able to view and respond to these messages.\n'
            )
        )

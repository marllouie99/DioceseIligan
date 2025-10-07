"""
Django management command to analyze and optimize database performance
Usage: python manage.py optimize_database
"""

from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings
from core.optimization_utils import DatabaseOptimizer, QueryProfiler
import time


class Command(BaseCommand):
    help = 'Analyze and optimize database performance'

    def add_arguments(self, parser):
        parser.add_argument(
            '--analyze-only',
            action='store_true',
            help='Only analyze performance without making changes'
        )
        parser.add_argument(
            '--clear-cache',
            action='store_true',
            help='Clear optimization cache'
        )
        parser.add_argument(
            '--show-stats',
            action='store_true',
            help='Show database statistics'
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting database optimization analysis...\n')
        )

        if options['show_stats']:
            self.show_database_stats()

        if options['clear_cache']:
            self.clear_optimization_cache()

        if options['analyze_only']:
            self.analyze_performance()
        else:
            self.analyze_performance()
            self.suggest_optimizations()

    def show_database_stats(self):
        """Show database statistics"""
        self.stdout.write(self.style.SUCCESS('=== Database Statistics ==='))
        
        stats = DatabaseOptimizer.get_database_stats()
        for key, value in stats.items():
            self.stdout.write(f'{key}: {value:,}')
        
        self.stdout.write('')

    def clear_optimization_cache(self):
        """Clear optimization cache"""
        self.stdout.write(self.style.WARNING('Clearing optimization cache...'))
        DatabaseOptimizer.clear_optimization_cache()
        self.stdout.write(self.style.SUCCESS('Cache cleared successfully.\n'))

    def analyze_performance(self):
        """Analyze database performance"""
        self.stdout.write(self.style.SUCCESS('=== Performance Analysis ==='))
        
        if not settings.DEBUG:
            self.stdout.write(
                self.style.WARNING(
                    'Warning: DEBUG is False. Query analysis requires DEBUG=True'
                )
            )
            return

        # Analyze slow queries
        slow_queries = DatabaseOptimizer.analyze_slow_queries()
        
        if slow_queries:
            self.stdout.write(
                self.style.WARNING(f'Found {len(slow_queries)} slow queries:')
            )
            for i, query in enumerate(slow_queries, 1):
                self.stdout.write(f'\n{i}. Time: {query["time"]:.3f}s')
                self.stdout.write(f'   SQL: {query["sql"][:200]}...')
        else:
            self.stdout.write(
                self.style.SUCCESS('No slow queries detected!')
            )

        # Show query count
        query_count = DatabaseOptimizer.get_query_count()
        self.stdout.write(f'\nTotal queries executed: {query_count}')
        
        self.stdout.write('')

    def suggest_optimizations(self):
        """Suggest database optimizations"""
        self.stdout.write(self.style.SUCCESS('=== Optimization Suggestions ==='))
        
        suggestions = [
            {
                'title': 'Add Database Indexes',
                'description': 'Consider adding indexes for frequently queried fields',
                'sql': [
                    'CREATE INDEX idx_booking_church_status ON core_booking(church_id, status);',
                    'CREATE INDEX idx_booking_user_status ON core_booking(user_id, status);',
                    'CREATE INDEX idx_notification_user_read ON core_notification(user_id, is_read);',
                    'CREATE INDEX idx_churchfollow_user ON core_churchfollow(user_id);',
                ]
            },
            {
                'title': 'Optimize Query Patterns',
                'description': 'Use select_related() and prefetch_related() for foreign keys',
                'examples': [
                    'Church.objects.select_related("owner")',
                    'Booking.objects.prefetch_related("service__service_images")',
                ]
            },
            {
                'title': 'Implement Caching',
                'description': 'Cache frequently accessed data',
                'examples': [
                    'Cache follower counts for 5 minutes',
                    'Cache booking statistics for 2 minutes',
                    'Cache notification counts for 1 minute',
                ]
            },
            {
                'title': 'Use Database Aggregation',
                'description': 'Replace multiple count() queries with single aggregation',
                'before': 'church.followers.count()\nchurch.bookings.filter(status="approved").count()',
                'after': 'church.aggregate(followers=Count("followers"), approved=Count("bookings", filter=Q(status="approved")))',
            }
        ]

        for i, suggestion in enumerate(suggestions, 1):
            self.stdout.write(f'\n{i}. {suggestion["title"]}')
            self.stdout.write(f'   {suggestion["description"]}')
            
            if 'sql' in suggestion:
                self.stdout.write('   SQL Commands:')
                for sql in suggestion['sql']:
                    self.stdout.write(f'     {sql}')
            
            if 'examples' in suggestion:
                self.stdout.write('   Examples:')
                for example in suggestion['examples']:
                    self.stdout.write(f'     {example}')
            
            if 'before' in suggestion and 'after' in suggestion:
                self.stdout.write('   Before:')
                self.stdout.write(f'     {suggestion["before"]}')
                self.stdout.write('   After:')
                self.stdout.write(f'     {suggestion["after"]}')

        self.stdout.write('\n' + self.style.SUCCESS('Analysis complete!'))


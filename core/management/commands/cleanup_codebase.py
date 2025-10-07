"""
Django management command to clean up the codebase
Removes debug code, legacy files, and optimizes the codebase
Usage: python manage.py cleanup_codebase
"""

from django.core.management.base import BaseCommand
import os
import re
from pathlib import Path


class Command(BaseCommand):
    help = 'Clean up the codebase by removing debug code, legacy files, and optimizing code'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be cleaned without making changes'
        )
        parser.add_argument(
            '--remove-legacy',
            action='store_true',
            help='Remove legacy files'
        )
        parser.add_argument(
            '--remove-debug',
            action='store_true',
            help='Remove debug console statements'
        )
        parser.add_argument(
            '--remove-todos',
            action='store_true',
            help='Remove TODO comments'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        remove_legacy = options['remove_legacy']
        remove_debug = options['remove_debug']
        remove_todos = options['remove_todos']

        self.stdout.write(
            self.style.SUCCESS('Starting codebase cleanup...\n')
        )

        if remove_legacy:
            self.cleanup_legacy_files(dry_run)

        if remove_debug:
            self.cleanup_debug_code(dry_run)

        if remove_todos:
            self.cleanup_todo_comments(dry_run)

        self.stdout.write(
            self.style.SUCCESS('\nCleanup complete!')
        )

    def cleanup_legacy_files(self, dry_run):
        """Remove legacy files that are no longer needed"""
        self.stdout.write(self.style.SUCCESS('=== Cleaning Legacy Files ==='))
        
        legacy_files = [
            'static/js/legacy/manage_church.archived.js',
            'static/js/legacy/README.md',
        ]
        
        for file_path in legacy_files:
            if os.path.exists(file_path):
                if dry_run:
                    self.stdout.write(f'Would remove: {file_path}')
                else:
                    os.remove(file_path)
                    self.stdout.write(f'Removed: {file_path}')
            else:
                self.stdout.write(f'Not found: {file_path}')

    def cleanup_debug_code(self, dry_run):
        """Remove debug console statements from JavaScript files"""
        self.stdout.write(self.style.SUCCESS('=== Cleaning Debug Code ==='))
        
        js_files = [
            'static/js/app_optimized.js',
            'static/js/manage_availability_new.js',
            'static/js/service_gallery_new.js',
            'static/js/manage_profile_new.js',
            'static/js/profile_new.js',
        ]
        
        # Add all files in modules directory
        modules_dir = Path('static/js/modules')
        if modules_dir.exists():
            js_files.extend([str(f) for f in modules_dir.glob('*.js')])
        
        debug_patterns = [
            (r'console\.log\([^)]*\);?\s*\n?', ''),
            (r'console\.warn\([^)]*\);?\s*\n?', ''),
            (r'console\.error\([^)]*\);?\s*\n?', ''),
            (r'// Make app globally available for debugging\s*\n?', ''),
        ]
        
        for file_path in js_files:
            if os.path.exists(file_path):
                self.clean_file_patterns(file_path, debug_patterns, dry_run, 'Debug code')

    def cleanup_todo_comments(self, dry_run):
        """Remove TODO comments from Python files"""
        self.stdout.write(self.style.SUCCESS('=== Cleaning TODO Comments ==='))
        
        python_files = [
            'core/views.py',
            'core/views_optimized.py',
            'core/optimization_utils.py',
        ]
        
        todo_patterns = [
            (r'\s*# TODO:.*\n', ''),
            (r'\s*# FIXME:.*\n', ''),
            (r'\s*# XXX:.*\n', ''),
            (r'\s*# HACK:.*\n', ''),
        ]
        
        for file_path in python_files:
            if os.path.exists(file_path):
                self.clean_file_patterns(file_path, todo_patterns, dry_run, 'TODO comments')

    def clean_file_patterns(self, file_path, patterns, dry_run, description):
        """Clean specific patterns from a file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            changes_made = 0
            
            for pattern, replacement in patterns:
                matches = re.findall(pattern, content, re.MULTILINE)
                if matches:
                    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
                    changes_made += len(matches)
            
            if changes_made > 0:
                if dry_run:
                    self.stdout.write(f'Would clean {changes_made} {description} from {file_path}')
                else:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    self.stdout.write(f'Cleaned {changes_made} {description} from {file_path}')
            else:
                self.stdout.write(f'No {description} found in {file_path}')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error processing {file_path}: {str(e)}')
            )

    def cleanup_duplicate_functions(self, dry_run):
        """Identify and suggest cleanup for duplicate functions"""
        self.stdout.write(self.style.SUCCESS('=== Duplicate Functions Analysis ==='))
        
        # This would require more sophisticated analysis
        # For now, just report the known duplicates
        duplicates = [
            {
                'function': '_app_context()',
                'files': ['core/views.py', 'core/views_optimized.py'],
                'suggestion': 'Consolidate into a shared utility module'
            }
        ]
        
        for dup in duplicates:
            self.stdout.write(f"Duplicate function '{dup['function']}' found in:")
            for file_path in dup['files']:
                self.stdout.write(f"  - {file_path}")
            self.stdout.write(f"  Suggestion: {dup['suggestion']}\n")

    def cleanup_unused_imports(self, dry_run):
        """Identify potentially unused imports"""
        self.stdout.write(self.style.SUCCESS('=== Unused Imports Analysis ==='))
        
        # This would require AST analysis to be accurate
        # For now, just report files that might have unused imports
        files_to_check = [
            'core/views_optimized.py',
            'core/optimization_utils.py',
        ]
        
        for file_path in files_to_check:
            if os.path.exists(file_path):
                self.stdout.write(f'Check {file_path} for unused imports')
                self.stdout.write('  Consider using tools like "unimport" or "autoflake"')


"""
Django management command to optimize images
Usage: python manage.py optimize_images
"""

from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
from django.conf import settings
from PIL import Image
import os
from pathlib import Path


class Command(BaseCommand):
    help = 'Optimize images in the media directory'

    def add_arguments(self, parser):
        parser.add_argument(
            '--quality',
            type=int,
            default=85,
            help='JPEG quality (1-100, default: 85)'
        )
        parser.add_argument(
            '--max-width',
            type=int,
            default=1920,
            help='Maximum width for images (default: 1920)'
        )
        parser.add_argument(
            '--max-height',
            type=int,
            default=1080,
            help='Maximum height for images (default: 1080)'
        )
        parser.add_argument(
            '--format',
            choices=['JPEG', 'WEBP', 'PNG'],
            default='JPEG',
            help='Output format (default: JPEG)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be optimized without making changes'
        )

    def handle(self, *args, **options):
        quality = options['quality']
        max_width = options['max_width']
        max_height = options['max_height']
        output_format = options['format']
        dry_run = options['dry_run']

        self.stdout.write(
            self.style.SUCCESS(
                f'Starting image optimization...\n'
                f'Quality: {quality}\n'
                f'Max dimensions: {max_width}x{max_height}\n'
                f'Format: {output_format}\n'
                f'Dry run: {dry_run}\n'
            )
        )

        media_root = settings.MEDIA_ROOT
        optimized_count = 0
        total_size_before = 0
        total_size_after = 0

        # Supported image extensions
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}

        for root, dirs, files in os.walk(media_root):
            for file in files:
                file_path = os.path.join(root, file)
                file_ext = Path(file).suffix.lower()

                if file_ext in image_extensions:
                    try:
                        # Skip already optimized files
                        if '_optimized' in file:
                            continue

                        # Get file size before optimization
                        file_size_before = os.path.getsize(file_path)
                        total_size_before += file_size_before

                        if dry_run:
                            self.stdout.write(f'Would optimize: {file_path}')
                            continue

                        # Open and optimize image
                        with Image.open(file_path) as img:
                            # Convert to RGB if necessary
                            if img.mode in ('RGBA', 'LA', 'P'):
                                img = img.convert('RGB')

                            # Resize if too large
                            if img.width > max_width or img.height > max_height:
                                img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

                            # Generate output filename
                            name, ext = os.path.splitext(file)
                            output_filename = f"{name}_optimized{ext}"
                            output_path = os.path.join(root, output_filename)

                            # Save optimized image
                            if output_format == 'WEBP':
                                img.save(output_path, 'WEBP', quality=quality, optimize=True)
                            elif output_format == 'PNG':
                                img.save(output_path, 'PNG', optimize=True)
                            else:  # JPEG
                                img.save(output_path, 'JPEG', quality=quality, optimize=True)

                            # Get file size after optimization
                            file_size_after = os.path.getsize(output_path)
                            total_size_after += file_size_after

                            # Calculate savings
                            savings = file_size_before - file_size_after
                            savings_percent = (savings / file_size_before) * 100

                            self.stdout.write(
                                f'Optimized: {file} -> {output_filename}\n'
                                f'  Size: {self.format_bytes(file_size_before)} -> {self.format_bytes(file_size_after)}\n'
                                f'  Savings: {self.format_bytes(savings)} ({savings_percent:.1f}%)\n'
                            )

                            optimized_count += 1

                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'Error optimizing {file}: {str(e)}')
                        )

        if not dry_run:
            total_savings = total_size_before - total_size_after
            savings_percent = (total_savings / total_size_before) * 100 if total_size_before > 0 else 0

            self.stdout.write(
                self.style.SUCCESS(
                    f'\nOptimization complete!\n'
                    f'Files optimized: {optimized_count}\n'
                    f'Total size before: {self.format_bytes(total_size_before)}\n'
                    f'Total size after: {self.format_bytes(total_size_after)}\n'
                    f'Total savings: {self.format_bytes(total_savings)} ({savings_percent:.1f}%)\n'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Dry run complete. Would optimize {optimized_count} files.')
            )

    def format_bytes(self, bytes_value):
        """Convert bytes to human readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes_value < 1024.0:
                return f"{bytes_value:.1f} {unit}"
            bytes_value /= 1024.0
        return f"{bytes_value:.1f} TB"
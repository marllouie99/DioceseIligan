"""
Management command to fix naive datetimes in the database.
Converts all naive datetime fields to timezone-aware datetimes.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import models
from core.models import (
    Booking, ChurchFollow, PostLike, PostComment, Donation
)


class Command(BaseCommand):
    help = 'Convert naive datetimes to timezone-aware datetimes'

    def handle(self, *args, **options):
        self.stdout.write('Starting datetime conversion...')
        
        # Get the default timezone
        default_tz = timezone.get_default_timezone()
        
        # Fix Booking.created_at
        self.stdout.write('Fixing Booking.created_at...')
        bookings = Booking.objects.all()
        count = 0
        for booking in bookings:
            if booking.created_at and timezone.is_naive(booking.created_at):
                booking.created_at = timezone.make_aware(booking.created_at, default_tz)
                booking.save(update_fields=['created_at'])
                count += 1
        self.stdout.write(self.style.SUCCESS(f'  Fixed {count} Booking records'))
        
        # Fix ChurchFollow.followed_at
        self.stdout.write('Fixing ChurchFollow.followed_at...')
        follows = ChurchFollow.objects.all()
        count = 0
        for follow in follows:
            if follow.followed_at and timezone.is_naive(follow.followed_at):
                follow.followed_at = timezone.make_aware(follow.followed_at, default_tz)
                follow.save(update_fields=['followed_at'])
                count += 1
        self.stdout.write(self.style.SUCCESS(f'  Fixed {count} ChurchFollow records'))
        
        # Fix PostLike.created_at
        self.stdout.write('Fixing PostLike.created_at...')
        likes = PostLike.objects.all()
        count = 0
        for like in likes:
            if like.created_at and timezone.is_naive(like.created_at):
                like.created_at = timezone.make_aware(like.created_at, default_tz)
                like.save(update_fields=['created_at'])
                count += 1
        self.stdout.write(self.style.SUCCESS(f'  Fixed {count} PostLike records'))
        
        # Fix PostComment.created_at
        self.stdout.write('Fixing PostComment.created_at...')
        comments = PostComment.objects.all()
        count = 0
        for comment in comments:
            if comment.created_at and timezone.is_naive(comment.created_at):
                comment.created_at = timezone.make_aware(comment.created_at, default_tz)
                comment.save(update_fields=['created_at'])
                count += 1
        self.stdout.write(self.style.SUCCESS(f'  Fixed {count} PostComment records'))
        
        # Fix Donation.created_at
        self.stdout.write('Fixing Donation.created_at...')
        donations = Donation.objects.all()
        count = 0
        for donation in donations:
            if donation.created_at and timezone.is_naive(donation.created_at):
                donation.created_at = timezone.make_aware(donation.created_at, default_tz)
                donation.save(update_fields=['created_at'])
                count += 1
        self.stdout.write(self.style.SUCCESS(f'  Fixed {count} Donation records'))
        
        self.stdout.write(self.style.SUCCESS('\nAll naive datetimes have been converted!'))

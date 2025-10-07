from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import F

from core.models import Notification


class Command(BaseCommand):
    help = (
        "Remove mis-targeted 'booking_requested' notifications that were sent to the requester "
        "(booking.user) instead of the church owner."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without actually deleting.",
        )
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Actually perform the deletion without interactive confirmation.",
        )
        parser.add_argument(
            "--sample",
            type=int,
            default=10,
            help="Number of sample notifications to display in dry-run output (default: 10).",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        confirm = options["yes"]
        sample_n = options["sample"]

        # Wrong targets are booking_requested notifications where the recipient is the requester
        # rather than the church owner.
        qs = (
            Notification.objects
            .filter(notification_type=Notification.TYPE_BOOKING_REQUESTED, booking__isnull=False)
            .filter(user=F("booking__user"))
            .select_related("booking", "church", "user", "booking__church")
        )

        total = qs.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS("No mis-targeted 'booking_requested' notifications found."))
            return

        self.stdout.write(self.style.WARNING(f"Found {total} mis-targeted 'booking_requested' notifications."))

        if dry_run:
            self.stdout.write("\nSample (up to {}):".format(sample_n))
            for n in qs[:sample_n]:
                b = n.booking
                self.stdout.write(
                    f"- id={n.id} user={n.user_id} booking={b.id if b else None} "
                    f"church={b.church_id if b else None} title={n.title!r}"
                )
            self.stdout.write(self.style.NOTICE("\nDry run complete. No deletions performed."))
            return

        if not confirm:
            raise CommandError("Pass --yes to actually delete these notifications, or use --dry-run to preview.")

        with transaction.atomic():
            deleted_count, _ = qs.delete()

        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_count} notifications."))

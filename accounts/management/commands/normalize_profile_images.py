from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db import transaction

import os
import re

from accounts.models import Profile


class Command(BaseCommand):
    help = (
        "Normalize stored file paths for Profile.profile_image to avoid repeated 'profiles/' "
        "segments and mixed path separators. Optionally delete old files after moving."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would change without modifying files or database",
        )
        parser.add_argument(
            "--delete-old",
            action="store_true",
            help="Delete the original file after successfully moving to the normalized path",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Limit the number of profiles to process (0 = no limit)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        delete_old = options["delete_old"]
        limit = options["limit"]

        qs = Profile.objects.exclude(profile_image="").exclude(profile_image__isnull=True)
        if limit > 0:
            qs = qs[:limit]

        total = qs.count()
        fixed = 0
        skipped = 0
        errors = 0

        self.stdout.write(self.style.NOTICE(f"Scanning {total} profile images..."))

        for profile in qs:
            old_name = str(getattr(profile.profile_image, "name", "") or "").strip()
            if not old_name:
                skipped += 1
                continue

            normalized = self.normalize_name(old_name)
            # Ensure single 'profiles/' root with basename only
            base = os.path.basename(normalized)
            target_name = f"profiles/{base}"

            if target_name == old_name.replace("\\", "/"):
                # Already normalized
                skipped += 1
                continue

            msg = f"{old_name} -> {target_name}"

            if dry_run:
                self.stdout.write(f"DRY-RUN: {msg}")
                fixed += 1
                continue

            try:
                # Move/copy file in storage
                if not default_storage.exists(old_name):
                    # Try the normalized version as a fallback
                    alt_old = old_name.replace("\\", "/")
                    if default_storage.exists(alt_old):
                        old_name = alt_old
                    else:
                        self.stdout.write(self.style.WARNING(f"Missing file: {old_name}. Skipping."))
                        skipped += 1
                        continue

                # Read and write new file atomically
                with default_storage.open(old_name, "rb") as src:
                    content = src.read()

                saved_name = default_storage.save(target_name, ContentFile(content, name=os.path.basename(target_name)))

                # Update model
                with transaction.atomic():
                    profile.profile_image.name = saved_name
                    profile.save(update_fields=["profile_image"])

                # Optionally delete old
                if delete_old and saved_name != old_name and default_storage.exists(old_name):
                    try:
                        default_storage.delete(old_name)
                    except Exception:
                        # Non-fatal
                        pass

                self.stdout.write(self.style.SUCCESS(f"OK: {msg}"))
                fixed += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"ERROR moving {old_name}: {e}"))
                errors += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Completed. Fixed: {fixed}, Skipped: {skipped}, Errors: {errors}"))

    @staticmethod
    def normalize_name(name: str) -> str:
        # Use forward slashes consistently
        n = name.replace("\\", "/")
        # Collapse repeated 'profiles/' segments anywhere
        n = re.sub(r"(?:profiles/)+", "profiles/", n)
        # Ensure it starts with 'profiles/' if it did before; otherwise leave as-is
        if n.startswith("profiles/"):
            parts = n.split("/")
            # Reduce to 'profiles/<basename>' only
            n = f"profiles/{os.path.basename(n)}"
        return n

from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db import transaction

import os
import re

from core.models import Church


class Command(BaseCommand):
    help = (
        "Normalize stored file paths for Church.logo and Church.cover_image to avoid repeated segments "
        "and leading 'media/' prefixes. Optionally delete old files after moving."
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
            help="Limit the number of churches to process (0 = no limit)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        delete_old = options["delete_old"]
        limit = options["limit"]

        qs = Church.objects.all()
        if limit > 0:
            qs = qs[:limit]

        total = qs.count()
        fixed = 0
        skipped = 0
        errors = 0

        self.stdout.write(self.style.NOTICE(f"Scanning {total} churches..."))

        for church in qs:
            changed_any = False
            # Process both logo and cover
            for field_name, root in (("logo", "churches/logos"), ("cover_image", "churches/covers")):
                f = getattr(church, field_name)
                old_name = str(getattr(f, "name", "") or "").strip()
                if not old_name:
                    continue

                normalized = self.normalize_name(old_name, root)
                base = os.path.basename(normalized)
                target_name = f"{root}/{base}"

                # If already normalized, skip this field
                if target_name == old_name.replace("\\", "/"):
                    continue

                msg = f"{field_name}: {old_name} -> {target_name}"
                if dry_run:
                    self.stdout.write(f"DRY-RUN: {msg}")
                    fixed += 1
                    changed_any = True
                    continue

                try:
                    # Move/copy file in storage
                    source_name = old_name
                    if not default_storage.exists(source_name):
                        # try alt with forward slashes
                        alt_old = old_name.replace("\\", "/")
                        if default_storage.exists(alt_old):
                            source_name = alt_old
                        else:
                            self.stdout.write(self.style.WARNING(f"Missing file: {old_name}. Skipping field {field_name}."))
                            continue

                    with default_storage.open(source_name, "rb") as src:
                        content = src.read()

                    saved_name = default_storage.save(
                        target_name, ContentFile(content, name=os.path.basename(target_name))
                    )

                    with transaction.atomic():
                        getattr(church, field_name).name = saved_name
                        church.save(update_fields=[field_name])

                    if delete_old and saved_name != source_name and default_storage.exists(source_name):
                        try:
                            default_storage.delete(source_name)
                        except Exception:
                            pass

                    self.stdout.write(self.style.SUCCESS(f"OK: {msg}"))
                    fixed += 1
                    changed_any = True
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"ERROR moving {old_name}: {e}"))
                    errors += 1

            if not changed_any:
                skipped += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Completed. Fixed: {fixed}, Skipped: {skipped}, Errors: {errors}"))

    @staticmethod
    def normalize_name(name: str, root: str) -> str:
        # Use forward slashes consistently
        n = name.replace("\\", "/").lstrip("/")
        # Strip media/ prefix
        if n.startswith("media/"):
            n = n[len("media/"):]
        # Collapse repeated root segments
        pattern = re.compile(rf"(?:{re.escape(root)}/)+")
        n = pattern.sub(f"{root}/", n)
        # Reduce to '<root>/<basename>' only
        return f"{root}/{os.path.basename(n)}"

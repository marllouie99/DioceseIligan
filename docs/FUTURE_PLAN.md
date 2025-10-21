# Future Plan

## Back-end: Media and Storage

- **Normalize church image paths (logos/covers)**
  - Create `core` management command `normalize_church_images` to clean up any repeated directory segments in `Church.logo` and `Church.cover_image` (e.g., `churches/logos/churches/logos/...`).
  - Implementation details:
    - Use Django `default_storage` to safely read/write and move existing files.
    - Normalize to `churches/logos/<basename>` and `churches/covers/<basename>` only (no nested dirs).
    - Provide flags similar to profile normalization:
      - `--dry-run` to preview changes.
      - `--delete-old` to remove the original after a successful move.
      - `--limit N` to process a subset.
  - Add safeguards to skip files already normalized or missing.
  - Add unit tests for filename normalization and skip logic.
  - Run in staging first, then in production with `--dry-run`, then without, optionally `--delete-old`.
  - Priority: Medium
  - Status: Planned

## QA and Tooling (optional)

- **Tests for image optimization and naming**
  - Cover `core/utils.py::optimize_image()` to ensure only basenames are returned and `_optimized` is not duplicated.
  - Add model-level tests verifying save guards skip images already containing `_optimized`.
  - Status: Planned

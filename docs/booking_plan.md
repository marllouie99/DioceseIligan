# Booking System Plan and Optimizations

This document outlines the current booking flow, implemented features, pending work, and optimizations for the ChurchIligan booking system.

## Current Flow (Implemented)
- Step 1: User submits a request
  - Users must be logged in to request a booking via `core:book_service`.
  - Form: `BookingForm` validates date (future, within advance window, not closed).
- Step 2: Church manages the request
  - Church owners use Manage Church → Appointments tab to see requests by status with counts and conflict badges.
  - Detail management page: `core:manage_booking` to update status.
- Step 3: Reviewed → user prints invoice
  - Users can open `core:booking_invoice` (printable) once status is `reviewed`.
- Step 4: Approved after in-person docs
  - Owner sets status to `approved`.
  - Auto-cancel: Approving one booking automatically cancels other conflicting requests for the same service/date and sets a cancellation reason.
- Step 5: Completed after service is done
  - Owner marks as `completed`.

## Pages and URLs
- Public detail with services: `templates/core/church_detail.html`
- Request flow (login required): `book-service/<int:service_id>/` → `core:book_service`
- User history: `appointments/` → `core:appointments` → `templates/core/my_appointments.html`
- Church management:
  - `manage-church/` → `core:manage_church` (Appointments tab lists bookings with conflict badges)
  - `manage-booking/<int:booking_id>/` → `core:manage_booking` → `templates/core/manage_booking_detail.html`
- Invoice/print: `booking-invoice/<int:booking_id>/` → `core:booking_invoice` → `templates/core/booking_invoice.html`

## Data Model
- `Booking` model with statuses: requested, reviewed, approved, completed, declined, canceled.
- Generates human-readable `code` (e.g., APPT-0001).
- `conflicts_qs()` helper used for auto-cancel.

## Conflict Handling
- Multiple users can request the same date.
- Conflicts are flagged in Manage Church → Appointments when multiple active bookings exist for the same service/date.
- Approving one booking auto-cancels other active conflicts and sets `cancel_reason`. (Notifications: TODO)

## Optimizations Done
- Select-related used where appropriate to reduce queries: `service`, `church`, `user`.
- Appointment lists filtered with status pills and counts for a better UX.
- Disabled print button on user list until `reviewed`.
- Minimal, accessible UI, consistent templates under `templates/core/`.

## Next Steps (Phase 2)
- Time slots generation per day
  - Use `service.duration`, `max_bookings_per_day`, and availability windows to propose slots.
  - Reserve slots tentatively on `requested` to visualize capacity (optional), or keep it simple until `approved`.
- Notifications
  - Email or in-app notifications on create/review/approve/decline/auto-cancel.
- Admin tools
  - Bulk status changes; batch approve with conflict auto-cancel preview.
- UX improvements
  - Pagination on Appointments lists (both user and owner views).
  - Search/filter by service/date/email on Manage Appointments.
  - Add inline notes when setting `reviewed/declined/canceled`.
- Security and Policy
  - Permission checks are in place (owner/user). Add audits for changes.
  - Rate-limit booking attempts per user (anti-spam).
- Performance
  - Caching for counts on Appointments tab if volume grows.

## Small Technical Tasks
- Add `min`/`max` attributes to the date input (computed bounds) on `book_service` page.
- Validate `max_bookings_per_day` at approval time (optional) if capacity becomes strict.
- Improve messages display in all tabs consistently.

If you want, I can tackle the slots generation next (Task apt-6) and wire up basic email notifications (Task apt-8).

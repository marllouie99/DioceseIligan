## ChurchConnect Database Schema

This document summarizes the database schema defined in `app/config/db.php` (authoritative) and aligned with `app/schema.sql`. It explains tables, key fields, and relationships.

### Core Concepts
- **Users**: Accounts for authentication; can be admins and/or church admins.
- **Churches**: Organizations displayed in the app; have services, posts, events, donations, admins, documents, followers.
- **Content**: Posts and Events created under a church, with engagement (views, likes, comments, registrations, tags).
- **Engagement**: Follows, post interactions, notifications.
- **Scheduling**: Church services, appointments, availability.
- **Donations**: Church- or event-linked donations with payment metadata.

---

### Tables

#### users
- id (PK)
- name, email (unique), password_hash
- is_admin (global system admin)
- phone, address, bio, date_of_birth, profile_image_url
- created_at, updated_at

Usage/Relations:
- Referenced by ownership/authorship FKs on `churches.created_by`, `churches.approved_by`, `churches.owner_user_id`, `posts.created_by`, `events.created_by`.
- Participation/engagement via `follows`, `event_registrations`, `donations.user_id`, `post_likes`, `post_comments`, `post_views.user_id`, `post_bookmarks`, `church_admins.user_id`, `church_documents.uploaded_by`, `church_claims.user_id` and `church_claims.decided_by`, `user_activity.user_id`, `notifications.user_id`.

#### churches
- id (PK)
- slug (unique), name, initials, about, address, denomination, website, phone, email
- owner_user_id (FK → users.id) Nullable; legacy/alternate ownership pointer
- followers_count (counter cache), rating, est_year
- status ENUM('draft','pending_review','needs_changes','approved','rejected','suspended')
- verified (legacy), verified_at
- created_by (FK → users.id), approved_by (FK → users.id)
- admin_notes
- Donation settings: donation_enabled, donation_gcash_number, donation_gcash_qr_url, donation_paypal_link
- Media: profile_image_url, cover_image_url
- created_at

Usage/Relations:
- One-to-many with `church_services`, `posts`, `events`, `donations`, `follows`, `church_admins`, `church_documents`, `church_claims`, `appointments`, `notification_templates`, `church_date_availability`.

#### church_services
- id (PK)
- church_id (FK → churches.id)
- name (unique per church via composite unique), description
- category, duration, price, requirements
- availability_json (per-service rules in JSON; optional)
- images (JSON; optional)
- active, sort_order
- created_at, updated_at

Usage/Relations:
- Referenced by `appointments.service_id`.
- Fine-grained availability can be modeled per-service via `availability_json` (no separate service-level availability table in db.php; see church-level availability below).

#### posts
- id (PK)
- church_id (FK → churches.id)
- event_id (FK → events.id, nullable)
- title, body
- image_url (optional)
- is_donation_post (flag)
- is_pinned (flag)
- created_by (FK → users.id, nullable)
- created_at

Usage/Relations:
- Engagement tables: `post_views`, `post_likes`, `post_comments`, `post_bookmarks`.

#### post_views
- id (PK, BIGINT)
- post_id (FK → posts.id)
- user_id (FK → users.id, nullable)
- created_at

#### post_likes
- id (PK, BIGINT)
- post_id (FK → posts.id)
- user_id (FK → users.id)
- created_at
- Unique: (post_id, user_id)

#### post_comments
- id (PK, BIGINT)
- post_id (FK → posts.id)
- user_id (FK → users.id, nullable)
- body, created_at, updated_at

#### post_bookmarks
- id (PK, BIGINT)
- post_id (FK → posts.id)
- user_id (FK → users.id)
- created_at
- Unique: (post_id, user_id)

#### events
- id (PK)
- church_id (FK → churches.id)
- title, description, category
- created_by (FK → users.id, nullable)
- start_date, start_time, location, capacity
- Donation settings: donation_enabled, donation_gcash_number, donation_gcash_qr_url, donation_paypal_link
- registered_count (counter cache), status ENUM('open','full','closed')
- created_at

Usage/Relations:
- Many-to-many tags via `event_tags`.
- Registrations via `event_registrations`.
- Donations can link to an event via `donations.event_id`.
- Posts can reference an event via `posts.event_id`.

#### event_tags
- event_id (FK → events.id)
- tag
- PK: (event_id, tag)

#### event_templates
- id (PK)
- church_id (FK → churches.id)
- title, description, category
- default_time, default_location, capacity
- Donation defaults: donation_enabled, donation_gcash_number, donation_gcash_qr_url, donation_paypal_link
- tags (TEXT; e.g., comma/JSON)
- created_at, updated_at

Purpose: speed up creating recurring/similar events.

#### event_registrations
- id (PK)
- event_id (FK → events.id)
- user_id (FK → users.id)
- status ENUM('registered','cancelled')
- created_at
- Unique: (event_id, user_id)

#### donations
- id (PK)
- church_id (FK → churches.id)
- event_id (FK → events.id, nullable)
- user_id (FK → users.id, nullable)
- amount DECIMAL(10,2)
- method ENUM('gcash','paypal')
- status ENUM('pending','paid','verified','failed','refunded','cancelled')
- reference, provider_txn_id, payload (raw provider data)
- created_at

#### follows
- id (PK)
- user_id (FK → users.id)
- church_id (FK → churches.id)
- created_at
- Unique: (user_id, church_id)

#### church_admins
- id (PK)
- church_id (FK → churches.id)
- user_id (FK → users.id)
- role ENUM('owner','manager','staff')
- is_primary_owner (flag)
- added_by (FK → users.id, nullable)
- created_at
- Unique: (church_id, user_id)

Purpose: manage admin access for a church beyond global `users.is_admin`.

#### church_documents
- id (PK)
- church_id (FK → churches.id)
- uploaded_by (FK → users.id, nullable)
- doc_type, valid_until (optional)
- file_url
- created_at

Purpose: verification/supporting docs for a church.

#### church_claims
- id (PK)
- church_id (FK → churches.id)
- user_id (FK → users.id)
- status ENUM('pending','approved','rejected')
- reason, proof_file_url, admin_notes
- decided_by (FK → users.id, nullable), decided_at
- created_at

Purpose: allow a user to claim ownership of an existing church listing.

#### appointments
- id (PK)
- user_id (FK → users.id)
- church_id (FK → churches.id)
- service_id (FK → church_services.id, nullable)
- service_name (denormalized text; preserved for legacy/manual entries)
- date, time, notes
- status ENUM('requested','approved','rejected','cancelled','completed','reviewed')
- invoice_number (optional), invoice_date (optional)
- created_at

Notes:
- Both `service_id` and `service_name` exist to support older flows or free-form requests.

#### church_date_availability
- id (PK)
- church_id (FK → churches.id)
- date
- available (1/0)
- updated_at
- Unique: (church_id, date)

Purpose: church-wide calendar toggles affecting all services (e.g., holidays/closures).

#### user_activity
- id (PK)
- user_id (FK → users.id)
- type (free-form action key)
- target_type ENUM('post','church')
- target_id (ID in target table)
- created_at

Purpose: activity feed/analytics for user actions across posts/church follows.

#### notifications
- id (PK)
- user_id (FK → users.id)
- type (key), title, message
- related_id (optional), related_type (optional)
- is_read, created_at, read_at

#### notification_templates
- id (PK)
- church_id (FK → churches.id)
- title, message
- template_type ENUM('appointment_decline','appointment_reschedule','general')
- is_active
- created_at, updated_at

Purpose: reusable message templates per church for notifications.

---

### Relationships Overview
- users 1—N churches (via `created_by`, `approved_by`, `owner_user_id`)
- users 1—N posts (via `created_by`)
- users 1—N events (via `created_by`)
- users 1—N donations (nullable)
- users N—N churches via follows (unique per pair)
- users N—N churches via church_admins (roleful membership)
- users N—N events via event_registrations (unique per pair)
- users 1—N notifications
- churches 1—N church_services, posts, events, donations, church_admins, church_documents, church_claims, appointments, notification_templates, church_date_availability
- posts 1—N post_views, post_likes, post_comments, post_bookmarks
- events 1—N event_tags, event_registrations; posts may reference an event; donations may reference an event
- church_services 1—N appointments

---

### Data Flow Highlights
- Church publishing workflow uses `churches.status` plus optional `verified`/`verified_at` for legacy alignment.
- Donations can be general (church only) or tied to an event; both honor church/event donation settings.
- Appointments may reference a specific predefined service or free-form `service_name`.
- Availability can be globally toggled per church date; service-level specifics may be embedded in `church_services.availability_json`.
- Engagement analytics are captured across posts (views/likes/comments/bookmarks) and user activity, with notifications to users.

---

### Seed and Migration Notes
- On first run, a default admin user may be created (email `admin@churchconnect.local`).
- Demo data may seed a few churches, posts, and events if the database is empty.
- `db.php` includes idempotent ALTERs to add missing columns and FKs safely on existing installs.



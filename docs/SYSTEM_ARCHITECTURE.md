# ChurchIligan System Architecture & Database Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Database Models](#database-models)
3. [Model Relationships](#model-relationships)
4. [System Flow](#system-flow)
5. [Key Features](#key-features)

---

## 🎯 System Overview

**ChurchIligan** is a comprehensive church management and community platform built with Django. It enables churches to manage their services, bookings, posts, donations, and communicate with their community members.

### Core Applications
- **accounts**: User authentication, profiles, and activity tracking
- **core**: Church management, bookings, posts, messaging, and donations

### Technology Stack
- **Backend**: Django 5.2.6
- **Database**: SQLite (development) / PostgreSQL (production)
- **Storage**: Local FileSystem (dev) / Cloudinary (production)
- **Email**: SMTP / Brevo API
- **Payments**: PayPal & Stripe integration

---

## 📊 Database Models

### 1. Authentication & User Management (accounts app)

#### **User (Django Built-in)**
- Standard Django authentication user model
- Fields: username, email, password, first_name, last_name, is_staff, is_active, is_superuser

#### **Profile**
- One-to-One relationship with User
- Stores extended user information
- **Philippine Address Structure**: region, province, city_municipality, barangay, street_address, postal_code
- Additional fields: display_name, phone, bio, date_of_birth, profile_image
- Image optimization for local storage

#### **EmailVerification**
- Handles email verification during registration
- 6-digit codes with 15-minute expiry
- Max 5 verification attempts
- Tracks IP address, user agent, device info

#### **PasswordReset**
- Password reset functionality
- 6-digit codes with 15-minute expiry
- Max 5 attempts
- Security tracking (IP, user agent)

#### **LoginCode**
- Passwordless login via email codes
- Same security features as password reset
- 15-minute expiry, max 5 attempts

#### **UserActivity**
- Comprehensive activity logging
- Tracks: registration, login, verification, profile updates
- Stores: IP address, user agent, browser info, OS info, location
- Used for security monitoring and analytics

---

### 2. Church Management (core app)

#### **Church**
- Central model for church organizations
- **Basic Info**: name, slug, description, denomination, size
- **Contact**: email, phone, website
- **Philippine Address**: region, province, city_municipality, barangay, street_address, postal_code
- **Location**: latitude, longitude for mapping
- **Leadership**: pastor_name, pastor_email, pastor_phone
- **Media**: logo, cover_image (optimized)
- **Services**: service_times, special_services, ministries
- **Social Media**: facebook_url, instagram_url, youtube_url, twitter_url
- **Payment**: paypal_email (for donations)
- **Status**: owner, is_verified, is_active
- **Statistics**: member_count, follower_count

#### **ChurchFollow**
- Many-to-Many relationship between Users and Churches
- Tracks when users follow churches
- Unique constraint on (user, church)

#### **ChurchVerificationRequest**
- Churches can request verification with legal documents
- Status workflow: pending → approved/rejected
- Tracks reviewer and review notes

#### **ChurchVerificationDocument**
- Uploaded documents for verification requests
- Multiple documents per request
- File storage with dynamic paths

---

### 3. Bookable Services & Bookings

#### **BookableService**
- Services that churches offer for booking
- Examples: counseling, baptism, wedding, confession
- **Pricing**: price, is_free, currency (PHP, USD, EUR, etc.)
- **Scheduling**: duration (15min-3hrs), max_bookings_per_day, advance_booking_days
- **Availability**: is_active, requires_approval
- **Instructions**: preparation_notes, cancellation_policy
- **Reviews**: average_rating, review_count, rating_distribution

#### **ServiceImage**
- Multiple images per service (gallery)
- Order management for display
- Primary image designation
- Auto-unset other primary images when setting new one

#### **Availability**
- Church availability calendar
- Types: closed_date, reduced_hours, special_hours
- Tracks closures and special operating hours
- Unique constraint on (church, date)

#### **DeclineReason**
- Customizable decline reasons per church
- Used when declining booking requests
- Sortable with order field

#### **Booking**
- Service booking/appointment system
- **Status Workflow**: requested → reviewed → approved → completed
- **Alternative**: requested → declined or canceled
- **Code**: Human-readable format (APPT-0001, APPT-0002, etc.)
- **Conflict Detection**: Same church + date
- Tracks date, time slots, notes, status changes
- Email notifications on status changes

---

### 4. Posts & Social Features

#### **Post**
- Church posts with multiple types
- **Types**: general, photo, event, prayer_request
- **Event Fields**: event_title, event_start_date, event_end_date, event_location, max_participants
- **Donation**: enable_donation, donation_goal
- **Analytics**: view_count
- **Image Optimization**: Max 1080x1350px (Facebook-style)

#### **PostLike**
- Users can like posts
- Unique constraint on (user, post)
- Tracks creation timestamp

#### **PostBookmark**
- Users can save/bookmark posts
- Unique constraint on (user, post)
- Used for "Saved Posts" feature

#### **PostComment**
- Comments on posts with nested replies
- **Self-referential**: parent field for replies
- **Moderation**: is_active flag
- Supports threaded discussions

#### **CommentLike**
- Users can like comments
- Unique constraint on (user, comment)

#### **PostView**
- Track individual post views
- Prevents duplicate counting
- Stores: user (optional), ip_address, user_agent
- Used for analytics

#### **PostReport**
- Users can report inappropriate posts
- **Reasons**: spam, inappropriate, harassment, violence, false_info, other
- **Status Workflow**: pending → reviewed → dismissed/action_taken
- Admin review system with notes
- Unique constraint: one report per user per post

---

### 5. Reviews & Ratings

#### **ServiceReview**
- Users review services after completed bookings
- **Main Rating**: 1-5 stars (required)
- **Additional Ratings**: staff_rating, facility_rating, value_rating (optional)
- **Content**: title, comment
- **Privacy**: is_anonymous option
- **Social**: helpful_votes counter
- **Verification**: Linked to completed booking
- Unique constraint: one review per user per service

#### **ServiceReviewHelpful**
- Track "helpful" votes on reviews
- Unique constraint on (user, review)
- Increments helpful_votes on ServiceReview

---

### 6. Donations & Payments

#### **Donation**
- Donations to posts (churches)
- **Payment Methods**: PayPal, Stripe, GCash, PayMongo, Bank Transfer
- **Status**: pending, completed, failed, refunded, cancelled
- **PayPal Fields**: order_id, payer_id, payer_email, transaction_id
- **Stripe Fields**: payment_intent_id, charge_id, customer_id, payment_method_id
- **Privacy**: is_anonymous option
- **Message**: Optional donor message
- Tracks completion timestamp

---

### 7. Messaging & Chat

#### **Conversation**
- One-to-one conversation between User and Church
- Unique constraint on (user, church)
- Tracks last update for sorting
- Calculates unread message count

#### **Message**
- Messages within conversations
- **Content**: text message (max 1000 chars)
- **Attachments**: File support with type detection
- **Types**: image, document, other
- **Metadata**: attachment_name, attachment_size
- **Read Status**: is_read flag
- Auto-detects attachment type on save

---

### 8. Notifications

#### **Notification**
- System notifications for users
- **Types**: 
  - Booking: requested, reviewed, approved, declined, canceled, completed
  - Church: approved, declined
  - Social: follow_request, follow_accepted
  - Messaging: message_received
- **Priority Levels**: low, medium, high, urgent
- **Related Objects**: Optional links to booking, church
- **Read Status**: is_read, read_at
- **UI Helpers**: icon_class, color_class properties

---

### 9. Analytics & Tracking

#### **UserInteraction**
- Comprehensive user activity tracking
- **Activity Types**: 
  - Post: like, unlike, comment, bookmark, unbookmark, view, share
  - Church: follow, unfollow
  - Booking: create, update, cancel
  - Service: review
  - Profile: update
  - Auth: login, logout
- **Generic Foreign Key**: Links to any model (post, church, booking, etc.)
- **Metadata**: JSON field for additional context
- **Tracking**: IP address, user agent
- Used for analytics and user behavior insights

---

## 🔗 Model Relationships

### User-Centric Relationships

```
User (1) ←→ (1) Profile
User (1) ←→ (N) Church [as owner]
User (M) ←→ (N) Church [via ChurchFollow]
User (1) ←→ (N) Booking
User (1) ←→ (N) PostLike
User (1) ←→ (N) PostBookmark
User (1) ←→ (N) PostComment
User (1) ←→ (N) ServiceReview
User (1) ←→ (N) Donation
User (1) ←→ (N) Conversation
User (1) ←→ (N) Message [as sender]
User (1) ←→ (N) Notification
User (1) ←→ (N) UserInteraction
User (1) ←→ (N) UserActivity
```

### Church-Centric Relationships

```
Church (1) ←→ (N) BookableService
Church (1) ←→ (N) Booking
Church (1) ←→ (N) Post
Church (1) ←→ (N) Availability
Church (1) ←→ (N) DeclineReason
Church (1) ←→ (N) Conversation
Church (1) ←→ (N) ChurchVerificationRequest
Church (M) ←→ (N) User [via ChurchFollow]
```

### Post-Centric Relationships

```
Post (1) ←→ (N) PostLike
Post (1) ←→ (N) PostBookmark
Post (1) ←→ (N) PostComment
Post (1) ←→ (N) PostView
Post (1) ←→ (N) PostReport
Post (1) ←→ (N) Donation
```

### Service-Centric Relationships

```
BookableService (1) ←→ (N) ServiceImage
BookableService (1) ←→ (N) Booking
BookableService (1) ←→ (N) ServiceReview
```

### Booking-Centric Relationships

```
Booking (1) ←→ (1) ServiceReview [optional]
Booking (1) ←→ (N) Notification
```

### Self-Referential Relationships

```
PostComment (1) ←→ (N) PostComment [parent-child replies]
```

### Generic Relationships

```
UserInteraction ←→ Any Model [via ContentType/GenericForeignKey]
```

---

## 🔄 System Flow

### 1. User Registration & Authentication Flow

```
1. User enters email → EmailVerification code sent
2. User verifies code → Account created
3. Profile automatically created (OneToOne signal)
4. UserActivity logged for each step
5. User can login with password or LoginCode (passwordless)
```

### 2. Church Creation & Management Flow

```
1. User creates Church → becomes owner
2. Church gets auto-generated slug
3. Owner can add BookableServices
4. Owner can manage Availability (closed dates)
5. Owner can create Posts
6. Owner can submit ChurchVerificationRequest
7. Admin reviews and approves/rejects verification
```

### 3. Booking Flow

```
1. User browses BookableServices
2. User checks Availability calendar
3. User creates Booking (status: requested)
4. Church owner receives Notification
5. Owner reviews → status: reviewed
6. Owner approves/declines → status: approved/declined
7. If approved: User receives Notification
8. After service: Owner marks completed → status: completed
9. User can write ServiceReview (only if completed)
```

### 4. Post & Social Interaction Flow

```
1. Church creates Post (general/photo/event/prayer)
2. Post appears in user feeds
3. Users can:
   - Like (PostLike)
   - Comment (PostComment)
   - Reply to comments (nested)
   - Bookmark (PostBookmark)
   - View (PostView tracked)
   - Report (PostReport)
4. If enable_donation: Users can donate via PayPal/Stripe
5. All interactions logged in UserInteraction
```

### 5. Donation Flow

```
1. Church enables donation on Post
2. Church must have paypal_email set
3. User clicks donate → enters amount
4. Payment processed via PayPal/Stripe
5. Donation created (status: pending)
6. Payment completed → status: completed
7. Donation stats updated on Post
8. Church receives notification
```

### 6. Messaging Flow

```
1. User initiates chat with Church
2. Conversation created (unique per user-church pair)
3. Messages sent back and forth
4. Supports file attachments (images, documents)
5. Unread count tracked per conversation
6. Notifications sent for new messages
7. Real-time updates via polling/WebSocket
```

### 7. Review & Rating Flow

```
1. User completes Booking
2. User can write ServiceReview
3. Review includes 1-5 star rating
4. Optional: staff_rating, facility_rating, value_rating
5. Review appears on Service page
6. Other users can mark review as "helpful"
7. Average rating calculated for Service
8. Unique constraint: one review per user per service
```

---

## 🎯 Key Features

### 1. **Multi-Denomination Support**
- Supports Catholic, Protestant, INC, Islam, Buddhism, etc.
- Customizable denomination choices

### 2. **Philippine Address Structure**
- Region, Province, City/Municipality, Barangay
- Street address and postal code
- Legacy address fields for backward compatibility

### 3. **Booking System**
- Status workflow with email notifications
- Conflict detection (same church + date)
- Customizable decline reasons per church
- Availability calendar management

### 4. **Social Features**
- Post types: general, photo, event, prayer request
- Nested comments (replies)
- Like, bookmark, share functionality
- Post reporting and moderation

### 5. **Donation System**
- PayPal and Stripe integration
- Anonymous donation option
- Donation goals and progress tracking
- Multiple currency support

### 6. **Review System**
- Verified customer badges (completed bookings)
- Multi-criteria ratings (staff, facility, value)
- Helpful votes on reviews
- Anonymous review option

### 7. **Messaging System**
- Direct user-to-church communication
- File attachment support
- Unread message tracking
- Conversation history

### 8. **Notification System**
- Real-time notifications
- Priority levels (low, medium, high, urgent)
- Type-based icons and colors
- Mark as read functionality

### 9. **Analytics & Tracking**
- User interaction logging
- Post view tracking
- Activity monitoring
- Security tracking (IP, user agent, device)

### 10. **Image Optimization**
- Automatic image resizing
- Format conversion (JPEG)
- Quality optimization
- Cloudinary integration for production

### 11. **Security Features**
- Email verification with expiry
- Rate limiting on verification attempts
- IP and device tracking
- CSRF protection
- Session management

### 12. **Church Verification**
- Document upload system
- Admin review workflow
- Verified badge for churches

---

## 📈 Database Statistics

### Total Models: 32

**accounts app (6 models):**
- Profile
- EmailVerification
- PasswordReset
- LoginCode
- UserActivity
- User (Django built-in)

**core app (26 models):**
- Church
- ChurchFollow
- ChurchVerificationRequest
- ChurchVerificationDocument
- BookableService
- ServiceImage
- Availability
- DeclineReason
- Booking
- Post
- PostLike
- PostBookmark
- PostComment
- CommentLike
- PostView
- PostReport
- ServiceReview
- ServiceReviewHelpful
- Donation
- Conversation
- Message
- Notification
- UserInteraction

### Relationship Types:
- **One-to-One**: 1 (User-Profile)
- **One-to-Many**: ~45 relationships
- **Many-to-Many**: 1 (User-Church via ChurchFollow)
- **Self-Referential**: 1 (PostComment parent-child)
- **Generic Foreign Key**: 1 (UserInteraction)

### Indexes:
- **Unique Constraints**: 15+
- **Composite Indexes**: 30+
- **Single Field Indexes**: 20+

---

## 🔧 Technical Implementation Notes

### Image Optimization
- Local storage: Optimized on save
- Cloudinary: Automatic optimization
- Profile images: 400x400px max
- Church logos: 400x400px max
- Church covers: 800x600px max
- Post images: 1080x1350px max

### Code Generation
- Booking codes: APPT-0001 format
- Auto-generated on first save
- Sequential numbering

### Slug Generation
- Auto-generated from name
- Uniqueness ensured with counter suffix
- Used in URLs for SEO

### Timestamps
- created_at: Auto-set on creation
- updated_at: Auto-updated on save
- Timezone-aware (Asia/Manila)

### Soft Deletes
- is_active flags for Posts, Comments, Reviews
- Allows hiding without data loss

### Cascading Deletes
- User deletion cascades to Profile, Bookings, etc.
- Church deletion cascades to Services, Posts, etc.
- SET_NULL for optional relationships

---

## 📝 Best Practices Implemented

1. **Normalization**: Proper table relationships, no data duplication
2. **Indexing**: Strategic indexes on frequently queried fields
3. **Constraints**: Unique constraints prevent duplicate data
4. **Validation**: Model-level validation for data integrity
5. **Security**: IP tracking, rate limiting, verification expiry
6. **Performance**: Optimized queries with select_related/prefetch_related
7. **Scalability**: Generic Foreign Keys for flexible relationships
8. **Maintainability**: Clear model names and comprehensive documentation
9. **User Experience**: Human-readable codes, time_ago properties
10. **Analytics**: Comprehensive tracking for insights

---

## 🚀 Future Enhancements

1. **Real-time Chat**: WebSocket integration for instant messaging
2. **Push Notifications**: Mobile push notification support
3. **Advanced Analytics**: Dashboard with charts and insights
4. **Multi-language**: i18n support for multiple languages
5. **API**: RESTful API for mobile app integration
6. **Search**: Full-text search with Elasticsearch
7. **Caching**: Redis caching for performance
8. **CDN**: CloudFront for static asset delivery
9. **Backup**: Automated database backups
10. **Testing**: Comprehensive test coverage

---

*Generated: 2025-10-16*
*System: ChurchIligan v1.0*

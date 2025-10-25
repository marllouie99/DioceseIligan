# ChurchIligan System - Level 1 Data Flow Diagram (DFD)

## 📋 Document Overview

This document provides a detailed Level 1 Data Flow Diagram specification for the ChurchIligan system. The Level 1 DFD decomposes the main system into 10 core processes, showing how data flows between processes, data stores, and external entities.

**Document Created**: 2025-10-16  
**System**: ChurchIligan v1.0  
**Diagram Type**: Level 1 DFD (10 Processes)

---

## 🎯 DFD Components

### **Processes (10)**
Numbered circles representing system functions

### **Data Stores (10)**
Parallel lines representing database tables/storage

### **External Entities (8)**
Rectangles representing actors and external systems

### **Data Flows**
Arrows showing data movement with labels

---

## 🔄 Core Processes (Maximum 10)

### **Process 1.0: User Authentication & Account Management**
**Description**: Handles user registration, login, email verification, password reset, and profile management.

**Inputs**:
- Registration data (from Anonymous Visitor)
- Login credentials (from User, Church Owner, Admin)
- Verification codes (from User)
- Profile updates (from User)
- Password reset requests (from User)

**Outputs**:
- Email verification codes (to Email Service)
- Authentication tokens (to User)
- Profile data (to User)
- Account status (to User)

**Data Stores Used**:
- DS1: User Database
- DS2: Profile Database
- DS3: Email Verification Database
- DS4: User Activity Log

**Process Logic**:
1. Validate registration data
2. Generate verification codes
3. Send verification emails
4. Authenticate credentials
5. Manage user sessions
6. Update profile information
7. Log all activities

---

### **Process 2.0: Church Profile Management**
**Description**: Manages church updates and church information display. **Church creation, manager assignment, and verification are handled by Super Admin in Process 10.0**. All churches created by Super-Admin are automatically verified.

**Inputs**:
- Church updates (from Parish Manager)
- Church search queries (from Regular User)
- Church creation data with assigned manager (from Process 10.0) - automatically verified
- User credentials for ownership verification (from Process 1.0)

**Outputs**:
- Church listings (to Regular User)
- Church details (to Regular User, Parish Manager)
- Church analytics (to Parish Manager)
- Church created confirmation (to Process 10.0)
- Church data for services (to Process 3.0)

**Data Stores Used**:
- DS5: Church Database
- DS1: User Database (read-only for ownership verification)

**Process Logic**:
1. Receive and store church profiles created by Super Admin (with assigned manager, auto-verified)
2. Validate ownership: verify Parish Manager is assigned to the church
3. Validate and store church updates from assigned Parish Manager only
4. Upload and optimize church images
5. Calculate church statistics (views, followers, engagement)
6. Generate church listings for public search
7. Track follower counts and analytics

---

### **Process 3.0: Service & Booking Management**
**Description**: Handles bookable services, availability calendar, booking requests with online payment, and booking workflow.

**Inputs**:
- Service creation (from Parish Manager)
- Service images (from Parish Manager)
- Availability updates (from Parish Manager)
- Booking requests with payment (from Regular User)
- Payment confirmations (from Payment Gateway)
- Payment webhooks (from Payment Gateway)
- Booking decisions (from Parish Manager)

**Outputs**:
- Service catalog (to Regular User)
- Availability calendar (to Regular User)
- Payment requests (to Payment Gateway)
- Booking confirmations (to Regular User)
- Payment receipts (to Regular User, Email Service)
- Booking notifications (to Parish Manager, Email Service)
- Booking status updates (to Regular User)

**Data Stores Used**:
- DS7: Bookable Service Database
- DS8: Booking Database (includes payment fields)
- DS9: Availability Database
- DS5: Church Database

**Process Logic**:
1. Create and manage services (with pricing)
2. Manage availability calendar
3. Check booking conflicts
4. Process booking requests with payment
5. Validate payment before confirming booking
6. Handle PayPal/Stripe webhooks for booking payments
7. Update booking status workflow
8. Generate booking codes (APPT-XXXX)
9. Generate payment receipts
10. Send notifications
11. Track booking and payment statistics

---

### **Process 4.0: Post & Content Management**
**Description**: Manages church posts (general, photo, event, prayer), post interactions, and content moderation.

**Inputs**:
- Post creation (from Church Owner)
- Post updates (from Church Owner)
- Post interactions (from User) - likes, comments, bookmarks
- Post reports (from User)
- Moderation decisions (from Admin)

**Outputs**:
- Post feed (to User)
- Post details (to User)
- Post analytics (to Church Owner)
- Interaction notifications (to Church Owner)
- Moderation queue (to Admin)

**Data Stores Used**:
- DS10: Post Database
- DS11: Post Interaction Database (likes, comments, bookmarks)
- DS12: Post Report Database
- DS5: Church Database

**Process Logic**:
1. Create and publish posts
2. Optimize post images
3. Process likes, comments, bookmarks
4. Handle nested comment replies
5. Track post views
6. Process post reports
7. Calculate engagement metrics
8. Filter and moderate content

---

### **Process 5.0:      **
**Description**: Handles donation enabling, payment processing, donation tracking, and receipt generation.

**Inputs**:
- Donation settings (from Church Owner)
- Donation requests (from User)
- Payment confirmations (from Payment Gateway)
- Payment webhooks (from Payment Gateway)

**Outputs**:
- Payment requests (to Payment Gateway)
- Donation receipts (to User, Email Service)
- Donation statistics (to Church Owner)
- Donation notifications (to Church Owner)

**Data Stores Used**:
- DS13: Donation Database
- DS10: Post Database
- DS5: Church Database

**Process Logic**:
1. Validate church PayPal email
2. Create donation records
3. Process payment requests
4. Handle PayPal/Stripe webhooks
5. Update donation status
6. Calculate donation goals progress
7. Generate receipts
8. Track donor information

---

### **Process 6.0: Messaging & Communication**
**Description**: Manages direct messaging between users and churches, file attachments, and message notifications.

**Inputs**:
- Message content (from User, Church Owner)
- File attachments (from User, Church Owner)
- Read receipts (from User, Church Owner)

**Outputs**:
- Messages (to User, Church Owner)
- Message notifications (to User, Church Owner, Email Service)
- Unread counts (to User, Church Owner)
- Conversation history (to User, Church Owner)

**Data Stores Used**:
- DS14: Conversation Database
- DS15: Message Database
- DS5: Church Database
- DS1: User Database

**Process Logic**:
1. Create or retrieve conversations
2. Send and store messages
3. Handle file attachments
4. Detect attachment types
5. Mark messages as read
6. Calculate unread counts
7. Update conversation timestamps
8. Send message notifications

---

### **Process 7.0: Review & Rating Management**
**Description**: Manages service reviews, ratings, helpful votes, and review display.

**Inputs**:
- Review submissions (from User)
- Helpful votes (from User)
- Review moderation (from Admin)

**Outputs**:
- Review displays (to User)
- Review notifications (to Church Owner)
- Rating statistics (to User, Church Owner)
- Average ratings (to User)

**Data Stores Used**:
- DS16: Service Review Database
- DS7: Bookable Service Database
- DS8: Booking Database
- DS1: User Database

**Process Logic**:
1. Validate completed bookings
2. Create service reviews
3. Calculate average ratings
4. Track helpful votes
5. Generate rating distributions
6. Verify customer status
7. Handle anonymous reviews
8. Update service ratings

---

### **Process 8.0: Notification Management**
**Description**: Generates, stores, and delivers notifications for all system events.

**Inputs**:
- Booking events (from Process 3.0)
- Message events (from Process 6.0)
- Donation events (from Process 5.0)
- Review events (from Process 7.0)
- Post events (from Process 4.0)

**Outputs**:
- In-app notifications (to User, Church Owner)
- Email notifications (to Email Service)
- Notification counts (to User, Church Owner)
- Notification lists (to User, Church Owner)

**Data Stores Used**:
- DS17: Notification Database
- DS1: User Database

**Process Logic**:
1. Generate notifications for events
2. Set priority levels
3. Store notifications
4. Send email notifications
5. Track read status
6. Calculate unread counts
7. Mark notifications as read
8. Clean up old notifications

---

### **Process 9.0: Analytics & Tracking**
**Description**: Tracks user interactions, generates analytics, and provides insights.

**Inputs**:
- User interactions (from all processes)
- View events (from User)
- Activity events (from User, Church Owner)

**Outputs**:
- Analytics dashboards (to Church Owner, Admin)
- Interaction reports (to Church Owner)
- System metrics (to Admin)
- User activity logs (to Admin)

**Data Stores Used**:
- DS18: User Interaction Database
- DS4: User Activity Log
- DS10: Post Database
- DS5: Church Database
- DS8: Booking Database

**Process Logic**:
1. Log user interactions
2. Track post views
3. Calculate engagement metrics
4. Generate church analytics
5. Track booking statistics
6. Monitor donation trends
7. Create system reports
8. Analyze user behavior

---

### **Process 10.0: System Administration**
**Description**: Handles administrative functions, church creation & assignment, moderation, verification approval, and system management.

**Inputs**:
- Admin commands (from Admin)
- Church creation request (from Super Admin)
- User assignment data (from Super Admin)
- Verification requests (from Process 2.0)
- Post reports (from Process 4.0)
- System queries (from Admin)

**Outputs**:
- Church creation data (to Process 2.0)
- Manager assignment notification (to Process 8.0)
- Email notification request (to Email Service)
- Verification decisions (to Process 2.0)
- Moderation actions (to Process 4.0)
- User management actions (to Process 1.0)
- System reports (to Admin)
- Configuration updates (to all processes)

**Data Stores Used**:
- DS1: User Database
- DS5: Church Database
- DS6: Church Verification Database
- DS12: Post Report Database
- DS4: User Activity Log
- DS17: Notification Database

**Process Logic**:
1. Create churches and assign managers
2. Validate user profile completeness
3. Send manager assignment notifications (email + system)
4. Review verification requests
5. Approve/reject church verifications
6. Moderate reported content
7. Manage users and churches
8. Generate system reports
9. Monitor security logs
10. Configure system settings
11. Maintain platform integrity

---

## 💾 Data Stores (10 Primary)

| ID | Data Store Name | Description | Tables Included |
|----|-----------------|-------------|-----------------|
| DS1 | User Database | User accounts and authentication | auth_user |
| DS2 | Profile Database | User profiles and personal info | accounts_profile |
| DS3 | Email Verification Database | Verification codes and security | accounts_emailverification, accounts_passwordreset, accounts_logincode |
| DS4 | User Activity Log | Activity tracking and security logs | accounts_useractivity |
| DS5 | Church Database | Church profiles and information | core_church, core_churchfollow |
| DS6 | Church Verification Database | Verification requests and documents | core_churchverificationrequest, core_churchverificationdocument |
| DS7 | Bookable Service Database | Services and service images | core_bookableservice, core_serviceimage |
| DS8 | Booking Database | Bookings with payment info | core_booking (includes payment fields), core_availability, core_declinereason |
| DS9 | Availability Database | Church availability calendar | core_availability |
| DS10 | Post Database | Church posts and content | core_post |
| DS11 | Post Interaction Database | Likes, comments, bookmarks, views | core_postlike, core_postcomment, core_commentlike, core_postbookmark, core_postview |
| DS12 | Post Report Database | Content moderation | core_postreport |
| DS13 | Donation Database | Donation records and payments | core_donation |
| DS14 | Conversation Database | Chat conversations | core_conversation |
| DS15 | Message Database | Chat messages | core_message |
| DS16 | Service Review Database | Reviews and ratings | core_servicereview, core_servicereviewhelpful |
| DS17 | Notification Database | System notifications | core_notification |
| DS18 | User Interaction Database | Analytics and tracking | core_userinteraction |

---

## 👥 External Entities (8)

1. **Regular User / Community Member**
2. **Church Owner / Administrator**
3. **System Administrator**
4. **Anonymous Visitor**
5. **Payment Gateway (PayPal/Stripe)**
6. **Email Service Provider (SMTP/Brevo)**
7. **Cloud Storage (Cloudinary)**
8. **Google OAuth Provider**

---

## 📊 Major Data Flows Between Processes

### **Inter-Process Communication**

```
Process 1.0 (Authentication) → Process 2.0 (Church Management)
- User credentials, ownership verification

Process 10.0 (Administration) → Process 2.0 (Church Management)
- Church creation data, manager assignment

Process 10.0 (Administration) → Process 8.0 (Notifications)
- Manager assignment notifications

Process 10.0 (Administration) → Email Service
- Manager assignment email notifications

Process 2.0 (Church Management) → Process 3.0 (Service & Booking)
- Church ID, church details for services

Process 3.0 (Service & Booking) → Process 8.0 (Notifications)
- Booking events, status changes

Process 3.0 (Service & Booking) → Process 7.0 (Reviews)
- Completed booking data for review eligibility

Process 4.0 (Post Management) → Process 5.0 (Donations)
- Post ID, donation settings

Process 5.0 (Donations) → Process 8.0 (Notifications)
- Donation events, payment confirmations

Process 6.0 (Messaging) → Process 8.0 (Notifications)
- Message events, new message alerts

Process 7.0 (Reviews) → Process 3.0 (Service & Booking)
- Rating updates for services

Process 8.0 (Notifications) → Email Service
- Email notification requests

All Processes → Process 9.0 (Analytics)
- Interaction data, activity logs

Process 10.0 (Administration) → All Processes
- Configuration updates, moderation decisions
```

---

## 🎨 DFD Visual Layout Specification

### **Diagram Structure**

```
                    [Anonymous Visitor]
                            │
                            ↓
                    ┌───────────────┐
                    │   Process 1.0 │
                    │ Authentication│←─────[User]
                    └───────┬───────┘
                            │
                    ┌───────┴───────┐
                    ↓               ↓
            ┌───────────────┐   ┌───────────────┐
[Church     │   Process 2.0 │   │   Process 4.0 │
 Owner]────→│    Church     │   │     Post      │
            │  Management   │   │  Management   │
            └───────┬───────┘   └───────┬───────┘
                    │                   │
                    ↓                   ↓
            ┌───────────────┐   ┌───────────────┐
            │   Process 3.0 │   │   Process 5.0 │
            │   Service &   │   │   Donation    │←──[Payment Gateway]
            │    Booking    │   │  Processing   │
            └───────┬───────┘   └───────┬───────┘
                    │                   │
                    └───────┬───────────┘
                            │
                    ┌───────┴───────┐
                    │   Process 8.0 │
                    │ Notifications │────→[Email Service]
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            ↓               ↓               ↓
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │   Process 6.0 │ │   Process 7.0 │ │   Process 9.0 │
    │   Messaging   │ │    Reviews    │ │   Analytics   │
    └───────────────┘ └───────────────┘ └───────┬───────┘
                                                 │
                                                 ↓
                                        ┌───────────────┐
                                        │  Process 10.0 │
                            [Admin]────→│    System     │
                                        │Administration │
                                        └───────────────┘

                    [Data Stores DS1-DS18 connected to all processes]
```

---

## 📋 Detailed Process Specifications

### **Process 1.0: User Authentication & Account Management**

**Process Number**: 1.0  
**Process Name**: User Authentication & Account Management

**Input Data Flows**:
| From | Data Flow | Data Elements |
|------|-----------|---------------|
| Anonymous Visitor | Registration Request | Email, Password, Name, Phone |
| User | Login Request | Email, Password |
| User | Verification Code | Email, 6-digit Code |
| User | Profile Update | Display Name, Bio, Address, Image |
| User | Password Reset Request | Email |
| Google OAuth | OAuth Token | Access Token, User Info |

**Output Data Flows**:
| To | Data Flow | Data Elements |
|----|-----------|---------------|
| User | Authentication Token | Session ID, User ID |
| User | Profile Data | User Info, Profile Details |
| Email Service | Verification Email | Email, Code, Expiry |
| DS1 | User Record | User Account Data |
| DS2 | Profile Record | Profile Information |
| DS3 | Verification Code | Code, Email, Expiry |
| DS4 | Activity Log | Activity Type, IP, Timestamp |

**Data Stores Accessed**:
- DS1: User Database (Read/Write)
- DS2: Profile Database (Read/Write)
- DS3: Email Verification Database (Read/Write)
- DS4: User Activity Log (Write)

---

### **Process 2.0: Church Profile Management**

**Process Number**: 2.0  
**Process Name**: Church Profile Management

**Key Concept**: Super-Admin creates churches and assigns Parish Managers in Process 10.0. All churches are automatically verified upon creation. Process 2.0 receives the created church data and manages updates from the assigned Parish Manager.

**Input Data Flows**:
| From | Data Flow | Data Elements |
|------|-----------|---------------|
| Process 10.0 | Church Creation Data with Assigned Manager | Name, Description, Contact, Address, Images, Assigned Manager User ID, is_verified=True |
| Process 1.0 | User Credentials | User ID, Authentication Token (for ownership verification) |
| Parish Manager | Church Update | Updated Church Data (name, description, contact, images) |
| Regular User | Church Search Query | Keywords, Filters, Location |
| Cloud Storage | Image URL | CDN URL, File ID |

**Output Data Flows**:
| To | Data Flow | Data Elements |
|----|-----------|---------------|
| Regular User | Church Listings | Church List, Filters Applied |
| Regular User | Church Details | Full Church Profile |
| Parish Manager | Church Details | Full Church Profile (for their church) |
| Parish Manager | Church Analytics | Views, Followers, Engagement Statistics |
| Process 10.0 | Church Created Confirmation | Church ID, Status, Assigned Manager |
| Process 3.0 | Church Data for Services | Church ID, Church Name, Church Details |
| Cloud Storage | Image Upload Request | Image File, Metadata |
| DS5 | Church Record | Church Data (with is_verified=True) |

**Data Stores Accessed**:
- DS5: Church Database (Read/Write)
- DS1: User Database (Read - for ownership verification)

---

### **Process 3.0: Service & Booking Management**

**Process Number**: 3.0  
**Process Name**: Service & Booking Management

**Key Update**: Users can now pay online for booking requests. Payment is processed before booking confirmation.

**Input Data Flows**:
| From | Data Flow | Data Elements |
|------|-----------|---------------|
| Parish Manager | Service Creation | Name, Description, Price, Duration, Images, Payment Required (Yes/No) |
| Parish Manager | Availability Update | Date, Type, Reason, Hours |
| Regular User | Booking Request with Payment | Service ID, Date, Time, Notes, Payment Method |
| Payment Gateway | Payment Confirmation | Transaction ID, Status, Payer Info, Amount |
| Payment Gateway | Webhook Notification | Order ID, Status Update |
| Parish Manager | Booking Decision | Booking ID, Approve/Decline, Reason |
| Process 2.0 | Church Data | Church ID, Church Details, PayPal Email |

**Output Data Flows**:
| To | Data Flow | Data Elements |
|----|-----------|---------------|
| Regular User | Service Catalog | Services List, Details, Prices |
| Regular User | Availability Calendar | Available Dates, Closed Dates |
| Payment Gateway | Payment Request | Amount, Currency, Order ID, Service Details |
| Regular User | Booking Confirmation | Booking Code, Status, Payment Receipt |
| Regular User | Payment Receipt | Amount, Transaction ID, Receipt Details |
| Parish Manager | Booking Notification | New Booking Alert, Payment Status |
| Email Service | Booking & Payment Notification | Booking Details, Payment Receipt |
| Process 8.0 | Booking Event | Event Type, Booking Data, Payment Status |
| Process 7.0 | Completed Booking | Booking ID, Service ID, User ID |
| DS7 | Service Record | Service Data, Images, Price |
| DS8 | Booking Record | Booking Data, Status, Payment Status, Payment Details |
| DS9 | Availability Record | Date, Type, Hours |

**Data Stores Accessed**:
- DS7: Bookable Service Database (Read/Write)
- DS8: Booking Database (Read/Write) - includes payment fields
- DS9: Availability Database (Read/Write)
- DS5: Church Database (Read)

---

### **Process 4.0: Post & Content Management**

**Process Number**: 4.0  
**Process Name**: Post & Content Management

**Input Data Flows**:
| From | Data Flow | Data Elements |
|------|-----------|---------------|
| Church Owner | Post Creation | Content, Type, Image, Event Details |
| User | Post Like | Post ID, User ID |
| User | Post Comment | Post ID, Content, Parent Comment ID |
| User | Post Bookmark | Post ID, User ID |
| User | Post Report | Post ID, Reason, Description |
| Admin | Moderation Decision | Report ID, Action, Notes |
| Process 2.0 | Church Data | Church ID, Church Name |

**Output Data Flows**:
| To | Data Flow | Data Elements |
|----|-----------|---------------|
| User | Post Feed | Posts, Likes, Comments |
| User | Post Details | Full Post, All Comments |
| Church Owner | Post Analytics | Views, Likes, Comments, Shares |
| Church Owner | Interaction Notification | Like/Comment Alert |
| Admin | Moderation Queue | Reported Posts |
| Process 5.0 | Donation Settings | Post ID, Enable Donation, Goal |
| Process 9.0 | View Event | Post ID, User ID, Timestamp |
| DS10 | Post Record | Post Data |
| DS11 | Interaction Record | Likes, Comments, Bookmarks |
| DS12 | Report Record | Report Data, Status |

**Data Stores Accessed**:
- DS10: Post Database (Read/Write)
- DS11: Post Interaction Database (Read/Write)
- DS12: Post Report Database (Read/Write)
- DS5: Church Database (Read)

---

### **Process 5.0: Donation Processing**

**Process Number**: 5.0  
**Process Name**: Donation Processing

**Input Data Flows**:
| From | Data Flow | Data Elements |
|------|-----------|---------------|
| User | Donation Request | Post ID, Amount, Message, Payment Method |
| Payment Gateway | Payment Confirmation | Transaction ID, Status, Payer Info |
| Payment Gateway | Webhook Notification | Order ID, Status Update |
| Process 4.0 | Donation Settings | Post ID, Goal, PayPal Email |

**Output Data Flows**:
| To | Data Flow | Data Elements |
|----|-----------|---------------|
| Payment Gateway | Payment Request | Amount, Currency, Order ID |
| User | Donation Receipt | Amount, Transaction ID, Receipt |
| Church Owner | Donation Notification | Donor, Amount, Post |
| Church Owner | Donation Statistics | Total Raised, Donor Count, Progress |
| Process 8.0 | Donation Event | Donation Completed |
| DS13 | Donation Record | Donation Data, Payment Info |

**Data Stores Accessed**:
- DS13: Donation Database (Read/Write)
- DS10: Post Database (Read)
- DS5: Church Database (Read)

---

### **Process 6.0: Messaging & Communication**

**Process Number**: 6.0  
**Process Name**: Messaging & Communication

**Input Data Flows**:
| From | Data Flow | Data Elements |
|------|-----------|---------------|
| User | Message | Church ID, Content, Attachment |
| Church Owner | Message Reply | User ID, Content, Attachment |
| User/Church Owner | Read Receipt | Message ID |

**Output Data Flows**:
| To | Data Flow | Data Elements |
|----|-----------|---------------|
| User | Message Delivery | Content, Sender, Timestamp |
| Church Owner | Message Delivery | Content, Sender, Timestamp |
| User/Church Owner | Unread Count | Count of Unread Messages |
| Process 8.0 | Message Event | New Message Alert |
| DS14 | Conversation Record | User ID, Church ID, Updated At |
| DS15 | Message Record | Content, Sender, Attachment |

**Data Stores Accessed**:
- DS14: Conversation Database (Read/Write)
- DS15: Message Database (Read/Write)
- DS5: Church Database (Read)
- DS1: User Database (Read)

---

### **Process 7.0: Review & Rating Management**

**Process Number**: 7.0  
**Process Name**: Review & Rating Management

**Input Data Flows**:
| From | Data Flow | Data Elements |
|------|-----------|---------------|
| User | Review Submission | Service ID, Rating, Title, Comment |
| User | Helpful Vote | Review ID, User ID |
| Process 3.0 | Completed Booking | Booking ID, Service ID, User ID |

**Output Data Flows**:
| To | Data Flow | Data Elements |
|----|-----------|---------------|
| User | Review Display | Reviews, Ratings, Helpful Votes |
| Church Owner | Review Notification | New Review Alert |
| User | Rating Statistics | Average Rating, Distribution |
| Process 3.0 | Rating Update | Service ID, New Average Rating |
| DS16 | Review Record | Review Data, Ratings |

**Data Stores Accessed**:
- DS16: Service Review Database (Read/Write)
- DS7: Bookable Service Database (Read)
- DS8: Booking Database (Read)
- DS1: User Database (Read)

---

### **Process 8.0: Notification Management**

**Process Number**: 8.0  
**Process Name**: Notification Management

**Input Data Flows**:
| From | Data Flow | Data Elements |
|------|-----------|---------------|
| Process 3.0 | Booking Event | Event Type, Booking Data |
| Process 5.0 | Donation Event | Donation Data |
| Process 6.0 | Message Event | Message Data |
| Process 7.0 | Review Event | Review Data |
| Process 4.0 | Post Event | Interaction Data |

**Output Data Flows**:
| To | Data Flow | Data Elements |
|----|-----------|---------------|
| User | In-App Notification | Title, Message, Type, Priority |
| Church Owner | In-App Notification | Title, Message, Type, Priority |
| Email Service | Email Notification | Recipient, Subject, Body |
| User/Church Owner | Notification Count | Unread Count |
| DS17 | Notification Record | Notification Data |

**Data Stores Accessed**:
- DS17: Notification Database (Read/Write)
- DS1: User Database (Read)

---

### **Process 9.0: Analytics & Tracking**

**Process Number**: 9.0  
**Process Name**: Analytics & Tracking

**Input Data Flows**:
| From | Data Flow | Data Elements |
|------|-----------|---------------|
| All Processes | User Interaction | Activity Type, User ID, Object ID |
| Process 4.0 | View Event | Post ID, User ID, IP Address |
| User | Activity Event | Action, Timestamp, Metadata |

**Output Data Flows**:
| To | Data Flow | Data Elements |
|----|-----------|---------------|
| Church Owner | Church Analytics | Views, Followers, Engagement |
| Church Owner | Post Analytics | Views, Likes, Comments, Shares |
| Admin | System Metrics | User Count, Church Count, Activity |
| Admin | Activity Reports | User Activities, Trends |
| DS18 | Interaction Record | Activity Data, Metadata |

**Data Stores Accessed**:
- DS18: User Interaction Database (Write)
- DS4: User Activity Log (Read)
- DS10: Post Database (Read)
- DS5: Church Database (Read)
- DS8: Booking Database (Read)

---

### **Process 10.0: System Administration**

**Process Number**: 10.0  
**Process Name**: System Administration

**Input Data Flows**:
| From | Data Flow | Data Elements |
|------|-----------|---------------|
| Super Admin | Church Creation Request | Church Data, Manager User ID |
| Super Admin | Manager Assignment | Church ID, User ID |
| Admin | Admin Command | Action Type, Target ID, Parameters |
| Process 2.0 | Verification Request | Church ID, Documents |
| Process 4.0 | Post Report | Report ID, Post ID, Reason |
| DS1 | User Profile Data | Profile Completion Status |

**Output Data Flows**:
| To | Data Flow | Data Elements |
|----|-----------|---------------|
| Process 2.0 | Church Creation Data | Complete Church Profile, Manager Assignment |
| Process 8.0 | Manager Assignment Notification | User ID, Church ID, Notification Data |
| Email Service | Assignment Email | Recipient, Church Details, Dashboard Link |
| Process 2.0 | Verification Decision | Approved/Rejected, Notes |
| Process 4.0 | Moderation Action | Action Taken, Notes |
| Process 1.0 | User Management | Activate/Deactivate/Delete |
| Admin | System Report | Platform Statistics, Logs |
| Admin | User List | All Users, Status, Profile Completion |
| Admin | Church List | All Churches, Verification Status, Managers |

**Data Stores Accessed**:
- DS1: User Database (Read/Write)
- DS2: Profile Database (Read)
- DS5: Church Database (Read/Write)
- DS6: Church Verification Database (Read/Write)
- DS12: Post Report Database (Read/Write)
- DS17: Notification Database (Write)
- DS4: User Activity Log (Read)

---

## 🎨 Drawing Instructions

### **Step 1: Draw Processes**
- Draw 10 numbered circles
- Label each with process number and name
- Arrange in logical flow (top to bottom, left to right)

### **Step 2: Draw Data Stores**
- Draw 18 parallel lines (open rectangles)
- Label with DS number and name
- Position around processes

### **Step 3: Draw External Entities**
- Draw 8 rectangles
- Label with entity names
- Position around the perimeter

### **Step 4: Draw Data Flows**
- Connect entities to processes with arrows
- Connect processes to data stores
- Connect processes to other processes
- Label each arrow with data flow name

### **Step 5: Add Legend**
- Process (numbered circle)
- Data Store (parallel lines)
- External Entity (rectangle)
- Data Flow (arrow with label)

---

## 📊 Summary Statistics

| Component | Count |
|-----------|-------|
| **Processes** | 10 |
| **Data Stores** | 18 (grouped into 10 primary) |
| **Database Tables** | 32 |
| **External Entities** | 8 |
| **Major Data Flows** | 100+ |
| **Inter-Process Flows** | 15+ |

---

## 🔑 Key Insights

1. **Process 10.0 (Administration)** now handles church creation and manager assignment (changed from user-initiated)
2. **Process 8.0 (Notifications)** is a central hub receiving events from 6 processes including manager assignments
3. **Process 1.0 (Authentication)** is the entry point for all users
4. **Process 3.0 (Service & Booking)** has the most complex workflow with status transitions
5. **Process 9.0 (Analytics)** receives data from all processes for tracking
6. **Church Creation Flow**: Super Admin creates → Process 10.0 validates → Process 2.0 stores → Process 8.0 notifies → Email sent

---

## 🔄 Recent Changes

### **2025-10-23: Online Booking Payment**
- **New Feature**: Users can now pay online for booking requests
- **Payment Gateway**: PayPal/Stripe/GCash integration for booking payments
- **Updated Data Store**: DS8 - Booking Database now includes payment fields
- **Payment Fields in core_booking**:
  - payment_status (pending, paid, failed, canceled, refunded)
  - payment_method (paypal, stripe, gcash)
  - payment_amount
  - payment_transaction_id
  - payment_date
- **Updated Process**: Process 3.0 now handles payment processing
- **Payment Flow**: Payment → Confirmation → Booking Approval
- **Features**:
  1. **Optional Payment**: Services can be free or require payment
  2. **Payment Receipts**: Automatic receipt generation
  3. **Webhook Support**: Real-time payment status updates
  4. **Payment Validation**: Booking confirmed only after successful payment

### **2025-10-17: Church Creation Flow Update**
- **Old Flow**: Users could create churches directly through Process 2.0
- **New Flow**: Only Super Admins can create churches through Process 10.0
- **Reason**: Centralized control, quality assurance, proper manager assignment

### **Features Added (2025-10-17)**:
1. **Profile Validation**: System checks if assigned user has complete profile (Name, Phone, Address, DOB)
2. **Dual Notifications**: Both email and system notifications sent to assigned managers
3. **Cascading Location**: Philippine address dropdowns (Region → Province → City → Barangay)
4. **Auto-fill Leadership**: Pastor fields auto-populate from assigned manager's profile
5. **Auto-Verification**: Churches created by Super-Admin are automatically verified

---

*Document Created: 2025-10-16*  
*Last Updated: 2025-10-23*  
*System: ChurchIligan v1.0*  
*Diagram Type: Level 1 DFD (10 Processes, 18 Data Stores)*

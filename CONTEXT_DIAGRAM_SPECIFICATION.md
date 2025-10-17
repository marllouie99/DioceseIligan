# ChurchIligan System - Context Diagram Specification

## 📋 Document Overview

This document provides a detailed specification for creating a Context Diagram (Level 0 DFD) for the ChurchIligan system. The context diagram shows the system boundaries, external entities (actors), and the data flows between them and the system.

---

## 🎯 System Name

**"ChurchIligan - Integrated Church Management and Community Platform"**

---

## 📖 Context Diagram Description

The context diagram identifies the flows of information between the ChurchIligan system and its external entities. This context diagram effectively illustrates how the platform centralizes church administrative tasks, enhances communication between church leaders and community members, and facilitates seamless management of bookings, donations, and social interactions through digital means.

### **System Purpose**

ChurchIligan serves as a comprehensive digital platform that bridges the gap between churches and their communities. It streamlines church operations, enables efficient service booking management, facilitates transparent donation processing, and fosters community engagement through social features. The system acts as a central hub where multiple stakeholders—from regular community members to church administrators—can interact, communicate, and collaborate effectively.

### **Entity Roles and Responsibilities**

#### **System Administrator Entity**

The System Administrator represents users with full control over the platform's features and operations. They are responsible for managing all users and churches, reviewing and approving church verification requests, moderating reported content, and overseeing overall platform operations to ensure smooth functionality, security, and accurate information distribution. Administrators generate comprehensive system reports, monitor user activities and security logs, manage system configurations, and ensure the platform maintains high standards of quality and integrity. Their role is critical in maintaining trust, safety, and reliability across the entire platform.

#### **Regular User / Community Member Entity**

The Regular User entity refers to community members who log in to access church information, services, and community content. They can browse and search for churches, view church profiles and service offerings, make service bookings (such as counseling sessions, baptisms, or weddings), and interact with church posts through likes, comments, and bookmarks. Users can make donations to support church initiatives and causes, send direct messages to churches for inquiries, write reviews for completed services, and receive real-time notifications about booking status updates and church activities. Their role is to stay informed, engage actively in church-related activities, and contribute to the community through participation, feedback, and financial support. They interact with the system to discover churches, book services, view donation needs, submit donations, and receive updates on their bookings and contributions.

#### **Church Owner / Administrator Entity**

The Church Owner entity is designated to handle the complete management of their church's digital presence and operations on the platform. Church owners are assigned by Super Admins and receive email and system notifications upon assignment. They maintain comprehensive church profiles including contact information, location details, service schedules, and media assets. Church owners add and manage bookable services with detailed descriptions, pricing, duration, and image galleries. They handle the booking workflow by reviewing incoming service requests, approving or declining bookings with customizable reasons, and marking completed services. Church owners create and publish various types of posts (general updates, photo posts, event announcements, and prayer requests) to engage with their community. They can enable donations on posts to support specific causes or projects, respond to user messages through the integrated chat system, manage their church's availability calendar including closed dates and special hours, submit verification requests with legal documents to gain verified status, and access comprehensive analytics about their church's performance including views, followers, bookings, and donation statistics. They ensure that church activities are well-communicated, efficiently managed, and that community engagement is fostered through consistent digital interaction.

#### **Anonymous Visitor Entity**

The Anonymous Visitor entity represents non-authenticated users who are exploring the platform before creating an account. They can browse public church listings, view limited church details and public posts, and access registration and login pages. Their primary interaction is exploratory, allowing them to understand the platform's value before committing to registration. Once they register and verify their email, they transition to become Regular Users with full access to platform features.

#### **Payment Gateway Entity (External System)**

The Payment Gateway entity (PayPal and Stripe) is an external system integration responsible for securely processing all financial transactions on the platform. When users make donations to church posts, the system communicates with the payment gateway to initiate payment requests, verify transactions, and receive payment confirmations. The payment gateway handles sensitive payment information, processes credit card transactions, manages PayPal payments, and sends webhook notifications to update donation statuses in real-time. This integration ensures secure, PCI-compliant payment processing without the ChurchIligan system directly handling sensitive financial data.

#### **Email Service Provider Entity (External System)**

The Email Service Provider entity (SMTP/Brevo) is an external system integration that handles all email communications from the platform. It delivers critical emails including email verification codes during registration, password reset codes for account recovery, passwordless login codes, booking status notifications, new message alerts, and donation receipts. The email service ensures reliable delivery of time-sensitive communications and provides delivery status reports back to the system. This integration is essential for user authentication, security, and keeping all stakeholders informed about important platform activities.

#### **Cloud Storage Entity (External System)**

The Cloud Storage entity (Cloudinary) is an external system integration used in production environments to store and deliver all media files including church logos, cover images, post images, service gallery photos, profile pictures, and chat attachments. The system uploads images to Cloudinary and receives back optimized CDN URLs for fast, global content delivery. Cloudinary automatically handles image optimization, format conversion, and responsive image delivery, ensuring optimal performance across all devices. This integration offloads media storage and delivery from the main application servers, improving scalability and performance.

#### **Google OAuth Provider Entity (External System)**

The Google OAuth Provider entity is an external authentication system that enables users to sign in using their existing Google accounts. This integration simplifies the registration and login process, reduces password fatigue, and leverages Google's robust security infrastructure. When users choose to sign in with Google, the system initiates an OAuth request, receives user credentials and profile information from Google, and creates or authenticates user accounts accordingly. This provides a seamless, secure alternative authentication method for users who prefer not to create separate credentials.

---

## 👥 External Entities (Actors)

### 1. **Regular User / Community Member**
**Description**: General public who can browse churches, make bookings, interact with posts, and donate.

**Capabilities**:
- Browse and search churches
- View church details and services
- Follow churches
- Make service bookings
- View and interact with posts (like, comment, bookmark)
- Make donations to posts
- Send messages to churches
- Write reviews for completed services
- Manage personal profile
- Receive notifications

---

### 2. **Church Owner / Administrator**
**Description**: User assigned by Super Admin to manage a church profile on the platform.

**Capabilities**:
- Manage assigned church profile (cannot create new churches)
- Add and manage bookable services
- Upload service images
- Manage church availability calendar
- Review and approve/decline booking requests
- Create and publish posts (general, photo, event, prayer)
- Enable donations on posts
- Respond to user messages
- View church analytics and statistics
- Submit church verification requests
- Manage decline reasons
- View booking reports

---

### 3. **System Administrator (Super Admin)**
**Description**: Platform administrator with full system access, church creation authority, and moderation capabilities.

**Capabilities**:
- Create new churches and assign managers
- Validate user profile completeness before assignment
- Send manager assignment notifications (email + system)
- Manage all users and churches
- Review and approve church verification requests
- Review and moderate reported posts
- View system-wide analytics
- Manage user activities and security logs
- Access all system reports
- Perform system maintenance
- Manage system configurations

---

### 4. **Anonymous Visitor**
**Description**: Non-authenticated user browsing the platform.

**Capabilities**:
- View public church listings
- View church details (limited)
- View public posts
- Register for an account
- Request login code (passwordless)

---

### 5. **Payment Gateway (PayPal/Stripe)**
**Description**: External payment processing systems for handling donations.

**Interaction Type**: System-to-System Integration

**Data Exchange**:
- System sends: Payment requests, order details, amounts
- System receives: Payment confirmations, transaction IDs, payment status

---

### 6. **Email Service Provider (SMTP/Brevo)**
**Description**: External email delivery service for sending notifications and verification codes.

**Interaction Type**: System-to-System Integration

**Data Exchange**:
- System sends: Email content, recipient addresses, verification codes
- System receives: Delivery status, bounce notifications

---

### 7. **Cloud Storage (Cloudinary)**
**Description**: External cloud storage service for media files in production.

**Interaction Type**: System-to-System Integration

**Data Exchange**:
- System sends: Images (church logos, covers, post images, profile pictures)
- System receives: CDN URLs, storage confirmations

---

### 8. **Google OAuth Provider**
**Description**: External authentication service for Google Sign-In.

**Interaction Type**: System-to-System Integration

**Data Exchange**:
- System sends: OAuth requests, redirect URIs
- System receives: User credentials, email, profile information

---

## 📊 Data Flows

### **FROM: Regular User → TO: System**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| Login Credentials | User authentication | Email, Password |
| Registration Data | New account creation | Email, Password, Name, Phone |
| Email Verification Code | Code verification | Email, 6-digit Code |
| Profile Information | Profile updates | Display Name, Bio, Address, Phone, Profile Image |
| Church Follow Request | Follow a church | Church ID, User ID |
| Booking Request | Service booking | Service ID, Date, Time, Notes |
| Booking Cancellation | Cancel booking | Booking ID, Reason |
| Post Interaction | Like/Comment/Bookmark | Post ID, Action Type, Content |
| Comment Reply | Reply to comment | Comment ID, Reply Content |
| Donation Payment | Make donation | Post ID, Amount, Payment Method, Message |
| Chat Message | Send message to church | Church ID, Message Content, Attachments |
| Service Review | Review after booking | Service ID, Rating, Title, Comment |
| Review Helpful Vote | Mark review helpful | Review ID |
| Post Report | Report inappropriate post | Post ID, Reason, Description |
| Search Query | Search churches/posts | Keywords, Filters, Location |

---

### **FROM: System → TO: Regular User**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| Church Listings | Browse churches | Church Details, Images, Ratings |
| Church Details | View church profile | Full Church Info, Services, Posts, Location |
| Service Catalog | Available services | Service Details, Pricing, Duration, Images |
| Availability Calendar | Church schedule | Available Dates, Closed Dates, Special Hours |
| Booking Confirmation | Booking status | Booking Code, Status, Date, Time |
| Booking Status Update | Status changes | Updated Status, Reason (if declined) |
| Post Feed | Church posts | Post Content, Images, Likes, Comments |
| Post Details | Full post view | Complete Post Data, All Comments, Donation Stats |
| Donation Receipt | Payment confirmation | Donation Amount, Transaction ID, Receipt |
| Chat Messages | Messages from church | Message Content, Attachments, Timestamp |
| Notification List | User notifications | Notification Type, Title, Message, Timestamp |
| Review Display | Service reviews | Reviews, Ratings, Helpful Votes |
| User Profile Data | Profile information | Display Name, Bio, Address, Profile Image |
| Email Verification Code | Registration verification | 6-digit Code, Expiry Time |
| Password Reset Code | Password recovery | 6-digit Code, Expiry Time |
| Login Code | Passwordless login | 6-digit Code, Expiry Time |

---

### **FROM: Church Owner → TO: System**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| Church Profile Update | Modify assigned church info | Updated Church Data, Media Files |
| Service Creation | Add bookable service | Service Details, Pricing, Duration, Images |
| Service Update | Modify service | Updated Service Data |
| Service Gallery Upload | Multiple service images | Images, Captions, Order |
| Availability Management | Set closed dates | Date, Type, Reason, Special Hours |
| Decline Reason Setup | Custom decline reasons | Reason Label, Order |
| Booking Review | Review booking request | Booking ID, Decision |
| Booking Approval | Approve booking | Booking ID, Confirmation |
| Booking Decline | Decline booking | Booking ID, Decline Reason |
| Booking Completion | Mark as completed | Booking ID |
| Post Creation | Create new post | Content, Type, Image, Event Details |
| Post Update | Edit post | Updated Content, Image |
| Donation Settings | Enable donations | Donation Goal, PayPal Email |
| Chat Response | Reply to user message | Message Content, Attachments |
| Verification Request | Request verification | Church ID, Legal Documents |
| Verification Documents | Upload documents | Document Files, Titles |

---

### **FROM: System → TO: Church Owner**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| Booking Notifications | New booking alerts | Booking Details, User Info, Service |
| Booking List | All bookings | Booking Status, Dates, Services |
| Booking Details | Full booking info | Complete Booking Data, User Contact |
| Message Notifications | New message alerts | User Name, Message Preview |
| Chat History | Conversation history | All Messages, Timestamps |
| Church Analytics | Performance metrics | Views, Followers, Bookings, Donations |
| Post Analytics | Post performance | Views, Likes, Comments, Shares |
| Donation Reports | Donation statistics | Total Raised, Donor Count, Transactions |
| Review Notifications | New review alerts | Service Name, Rating, Review Content |
| Verification Status | Verification updates | Status, Admin Notes, Decision |
| Service Statistics | Service metrics | Booking Count, Average Rating, Revenue |

---

### **FROM: System Administrator → TO: System**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| Admin Login | Administrator access | Admin Credentials |
| Church Creation Request | Create new church | Church Data, Location, Images, Assigned Manager ID |
| Manager Assignment | Assign user to church | Church ID, User ID |
| User Management | Manage users | User Actions (activate, deactivate, delete) |
| Church Management | Manage churches | Church Actions (verify, suspend, delete, reassign) |
| Verification Review | Review requests | Decision, Notes |
| Report Review | Moderate reports | Status, Action Taken, Admin Notes |
| System Configuration | Update settings | Configuration Parameters |

---

### **FROM: System → TO: System Administrator**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| User List | All users | User Details, Status, Activity, Profile Completion |
| Eligible Manager List | Users with complete profiles | User Details, Profile Status |
| Church List | All churches | Church Details, Verification Status, Assigned Manager |
| Church Creation Confirmation | Church created successfully | Church ID, Manager Assigned, Notification Sent |
| Verification Requests | Pending verifications | Church Info, Documents, Submission Date |
| Report Queue | Pending reports | Post Details, Reporter, Reason |
| System Analytics | Platform metrics | User Count, Church Count, Bookings, Donations |
| Activity Logs | User activities | Activity Type, User, Timestamp, IP |
| Security Logs | Security events | Login Attempts, Verification Attempts, IP Tracking |
| System Reports | Comprehensive reports | All System Data, Statistics |

---

### **FROM: Anonymous Visitor → TO: System**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| Registration Request | Create account | Email, Password, Name |
| Login Code Request | Passwordless login | Email |
| Browse Request | View public content | None (GET requests) |

---

### **FROM: System → TO: Anonymous Visitor**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| Public Church List | Browse churches | Church Names, Locations, Denominations |
| Public Posts | View posts | Post Content, Images (limited) |
| Registration Form | Sign up page | Form Fields |
| Login Form | Sign in page | Form Fields |

---

### **FROM: System → TO: Payment Gateway**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| Payment Request | Initiate payment | Amount, Currency, Order ID, Return URL |
| Payment Verification | Verify transaction | Transaction ID, Order ID |

---

### **FROM: Payment Gateway → TO: System**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| Payment Confirmation | Payment success | Transaction ID, Payer Info, Amount, Status |
| Payment Failure | Payment failed | Error Code, Reason |
| Webhook Notification | Payment status update | Order ID, Status, Transaction Details |

---

### **FROM: System → TO: Email Service**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| Verification Email | Email verification | Recipient Email, 6-digit Code, Expiry Time |
| Password Reset Email | Password recovery | Recipient Email, Reset Code |
| Login Code Email | Passwordless login | Recipient Email, Login Code |
| Manager Assignment Email | Church manager assignment | Recipient Email, Church Details, Responsibilities, Dashboard Link |
| Booking Notification Email | Booking updates | Recipient Email, Booking Details, Status |
| Message Notification Email | New message alert | Recipient Email, Sender, Message Preview |
| Donation Receipt Email | Donation confirmation | Recipient Email, Amount, Church Name |

---

### **FROM: Email Service → TO: System**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| Delivery Status | Email delivery report | Message ID, Status (delivered/bounced/failed) |

---

### **FROM: System → TO: Cloud Storage**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| Image Upload | Store media files | Image File, Folder Path, Metadata |
| Image Delete | Remove media | File URL/ID |

---

### **FROM: Cloud Storage → TO: System**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| Image URL | CDN link | Public URL, File ID |
| Upload Confirmation | Storage success | File ID, URL, Size |

---

### **FROM: System → TO: Google OAuth**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| OAuth Request | Initiate Google Sign-In | Client ID, Redirect URI, Scope |
| Token Verification | Verify OAuth token | Access Token |

---

### **FROM: Google OAuth → TO: System**

| Data Flow Name | Description | Data Elements |
|----------------|-------------|---------------|
| OAuth Response | User credentials | Access Token, User Email, Name, Profile Picture |
| Token Validation | Token status | Valid/Invalid, User Info |

---

## 🎨 Context Diagram Visual Specification

### **Diagram Layout**

```
                                    ┌─────────────────────┐
                                    │  Email Service      │
                                    │  (SMTP/Brevo)       │
                                    └──────────┬──────────┘
                                               │
                                               ↓ Email Notifications
                                               ↑ Delivery Status
                                               │
┌──────────────┐                               │                    ┌──────────────────┐
│  Anonymous   │                               │                    │  Payment Gateway │
│  Visitor     │                               │                    │  (PayPal/Stripe) │
└──────┬───────┘                               │                    └────────┬─────────┘
       │                                       │                             │
       │ Browse, Register                      │                             │ Payment
       ↓                                       │                             ↓ Confirmation
       ↑ Public Content                        │                             ↑ Payment Request
       │                                       │                             │
       │         ┌──────────────┐              │              ┌──────────────┴────────┐
       │         │  Regular     │              │              │                       │
       └────────→│  User        │              │              │                       │
                 └──────┬───────┘              │              │                       │
                        │                      │              │                       │
                        │ Login, Bookings      │              │                       │
                        │ Posts, Donations     ↓              ↓                       │
                        ↓ Messages, Reviews    │              │                       │
                        ↑ Notifications        │              │                       │
                        │ Church Data          │              │                       │
                        │                      │              │                       │
                        │         ┌────────────┴──────────────┴────────────┐          │
                        │         │                                        │          │
                        └────────→│      ChurchIligan System               │←─────────┘
                                  │                                        │
                        ┌────────→│  Integrated Church Management and      │←─────────┐
                        │         │  Community Platform                    │          │
                        │         │                                        │          │
                        │         └────────────┬──────────────┬────────────┘          │
                        │                      │              │                       │
                        │ Church Management    │              │ System Admin          │
                        │ Bookings, Posts      ↓              ↓ User Management       │
                        ↓ Messages, Analytics  │              │ Reports               │
                        ↑ Notifications        │              │                       │
                        │ Booking Requests     │              │                       │
                        │                      │              │                       │
                 ┌──────┴───────┐              │              │              ┌────────┴────────┐
                 │  Church      │              │              │              │  System         │
                 │  Owner       │              │              │              │  Administrator  │
                 └──────────────┘              │              │              └─────────────────┘
                                               │              │
                                               ↓              ↓
                                               ↑              ↑
                                               │              │
                                    ┌──────────┴──────────────┴──────────┐
                                    │  Cloud Storage (Cloudinary)        │
                                    │  Image Upload/CDN                  │
                                    └────────────────────────────────────┘
                                               ↑
                                               ↓
                                               │
                                    ┌──────────┴──────────┐
                                    │  Google OAuth       │
                                    │  Authentication     │
                                    └─────────────────────┘
```

---

## 📐 Diagram Drawing Instructions

### **Step 1: Draw the Central System**
- Draw a large rounded rectangle in the center
- Label it: **"ChurchIligan System - Integrated Church Management and Community Platform"**
- Use a distinct color (e.g., light blue or green)

### **Step 2: Position External Entities**

**Top Section:**
- Email Service Provider (top center)
- Google OAuth (top right)

**Left Section:**
- Anonymous Visitor (top left)
- Regular User (middle left)

**Right Section:**
- Payment Gateway (top right)
- Cloud Storage (middle right)

**Bottom Section:**
- Church Owner (bottom left)
- System Administrator (bottom right)

### **Step 3: Draw Data Flow Arrows**

**Arrow Conventions:**
- **Solid arrows** (→): Data flow direction
- **Bidirectional arrows** (↔): Two-way communication
- **Label each arrow** with the primary data flow name
- **Use different colors** for different types of flows:
  - Blue: User interactions
  - Green: System responses
  - Red: Administrative actions
  - Orange: External integrations

### **Step 4: Add Data Flow Labels**

For each arrow, add a small label showing the key data flows:

**Example for Regular User → System:**
```
→ Login, Bookings, Posts, Donations, Messages, Reviews
← Notifications, Church Data, Booking Status, Post Feed
```

### **Step 5: Add Legend**

Include a legend showing:
- External Entity (rectangle)
- System (rounded rectangle)
- Data Flow (arrow)
- Bidirectional Flow (double arrow)

---

## 📝 Detailed Data Flow Descriptions

### **Primary User Flows**

#### **1. Authentication Flow**
```
Anonymous Visitor → Registration Data → System
System → Email Verification Code → Email Service → User
User → Verification Code → System
System → Account Created → User
```

#### **2. Booking Flow**
```
User → Booking Request → System
System → Booking Notification → Church Owner
Church Owner → Booking Decision → System
System → Booking Status Update → User
System → Email Notification → Email Service → User
```

#### **3. Donation Flow**
```
User → Donation Payment → System
System → Payment Request → Payment Gateway
Payment Gateway → Payment Confirmation → System
System → Donation Receipt → User
System → Donation Notification → Church Owner
```

#### **4. Messaging Flow**
```
User → Chat Message → System
System → Message Notification → Church Owner
Church Owner → Chat Response → System
System → Message Delivery → User
```

#### **5. Post Interaction Flow**
```
Church Owner → Post Creation → System
System → Post Feed → Users
User → Post Interaction (Like/Comment) → System
System → Interaction Notification → Church Owner
```

---

## 🔄 System Boundaries

### **Inside the System:**
- User authentication and authorization
- Church profile management
- Booking management and workflow
- Post creation and social interactions
- Donation processing coordination
- Messaging and notifications
- Analytics and reporting
- Database operations
- Business logic and validation

### **Outside the System:**
- Payment processing (handled by PayPal/Stripe)
- Email delivery (handled by SMTP/Brevo)
- Media storage (handled by Cloudinary in production)
- OAuth authentication (handled by Google)
- User devices and browsers
- Network infrastructure

---

## 📊 Context Diagram Summary Table

| Entity Type | Count | Examples |
|-------------|-------|----------|
| **Human Actors** | 4 | Regular User, Church Owner, Admin, Anonymous Visitor |
| **External Systems** | 4 | Payment Gateway, Email Service, Cloud Storage, Google OAuth |
| **Total External Entities** | 8 | All actors and systems |
| **Data Flows (User → System)** | 15+ | Login, Booking, Donation, Messages, etc. |
| **Data Flows (System → User)** | 15+ | Notifications, Church Data, Status Updates, etc. |
| **Data Flows (Owner → System)** | 18+ | Church Management, Bookings, Posts, etc. |
| **Data Flows (System → Owner)** | 11+ | Notifications, Analytics, Reports, etc. |
| **Data Flows (Admin → System)** | 6+ | User Management, Moderation, Configuration |
| **Data Flows (System → Admin)** | 8+ | Reports, Logs, Analytics, Verification Queue |
| **Integration Flows** | 12+ | Payment, Email, Storage, OAuth |

---

## 🎯 Key Insights from Context Diagram

### **1. Multi-Actor System**
The system serves three distinct user types with different capabilities and interfaces.

### **2. Heavy External Integration**
The system relies on four major external services for critical functionality.

### **3. Bidirectional Communication**
Most data flows are bidirectional, indicating interactive and responsive system behavior.

### **4. Notification-Heavy**
Multiple notification channels (in-app, email) for various events.

### **5. Complex Workflow Management**
Booking workflow involves multiple actors and status transitions.

### **6. Social Platform Features**
Rich interaction patterns similar to social media platforms.

### **7. Payment Integration**
Secure payment processing through external gateways.

### **8. Content Management**
Church owners have extensive content creation and management capabilities.

---

## 🛠️ Tools for Creating the Diagram

### **Recommended Tools:**

1. **Draw.io (diagrams.net)** - Free, web-based
2. **Lucidchart** - Professional, collaborative
3. **Microsoft Visio** - Enterprise standard
4. **PlantUML** - Code-based diagrams
5. **Miro** - Collaborative whiteboard
6. **Creately** - Online diagramming

### **Template Elements Needed:**
- Rounded rectangles (for system)
- Rectangles (for external entities)
- Arrows (solid, dashed, bidirectional)
- Text labels
- Legend box
- Color coding

---

## 📋 Checklist for Complete Context Diagram

- [ ] Central system clearly labeled
- [ ] All 8 external entities positioned
- [ ] All major data flows drawn
- [ ] Arrows properly labeled
- [ ] Bidirectional flows indicated
- [ ] Color coding applied
- [ ] Legend included
- [ ] Title and date added
- [ ] System boundary clearly defined
- [ ] Data flow descriptions added

---

*Document Created: 2025-10-16*
*Last Updated: 2025-10-17*
*System: ChurchIligan v1.0*
*Diagram Type: Context Diagram (Level 0 DFD)*

---

## 🔄 Recent Updates (2025-10-17)

### **Church Creation Flow Change**
- **Old**: Church Owner could create churches directly
- **New**: Only Super Admin can create churches and assign managers
- **Impact**: Added new data flows for church creation and manager assignment
- **New Features**: Profile validation, dual notifications (email + system)

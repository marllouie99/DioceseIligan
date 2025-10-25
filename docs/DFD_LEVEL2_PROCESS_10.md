# Level 2 DFD - Process 10.0: System Administration

**System:** ChurchIligan  
**Document Type:** Data Flow Diagram - Level 2 Decomposition  
**Parent Process:** Process 10.0  
**Created:** 2025-10-24  

---

## 📊 Process 10.0 Decomposition

### **Sub-Processes:**

```
┌─────────────────────────────────────────────────────────────────┐
│                   PROCESS 10.0 DECOMPOSITION                    │
│                   System Administration                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   10.1       │      │   10.2       │      │   10.3       │
│   Church     │─────▶│   Profile    │─────▶│   Manager    │
│  Creation    │      │ Validation   │      │  Assignment  │
└──────────────┘      └──────────────┘      └──────────────┘
                                                    │
                                                    ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   10.4       │      │   10.5       │      │   10.6       │
│     User     │      │   Content    │      │   System     │
│  Management  │      │ Moderation   │      │   Reports    │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 🔹 Process 10.1: Church Creation

**Description:** Super-Admin creates new church profiles

**Inputs:**
- Super-Admin → Church Creation Form
  - Name, Description, Denomination, Size
  - Contact: Email, Phone, Website
  - Address: Region, Province, City, Barangay, Street
  - Leadership: Pastor Name, Email, Phone
  - Service Times, Ministries
  - Social Media Links
  - PayPal Email

**Outputs:**
- Church Data → Process 10.2 (for validation)

**Logic:**
1. Verify user is Super-Admin (is_superuser = True)
2. Validate all required fields
3. Generate unique slug from church name
4. Validate Philippine address structure
5. Route to profile validation

**Business Rule:**
- **ONLY Super-Admins can create churches**
- Regular users cannot create churches

---

## 🔹 Process 10.2: Profile Validation

**Description:** Validate assigned manager's profile completeness

**Inputs:**
- Process 10.1 → Church Data
- D2 → Profile Data (of selected manager)

**Outputs:**
- Validation Result → Process 10.3
- Validation Error → Super-Admin (if incomplete)

**Logic:**
1. Check if selected user has complete profile:
   - ✅ Full Name (display_name OR first_name + last_name)
   - ✅ Phone number
   - ✅ Address (region + city OR legacy address)
   - ✅ Date of birth
2. If incomplete → Return error to Super-Admin
3. If complete → Route to manager assignment

**Validation Rules:**
```python
# Profile must have:
- display_name OR (user.first_name AND user.last_name)
- phone
- (region AND city_municipality) OR address
- date_of_birth
```

---

## 🔹 Process 10.3: Manager Assignment & Notification

**Description:** Assign Parish Manager and send notifications

**Inputs:**
- Process 10.2 → Validated Church Data
- Super-Admin → Selected Manager (User ID)

**Outputs:**
- Church Record → D5 (Church Database)
- Church Assignment Notification → Process 8.0
- Assignment Email → Email Service
- Manager Notification → D17 (Notification Database)

**Logic:**
1. Assign owner_id to selected user
2. Set is_verified = True (auto-verified)
3. Auto-fill pastor fields from manager's profile
4. Store church in D5
5. Create system notification:
   - Type: 'church_assignment'
   - Title: "Church Manager Assignment"
   - Message: "You have been assigned as manager of {church.name}"
   - Link: "/app/manage-church/"
6. Send email notification
7. Route to Process 8.0 for notification delivery

**Notifications Sent:**
- ✉️ Email: Church assignment details
- 🔔 In-app: System notification

---

## 🔹 Process 10.4: User Management

**Description:** Manage user accounts (activate/deactivate/delete)

**Inputs:**
- Super-Admin → User Management Action
  - Activate User
  - Deactivate User
  - Delete User
  - Change Role

**Outputs:**
- Updated User → D1 (User Database)
- User Status Change → D4 (User Activity Log)
- Status Notification → Affected User

**Logic:**
1. Display all users to Super-Admin
2. Super-Admin selects action:
   - **Activate:** Set is_active = True
   - **Deactivate:** Set is_active = False
   - **Delete:** Soft delete or hard delete
   - **Change Role:** Update is_staff/is_superuser
3. Update user in D1
4. Log action in D4
5. Notify user of status change

**Actions:**
- View all users
- Search/filter users
- Activate/deactivate accounts
- Delete accounts
- Assign roles

---

## 🔹 Process 10.5: Content Moderation

**Description:** Review and moderate reported posts

**Inputs:**
- D12 → Post Reports (Pending)
- Super-Admin → Moderation Decision

**Outputs:**
- Moderation Action → D10 (Post Database)
- Report Status → D12 (Post Report Database)
- Moderation Notification → Parish Manager

**Logic:**
1. Display pending reports to Super-Admin
2. Super-Admin reviews reported post
3. Make decision:
   - **Keep Post:** Mark report as reviewed
   - **Remove Post:** Set post.is_active = False
   - **Warn User:** Send warning notification
4. Update report status in D12
5. Update post in D10 (if removed)
6. Notify Parish Manager of decision
7. Log moderation action

**Moderation Queue:**
- View all reports
- Filter by status/reason
- View post content
- View reporter details
- Make decision

---

## 🔹 Process 10.6: System Reports Generation

**Description:** Generate comprehensive system reports

**Inputs:**
- Super-Admin → Report Request (Type, Date Range)
- D1 → User Data
- D5 → Church Data
- D8 → Booking Data
- D10 → Post Data
- D13 → Donation Data
- D4 → Activity Logs

**Outputs:**
- System Report → Super-Admin
- Report PDF → Super-Admin
- Report Export → Super-Admin (CSV/Excel)

**Logic:**
1. Super-Admin selects report type
2. Specify date range and filters
3. Query relevant data stores
4. Compile data into report
5. Generate visualizations (charts, graphs)
6. Export as PDF/CSV/Excel
7. Display in admin dashboard

**Report Types:**
- **User Statistics:** Total users, new registrations, active users
- **Church Statistics:** Total churches, verified churches, followers
- **Booking Statistics:** Total bookings, payment stats, status breakdown
- **Donation Statistics:** Total donations, top churches, trends
- **Post Statistics:** Total posts, engagement, reports
- **Activity Reports:** User activities, login trends, security logs

---

## 📊 Data Stores Used

| ID | Name | Access |
|----|------|--------|
| D1 | User Database | Read/Write (10.4) |
| D2 | Profile Database | Read (10.2) |
| D4 | User Activity Log | Read/Write (10.4, 10.6) |
| D5 | Church Database | Read/Write (10.3) |
| D6 | Church Verification Database | Read (10.6) |
| D8 | Booking Database | Read (10.6) |
| D10 | Post Database | Read/Write (10.5) |
| D12 | Post Report Database | Read/Write (10.5) |
| D13 | Donation Database | Read (10.6) |
| D17 | Notification Database | Write (10.3) |

---

## 🔄 Complete Workflow Example

```
SUPER-ADMIN CREATES CHURCH:

1. Super-Admin → 10.1: Create Church Form
   - Name: "St. Mary's Cathedral"
   - Address: Iligan City, Lanao del Norte
   - Select Manager: User ID 42
2. 10.1 → 10.2: Validate manager profile
3. 10.2 → D2: Check User 42 profile
4. D2 → 10.2: Profile complete ✓
5. 10.2 → 10.3: Proceed with assignment
6. 10.3 → D5: Store church (owner_id = 42, is_verified = True)
7. 10.3 → D17: Create notification
8. 10.3 → Email Service: Send assignment email
9. 10.3 → Process 8.0: Trigger notification delivery
10. User 42 receives:
    - Email: "You've been assigned as manager of St. Mary's Cathedral"
    - In-app notification with link to manage church
11. Super-Admin → 10.6: Generate monthly report
12. 10.6 → D1, D5, D8, D13: Query data
13. 10.6 → Super-Admin: Display report with charts
14. Super-Admin → 10.6: Export as PDF
```

---

## 🔐 Security & Access Control

**Super-Admin Only:**
- All sub-processes require is_superuser = True
- Church creation restricted
- User management restricted
- Content moderation restricted
- System reports restricted

**Audit Trail:**
- All admin actions logged in D4
- Includes: Action type, timestamp, admin user, affected user/church

---

**Total Sub-Processes: 6**  
**Data Stores: 10**  
**External Entities: 2 (Super-Admin, Email Service)**

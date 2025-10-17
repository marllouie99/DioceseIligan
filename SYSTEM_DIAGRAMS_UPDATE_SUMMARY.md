# ChurchIligan System Diagrams - Update Summary

## 📅 Update Date: October 17, 2025

## 🎯 Purpose
This document summarizes the updates made to the system diagrams (ERD, Context Diagram, and DFD) to reflect the new church creation and management flow.

---

## 🔄 Major System Change

### **Church Creation Flow Redesign**

#### **Previous Flow (Before October 17, 2025)**
```
User → Register → Create Church → Await Approval → Manage Church
```
- Any registered user could create a church
- Churches required admin approval
- User became church owner upon approval

#### **New Flow (After October 17, 2025)**
```
Super Admin → Create Church → Assign Manager → Send Notifications → Manager Manages Church
```
- Only Super Admins can create churches
- Super Admin selects user with complete profile as manager
- System sends email + in-app notification to assigned manager
- Manager immediately gets access to church dashboard

---

## 📊 Updated Diagrams

### **1. Data Flow Diagram (DFD) - Level 1**
**File**: `DATA_FLOW_DIAGRAM_LEVEL1.md`

#### **Process 2.0: Church Profile Management**
**Changes**:
- ❌ Removed: Church registration input from Church Owner
- ✅ Added: Church creation data input from Process 10.0
- ✅ Added: Church created confirmation output to Process 10.0
- 📝 Updated description to reflect Super Admin-only creation

**New Logic**:
1. Store church profiles created by Super Admin
2. Validate and store church updates (from managers)
3. Process verification requests
4. Upload and optimize images
5. Calculate church statistics
6. Generate church listings
7. Track follower counts

#### **Process 10.0: System Administration**
**Changes**:
- ✅ Added: Church creation request input from Super Admin
- ✅ Added: Manager assignment input from Super Admin
- ✅ Added: User profile data input from DS1
- ✅ Added: Church creation data output to Process 2.0
- ✅ Added: Manager assignment notification output to Process 8.0
- ✅ Added: Assignment email output to Email Service
- ✅ Added: DS2 (Profile Database) access for validation
- ✅ Added: DS17 (Notification Database) access for notifications

**New Logic**:
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

#### **Inter-Process Communication**
**New Data Flows Added**:
```
Process 10.0 → Process 2.0
- Church creation data, manager assignment

Process 10.0 → Process 8.0
- Manager assignment notifications

Process 10.0 → Email Service
- Manager assignment email notifications
```

---

### **2. Context Diagram**
**Updates Needed**:

#### **External Entities**
- ✅ Keep: Super Admin (already exists)
- ✅ Emphasize: Super Admin creates churches
- 📝 Update: Church Owner role description (now assigned by admin)

#### **Data Flows**
**Add**:
- Super Admin → System: Church Creation Request
- Super Admin → System: Manager Assignment
- System → Email Service: Manager Assignment Email
- System → Assigned User: Assignment Notification

**Update**:
- ~~Church Owner → System: Church Registration~~ (Remove)
- Church Owner → System: Church Updates (Keep)

---

### **3. Entity Relationship Diagram (ERD)**
**Updates Needed**:

#### **Relationships**
**No structural changes needed**, but document the business rule changes:

**Church → User (owner) Relationship**:
- **Old Rule**: User creates church, becomes owner
- **New Rule**: Super Admin creates church, assigns user as owner
- **Cardinality**: Still 1:1 (One church has one owner)
- **Constraint**: Owner must have complete profile

#### **New Business Rules to Document**:
1. **Profile Completeness Constraint**:
   - User must have: Full Name, Phone, Address, Date of Birth
   - Enforced at: Church creation/assignment time
   - Validation: System checks before allowing assignment

2. **Church Creation Privilege**:
   - Only users with `is_superuser=True` can create churches
   - Regular users cannot create churches
   - Church owners can only update their assigned church

3. **Notification Triggers**:
   - Church creation → Manager assignment notification
   - Manager reassignment → New manager notification
   - Notification types: Email + In-app

---

## 🆕 New System Features

### **1. Profile Validation**
- **Location**: `core/forms.py` - `SuperAdminChurchCreateForm.__init__()`
- **Function**: Validates user has complete essential profile
- **Required Fields**:
  - Full Name (or Display Name)
  - Phone Number
  - Address (Region + City OR legacy address)
  - Date of Birth

### **2. Cascading Location Dropdowns**
- **Location**: `templates/core/super_admin_create_church.html`
- **Function**: Philippine address selection
- **Flow**: Region → Province → City/Municipality → Barangay
- **Data**: Hardcoded for reliability (Region X, NCR, Region I)
- **Special**: All 44 Iligan City barangays included

### **3. Auto-fill Leadership Fields**
- **Location**: `templates/core/super_admin_create_church.html` (JavaScript)
- **Function**: Populates pastor fields from assigned manager's profile
- **API**: `/app/api/user/<user_id>/profile/`
- **Fields Auto-filled**:
  - Pastor Name (from user's full name)
  - Pastor Email (from user's email)
  - Pastor Phone (from user's phone)

### **4. Dual Notification System**
- **Location**: `core/forms.py` - `SuperAdminChurchCreateForm.save()`
- **Email Notification**:
  - Template: `templates/emails/church_assignment.html`
  - Includes: Church details, responsibilities, dashboard link
  - Service: Brevo SMTP (production-ready)
- **System Notification**:
  - Type: `church_assignment`
  - Stored in: `accounts_notification` table
  - Link: Direct to church dashboard

---

## 📋 Implementation Details

### **Files Modified**

| File | Changes | Purpose |
|------|---------|---------|
| `core/forms.py` | Updated `SuperAdminChurchCreateForm` | Profile validation, notifications |
| `core/views.py` | Added `super_admin_create_church`, `super_admin_edit_church`, `api_user_profile` | Church CRUD, API endpoint |
| `core/urls.py` | Added routes for create, edit, API | URL routing |
| `templates/core/super_admin_create_church.html` | Created template | UI for create/edit |
| `templates/core/super_admin_church_detail.html` | Added edit button | Navigation |
| `templates/emails/church_assignment.html` | Created email template | Email notification |
| `ChurchIligan/settings/base.py` | Added `SITE_URL` | Email links |
| `DATA_FLOW_DIAGRAM_LEVEL1.md` | Updated Process 2.0, 10.0 | Documentation |

### **Database Tables Affected**

| Table | Changes | Impact |
|-------|---------|--------|
| `core_church` | Owner assigned by admin | Business logic change |
| `accounts_notification` | New notification type | New notifications created |
| `accounts_profile` | Validation enforced | Profile must be complete |

---

## 🔐 Security & Access Control

### **Permissions**
- **Church Creation**: `is_superuser=True` required
- **Church Editing**: `is_superuser=True` required
- **Church Management**: Owner assigned by admin
- **API Access**: `/api/user/<id>/profile/` - superuser only

### **Validation**
- Profile completeness checked before assignment
- Email fails gracefully (doesn't block form submission)
- Cascading dropdowns prevent invalid addresses

---

## 📧 Notification Flow

```
Super Admin Creates/Edits Church
         ↓
Assigns User as Manager
         ↓
Form.save() Method
         ↓
    ┌────┴────┐
    ↓         ↓
Email      System
Notification  Notification
    ↓         ↓
User's     User's
Inbox      Dashboard
```

### **Email Content**
- Subject: "You are now the Manager of {Church Name}"
- Includes: Church details, responsibilities list, dashboard link
- Template: Professional HTML with warm sacred earth theme
- Fallback: Plain text version

### **System Notification**
- Title: "Church Manager Assignment"
- Message: "You have been assigned as the manager of {Church Name}..."
- Link: `/app/manage-church/`
- Priority: Normal
- Type: `church_assignment`

---

## 🎨 UI/UX Improvements

### **Form Features**
1. **Search-enabled dropdown** (Select2) for user selection
2. **Cascading location dropdowns** with Philippine data
3. **Auto-fill pastor fields** from manager profile
4. **Image preview** for existing logo/cover in edit mode
5. **Consistent theme** with other super admin pages

### **User Experience**
- **Create**: Clean form with all fields organized in sections
- **Edit**: Pre-populated with existing data, preserves images
- **Validation**: Real-time feedback, clear error messages
- **Navigation**: Easy access from church detail page

---

## 📊 Data Flow Summary

### **Church Creation Flow**
```
1. Super Admin opens Create Church form
2. Selects user from dropdown (filtered by complete profile)
3. Fills church details (location cascades, pastor auto-fills)
4. Submits form
5. System validates and saves church
6. System creates notification record
7. System sends email notification
8. User receives email + in-app notification
9. User clicks link → Redirected to church dashboard
```

### **Church Editing Flow**
```
1. Super Admin views church detail
2. Clicks "Edit Church" button
3. Form loads with existing data
4. Can change manager (reassignment)
5. Can update church details
6. Submits form
7. If manager changed → Notifications sent
8. Church updated successfully
```

---

## 🧪 Testing Checklist

### **Functional Testing**
- [ ] Super admin can create church
- [ ] Only users with complete profiles appear in dropdown
- [ ] Location dropdowns cascade correctly
- [ ] Pastor fields auto-fill from selected user
- [ ] Email notification sent successfully
- [ ] System notification created
- [ ] User receives both notifications
- [ ] Links in notifications work
- [ ] Edit mode preserves all data
- [ ] Image preview shows in edit mode
- [ ] Reassignment sends new notifications

### **Security Testing**
- [ ] Regular users cannot access create/edit pages
- [ ] API endpoint requires superuser permission
- [ ] Form validation prevents incomplete profiles
- [ ] CSRF protection enabled
- [ ] SQL injection prevention

### **UI/UX Testing**
- [ ] Form matches super admin theme
- [ ] Dropdowns work on mobile
- [ ] Images display correctly
- [ ] Error messages are clear
- [ ] Success messages appear
- [ ] Navigation is intuitive

---

## 📈 Impact Analysis

### **Positive Impacts**
1. ✅ **Quality Control**: Admin vets all churches before creation
2. ✅ **Profile Completeness**: Ensures managers have necessary info
3. ✅ **Better Communication**: Dual notifications ensure managers are informed
4. ✅ **Centralized Management**: Admin has full control over church assignments
5. ✅ **Reduced Spam**: Prevents fake/duplicate church registrations

### **Considerations**
1. ⚠️ **Admin Workload**: Admin must manually create all churches
2. ⚠️ **Scalability**: May need bulk import feature for many churches
3. ⚠️ **User Expectations**: Users may expect self-service church creation

### **Mitigation Strategies**
1. **Bulk Import**: Add CSV import feature for multiple churches
2. **Application Form**: Allow users to request church creation
3. **Delegation**: Allow trusted users to create churches with approval
4. **Automation**: Auto-approve churches from verified domains

---

## 🚀 Future Enhancements

### **Short Term**
1. Add church creation request form for users
2. Implement bulk church import from CSV
3. Add church transfer feature (change manager)
4. Create church creation analytics dashboard

### **Medium Term**
1. Multi-manager support (assign multiple admins)
2. Role-based permissions (admin, editor, viewer)
3. Church approval workflow (pending → approved)
4. Automated profile completion reminders

### **Long Term**
1. Church network/hierarchy (parent/child churches)
2. Multi-location church support
3. Franchise/branch management
4. API for third-party integrations

---

## 📚 Related Documentation

- **DFD Level 1**: `DATA_FLOW_DIAGRAM_LEVEL1.md`
- **ERD**: (To be created/updated)
- **Context Diagram**: (To be created/updated)
- **API Documentation**: (To be created)
- **User Guide**: (To be created)

---

## ✅ Verification

### **Diagram Updates Completed**
- [x] Data Flow Diagram (Level 1) updated
- [ ] Context Diagram to be updated
- [ ] ERD to be updated (business rules documented)

### **Code Implementation Completed**
- [x] Form with profile validation
- [x] Create/Edit views
- [x] URL routing
- [x] Templates (create/edit)
- [x] Email template
- [x] Notification system
- [x] API endpoint
- [x] Cascading dropdowns
- [x] Auto-fill functionality

### **Documentation Completed**
- [x] DFD updates
- [x] Update summary document
- [x] Code comments
- [x] Change log

---

*Document Created: 2025-10-17*  
*System: ChurchIligan v1.0*  
*Author: System Architect*  
*Status: Complete*

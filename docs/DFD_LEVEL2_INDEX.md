# Level 2 Data Flow Diagrams - Index

**System:** ChurchIligan  
**Document Type:** Level 2 DFD Index  
**Created:** 2025-10-24  
**Total Decomposed Processes:** 5  

---

## 📚 Overview

This document serves as an index for all Level 2 Data Flow Diagram decompositions of the ChurchIligan system. Each decomposition breaks down a complex Level 1 process into detailed sub-processes, showing the internal data flows and logic.

---

## 📋 Decomposed Processes

### **1. Process 1.0: User Authentication & Account Management**
**File:** `DFD_LEVEL2_PROCESS_1.md`  
**Sub-Processes:** 7  
**Complexity:** High (Security-critical)

**Sub-Processes:**
- 1.1: User Registration
- 1.2: Email Verification
- 1.3: Login Authentication
- 1.4: Password Reset
- 1.5: Google OAuth Integration
- 1.6: Profile Management
- 1.7: Activity Logging

**Key Features:**
- 6-digit email verification codes
- Password hashing (PBKDF2)
- Google OAuth integration
- Failed login tracking
- Activity logging with IP/device tracking

---

### **2. Process 3.0: Service & Booking Management**
**File:** `DFD_LEVEL2_PROCESS_3.md`  
**Sub-Processes:** 6  
**Complexity:** Very High (Payment integration)

**Sub-Processes:**
- 3.1: Service Management
- 3.2: Availability Management
- 3.3: Booking Request Processing
- 3.4: Payment Processing
- 3.5: Booking Approval Workflow
- 3.6: Receipt Generation

**Key Features:**
- Online payment (PayPal/Stripe/GCash)
- Booking conflict checking
- Payment validation
- Booking codes (APPT-XXXX)
- Webhook handling
- Receipt generation

---

### **3. Process 4.0: Post & Content Management**
**File:** `DFD_LEVEL2_PROCESS_4.md`  
**Sub-Processes:** 6  
**Complexity:** Medium-High (Multiple post types)

**Sub-Processes:**
- 4.1: Post Creation
- 4.2: Post Interaction
- 4.3: Comment Management
- 4.4: Post Moderation
- 4.5: Post Analytics
- 4.6: Donation Integration

**Key Features:**
- 4 post types (General, Photo, Event, Prayer)
- Nested comments
- Like/Bookmark/Share
- Content moderation
- View tracking
- Donation integration

---

### **4. Process 5.0: Donation Processing**
**File:** `DFD_LEVEL2_PROCESS_5.md`  
**Sub-Processes:** 6  
**Complexity:** Medium (Payment processing)

**Sub-Processes:**
- 5.1: Donation Settings Configuration
- 5.2: Payment Request Processing
- 5.3: Payment Validation
- 5.4: Webhook Handler
- 5.5: Receipt Generation
- 5.6: Goal Tracking & Statistics

**Key Features:**
- PayPal/Stripe integration
- Anonymous donations
- Donation goals
- Progress tracking
- Receipt generation
- Real-time webhooks

---

### **5. Process 10.0: System Administration**
**File:** `DFD_LEVEL2_PROCESS_10.md`  
**Sub-Processes:** 6  
**Complexity:** High (Admin control center)

**Sub-Processes:**
- 10.1: Church Creation
- 10.2: Profile Validation
- 10.3: Manager Assignment & Notification
- 10.4: User Management
- 10.5: Content Moderation
- 10.6: System Reports Generation

**Key Features:**
- Church creation (Super-Admin only)
- Profile completeness validation
- Dual notifications (Email + In-app)
- User management (Activate/Deactivate/Delete)
- Content moderation queue
- Comprehensive system reports

---

## 📊 Summary Statistics

| Process | Sub-Processes | Data Stores | Complexity | Priority |
|---------|---------------|-------------|------------|----------|
| **1.0** | 7 | 4 | High | ⭐⭐⭐ |
| **3.0** | 6 | 4 | Very High | ⭐⭐⭐ |
| **4.0** | 6 | 4 | Medium-High | ⭐⭐ |
| **5.0** | 6 | 3 | Medium | ⭐⭐ |
| **10.0** | 6 | 10 | High | ⭐⭐⭐ |
| **TOTAL** | **31** | **18 (unique)** | - | - |

---

## 🎯 Key Insights

### **Most Complex Process:**
**Process 3.0 (Service & Booking Management)**
- Integrates payment gateway
- Multiple status transitions
- Conflict checking
- Receipt generation
- Webhook handling

### **Most Data Stores:**
**Process 10.0 (System Administration)**
- Accesses 10 different data stores
- Central control hub
- Affects entire system

### **Most Sub-Processes:**
**Process 1.0 (User Authentication)**
- 7 sub-processes
- Security-critical
- Multiple authentication methods

---

## 🔄 Process Relationships

```
Process 1.0 → Provides authenticated users to all processes
Process 3.0 → Sends booking events to Process 8.0
Process 4.0 → Sends donation settings to Process 5.0
Process 5.0 → Processes donations from Process 4.0
Process 10.0 → Creates churches for Process 2.0
All Processes → Send activity data to Process 9.0
```

---

## 📁 File Structure

```
docs/
├── DATA_FLOW_DIAGRAM_LEVEL1.md      # Level 1 DFD (10 processes)
├── DFD_LEVEL2_INDEX.md              # This file
├── DFD_LEVEL2_PROCESS_1.md          # Authentication decomposition
├── DFD_LEVEL2_PROCESS_3.md          # Booking decomposition
├── DFD_LEVEL2_PROCESS_4.md          # Post decomposition
├── DFD_LEVEL2_PROCESS_5.md          # Donation decomposition
└── DFD_LEVEL2_PROCESS_10.md         # Administration decomposition
```

---

## 🎨 Diagram Notation

All Level 2 DFDs use standard notation:
- **Rectangle:** Sub-process
- **Parallel lines:** Data store
- **Rectangle (external):** External entity
- **Arrow:** Data flow
- **Dashed box:** Process boundary

---

## 💡 Usage Guidelines

1. **Start with Level 1 DFD** to understand overall system
2. **Drill down to Level 2** for detailed process logic
3. **Use for development** to implement features
4. **Use for testing** to create test cases
5. **Use for documentation** to explain system behavior

---

## 🔍 Next Steps

### **Processes Not Yet Decomposed:**
- Process 2.0: Church Profile Management
- Process 6.0: Messaging & Communication
- Process 7.0: Review & Rating Management
- Process 8.0: Notification Management
- Process 9.0: Analytics & Tracking

These can be decomposed in future iterations if needed.

---

*Document Created: 2025-10-24*  
*System: ChurchIligan v1.0*  
*Total Processes Decomposed: 5 of 10*  
*Total Sub-Processes: 31*

# Level 2 DFD - Process 3.0: Service & Booking Management

**System:** ChurchIligan  
**Document Type:** Data Flow Diagram - Level 2 Decomposition  
**Parent Process:** Process 3.0  
**Created:** 2025-10-24  

---

## 📊 Process 3.0 Decomposition

### **Sub-Processes:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESS 3.0 DECOMPOSITION                    │
│              Service & Booking Management                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   3.1        │      │   3.2        │      │   3.3        │
│   Service    │─────▶│ Availability │─────▶│   Booking    │
│  Management  │      │  Management  │      │   Request    │
└──────────────┘      └──────────────┘      └──────────────┘
                                                    │
                                                    ▼
                                            ┌──────────────┐
                                            │   3.4        │
                                            │   Payment    │
                                            │  Processing  │
                                            └──────────────┘
                                                    │
                                                    ▼
                                            ┌──────────────┐
                                            │   3.5        │
                                            │   Booking    │
                                            │   Approval   │
                                            └──────────────┘
                                                    │
                                                    ▼
                                            ┌──────────────┐
                                            │   3.6        │
                                            │   Receipt    │
                                            │  Generation  │
                                            └──────────────┘
```

---

## 🔹 Process 3.1: Service Management

**Description:** Create and manage bookable services with pricing

**Inputs:**
- Parish Manager → Service Creation Data (Name, Description, Price, Duration, Payment Required)
- Parish Manager → Service Images
- Parish Manager → Service Updates

**Outputs:**
- Service Catalog → Regular User
- Service Record → D7 (Bookable Service Database)

**Logic:**
1. Validate Parish Manager ownership
2. Create/update service with pricing
3. Upload and optimize service images
4. Store in D7
5. Display in public catalog

---

## 🔹 Process 3.2: Availability Management

**Description:** Manage church availability calendar

**Inputs:**
- Parish Manager → Availability Updates (Date, Type, Reason, Hours)

**Outputs:**
- Availability Calendar → Regular User
- Availability Record → D9 (Availability Database)

**Logic:**
1. Set available/closed dates
2. Define special hours
3. Store in D9
4. Display calendar to users

---

## 🔹 Process 3.3: Booking Request Processing

**Description:** Process booking requests and check conflicts

**Inputs:**
- Regular User → Booking Request (Service ID, Date, Time, Notes, Payment Method)
- D7 → Service Data (Price, Payment Required)
- D9 → Availability Data

**Outputs:**
- Booking Data → Process 3.4 (if payment required)
- Booking Record → D8 (if no payment required)
- Conflict Alert → Regular User (if conflict exists)

**Logic:**
1. Validate service exists
2. Check date availability
3. Check booking conflicts
4. If payment required → Route to Process 3.4
5. If free → Create booking in D8 (Status: Pending)

---

## 🔹 Process 3.4: Payment Processing

**Description:** Process online payments for bookings

**Inputs:**
- Process 3.3 → Booking Data
- Payment Gateway → Payment Confirmation
- Payment Gateway → Webhook Notification

**Outputs:**
- Payment Request → Payment Gateway
- Booking with Payment → D8
- Payment Receipt → Process 3.6

**Logic:**
1. Get service price from D7
2. Create payment request
3. Send to Payment Gateway
4. Wait for payment confirmation
5. Store payment details in D8:
   - payment_status: 'paid'
   - payment_method: 'paypal'/'stripe'/'gcash'
   - payment_amount
   - payment_transaction_id
   - payment_date
6. Create booking (Status: Pending Approval)
7. Route to Process 3.5

---

## 🔹 Process 3.5: Booking Approval Workflow

**Description:** Parish Manager approves/declines bookings

**Inputs:**
- Parish Manager → Booking Decision (Approve/Decline/Reschedule)
- D8 → Booking Data

**Outputs:**
- Booking Status Update → D8
- Booking Notification → Parish Manager
- Booking Confirmation → Regular User
- Booking Event → Process 8.0 (Notifications)

**Logic:**
1. Display pending bookings to Parish Manager
2. Parish Manager reviews and decides
3. Update booking status in D8:
   - Approved
   - Declined (with reason)
   - Rescheduled
4. Generate booking code (APPT-XXXX)
5. Send notifications
6. If completed → Send to Process 7.0 for review eligibility

---

## 🔹 Process 3.6: Receipt Generation

**Description:** Generate booking and payment receipts

**Inputs:**
- Process 3.4 → Payment Receipt Data
- D8 → Booking Data

**Outputs:**
- Payment Receipt → Regular User
- Receipt Email → Email Service

**Logic:**
1. Compile booking details
2. Include payment information
3. Generate PDF receipt
4. Send to user
5. Email copy to user

---

## 📊 Data Stores Used

| ID | Name | Access |
|----|------|--------|
| D7 | Bookable Service Database | Read/Write (3.1) |
| D8 | Booking Database | Read/Write (3.3, 3.4, 3.5) |
| D9 | Availability Database | Read/Write (3.2) |
| D5 | Church Database | Read (all) |

---

## 🔄 Complete Workflow Example

```
USER BOOKS A PAID SERVICE:

1. User → 3.3: Booking Request (Wedding, Date, Payment: PayPal)
2. 3.3 → D7: Check service (Price: ₱5,000, Payment Required: Yes)
3. 3.3 → D9: Check availability (Available)
4. 3.3 → 3.4: Route to payment
5. 3.4 → Payment Gateway: Payment Request (₱5,000)
6. User pays via PayPal
7. Payment Gateway → 3.4: Payment Confirmed (TXN-12345)
8. 3.4 → D8: Store booking with payment (Status: Pending, Payment: Paid)
9. 3.4 → 3.6: Generate receipt
10. 3.6 → User: Payment Receipt
11. 3.5: Parish Manager reviews
12. Parish Manager → 3.5: Approve
13. 3.5 → D8: Update status (Approved)
14. 3.5 → User: Booking Confirmed (APPT-0123)
15. 3.5 → Process 8.0: Trigger notifications
```

---

**Total Sub-Processes: 6**  
**Data Stores: 4**  
**External Entities: 3 (Regular User, Parish Manager, Payment Gateway)**

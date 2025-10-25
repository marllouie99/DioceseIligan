# Level 2 DFD - Process 5.0: Donation Processing

**System:** ChurchIligan  
**Document Type:** Data Flow Diagram - Level 2 Decomposition  
**Parent Process:** Process 5.0  
**Created:** 2025-10-24  

---

## 📊 Process 5.0 Decomposition

### **Sub-Processes:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESS 5.0 DECOMPOSITION                    │
│                    Donation Processing                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   5.1        │      │   5.2        │      │   5.3        │
│  Donation    │─────▶│   Payment    │─────▶│   Payment    │
│  Settings    │      │   Request    │      │  Validation  │
└──────────────┘      └──────────────┘      └──────────────┘
                                                    │
                                                    ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   5.4        │      │   5.5        │      │   5.6        │
│   Webhook    │─────▶│   Receipt    │─────▶│   Goal       │
│   Handler    │      │  Generation  │      │   Tracking   │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 🔹 Process 5.1: Donation Settings Configuration

**Description:** Configure donation settings for posts

**Inputs:**
- Process 4.6 → Donation Settings (Post ID, Goal, PayPal Email)
- D5 → Church Data (PayPal Email)

**Outputs:**
- Validated Settings → Process 5.2

**Logic:**
1. Receive donation settings from Process 4.6
2. Verify church has PayPal email in D5
3. Validate donation goal (if set)
4. Enable donation button on post
5. Store settings for payment processing

---

## 🔹 Process 5.2: Payment Request Processing

**Description:** Process donation payment requests

**Inputs:**
- Regular User → Donation Request (Post ID, Amount, Message, Anonymous)
- Process 5.1 → Donation Settings

**Outputs:**
- Payment Request → Payment Gateway
- Pending Donation → D13 (Donation Database)

**Logic:**
1. Validate post has donations enabled
2. Validate donation amount (min: ₱10)
3. Get church PayPal email from D5
4. Create donation record in D13 (Status: Pending)
5. Generate payment request
6. Send to Payment Gateway (PayPal/Stripe)
7. Wait for payment confirmation

---

## 🔹 Process 5.3: Payment Validation

**Description:** Validate payment confirmation from gateway

**Inputs:**
- Payment Gateway → Payment Confirmation
- D13 → Pending Donation Data

**Outputs:**
- Validated Payment → Process 5.4
- Updated Donation → D13 (Status: Completed)

**Logic:**
1. Receive payment confirmation
2. Verify transaction ID
3. Match with pending donation in D13
4. Validate payment amount
5. Update donation status to 'Completed'
6. Store payment details:
   - paypal_order_id
   - paypal_transaction_id
   - paypal_payer_email
   - completed_at timestamp
7. Route to receipt generation

---

## 🔹 Process 5.4: Webhook Handler

**Description:** Handle real-time payment status updates

**Inputs:**
- Payment Gateway → Webhook Notification (Order ID, Status)

**Outputs:**
- Status Update → D13
- Notification → Parish Manager

**Logic:**
1. Receive webhook from PayPal/Stripe
2. Verify webhook signature
3. Parse webhook data
4. Find donation by order_id in D13
5. Update payment status:
   - Completed
   - Failed
   - Refunded
   - Cancelled
6. Notify Parish Manager of status change
7. Log webhook event

---

## 🔹 Process 5.5: Receipt Generation

**Description:** Generate donation receipts

**Inputs:**
- Process 5.3 → Completed Donation Data
- D13 → Donation Details

**Outputs:**
- Donation Receipt → Regular User
- Receipt Email → Email Service
- Receipt Notification → Parish Manager

**Logic:**
1. Compile donation details:
   - Amount
   - Transaction ID
   - Date/Time
   - Church name
   - Post title
   - Donor name (if not anonymous)
2. Generate PDF receipt
3. Send to donor
4. Email copy to donor
5. Notify Parish Manager of new donation

---

## 🔹 Process 5.6: Goal Tracking & Statistics

**Description:** Track donation goals and generate statistics

**Inputs:**
- D13 → Donation Data
- D10 → Post Data (Donation Goal)

**Outputs:**
- Goal Progress → Regular User
- Donation Statistics → Parish Manager
- Donation Event → Process 9.0 (Analytics)

**Logic:**
1. Calculate total donations per post
2. Compare with donation goal
3. Calculate progress percentage
4. Display progress bar on post
5. Generate donation statistics:
   - Total amount raised
   - Number of donors
   - Average donation
   - Top donors (if not anonymous)
6. Send data to Process 9.0 for analytics

---

## 📊 Data Stores Used

| ID | Name | Access |
|----|------|--------|
| D13 | Donation Database | Read/Write (5.2, 5.3, 5.4, 5.6) |
| D10 | Post Database | Read (5.6) |
| D5 | Church Database | Read (5.1, 5.2) |

---

## 🔄 Complete Workflow Example

```
USER DONATES TO POST:

1. User → 5.2: Donate ₱500 to Christmas Mass post
2. 5.2 → D5: Get church PayPal email
3. 5.2 → D13: Create donation (Status: Pending)
4. 5.2 → Payment Gateway: Payment Request (₱500)
5. User completes payment on PayPal
6. Payment Gateway → 5.3: Payment Confirmed (TXN-67890)
7. 5.3 → D13: Update donation (Status: Completed)
8. 5.3 → 5.5: Generate receipt
9. 5.5 → User: Donation Receipt PDF
10. 5.5 → Email Service: Send receipt email
11. 5.5 → Parish Manager: Notification (New donation: ₱500)
12. 5.6 → D13: Calculate total donations
13. 5.6 → D10: Get donation goal (₱10,000)
14. 5.6 → User: Display progress (₱3,500 / ₱10,000 = 35%)
15. Payment Gateway → 5.4: Webhook (Status: Completed)
16. 5.4 → D13: Confirm status
17. 5.6 → Process 9.0: Send donation analytics
```

---

## 💰 Payment Flow Details

### **PayPal Integration:**
- Order creation
- Payment capture
- Webhook notifications
- Refund handling

### **Stripe Integration:**
- Payment intent creation
- Payment confirmation
- Webhook events
- Charge management

### **Supported Features:**
- One-time donations
- Anonymous donations
- Donation messages
- Goal tracking
- Receipt generation
- Real-time updates

---

**Total Sub-Processes: 6**  
**Data Stores: 3**  
**External Entities: 3 (Regular User, Parish Manager, Payment Gateway)**

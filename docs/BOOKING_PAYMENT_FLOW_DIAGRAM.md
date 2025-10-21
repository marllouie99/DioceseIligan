# Booking Payment Flow Diagram

## Complete Booking Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER CREATES BOOKING                         │
│                                                                       │
│  Status: REQUESTED                                                   │
│  Payment Status: pending                                             │
│  Payment Amount: null                                                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   User Decides to     │
                    │   Pay Online?         │
                    └───────┬───────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
               YES                     NO
                │                       │
                ▼                       ▼
    ┌─────────────────────┐   ┌──────────────────┐
    │  PAYMENT PROCESS    │   │  Church Owner    │
    │  (PayPal/Stripe)    │   │  Reviews         │
    └──────────┬──────────┘   └────────┬─────────┘
               │                        │
               ▼                        ▼
    ┌─────────────────────┐   ┌──────────────────┐
    │  Payment Success    │   │  Manual Review   │
    │                     │   │  & Approval      │
    │  ✓ payment_status   │   └────────┬─────────┘
    │    = "paid"         │            │
    │  ✓ Status stays     │            ▼
    │    "REQUESTED"      │   ┌──────────────────┐
    │  ✓ Records:         │   │  Status:         │
    │    - amount         │   │  REVIEWED →      │
    │    - method         │   │  APPROVED        │
    │    - transaction_id │   └────────┬─────────┘
    │    - date           │            │
    │                     │            │
    │  ✓ Auto-cancels     │            │
    │    conflicting      │            │
    │    bookings         │            │
    │                     │            │
    │  ✓ Notifies church  │            │
    │    owner            │            │
    └──────────┬──────────┘            │
               │                        │
               └────────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Church Owner Reviews │
                │  Paid Booking         │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Status: REVIEWED     │
                │  Payment: paid        │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Church Owner         │
                │  Approves/Declines    │
                └───────┬───────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
        APPROVE                  DECLINE
            │                       │
            ▼                       ▼
┌───────────────────────┐  ┌──────────────────┐
│  Status: APPROVED     │  │  Status:         │
│  Payment: paid        │  │  DECLINED        │
└───────────┬───────────┘  └──────────────────┘
            │
            ▼
┌───────────────────────┐
│  Appointment Happens  │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  Status: COMPLETED    │
│  Payment: paid        │
└───────────────────────┘
```

## Conflict Resolution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              SAME CHURCH + SAME DATE SCENARIO                    │
└─────────────────────────────────────────────────────────────────┘

TIME: 10:00 AM
┌──────────────────────┐         ┌──────────────────────┐
│  USER A              │         │  USER B              │
│  Booking A           │         │  Booking B           │
│  Status: REQUESTED   │         │  Status: REQUESTED   │
│  Payment: pending    │         │  Payment: pending    │
└──────────┬───────────┘         └──────────┬───────────┘
           │                                 │
           │                                 │
TIME: 10:05 AM                               │
           │                                 │
           ▼                                 │
    ┌─────────────┐                         │
    │  User A     │                         │
    │  Pays ₱500  │                         │
    └──────┬──────┘                         │
           │                                 │
           ▼                                 │
    ┌─────────────────────────────┐         │
    │  ATOMIC TRANSACTION START   │         │
    │                             │         │
    │  1. Update Booking A:       │         │
    │     ✓ payment_status="paid" │         │
    │     ✓ payment_amount=500    │         │
    │     ✓ payment_method=paypal │         │
    │     ✓ transaction_id=XXX    │         │
    │     ✓ payment_date=now()    │         │
    │     ✓ status=REQUESTED      │         │
    │                             │         │
    │  2. Find Conflicts:         │         │
    │     → Booking B found!      │         │
    │                             │         │
    │  3. Cancel Booking B:       │         │
    │     ✓ status=CANCELED       │         │
    │     ✓ cancel_reason=        │         │
    │       "Another booking      │         │
    │        confirmed..."        │         │
    │                             │         │
    │  4. Notify Church Owner     │         │
    │  5. Notify User B           │         │
    │                             │         │
    │  COMMIT ALL CHANGES         │         │
    └─────────────┬───────────────┘         │
                  │                         │
                  ▼                         ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │  BOOKING A           │    │  BOOKING B           │
    │  ✅ REQUESTED        │    │  ❌ CANCELED         │
    │  ✅ Payment: paid    │    │  📧 Notification:    │
    │  ✅ Amount: ₱500     │    │  "Your booking was   │
    │                      │    │   cancelled because  │
    │  📧 Church notified: │    │   another user       │
    │  "Payment received"  │    │   confirmed the      │
    │                      │    │   same date"         │
    └──────────────────────┘    └──────────────────────┘
```

## Status Comparison: Before vs After Fix

### BEFORE (Incorrect Flow)
```
User Books
    ↓
Status: REQUESTED, Payment: pending
    ↓
User Pays
    ↓
Status: REVIEWED ❌ (Skipped proper review!)
    ↓
Church Owner confused - already marked as reviewed
    ↓
Status: APPROVED
```

**Problems:**
- ❌ Skips proper church review
- ❌ No payment details recorded
- ❌ Conflicting bookings not handled
- ❌ Church owner not notified of payment

### AFTER (Correct Flow)
```
User Books
    ↓
Status: REQUESTED, Payment: pending
    ↓
User Pays
    ↓
Status: REQUESTED ✅, Payment: paid ✅
    ↓ (Payment details recorded)
    ↓ (Conflicts auto-cancelled)
    ↓ (Church owner notified)
Church Owner Reviews
    ↓
Status: REVIEWED
    ↓
Church Owner Approves
    ↓
Status: APPROVED
```

**Benefits:**
- ✅ Proper status progression
- ✅ Full payment tracking
- ✅ Automatic conflict resolution
- ✅ Church owner notifications
- ✅ Clear audit trail

## Payment Status States

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT STATUS                            │
└─────────────────────────────────────────────────────────────┘

┌──────────┐
│ pending  │ ← Initial state when booking created
└────┬─────┘
     │
     ├─────► User pays online
     │
     ▼
┌──────────┐
│   paid   │ ← Payment successful
└────┬─────┘   - Amount recorded
     │          - Method recorded
     │          - Transaction ID recorded
     │          - Date recorded
     │          - Conflicts cancelled
     │
     ├─────► Payment fails
     │
     ▼
┌──────────┐
│  failed  │ ← Payment unsuccessful, can retry
└──────────┘

┌──────────┐
│ refunded │ ← Future: If booking cancelled after payment
└──────────┘
```

## Booking Status States

```
┌─────────────────────────────────────────────────────────────┐
│                    BOOKING STATUS                            │
└─────────────────────────────────────────────────────────────┘

┌────────────┐
│ REQUESTED  │ ← Initial state
└──────┬─────┘   Can have payment: pending OR paid
       │
       ├─────► Church owner reviews
       │
       ▼
┌────────────┐
│  REVIEWED  │ ← Under review by church
└──────┬─────┘
       │
       ├─────► Church owner decides
       │
       ├────────────┬────────────┐
       │            │            │
       ▼            ▼            ▼
┌────────────┐ ┌──────────┐ ┌──────────┐
│  APPROVED  │ │ DECLINED │ │ CANCELED │
└──────┬─────┘ └──────────┘ └──────────┘
       │
       ▼
┌────────────┐
│ COMPLETED  │ ← Appointment finished
└────────────┘
```

## Notification Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    NOTIFICATIONS                             │
└─────────────────────────────────────────────────────────────┘

EVENT: User Creates Booking
    ↓
    📧 → Church Owner: "New booking request"

EVENT: User Pays Online
    ↓
    📧 → Church Owner: "Payment received - ₱XXX"
    📧 → User: "Payment successful"
    📧 → Other Users (if conflicts): "Booking cancelled"

EVENT: Church Owner Reviews
    ↓
    📧 → User: "Your booking is under review"

EVENT: Church Owner Approves
    ↓
    📧 → User: "Your booking is approved!"

EVENT: Church Owner Declines
    ↓
    📧 → User: "Your booking was declined"

EVENT: Appointment Completed
    ↓
    📧 → User: "Thank you for your visit"
```

## Database Transaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│              ATOMIC TRANSACTION GUARANTEE                    │
└─────────────────────────────────────────────────────────────┘

BEGIN TRANSACTION
    │
    ├─ UPDATE booking SET
    │   payment_status = 'paid',
    │   payment_amount = 500.00,
    │   payment_method = 'paypal',
    │   payment_transaction_id = 'TXN123',
    │   payment_date = NOW()
    │
    ├─ SELECT conflicting_bookings
    │   WHERE church_id = X
    │   AND date = Y
    │   AND payment_status = 'pending'
    │
    ├─ UPDATE conflicting_bookings SET
    │   status = 'CANCELED',
    │   cancel_reason = '...'
    │
    ├─ INSERT notifications
    │
    └─ If ALL succeed → COMMIT
       If ANY fails → ROLLBACK (nothing changes)
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                           │
└─────────────────────────────────────────────────────────────┘

SCENARIO 1: Payment Gateway Failure
    Payment fails → Booking stays REQUESTED (pending)
    User can retry payment

SCENARIO 2: Database Error During Transaction
    Transaction rolls back → No changes applied
    User sees error, can retry

SCENARIO 3: Notification Failure
    Booking updated successfully
    Notification logged as failed
    Can be retried separately

SCENARIO 4: Concurrent Payments
    Atomic transaction prevents race condition
    First payment wins
    Second payment may fail or cancel conflicts
```

## Summary

This flow ensures:
✅ Proper status progression (no skipping)
✅ Complete payment tracking
✅ Automatic conflict resolution
✅ Data consistency (atomic transactions)
✅ Clear communication (notifications)
✅ Audit trail (all changes logged)

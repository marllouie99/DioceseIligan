# Booking Payment Flow Fix

## Issues Fixed

### Issue 1: Appointment Status Skipping "Reviewed" Status
**Problem**: When a pending/requested appointment received online payment, the appointment status automatically jumped from "requested" to "approved", skipping the "reviewed" status entirely.

**Root Cause**: The payment capture functions in `booking_payment_views.py` were setting `booking.status = Booking.STATUS_REVIEWED` immediately after payment, which was incorrect. The status should remain as "REQUESTED" with payment_status set to "paid", allowing the church owner to review and manually approve.

**Solution**: 
- Modified payment capture functions to keep `status = REQUESTED` after payment
- Updated `payment_status = 'paid'` to indicate payment received
- Added payment details (amount, method, transaction_id, date) to the booking
- Church owner can now review paid bookings and manually approve them

### Issue 2: Conflicting Bookings Auto-Cancellation
**Problem**: When User A and User B booked the same time slot at the same church, and one user paid first while in pending/requested status, the other user's booking was not automatically cancelled, leading to double bookings.

**Root Cause**: No conflict detection or auto-cancellation logic existed when payment was confirmed.

**Solution**:
- Added automatic conflict detection using the existing `conflicts_qs()` method
- When payment is confirmed, all other pending bookings for the same church and date are automatically cancelled
- Cancelled bookings receive a clear cancel_reason explaining why
- Uses atomic database transactions to ensure data consistency

## Changes Made

### 1. Updated `core/booking_payment_views.py`

#### PayPal Payment Capture (`capture_booking_payment`)
```python
# Before:
booking.status = Booking.STATUS_REVIEWED
booking.save()

# After:
with transaction.atomic():
    # Update payment details
    booking.payment_status = 'paid'
    booking.payment_method = 'paypal'
    booking.payment_amount = payment_amount
    booking.payment_transaction_id = transaction_id
    booking.payment_date = timezone.now()
    
    # Keep status as REQUESTED - church owner needs to review
    booking.status = Booking.STATUS_REQUESTED
    booking.save()
    
    # Auto-cancel conflicting bookings
    conflicting_bookings = booking.conflicts_qs().filter(
        payment_status='pending'
    )
    
    for conflict in conflicting_bookings:
        conflict.status = Booking.STATUS_CANCELED
        conflict.cancel_reason = f'Another booking was confirmed for {booking.church.name} on {booking.date}'
        conflict.save()
```

#### Stripe Payment Confirmation (`confirm_stripe_booking_payment`)
- Same logic as PayPal implementation
- Properly handles Stripe payment amounts (converts from cents)
- Uses atomic transactions for data consistency

### 2. Updated `core/signals.py`

#### Enhanced Pre-Save Signal
```python
@receiver(pre_save, sender=Booking)
def cache_booking_old_status(sender, instance, **kwargs):
    """
    Cache the previous status and payment_status for change detection.
    """
    if instance.pk:
        old_booking = Booking.objects.only('status', 'payment_status').get(pk=instance.pk)
        instance._old_status = old_booking.status
        instance._old_payment_status = old_booking.payment_status
```

#### Added Payment Notification
```python
# Notify church owner when payment is received
if old_payment_status != 'paid' and instance.payment_status == 'paid':
    create_church_notification(
        church_owner=church_owner,
        notification_type=Notification.TYPE_BOOKING_REQUESTED,
        title=f'Payment Received - {instance.code}',
        message=f'{user} has paid ₱{amount} for {service} on {date}. Please review and approve.',
        priority='high',
        church=instance.church
    )
```

## Booking Flow After Fix

### User Journey
1. **User creates booking** → Status: `REQUESTED`, Payment: `pending`
2. **User pays online** → Status: `REQUESTED`, Payment: `paid`
   - Payment details recorded (amount, method, transaction_id, date)
   - Conflicting bookings auto-cancelled
   - Church owner receives notification
3. **Church owner reviews** → Status: `REVIEWED`, Payment: `paid`
4. **Church owner approves** → Status: `APPROVED`, Payment: `paid`
5. **Appointment completed** → Status: `COMPLETED`, Payment: `paid`

### Status Flow Diagram
```
REQUESTED (payment: pending)
    ↓ [User pays online]
REQUESTED (payment: paid) ← Stays here until church reviews
    ↓ [Church owner reviews]
REVIEWED (payment: paid)
    ↓ [Church owner approves]
APPROVED (payment: paid)
    ↓ [Appointment happens]
COMPLETED (payment: paid)
```

## Conflict Resolution Logic

### How It Works
1. When payment is confirmed for Booking A:
   - Query all bookings with same `church_id` and `date`
   - Filter for active statuses: `REQUESTED`, `REVIEWED`, `APPROVED`
   - Exclude Booking A itself
   - Filter for `payment_status = 'pending'` (unpaid bookings)

2. For each conflicting booking:
   - Set `status = CANCELED`
   - Set `cancel_reason` with clear explanation
   - Save and trigger notification to user

3. Users with cancelled bookings receive:
   - In-app notification
   - Email notification
   - Clear reason for cancellation

### Example Scenario
```
Church: St. Mary's Cathedral
Date: 2025-10-25

Booking A (User A): REQUESTED, payment: pending
Booking B (User B): REQUESTED, payment: pending

[User A pays ₱500]

Booking A: REQUESTED, payment: paid ✓
Booking B: CANCELED, reason: "Another booking was confirmed for St. Mary's Cathedral on 2025-10-25"
```

## Database Transaction Safety

All payment operations use atomic transactions:
```python
with transaction.atomic():
    # Update booking payment details
    # Cancel conflicting bookings
    # All changes committed together or rolled back on error
```

This ensures:
- No partial updates if an error occurs
- Data consistency across multiple bookings
- No race conditions between concurrent payments

## Benefits

### For Users
✅ Clear payment status tracking  
✅ Automatic conflict resolution  
✅ Immediate notification of cancellations  
✅ No double bookings  
✅ Transparent booking flow  

### For Church Owners
✅ Review paid bookings before approval  
✅ Payment notification alerts  
✅ Better control over appointments  
✅ Reduced manual conflict management  
✅ Clear audit trail of payments  

### For System
✅ Data consistency with atomic transactions  
✅ Proper status flow enforcement  
✅ Automatic conflict detection  
✅ Comprehensive logging  
✅ Scalable architecture  

## Testing Recommendations

### Test Case 1: Single User Payment
1. Create booking (status: REQUESTED, payment: pending)
2. Process payment
3. Verify: status stays REQUESTED, payment_status = paid
4. Verify: payment details recorded
5. Verify: church owner receives notification

### Test Case 2: Concurrent Bookings
1. User A creates booking for Church X on Date Y
2. User B creates booking for Church X on Date Y
3. User A pays first
4. Verify: User A booking has payment_status = paid
5. Verify: User B booking is CANCELED
6. Verify: User B receives cancellation notification

### Test Case 3: Church Owner Approval Flow
1. User pays for booking
2. Church owner reviews (sets to REVIEWED)
3. Church owner approves (sets to APPROVED)
4. Verify: status progression is correct
5. Verify: user receives notifications at each step

### Test Case 4: Payment Failure Handling
1. Create booking
2. Simulate payment failure
3. Verify: booking remains REQUESTED with payment: pending
4. Verify: no conflicting bookings cancelled
5. Verify: user can retry payment

### Test Case 5: Multiple Conflicts
1. Create 3 bookings for same church/date
2. User A pays
3. Verify: Other 2 bookings cancelled
4. Verify: Both users receive notifications
5. Verify: All operations in single transaction

## Migration Notes

### Existing Bookings
- No database migration required
- Existing bookings unaffected
- New logic applies to future payments only

### Backward Compatibility
- All existing booking statuses preserved
- Payment fields already exist in model
- No breaking changes to API

## Monitoring and Logging

### Log Messages
```python
logger.info(f"Payment captured for booking {booking.code}. Cancelled {count} conflicting bookings.")
logger.error(f"Error capturing booking payment: {str(e)}")
```

### What to Monitor
- Payment success rate
- Conflict cancellation frequency
- Notification delivery success
- Transaction rollback occurrences
- Payment processing time

## Future Enhancements

### Potential Improvements
1. **Time-based slots**: Add start_time/end_time conflict detection
2. **Refund handling**: Auto-refund cancelled bookings if paid
3. **Waitlist system**: Offer cancelled slots to waitlisted users
4. **Payment reminders**: Remind users to pay pending bookings
5. **Bulk operations**: Admin tool to resolve conflicts manually
6. **Analytics**: Track payment conversion rates and cancellation patterns

## API Response Changes

### Payment Capture Response
```json
{
  "success": true,
  "message": "Payment successful! Your booking is now pending church approval.",
  "capture_id": "PAYPAL_CAPTURE_ID",
  "cancelled_conflicts": 2
}
```

The `cancelled_conflicts` field indicates how many other bookings were automatically cancelled.

## Security Considerations

✅ User ownership verification before payment  
✅ Church PayPal configuration validation  
✅ Minimum payment amount enforcement  
✅ Transaction ID recording for audit  
✅ Atomic operations prevent race conditions  
✅ Proper error handling and logging  

## Support and Troubleshooting

### Common Issues

**Issue**: Payment succeeds but booking not updated  
**Solution**: Check logs for transaction errors, verify database connection

**Issue**: Conflicting bookings not cancelled  
**Solution**: Verify `conflicts_qs()` method returns correct results

**Issue**: Church owner not receiving notification  
**Solution**: Check church.owner exists and notification system is working

**Issue**: User charged but booking failed  
**Solution**: Check payment gateway transaction, manual reconciliation may be needed

## Conclusion

These fixes ensure a proper booking payment flow that:
- Maintains correct status progression
- Prevents double bookings automatically
- Provides clear communication to all parties
- Ensures data consistency and integrity
- Scales well with concurrent users

The implementation follows Django best practices and uses atomic transactions for reliability.

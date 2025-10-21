# Booking Payment Amount Auto-Populate Fix

## Issue Fixed

**Problem**: The `payment_amount` field in the Booking model was not being populated when a booking was created. It only got populated after payment was completed, making it difficult to:
- See the expected payment amount in the admin panel
- Track which bookings require payment
- Display payment information before payment is made

**Solution**: Auto-populate `payment_amount` from the service price when the booking is created.

## Change Made

### Updated `core/forms.py` - BookingForm.save()

**Before:**
```python
def save(self, commit=True):
    booking = super().save(commit=False)
    if self.service:
        booking.service = self.service
        booking.church = self.service.church
    if self.user:
        booking.user = self.user
    booking.status = Booking.STATUS_REQUESTED
    if commit:
        booking.save()
    return booking
```

**After:**
```python
def save(self, commit=True):
    booking = super().save(commit=False)
    if self.service:
        booking.service = self.service
        booking.church = self.service.church
        # Auto-populate payment amount from service price
        if not self.service.is_free and self.service.price:
            booking.payment_amount = self.service.price
    if self.user:
        booking.user = self.user
    booking.status = Booking.STATUS_REQUESTED
    if commit:
        booking.save()
    return booking
```

## How It Works

### Booking Creation Flow

```
User Creates Booking
    ↓
BookingForm.save() called
    ↓
Check: Is service free?
    ├─ Yes → payment_amount = None
    └─ No → Check: Does service have price?
        ├─ Yes → payment_amount = service.price
        └─ No → payment_amount = None
    ↓
Booking saved to database
    ↓
payment_amount field populated ✓
```

### Example Scenarios

#### Scenario 1: Paid Service (₱500)
```
Service: Wedding Ceremony
Price: ₱500.00
is_free: False

Booking Created:
✓ payment_amount = 500.00
✓ payment_status = 'pending'
```

#### Scenario 2: Free Service
```
Service: Sunday Mass
Price: None
is_free: True

Booking Created:
✓ payment_amount = None
✓ payment_status = 'pending'
```

#### Scenario 3: Service Without Price
```
Service: Counseling
Price: None
is_free: False

Booking Created:
✓ payment_amount = None
✓ payment_status = 'pending'
```

## Database State

### Before Payment
```sql
-- Booking just created
id: 1
service_id: 5
user_id: 10
payment_amount: 500.00  ← Auto-populated from service.price
payment_status: 'pending'
payment_method: NULL
payment_transaction_id: NULL
payment_date: NULL
status: 'requested'
```

### After Payment
```sql
-- Payment completed
id: 1
service_id: 5
user_id: 10
payment_amount: 500.00  ← Remains the same (or updated if different)
payment_status: 'paid'
payment_method: 'paypal'
payment_transaction_id: 'TXN123456'
payment_date: '2025-10-21 01:45:00'
status: 'requested'
```

## Benefits

### For Admin Panel
✅ **Immediate visibility** - See expected payment amount right away  
✅ **Easy filtering** - Filter bookings by payment amount  
✅ **Better reporting** - Generate revenue reports before payments  
✅ **Data completeness** - All bookings have payment info  

### For Church Owners
✅ **Clear expectations** - Know how much to expect from each booking  
✅ **Revenue tracking** - Track pending vs completed payments  
✅ **Better management** - See which bookings are paid vs unpaid  

### For System
✅ **Data consistency** - Payment amount always matches service price  
✅ **Single source of truth** - Service price is the reference  
✅ **Audit trail** - Track if payment amount changes  
✅ **Validation** - Can compare payment_amount with service.price  

## Admin Panel View

### Before Fix
```
Booking #APPT-0001
Service: Wedding Ceremony
User: John Doe
Payment Amount: [empty]  ← Not populated
Payment Status: pending
```

### After Fix
```
Booking #APPT-0001
Service: Wedding Ceremony
User: John Doe
Payment Amount: ₱500.00  ← Auto-populated ✓
Payment Status: pending
```

## Edge Cases Handled

### 1. Free Services
```python
if not self.service.is_free and self.service.price:
    booking.payment_amount = self.service.price
```
- Free services: `payment_amount` remains `None`
- Paid services: `payment_amount` gets service price

### 2. Services Without Price
```python
if not self.service.is_free and self.service.price:
    booking.payment_amount = self.service.price
```
- No price set: `payment_amount` remains `None`
- Price set: `payment_amount` gets service price

### 3. Price Changes
If service price changes after booking is created:
- Booking keeps original `payment_amount`
- Payment validation uses `booking.payment_amount` (not service.price)
- This protects users from price increases

## Testing

### Test Case 1: Create Booking for Paid Service
```python
# Setup
service = BookableService.objects.create(
    name="Wedding",
    price=500.00,
    is_free=False
)

# Create booking
form = BookingForm(data, service=service, user=user)
booking = form.save()

# Assert
assert booking.payment_amount == 500.00
assert booking.payment_status == 'pending'
```

### Test Case 2: Create Booking for Free Service
```python
# Setup
service = BookableService.objects.create(
    name="Sunday Mass",
    is_free=True
)

# Create booking
form = BookingForm(data, service=service, user=user)
booking = form.save()

# Assert
assert booking.payment_amount is None
assert booking.payment_status == 'pending'
```

### Test Case 3: Admin Panel Display
1. Create booking for ₱500 service
2. Open Django admin
3. View booking in admin panel
4. Verify payment_amount shows ₱500.00

### Test Case 4: Payment Flow
1. Create booking (payment_amount = ₱500)
2. User pays ₱500
3. Backend validates: amount == booking.payment_amount ✓
4. Payment succeeds
5. payment_status updated to 'paid'

## Related Changes

This fix complements:
1. **BOOKING_PAYMENT_FLOW_FIX.md** - Payment flow and conflict resolution
2. **BOOKING_PAYMENT_AUTO_AMOUNT_FIX.md** - Auto-amount in payment UI
3. **BOOKING_PAYMENT_QUICK_SUMMARY.md** - Quick reference

## Migration

### No Database Migration Needed
- `payment_amount` field already exists
- Just populating it with data
- Existing bookings unaffected

### Existing Bookings
Existing bookings without `payment_amount`:
- Will remain as-is (no automatic backfill)
- Can be manually updated in admin if needed
- Future bookings will have it auto-populated

### Optional: Backfill Script
If you want to populate existing bookings:

```python
# management/commands/backfill_payment_amounts.py
from django.core.management.base import BaseCommand
from core.models import Booking

class Command(BaseCommand):
    help = 'Backfill payment_amount for existing bookings'

    def handle(self, *args, **options):
        bookings = Booking.objects.filter(payment_amount__isnull=True)
        updated = 0
        
        for booking in bookings:
            if not booking.service.is_free and booking.service.price:
                booking.payment_amount = booking.service.price
                booking.save(update_fields=['payment_amount'])
                updated += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Updated {updated} bookings')
        )
```

Run with: `python manage.py backfill_payment_amounts`

## Summary

✅ **Auto-populates** `payment_amount` when booking is created  
✅ **Uses service price** as the source of truth  
✅ **Handles free services** correctly (leaves amount as None)  
✅ **Handles missing prices** correctly (leaves amount as None)  
✅ **Improves admin visibility** - see amounts immediately  
✅ **No breaking changes** - existing bookings unaffected  
✅ **Data consistency** - amount always matches service price at booking time  

The `payment_amount` field is now automatically populated from the service price when a booking is created, making it easier to track and manage payments throughout the booking lifecycle! 🎉

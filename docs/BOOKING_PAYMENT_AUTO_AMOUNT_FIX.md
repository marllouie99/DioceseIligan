# Booking Payment Auto-Amount Fix

## Issue Fixed

**Problem**: Users had to manually enter the payment amount even though the service already had a price set up. This created several issues:
- Risk of payment tampering (users could enter wrong amounts)
- Poor user experience (redundant data entry)
- Potential for errors and confusion
- No validation against service price

**Solution**: Automatically use the service price from the booking, validate it on the backend, and remove manual amount entry from the UI.

## Changes Made

### 1. Backend Validation (`core/booking_payment_views.py`)

#### PayPal Payment Creation (`create_booking_payment_order`)
```python
# Added service price validation
if booking.service.is_free:
    return JsonResponse({
        'success': False,
        'message': 'This service is free and does not require payment'
    }, status=400)

if not booking.service.price:
    return JsonResponse({
        'success': False,
        'message': 'Service price is not set. Please contact the church.'
    }, status=400)

# Use service price (with optional override from POST)
amount = Decimal(request.POST.get('amount', str(booking.service.price)))

# Validate amount matches service price (prevent tampering)
if amount != booking.service.price:
    return JsonResponse({
        'success': False,
        'message': f'Payment amount must match service price of ₱{booking.service.price}'
    }, status=400)
```

#### Stripe Payment Creation (`create_stripe_booking_payment`)
- Same validation logic as PayPal
- Ensures amount matches service price
- Prevents payment tampering

### 2. Frontend Template (`templates/core/my_appointments.html`)

Added service price and is_free flag to the function call:
```html
onclick="openAppointmentSummary(
    ...existing parameters...,
    {{ b.service.price|default:'0' }},
    {{ b.service.is_free|yesno:'true,false' }}
)"
```

### 3. Frontend JavaScript (`static/js/my_appointments.js`)

#### Added Global Variables
```javascript
let currentServicePrice = 0;
let currentServiceIsFree = false;
```

#### Updated Function Signature
```javascript
function openAppointmentSummary(
    ...existing parameters...,
    servicePrice,
    isFree
)
```

#### Store Service Price
```javascript
currentServicePrice = parseFloat(servicePrice) || 0;
currentServiceIsFree = isFree;
```

#### Conditional Payment Display
```javascript
// Only show payment section if:
// 1. Status is 'requested'
// 2. Service is NOT free
// 3. Service has a price > 0
if (status === 'requested' && !currentServiceIsFree && currentServicePrice > 0) {
    paymentSection.style.display = 'block';
    // Initialize payment methods
}
```

#### Auto-populate Amount in PayPal
```javascript
body: `amount=${currentServicePrice.toFixed(2)}`
```

#### Auto-populate Amount in Stripe
```javascript
body: `amount=${currentServicePrice.toFixed(2)}`
```

## Security Improvements

### 1. **Price Validation**
- Backend validates that payment amount matches service price
- Prevents users from tampering with payment amounts
- Returns clear error message if amounts don't match

### 2. **Free Service Check**
- Prevents payment attempts on free services
- Returns appropriate error message

### 3. **Price Existence Check**
- Validates that service has a price set
- Prevents payment on services without pricing

### 4. **Server-Side Enforcement**
- All validation happens on the backend
- Frontend only sends the amount, backend verifies it
- No trust in client-side data

## User Experience Improvements

### Before Fix
```
1. User clicks "Pay Now"
2. User sees payment modal
3. User must manually enter amount (₱500.00)
4. User might enter wrong amount
5. Payment processes with potentially wrong amount
```

### After Fix
```
1. User clicks "Pay Now"
2. User sees payment modal
3. Amount is automatically set from service price
4. User just clicks PayPal/Stripe button
5. Backend validates amount matches service price
6. Payment processes with correct amount
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT AMOUNT FLOW                       │
└─────────────────────────────────────────────────────────────┘

SERVICE SETUP (Church Owner)
    ↓
Set Service Price: ₱500.00
Set is_free: False
    ↓
    
USER BOOKING
    ↓
User creates booking for service
    ↓
Booking stores reference to service
    ↓
    
PAYMENT INITIATION
    ↓
User clicks "View Summary"
    ↓
JavaScript receives:
  - servicePrice: 500.00
  - isFree: false
    ↓
Store in global variables:
  - currentServicePrice = 500.00
  - currentServiceIsFree = false
    ↓
Check conditions:
  ✓ status === 'requested'
  ✓ !currentServiceIsFree
  ✓ currentServicePrice > 0
    ↓
Show payment section
    ↓
    
PAYMENT METHOD SELECTION
    ↓
User chooses PayPal or Stripe
    ↓
    
PAYMENT REQUEST (PayPal Example)
    ↓
JavaScript sends:
  POST /api/booking/{id}/payment/create/
  body: amount=500.00
    ↓
Backend receives request
    ↓
Backend validates:
  ✓ booking.service.is_free == False
  ✓ booking.service.price exists
  ✓ amount (500.00) == booking.service.price (500.00)
    ↓
Validation passes
    ↓
Create PayPal order with ₱500.00
    ↓
Return order_id to frontend
    ↓
User completes payment on PayPal
    ↓
Payment captured with correct amount
```

## Error Scenarios

### Scenario 1: Free Service
```
User tries to pay for free service
    ↓
Backend check: booking.service.is_free == True
    ↓
Return error: "This service is free and does not require payment"
    ↓
Payment blocked
```

### Scenario 2: No Price Set
```
User tries to pay for service without price
    ↓
Backend check: booking.service.price == None
    ↓
Return error: "Service price is not set. Please contact the church."
    ↓
Payment blocked
```

### Scenario 3: Amount Tampering
```
Malicious user modifies JavaScript to send wrong amount
    ↓
Frontend sends: amount=1.00
    ↓
Backend receives: amount=1.00
    ↓
Backend check: 1.00 != booking.service.price (500.00)
    ↓
Return error: "Payment amount must match service price of ₱500.00"
    ↓
Payment blocked
```

### Scenario 4: Amount Below Minimum
```
Service price set to ₱5.00
    ↓
Backend check: 5.00 < 10.00 (minimum)
    ↓
Return error: "Minimum payment amount is ₱10"
    ↓
Payment blocked
```

## Testing Checklist

### Backend Tests
- [ ] Test payment with correct service price
- [ ] Test payment with free service (should fail)
- [ ] Test payment with no price set (should fail)
- [ ] Test payment with tampered amount (should fail)
- [ ] Test payment with amount below minimum (should fail)
- [ ] Test PayPal payment flow
- [ ] Test Stripe payment flow

### Frontend Tests
- [ ] Verify service price is passed to JavaScript
- [ ] Verify is_free flag is passed correctly
- [ ] Verify payment section shows for paid services
- [ ] Verify payment section hides for free services
- [ ] Verify amount is auto-populated in PayPal request
- [ ] Verify amount is auto-populated in Stripe request
- [ ] Test with various service prices (₱10, ₱100, ₱1000, etc.)

### Integration Tests
- [ ] Create booking for paid service
- [ ] Open appointment summary
- [ ] Verify payment section displays
- [ ] Click PayPal button
- [ ] Verify correct amount in PayPal checkout
- [ ] Complete payment
- [ ] Verify booking updated with correct amount

### Edge Cases
- [ ] Service with price = 0 (should hide payment)
- [ ] Service with price = null (should hide payment)
- [ ] Service with very large price (₱100,000+)
- [ ] Service with decimal price (₱99.99)
- [ ] Multiple bookings with different prices

## Benefits

### For Users
✅ **No manual entry** - Amount automatically set  
✅ **No errors** - Can't enter wrong amount  
✅ **Faster checkout** - One less step  
✅ **Clear pricing** - Always see correct amount  
✅ **Better UX** - Streamlined payment flow  

### For Church Owners
✅ **Accurate payments** - Always receive correct amount  
✅ **No disputes** - Amount matches service price  
✅ **Professional** - Automated pricing system  
✅ **Trust** - Users see official price  

### For System
✅ **Security** - Prevents payment tampering  
✅ **Data integrity** - Amount always matches service  
✅ **Validation** - Multiple checks on backend  
✅ **Maintainability** - Single source of truth (service price)  
✅ **Scalability** - Works for any number of services  

## Database Schema

### BookableService Model
```python
class BookableService(models.Model):
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_free = models.BooleanField(default=True)
    currency = models.CharField(max_length=3, default='PHP')
```

### Booking Model
```python
class Booking(models.Model):
    service = models.ForeignKey(BookableService, on_delete=models.CASCADE)
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    payment_status = models.CharField(max_length=20, default='pending')
```

## API Endpoints

### Create PayPal Payment
```
POST /api/booking/{booking_id}/payment/create/
Body: amount={service_price}
Response: { success: true, order_id: "..." }
```

### Create Stripe Payment
```
POST /api/booking/{booking_id}/payment/stripe/create/
Body: amount={service_price}
Response: { success: true, client_secret: "..." }
```

## Future Enhancements

### Potential Improvements
1. **Dynamic Pricing** - Allow custom amounts for donations
2. **Discounts** - Apply promo codes or discounts
3. **Multiple Currencies** - Support different currencies
4. **Partial Payments** - Allow installment payments
5. **Price History** - Track price changes over time
6. **Price Display** - Show price in booking summary
7. **Price Breakdown** - Show taxes, fees, etc.

## Related Documentation

- `BOOKING_PAYMENT_FLOW_FIX.md` - Payment flow and conflict resolution
- `BOOKING_PAYMENT_QUICK_SUMMARY.md` - Quick reference guide
- `BOOKING_PAYMENT_FLOW_DIAGRAM.md` - Visual flow diagrams

## Conclusion

This fix ensures that:
- Payment amounts are automatically set from service prices
- Users cannot tamper with payment amounts
- Free services don't show payment options
- Services without prices are handled gracefully
- The payment flow is streamlined and secure

The implementation follows security best practices and provides a better user experience while maintaining data integrity.

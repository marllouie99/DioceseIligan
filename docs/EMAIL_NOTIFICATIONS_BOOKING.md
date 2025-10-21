# Email Notifications for Booking Status Updates

## Summary
Implemented email notifications that are automatically sent to users when their booking/appointment status is updated by the church owner.

## Changes Made

### 1. Added Email Notification Function ✅
**File:** `accounts/email_utils.py`

Created `send_booking_status_email()` function that sends professional HTML emails when booking status changes.

**Supported Status Updates:**
- **Reviewed** - When church marks appointment as "under review"
- **Approved** - When church approves the appointment ✅
- **Declined** - When church declines the appointment
- **Completed** - When church marks appointment as completed
- **Canceled** - When appointment is canceled

**Features:**
- Professional HTML email templates with responsive design
- Includes all booking details (code, church name, service, date, time)
- Status-specific messaging and styling
- Uses Brevo API for reliable email delivery
- Async error handling to prevent blocking

### 2. Updated Signals to Send Emails ✅
**File:** `core/signals.py`

Modified the `create_booking_notifications` signal receiver to automatically send email notifications when booking status changes.

**Code Changes:**
```python
# Send email notification
from accounts.email_utils import send_booking_status_email
try:
    send_booking_status_email(instance, instance.status)
except Exception as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to send booking status email: {str(e)}")
```

### 3. Created Email Templates ✅
**Directory:** `templates/emails/`

Created 5 professional HTML email templates:

#### A. `booking_approved.html`
- Green success theme with checkmark icon
- Congratulatory message
- Complete appointment details
- Next steps checklist
- Reminder to arrive early

#### B. `booking_reviewed.html`
- Blue info theme with hourglass icon
- Status update message
- Booking details
- Reassurance that they'll be notified

#### C. `booking_declined.html`
- Orange/yellow warning theme
- Polite decline message
- Booking details
- Decline reason displayed
- Suggestions for next steps

#### D. `booking_completed.html`
- Purple success theme
- Thank you message
- Appointment summary
- Request for feedback/review
- Encouragement to book again

#### E. `booking_canceled.html`
- Gray neutral theme
- Cancellation confirmation
- Canceled appointment details
- Option to reschedule
- Friendly closing message

## Email Design Features

All email templates include:
- **Responsive Design** - Works on desktop and mobile
- **Professional Styling** - Modern gradient backgrounds and clean layout
- **Consistent Branding** - ChurchConnect logo and colors
- **Clear Information** - Well-organized booking details in table format
- **Status Badges** - Color-coded status indicators
- **Call-to-Actions** - Relevant next steps for each status
- **Footer** - Support contact and copyright information

## User Flow

1. **Church owner updates booking status** (e.g., Approved, Declined, etc.)
2. **Signal triggers automatically** → `create_booking_notifications` in `core/signals.py`
3. **In-app notification created** → User sees notification in the app
4. **Email sent via Brevo API** → User receives professional email
5. **User receives email** → Opens email with complete booking details and status

## Email Content by Status

### Approved ✅
- Subject: "ChurchConnect - Your Appointment Has Been Approved! ✅"
- Message: Congratulations, appointment confirmed
- Action: Mark calendar, arrive early, prepare documents

### Reviewed ⏳
- Subject: "ChurchConnect - Your Appointment is Being Reviewed"
- Message: Request is under review, will notify soon
- Action: Wait for church response

### Declined ❌
- Subject: "ChurchConnect - Appointment Update"
- Message: Unable to approve at this time
- Reason: Displays decline reason from church
- Action: Submit new request or contact church

### Completed ✓
- Subject: "ChurchConnect - Appointment Completed"
- Message: Thank you for attending
- Action: Leave a review, book again

### Canceled ✕
- Subject: "ChurchConnect - Appointment Canceled"
- Message: Appointment has been canceled
- Action: Reschedule if needed

## Technical Details

### Email Delivery
- Uses **Brevo API** for reliable email delivery
- Works on both local development and production (Render)
- Async error handling prevents blocking
- Logs all email send attempts

### Error Handling
- Try-catch blocks prevent signal failures
- Errors logged but don't break the booking update
- In-app notification still created even if email fails

### Template Variables
All templates receive:
- `user_name` - User's full name or username
- `church_name` - Name of the church
- `service_name` - Name of the service
- `booking_code` - Unique booking ID (e.g., APPT-0001)
- `booking_date` - Formatted date (e.g., "January 15, 2025")
- `booking_time` - Formatted time (e.g., "10:00 AM")
- `decline_reason` - (Declined only) Reason for decline

## Files Modified

1. `accounts/email_utils.py` - Added `send_booking_status_email()` function
2. `core/signals.py` - Updated to send emails on status change

## Files Created

1. `templates/emails/booking_approved.html`
2. `templates/emails/booking_reviewed.html`
3. `templates/emails/booking_declined.html`
4. `templates/emails/booking_completed.html`
5. `templates/emails/booking_canceled.html`

## Testing Checklist

- [ ] Test email sending when status changes to "Reviewed"
- [ ] Test email sending when status changes to "Approved"
- [ ] Test email sending when status changes to "Declined"
- [ ] Test email sending when status changes to "Completed"
- [ ] Test email sending when status changes to "Canceled"
- [ ] Verify emails arrive in inbox (check spam folder)
- [ ] Verify all booking details are correct in emails
- [ ] Test email rendering on desktop and mobile
- [ ] Verify decline reason appears in declined emails
- [ ] Check that in-app notifications still work

## Configuration Required

Ensure these environment variables are set:
- `BREVO_API_KEY` - Brevo API key for sending emails
- `DEFAULT_FROM_EMAIL` - Sender email address

## Notes

- Emails are sent asynchronously to avoid blocking the HTTP request
- If email fails, the booking status update still succeeds
- All email sends are logged for debugging
- Templates use inline CSS for maximum email client compatibility
- Color scheme matches ChurchConnect branding

## Suggestions & Recommendations

1. **Email Preferences** - Add user settings to opt-out of email notifications
2. **SMS Notifications** - Consider adding SMS for critical updates (approved/declined)
3. **Email Analytics** - Track email open rates and click-through rates
4. **Batch Emails** - For church owners, send daily digest of all bookings
5. **Reminder Emails** - Send reminder 24 hours before appointment
6. **Follow-up Emails** - Send review request 24 hours after completion
7. **Localization** - Add multi-language support for email templates
8. **Attachments** - Consider adding calendar invite (.ics) for approved bookings

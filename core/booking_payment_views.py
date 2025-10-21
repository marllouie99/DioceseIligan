"""
Booking payment views for PayPal and Stripe integration.
"""
import requests
import base64
import json
import logging
from decimal import Decimal
import stripe

from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.contrib.auth.decorators import login_required

from django.utils import timezone
from django.db import transaction

from .models import Booking, BookableService

logger = logging.getLogger(__name__)

# PayPal Configuration
PAYPAL_MODE = getattr(settings, 'PAYPAL_MODE', 'sandbox')
PAYPAL_CLIENT_ID = getattr(settings, 'PAYPAL_CLIENT_ID', '')
PAYPAL_CLIENT_SECRET = getattr(settings, 'PAYPAL_CLIENT_SECRET', '')
PAYPAL_BASE_URL = 'https://api-m.sandbox.paypal.com' if PAYPAL_MODE == 'sandbox' else 'https://api-m.paypal.com'
PAYPAL_CURRENCY = getattr(settings, 'PAYPAL_CURRENCY', 'PHP')

# Stripe Configuration
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')

# Site URL
SITE_URL = getattr(settings, 'ALLOWED_HOSTS', ['localhost'])[0]
if not SITE_URL.startswith('http'):
    SITE_URL = f'https://{SITE_URL}' if 'onrender.com' in SITE_URL else f'http://{SITE_URL}'


def get_paypal_access_token():
    """Get PayPal OAuth2 access token."""
    auth = base64.b64encode(f"{PAYPAL_CLIENT_ID}:{PAYPAL_CLIENT_SECRET}".encode()).decode()
    headers = {
        'Authorization': f'Basic {auth}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = {'grant_type': 'client_credentials'}
    
    try:
        response = requests.post(
            f"{PAYPAL_BASE_URL}/v1/oauth2/token",
            headers=headers,
            data=data,
            timeout=10
        )
        response.raise_for_status()
        return response.json()['access_token']
    except Exception as e:
        logger.error(f"Failed to get PayPal access token: {str(e)}")
        raise


@require_POST
@login_required
def create_booking_payment_order(request, booking_id):
    """Create a PayPal order for booking payment."""
    try:
        # Get booking
        booking = get_object_or_404(
            Booking.objects.select_related('service', 'church', 'user'),
            id=booking_id
        )
        
        # Verify user owns this booking
        if request.user != booking.user:
            return JsonResponse({
                'success': False,
                'message': 'You do not have permission to pay for this booking'
            }, status=403)
        
        # Verify booking is in requested status
        if booking.status != Booking.STATUS_REQUESTED:
            return JsonResponse({
                'success': False,
                'message': 'This booking has already been processed'
            }, status=400)
        
        # Verify church has PayPal configured
        if not booking.church.paypal_email:
            return JsonResponse({
                'success': False,
                'message': 'This church has not set up their payment method yet'
            }, status=400)
        
        # Get service price from the booking's service
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
        
        # Use the service price (can be overridden by POST parameter for custom amounts)
        amount = Decimal(request.POST.get('amount', str(booking.service.price)))
        
        # Validate amount matches service price (prevent tampering)
        if amount != booking.service.price:
            return JsonResponse({
                'success': False,
                'message': f'Payment amount must match service price of ₱{booking.service.price}'
            }, status=400)
        
        if amount < 10:
            return JsonResponse({
                'success': False,
                'message': 'Minimum payment amount is ₱10'
            }, status=400)
        
        # Get PayPal access token
        access_token = get_paypal_access_token()
        
        # Create PayPal order
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
        
        order_data = {
            'intent': 'CAPTURE',
            'purchase_units': [{
                'reference_id': f'BOOKING-{booking.code}',
                'description': f'Appointment: {booking.service.name} at {booking.church.name}',
                'amount': {
                    'currency_code': PAYPAL_CURRENCY,
                    'value': str(amount)
                },
                'payee': {
                    'email_address': booking.church.paypal_email
                }
            }],
            'application_context': {
                'brand_name': 'ChurchConnect',
                'landing_page': 'NO_PREFERENCE',
                'user_action': 'PAY_NOW',
                'return_url': f'{SITE_URL}/payment/booking/success/{booking_id}/',
                'cancel_url': f'{SITE_URL}/payment/booking/cancel/{booking_id}/'
            }
        }
        
        response = requests.post(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders",
            headers=headers,
            json=order_data,
            timeout=10
        )
        response.raise_for_status()
        order = response.json()
        
        return JsonResponse({
            'success': True,
            'order_id': order['id']
        })
        
    except Exception as e:
        logger.error(f"Error creating booking payment order: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'Failed to create payment order. Please try again.'
        }, status=500)


@require_POST
@login_required
def capture_booking_payment(request, booking_id):
    """Capture a PayPal payment for booking."""
    try:
        booking = get_object_or_404(
            Booking.objects.select_related('service', 'church', 'user'),
            id=booking_id
        )
        
        # Verify user owns this booking
        if request.user != booking.user:
            return JsonResponse({
                'success': False,
                'message': 'You do not have permission'
            }, status=403)
        
        order_id = request.POST.get('order_id')
        if not order_id:
            return JsonResponse({
                'success': False,
                'message': 'Order ID is required'
            }, status=400)
        
        # Get PayPal access token
        access_token = get_paypal_access_token()
        
        # Capture the order
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
        
        response = requests.post(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}/capture",
            headers=headers,
            timeout=10
        )
        response.raise_for_status()
        capture_data = response.json()
        
        # Get payment amount from capture data
        payment_amount = Decimal(capture_data['purchase_units'][0]['payments']['captures'][0]['amount']['value'])
        transaction_id = capture_data['purchase_units'][0]['payments']['captures'][0]['id']
        
        # Use atomic transaction to ensure data consistency
        with transaction.atomic():
            # Update booking payment status and details
            booking.payment_status = 'paid'
            booking.payment_method = 'paypal'
            booking.payment_amount = payment_amount
            booking.payment_transaction_id = transaction_id
            booking.payment_date = timezone.now()
            
            # Auto-approve when paid - skip reviewed status and go directly to approved
            booking.status = Booking.STATUS_APPROVED
            booking.save()
            
            # Auto-cancel conflicting bookings (same church, same date)
            conflicting_bookings = booking.conflicts_qs().filter(
                payment_status='pending'
            )
            
            cancelled_count = 0
            for conflict in conflicting_bookings:
                conflict.status = Booking.STATUS_CANCELED
                conflict.cancel_reason = f'Another booking was confirmed for {booking.church.name} on {booking.date}'
                conflict.save()
                cancelled_count += 1
            
            logger.info(f"Payment captured for booking {booking.code}. Cancelled {cancelled_count} conflicting bookings.")
        
        return JsonResponse({
            'success': True,
            'message': 'Payment successful! Your booking has been confirmed.',
            'capture_id': capture_data['id'],
            'cancelled_conflicts': cancelled_count
        })
        
    except Exception as e:
        logger.error(f"Error capturing booking payment: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'Failed to process payment. Please contact support.'
        }, status=500)


@require_POST
@login_required
def create_stripe_booking_payment(request, booking_id):
    """Create a Stripe Payment Intent for booking."""
    try:
        booking = get_object_or_404(
            Booking.objects.select_related('service', 'church', 'user'),
            id=booking_id
        )
        
        # Verify user owns this booking
        if request.user != booking.user:
            return JsonResponse({
                'success': False,
                'message': 'You do not have permission'
            }, status=403)
        
        # Verify booking status
        if booking.status != Booking.STATUS_REQUESTED:
            return JsonResponse({
                'success': False,
                'message': 'This booking has already been processed'
            }, status=400)
        
        # Get service price from the booking's service
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
        
        # Use the service price (can be overridden by POST parameter for custom amounts)
        amount = Decimal(request.POST.get('amount', str(booking.service.price)))
        
        # Validate amount matches service price (prevent tampering)
        if amount != booking.service.price:
            return JsonResponse({
                'success': False,
                'message': f'Payment amount must match service price of ₱{booking.service.price}'
            }, status=400)
        
        if amount < 10:
            return JsonResponse({
                'success': False,
                'message': 'Minimum payment amount is ₱10'
            }, status=400)
        
        # Convert to cents for Stripe
        amount_cents = int(amount * 100)
        
        # Create Payment Intent
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency='php',
            metadata={
                'booking_id': booking.id,
                'booking_code': booking.code,
                'service': booking.service.name,
                'church': booking.church.name,
                'user_email': booking.user.email
            },
            description=f'Appointment: {booking.service.name} at {booking.church.name}'
        )
        
        return JsonResponse({
            'success': True,
            'client_secret': intent.client_secret
        })
        
    except Exception as e:
        logger.error(f"Error creating Stripe payment intent: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'Failed to initialize payment. Please try again.'
        }, status=500)


@require_POST
@login_required
def confirm_stripe_booking_payment(request, booking_id):
    """Confirm Stripe payment and update booking status."""
    try:
        booking = get_object_or_404(
            Booking.objects.select_related('service', 'church', 'user'),
            id=booking_id
        )
        
        # Verify user owns this booking
        if request.user != booking.user:
            return JsonResponse({
                'success': False,
                'message': 'You do not have permission'
            }, status=403)
        
        payment_intent_id = request.POST.get('payment_intent_id')
        if not payment_intent_id:
            return JsonResponse({
                'success': False,
                'message': 'Payment Intent ID is required'
            }, status=400)
        
        # Retrieve the payment intent to verify it succeeded
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status == 'succeeded':
            # Get payment amount
            payment_amount = Decimal(intent.amount) / 100  # Convert from cents
            
            # Use atomic transaction to ensure data consistency
            with transaction.atomic():
                # Update booking payment status and details
                booking.payment_status = 'paid'
                booking.payment_method = 'stripe'
                booking.payment_amount = payment_amount
                booking.payment_transaction_id = payment_intent_id
                booking.payment_date = timezone.now()
                
                # Auto-approve when paid - skip reviewed status and go directly to approved
                booking.status = Booking.STATUS_APPROVED
                booking.save()
                
                # Auto-cancel conflicting bookings (same church, same date)
                conflicting_bookings = booking.conflicts_qs().filter(
                    payment_status='pending'
                )
                
                cancelled_count = 0
                for conflict in conflicting_bookings:
                    conflict.status = Booking.STATUS_CANCELED
                    conflict.cancel_reason = f'Another booking was confirmed for {booking.church.name} on {booking.date}'
                    conflict.save()
                    cancelled_count += 1
                
                logger.info(f"Payment confirmed for booking {booking.code}. Cancelled {cancelled_count} conflicting bookings.")
            
            return JsonResponse({
                'success': True,
                'message': 'Payment successful! Your booking has been confirmed.',
                'cancelled_conflicts': cancelled_count
            })
        else:
            return JsonResponse({
                'success': False,
                'message': f'Payment status: {intent.status}'
            }, status=400)
        
    except Exception as e:
        logger.error(f"Error confirming Stripe payment: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'Failed to confirm payment. Please contact support.'
        }, status=500)

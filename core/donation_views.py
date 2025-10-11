"""
Donation views for PayPal integration using Orders API v2.
"""
import requests
import base64
import json
import logging
from decimal import Decimal

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.db.models import Sum

from .models import Post, Donation

logger = logging.getLogger(__name__)

# PayPal Configuration
PAYPAL_MODE = getattr(settings, 'PAYPAL_MODE', 'sandbox')
PAYPAL_CLIENT_ID = getattr(settings, 'PAYPAL_CLIENT_ID', '')
PAYPAL_CLIENT_SECRET = getattr(settings, 'PAYPAL_CLIENT_SECRET', '')
PAYPAL_BASE_URL = 'https://api-m.sandbox.paypal.com' if PAYPAL_MODE == 'sandbox' else 'https://api-m.paypal.com'

PAYPAL_CURRENCY = getattr(settings, 'PAYPAL_CURRENCY', 'PHP')
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
def create_donation_order(request, post_id):
    """Create a PayPal order using Orders API v2."""
    if not request.user.is_authenticated:
        return JsonResponse({
            'success': False,
            'message': 'You must be logged in to make a donation'
        }, status=401)
    
    try:
        # Get post
        try:
            post = Post.objects.get(id=post_id, is_active=True, enable_donation=True)
        except Post.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Post not found or donations are not enabled'
            }, status=404)
        
        # Verify church has PayPal configured
        if not post.church.paypal_email:
            return JsonResponse({
                'success': False,
                'message': 'This church has not set up their payment method yet'
            }, status=400)
        
        # Get form data
        amount = Decimal(request.POST.get('amount', 0))
        message = request.POST.get('message', '').strip()
        is_anonymous = request.POST.get('is_anonymous', 'false').lower() in ['true', 'on', '1']
        
        # Validate amount
        if amount < 10:
            return JsonResponse({
                'success': False,
                'message': 'Minimum donation amount is ₱10'
            }, status=400)
        
        # Get PayPal access token
        access_token = get_paypal_access_token()
        
        # Create order payload
        order_payload = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "amount": {
                    "currency_code": PAYPAL_CURRENCY,
                    "value": str(amount)
                },
                "description": f"Donation to {post.church.name}",
                "payee": {
                    "email_address": post.church.paypal_email
                }
            }],
            "application_context": {
                "brand_name": "ChurchConnect",
                "shipping_preference": "NO_SHIPPING",
                "return_url": f"{SITE_URL}/app/donations/success/{post_id}/",
                "cancel_url": f"{SITE_URL}/app/post/{post_id}/"
            }
        }
        
        logger.info(f"Creating PayPal order for amount: {amount} {PAYPAL_CURRENCY}")
        
        # Create order via PayPal API
        response = requests.post(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders",
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}'
            },
            json=order_payload,
            timeout=10
        )
        
        response.raise_for_status()
        order_data = response.json()
        order_id = order_data['id']
        
        logger.info(f"PayPal order created successfully: {order_id}")
        
        # Create donation record with pending status
        donation = Donation.objects.create(
            post=post,
            donor=request.user,
            amount=amount,
            currency=PAYPAL_CURRENCY,
            message=message,
            is_anonymous=is_anonymous,
            payment_method='paypal',
            payment_status='pending',
            paypal_order_id=order_id
        )
        
        logger.info(f"Donation record created: {donation.id} for order {order_id}")
        
        return JsonResponse({
            'success': True,
            'order_id': order_id
        })
            
    except Decimal.InvalidOperation:
        return JsonResponse({
            'success': False,
            'message': 'Invalid amount specified'
        }, status=400)
    except requests.exceptions.RequestException as e:
        logger.error(f"PayPal API error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"PayPal response: {e.response.text}")
        return JsonResponse({
            'success': False,
            'message': 'Failed to create payment. Please try again.'
        }, status=500)
    except Exception as e:
        logger.error(f"Donation order creation error: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'An error occurred. Please try again.'
        }, status=500)


@require_POST
def capture_donation(request, post_id):
    """Capture PayPal order after user approval (Orders API v2)."""
    if not request.user.is_authenticated:
        return JsonResponse({
            'success': False,
            'message': 'You must be logged in'
        }, status=401)
    
    try:
        # Get post
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Post not found'
            }, status=404)
        
        # Get order ID from request
        order_id = request.POST.get('order_id')
        
        if not order_id:
            return JsonResponse({
                'success': False,
                'message': 'Order ID is required'
            }, status=400)
        
        logger.info(f"Capturing PayPal order: {order_id}")
        
        # Get access token
        access_token = get_paypal_access_token()
        
        # Capture the order
        response = requests.post(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}/capture",
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}'
            },
            timeout=10
        )
        
        response.raise_for_status()
        capture_data = response.json()
        
        logger.info(f"Order captured successfully: {order_id}")
        logger.info(f"Capture status: {capture_data.get('status')}")
        
        # Update donation record
        try:
            donation = Donation.objects.get(paypal_order_id=order_id)
            
            if capture_data.get('status') == 'COMPLETED':
                donation.payment_status = 'completed'
                donation.completed_at = timezone.now()
                
                # Extract payer info and transaction ID
                payer = capture_data.get('payer', {})
                donation.paypal_payer_email = payer.get('email_address', '')
                donation.paypal_payer_id = payer.get('payer_id', '')
                
                # Get capture/transaction ID
                purchase_units = capture_data.get('purchase_units', [])
                if purchase_units and purchase_units[0].get('payments', {}).get('captures'):
                    capture = purchase_units[0]['payments']['captures'][0]
                    donation.paypal_transaction_id = capture.get('id', '')
                
                donation.save()
                logger.info(f"Donation completed: {donation.id}")
                
                # Send email notification
                send_donation_notification_email(donation)
                
                return JsonResponse({
                    'success': True,
                    'donation_id': donation.id,
                    'redirect_url': f'/app/donations/success/{post.id}/'
                })
            else:
                logger.warning(f"Order status not completed: {capture_data.get('status')}")
                return JsonResponse({
                    'success': False,
                    'message': 'Payment was not completed'
                }, status=400)
                
        except Donation.DoesNotExist:
            logger.error(f"Donation not found for order: {order_id}")
            return JsonResponse({
                'success': False,
                'message': 'Donation record not found'
            }, status=404)
            
    except requests.exceptions.RequestException as e:
        logger.error(f"PayPal capture error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"PayPal response: {e.response.text}")
        return JsonResponse({
            'success': False,
            'message': 'Failed to capture payment'
        }, status=500)
    except Exception as e:
        logger.error(f"Donation capture error: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'An error occurred'
        }, status=500)


# Keep old execute_donation for backward compatibility (redirects)
@require_http_methods(["GET"])
def execute_donation(request, post_id):
    """Legacy redirect handler - should not be used with new SDK."""
    return render(request, 'donations/failed.html', {
        'message': 'This payment method is no longer supported. Please try again.',
        'post': None
    })


@require_POST
def cancel_donation(request, post_id):
    """Handle cancelled donation (AJAX endpoint)."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False}, status=401)
    
    try:
        order_id = request.POST.get('order_id')
        if order_id:
            try:
                donation = Donation.objects.get(paypal_order_id=order_id)
                if donation.payment_status == 'pending':
                    donation.payment_status = 'cancelled'
                    donation.save()
                    logger.info(f"Donation cancelled: {donation.id}")
            except Donation.DoesNotExist:
                logger.warning(f"Donation not found for order: {order_id}")
        
        return JsonResponse({'success': True})
    except Exception as e:
        logger.error(f"Cancel donation error: {str(e)}")
        return JsonResponse({'success': False}, status=500)


@require_http_methods(["GET"])
def donation_success(request, post_id):
    """Show donation success page."""
    try:
        post = Post.objects.get(id=post_id)
        # Get the latest completed donation for this user and post
        donation = Donation.objects.filter(
            post=post,
            donor=request.user,
            payment_status='completed'
        ).order_by('-completed_at').first()
        
        return render(request, 'donations/success.html', {
            'post': post,
            'donation': donation
        })
    except Post.DoesNotExist:
        return render(request, 'donations/failed.html', {
            'post': None,
            'message': 'Post not found'
        })


@require_http_methods(["GET"])
def donation_failed(request, post_id):
    """Show donation failed page."""
    try:
        post = Post.objects.get(id=post_id)
        return render(request, 'donations/failed.html', {
            'post': post,
            'message': request.GET.get('message', 'An error occurred while processing your donation')
        })
    except Post.DoesNotExist:
        return render(request, 'donations/failed.html', {
            'post': None,
            'message': 'Post not found'
        })


@require_http_methods(["GET"])
def donation_cancelled(request, post_id):
    """Show donation cancelled page."""
    try:
        post = Post.objects.get(id=post_id)
        return render(request, 'donations/cancelled.html', {
            'post': post
        })
    except Post.DoesNotExist:
        return render(request, 'donations/cancelled.html', {
            'post': None
        })


def send_donation_notification_email(donation):
    """Send email notification to church owner about new donation."""
    try:
        church = donation.post.church
        owner_email = church.owner.email
        
        if not owner_email:
            logger.warning(f"No email for church owner: {church.owner.username}")
            return
        
        donor_name = donation.get_donor_name()
        
        subject = f"New Donation Received - {church.name}"
        
        # Render email template
        html_message = render_to_string('emails/donation_received.html', {
            'church': church,
            'donation': donation,
            'donor_name': donor_name,
            'post': donation.post,
        })
        
        # Plain text version
        plain_message = f"""
        New Donation Received!
        
        Church: {church.name}
        Amount: ₱{donation.amount}
        Donor: {donor_name}
        
        {"Message: " + donation.message if donation.message else ""}
        
        View donation details: {SITE_URL}/admin/core/donation/{donation.id}/change/
        
        Thank you for using ChurchConnect!
        """
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[owner_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Donation notification email sent to {owner_email}")
        
    except Exception as e:
        logger.error(f"Failed to send donation notification email: {str(e)}")


@csrf_exempt
@require_POST
def paypal_webhook(request):
    """Handle PayPal webhook notifications."""
    try:
        # Get webhook data
        event_body = json.loads(request.body)
        event_type = event_body.get('event_type')
        
        logger.info(f"PayPal webhook received: {event_type}")
        
        if event_type == 'PAYMENT.SALE.COMPLETED':
            # Handle successful payment
            resource = event_body.get('resource', {})
            parent_payment = resource.get('parent_payment')
            
            if parent_payment:
                try:
                    donation = Donation.objects.get(paypal_order_id=parent_payment)
                    if donation.payment_status != 'completed':
                        donation.mark_as_completed()
                        send_donation_notification_email(donation)
                        logger.info(f"Donation completed via webhook: {donation.id}")
                except Donation.DoesNotExist:
                    logger.warning(f"Donation not found for payment: {parent_payment}")
        
        elif event_type == 'PAYMENT.SALE.REFUNDED':
            # Handle refund
            resource = event_body.get('resource', {})
            sale_id = resource.get('sale_id')
            
            if sale_id:
                try:
                    donation = Donation.objects.get(paypal_transaction_id=sale_id)
                    donation.payment_status = 'refunded'
                    donation.save()
                    logger.info(f"Donation refunded: {donation.id}")
                except Donation.DoesNotExist:
                    logger.warning(f"Donation not found for sale: {sale_id}")
        
        return JsonResponse({'status': 'success'})
        
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

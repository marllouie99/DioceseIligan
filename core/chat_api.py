"""
Chat API Views
Handles real-time messaging between users and churches
"""

from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Q, Count, Max
from .models import Conversation, Message, Church
import json


@login_required
@require_http_methods(["GET", "POST"])
def conversations_api(request):
    """
    GET: List all conversations for the current user
    POST: Create a new conversation with a church
    """
    if request.method == 'GET':
        # Get user's conversations with optimized queries
        # Include conversations where user is the sender OR where user owns/manages the church
        from django.db.models import Q
        from .models import ChurchStaff
        
        # Get churches owned by this user (churches may have null owners)
        user_churches = list(Church.objects.filter(owner=request.user).values_list('id', flat=True))
        
        # Get churches where user is staff with messaging permissions
        staff_churches = list(ChurchStaff.objects.filter(
            user=request.user,
            status=ChurchStaff.STATUS_ACTIVE,
            role=ChurchStaff.ROLE_SECRETARY  # Secretaries have messaging permission
        ).values_list('church_id', flat=True))
        
        # Combine owned and managed churches
        managed_churches = list(set(user_churches) | set(staff_churches))
        
        # Get conversations where:
        # 1. User is the conversation participant (user-to-church)
        # 2. OR user owns/manages the church (seeing incoming messages)
        conversations = Conversation.objects.filter(
            Q(user=request.user) | Q(church_id__in=managed_churches)
        ).select_related('church', 'user').prefetch_related('messages').annotate(
            last_message_time=Max('messages__created_at')
        ).order_by('-updated_at')
        
        data = []
        for conv in conversations:
            last_message = conv.get_last_message()
            unread_count = conv.get_unread_count(request.user)
            
            # Determine if current user is managing the church (owner or staff)
            is_church_manager = conv.church.id in managed_churches
            
            if is_church_manager:
                # Church manager (owner/staff) sees the user who sent the message
                display_name = conv.user.username
                try:
                    if conv.user.get_full_name():
                        display_name = conv.user.get_full_name()
                    if hasattr(conv.user, 'profile') and conv.user.profile:
                        if conv.user.profile.display_name:
                            display_name = conv.user.profile.display_name
                except Exception:
                    pass
                
                # Get user avatar
                avatar = None
                try:
                    if hasattr(conv.user, 'profile'):
                        profile = getattr(conv.user, 'profile', None)
                        if profile and hasattr(profile, 'profile_image') and profile.profile_image:
                            avatar = profile.profile_image.url
                except Exception as e:
                    # Log the error for debugging
                    print(f"Error getting user avatar: {e}")
                    avatar = None
                
                # Get church logo for badge
                managed_church_logo = None
                try:
                    if conv.church.logo:
                        managed_church_logo = conv.church.logo.url
                except Exception:
                    managed_church_logo = None
                
                data.append({
                    'id': conv.id,
                    'church_id': conv.church.id,
                    'church_name': display_name,  # Show user name instead
                    'church_avatar': avatar,  # Show user avatar instead
                    'managed_church_name': conv.church.name,  # Church context
                    'managed_church_logo': managed_church_logo,  # Church logo for badge
                    'last_message': last_message.content if last_message else None,
                    'last_message_time': last_message.created_at.isoformat() if last_message else conv.created_at.isoformat(),
                    'unread_count': unread_count,
                    'is_church_owner': True,
                    'other_user_id': conv.user.id
                })
            else:
                # Regular user sees the church
                church_avatar = None
                if conv.church.logo:
                    try:
                        church_avatar = conv.church.logo.url
                    except:
                        church_avatar = None
                
                data.append({
                    'id': conv.id,
                    'church_id': conv.church.id,
                    'church_name': conv.church.name,
                    'church_avatar': church_avatar,
                    'last_message': last_message.content if last_message else None,
                    'last_message_time': last_message.created_at.isoformat() if last_message else conv.created_at.isoformat(),
                    'unread_count': unread_count,
                    'is_church_owner': False
                })
        
        return JsonResponse({'conversations': data})
    
    elif request.method == 'POST':
        # Create new conversation
        try:
            data = json.loads(request.body)
            church_id = data.get('church_id')
            
            if not church_id:
                return JsonResponse({'error': 'Church ID is required'}, status=400)
            
            try:
                church = Church.objects.get(id=church_id)
            except Church.DoesNotExist:
                return JsonResponse({'error': 'Church not found'}, status=404)
            
            # Get or create conversation
            conversation, created = Conversation.objects.get_or_create(
                user=request.user,
                church=church
            )
            
            # Get church avatar URL
            church_avatar = None
            if church.logo:
                try:
                    church_avatar = church.logo.url
                except:
                    church_avatar = None
            
            return JsonResponse({
                'conversation': {
                    'id': conversation.id,
                    'church_id': church.id,
                    'church_name': church.name,
                    'church_avatar': church_avatar,
                    'last_message': None,
                    'last_message_time': conversation.created_at.isoformat(),
                    'unread_count': 0
                }
            }, status=201 if created else 200)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["GET", "POST"])
def conversation_messages_api(request, conversation_id):
    """
    GET: Get all messages for a conversation
    POST: Send a new message in a conversation
    """
    # Verify user has access to this conversation
    # User can access if they are the conversation participant OR church owner/manager
    try:
        from django.db.models import Q
        from .models import ChurchStaff
        
        # Get churches user owns or manages with messaging permission
        user_churches = Church.objects.filter(owner=request.user).values_list('id', flat=True)
        staff_churches = ChurchStaff.objects.filter(
            user=request.user,
            status=ChurchStaff.STATUS_ACTIVE,
            role=ChurchStaff.ROLE_SECRETARY
        ).values_list('church_id', flat=True)
        managed_churches = set(user_churches) | set(staff_churches)
        
        conversation = Conversation.objects.select_related('church', 'user').get(
            Q(id=conversation_id) & (Q(user=request.user) | Q(church_id__in=managed_churches))
        )
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Conversation not found'}, status=404)
    
    if request.method == 'GET':
        # Get all messages in the conversation
        messages = conversation.messages.select_related('sender').all()
        
        # Import donation rank utility
        from accounts.donation_utils import get_user_donation_rank
        
        data = []
        for msg in messages:
            # Determine if sender is managing the church (owner or staff)
            # Check if the message sender is the church owner
            is_owner = conversation.church.owner and msg.sender == conversation.church.owner
            
            # Check if the message sender is a staff member with access to this church
            is_staff = ChurchStaff.objects.filter(
                user=msg.sender,
                church=conversation.church,
                status=ChurchStaff.STATUS_ACTIVE,
                role=ChurchStaff.ROLE_SECRETARY
            ).exists() if not is_owner else False
            
            is_church_manager = is_owner or is_staff
            
            # Get sender avatar
            avatar = None
            if is_church_manager:
                # Use church logo for church manager messages
                try:
                    if conversation.church.logo:
                        avatar = request.build_absolute_uri(conversation.church.logo.url)
                except Exception as e:
                    print(f"Error getting church logo: {e}")
                    avatar = None
            else:
                # Use user profile avatar
                try:
                    if hasattr(msg.sender, 'profile') and msg.sender.profile:
                        profile = msg.sender.profile
                        if profile.profile_image:
                            avatar = request.build_absolute_uri(profile.profile_image.url)
                except Exception as e:
                    print(f"Error getting message sender avatar: {e}")
                    avatar = None
            
            # Get sender name
            sender_name = msg.sender.username
            if is_church_manager:
                # Use church name for church manager
                sender_name = conversation.church.name
            else:
                # Use user's display name
                try:
                    if msg.sender.get_full_name():
                        sender_name = msg.sender.get_full_name()
                    if hasattr(msg.sender, 'profile') and msg.sender.profile:
                        if msg.sender.profile.display_name:
                            sender_name = msg.sender.profile.display_name
                except Exception:
                    pass
            
            # Get donation rank (only for regular users, not church managers)
            donation_rank = None
            if not is_church_manager:
                donation_rank = get_user_donation_rank(msg.sender)
            
            # Prepare attachment data
            attachment_data = None
            if msg.attachment:
                try:
                    attachment_data = {
                        'url': msg.attachment.url,
                        'name': msg.attachment_name,
                        'size': msg.attachment_size,
                        'type': msg.attachment_type
                    }
                except:
                    pass
            
            data.append({
                'id': msg.id,
                'content': msg.content,
                'created_at': msg.created_at.isoformat(),
                'is_sent_by_user': msg.sender == request.user,
                'sender_name': sender_name,
                'avatar': avatar,
                'is_read': msg.is_read,
                'read_at': msg.read_at.isoformat() if msg.read_at else None,
                'attachment': attachment_data,
                'donation_rank': donation_rank
            })
        
        return JsonResponse({'messages': data})
    
    elif request.method == 'POST':
        # Send a new message (with optional file attachment)
        try:
            # Check if this is a file upload (multipart/form-data)
            if request.FILES.get('attachment'):
                content = request.POST.get('content', '').strip()
                attachment = request.FILES['attachment']
                
                # Validate file size (max 10MB)
                if attachment.size > 10 * 1024 * 1024:
                    return JsonResponse({'error': 'File size must be less than 10MB'}, status=400)
                
                # Validate content length if provided
                if content and len(content) > 1000:
                    return JsonResponse({'error': 'Message is too long (max 1000 characters)'}, status=400)
                
                # Create message with attachment
                message = Message.objects.create(
                    conversation=conversation,
                    sender=request.user,
                    content=content,
                    attachment=attachment
                )
            else:
                # Regular text message (JSON)
                data = json.loads(request.body)
                content = data.get('content', '').strip()
                
                if not content:
                    return JsonResponse({'error': 'Message content cannot be empty'}, status=400)
                
                if len(content) > 1000:
                    return JsonResponse({'error': 'Message is too long (max 1000 characters)'}, status=400)
                
                # Create the message
                message = Message.objects.create(
                    conversation=conversation,
                    sender=request.user,
                    content=content
                )
            
            # Update conversation timestamp
            conversation.updated_at = message.created_at
            conversation.save(update_fields=['updated_at'])
            
            # Get sender avatar
            avatar = None
            try:
                if hasattr(request.user, 'profile') and request.user.profile:
                    if hasattr(request.user.profile, 'profile_image') and request.user.profile.profile_image:
                        avatar = request.user.profile.profile_image.url
            except Exception:
                avatar = None
            
            # Get sender name
            sender_name = request.user.username
            try:
                if request.user.get_full_name():
                    sender_name = request.user.get_full_name()
                if hasattr(request.user, 'profile') and request.user.profile:
                    if request.user.profile.display_name:
                        sender_name = request.user.profile.display_name
            except Exception:
                pass
            
            # Prepare attachment data
            attachment_data = None
            if message.attachment:
                try:
                    attachment_data = {
                        'url': message.attachment.url,
                        'name': message.attachment_name,
                        'size': message.attachment_size,
                        'type': message.attachment_type
                    }
                except:
                    pass
            
            return JsonResponse({
                'message': {
                    'id': message.id,
                    'content': message.content,
                    'created_at': message.created_at.isoformat(),
                    'is_sent_by_user': True,
                    'sender_name': sender_name,
                    'avatar': avatar,
                    'is_read': False,
                    'read_at': None,
                    'attachment': attachment_data
                }
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def mark_conversation_read(request, conversation_id):
    """Mark all messages in a conversation as read"""
    try:
        from django.db.models import Q
        from .models import ChurchStaff
        
        # Get churches user owns or manages with messaging permission
        user_churches = Church.objects.filter(owner=request.user).values_list('id', flat=True)
        staff_churches = ChurchStaff.objects.filter(
            user=request.user,
            status=ChurchStaff.STATUS_ACTIVE,
            role=ChurchStaff.ROLE_SECRETARY
        ).values_list('church_id', flat=True)
        managed_churches = set(user_churches) | set(staff_churches)
        
        conversation = Conversation.objects.get(
            Q(id=conversation_id) & (Q(user=request.user) | Q(church_id__in=managed_churches))
        )
        
        # Mark all unread messages (not sent by user) as read with timestamp
        from django.utils import timezone
        
        unread_messages = conversation.messages.filter(
            is_read=False
        ).exclude(sender=request.user)
        
        count = unread_messages.update(is_read=True, read_at=timezone.now())
        
        return JsonResponse({
            'success': True,
            'marked_read': count
        })
        
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Conversation not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def conversation_typing(request, conversation_id):
    """
    Handle typing indicator - stores typing status in cache
    """
    try:
        from django.core.cache import cache
        from django.db.models import Q
        from .models import ChurchStaff
        
        # Get conversation and check if user has access
        conversation = Conversation.objects.get(id=conversation_id)
        
        # Check if user is conversation user OR manages the church
        is_conversation_user = conversation.user == request.user
        is_church_owner = conversation.church.owner == request.user if conversation.church.owner else False
        is_church_staff = ChurchStaff.objects.filter(
            user=request.user,
            church=conversation.church,
            status=ChurchStaff.STATUS_ACTIVE,
            role=ChurchStaff.ROLE_SECRETARY
        ).exists()
        
        if not (is_conversation_user or is_church_owner or is_church_staff):
            return JsonResponse({'error': 'Permission denied'}, status=403)
        
        data = json.loads(request.body)
        is_typing = data.get('is_typing', False)
        
        # Store typing status in cache with 5 second expiry
        cache_key = f'typing_{conversation_id}_{request.user.id}'
        
        if is_typing:
            # Store user info for typing indicator
            try:
                avatar_url = None
                if hasattr(request.user, 'profile') and request.user.profile and request.user.profile.avatar:
                    avatar_url = request.user.profile.avatar.url
            except:
                avatar_url = None
            
            cache.set(cache_key, {
                'user_id': request.user.id,
                'username': request.user.username,
                'display_name': request.user.get_full_name() or request.user.username,
                'avatar': avatar_url,
            }, timeout=5)  # Auto-expire after 5 seconds
        else:
            # Clear typing status
            cache.delete(cache_key)
        
        return JsonResponse({
            'success': True,
            'is_typing': is_typing
        })
        
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Conversation not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
def conversation_typing_status(request, conversation_id):
    """
    Get typing status for a conversation - who is currently typing
    """
    try:
        from django.core.cache import cache
        from django.db.models import Q
        from .models import ChurchStaff
        
        # Get conversation and check if user has access
        conversation = Conversation.objects.get(id=conversation_id)
        
        # Check if user is conversation user OR manages the church
        is_conversation_user = conversation.user == request.user
        is_church_owner = conversation.church.owner == request.user if conversation.church.owner else False
        is_church_staff = ChurchStaff.objects.filter(
            user=request.user,
            church=conversation.church,
            status=ChurchStaff.STATUS_ACTIVE,
            role=ChurchStaff.ROLE_SECRETARY
        ).exists()
        
        if not (is_conversation_user or is_church_owner or is_church_staff):
            return JsonResponse({'error': 'Permission denied'}, status=403)
        
        # Get all possible typers in this conversation (everyone except current user)
        typers = []
        
        # Check if conversation user is typing (if current user is church manager)
        if is_church_owner or is_church_staff:
            cache_key = f'typing_{conversation_id}_{conversation.user.id}'
            typing_info = cache.get(cache_key)
            if typing_info:
                typers.append(typing_info)
        
        # Check if church owner/managers are typing (if current user is the conversation user)
        if request.user == conversation.user:
            # Check church owner
            if conversation.church.owner:
                cache_key = f'typing_{conversation_id}_{conversation.church.owner.id}'
                typing_info = cache.get(cache_key)
                if typing_info:
                    typers.append(typing_info)
            
            # Check church staff with messaging permission
            staff_members = ChurchStaff.objects.filter(
                church=conversation.church,
                status=ChurchStaff.STATUS_ACTIVE,
                role=ChurchStaff.ROLE_SECRETARY
            ).values_list('user_id', flat=True)
            
            for staff_user_id in staff_members:
                cache_key = f'typing_{conversation_id}_{staff_user_id}'
                typing_info = cache.get(cache_key)
                if typing_info:
                    typers.append(typing_info)
        
        return JsonResponse({
            'is_typing': len(typers) > 0,
            'typers': typers
        })
        
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Conversation not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

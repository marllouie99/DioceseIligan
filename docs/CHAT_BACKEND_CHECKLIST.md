# 📋 Chat Widget Backend Implementation Checklist

Use this checklist to implement the backend for the chat widget.

## Phase 1: Database Models ⏳

### Step 1.1: Create Conversation Model
- [ ] Open `core/models.py` (or create `chat/models.py`)
- [ ] Add Conversation model with fields:
  - [ ] `user` (ForeignKey to User)
  - [ ] `church` (ForeignKey to Church)
  - [ ] `created_at` (DateTimeField)
  - [ ] `updated_at` (DateTimeField)
  - [ ] `unique_together` constraint on (user, church)
- [ ] Add `__str__` method
- [ ] Add `get_unread_count` method
- [ ] Add `get_last_message` method

### Step 1.2: Create Message Model
- [ ] Add Message model with fields:
  - [ ] `conversation` (ForeignKey to Conversation)
  - [ ] `sender` (ForeignKey to User)
  - [ ] `content` (TextField, max_length=1000)
  - [ ] `is_read` (BooleanField, default=False)
  - [ ] `created_at` (DateTimeField)
- [ ] Add `__str__` method
- [ ] Add Meta ordering by created_at
- [ ] Add `mark_as_read` method

### Step 1.3: Run Migrations
- [ ] Run `python manage.py makemigrations`
- [ ] Review migration file
- [ ] Run `python manage.py migrate`
- [ ] Verify tables created in database

## Phase 2: Serializers 📦

### Step 2.1: Create Message Serializer
- [ ] Create `chat/serializers.py` (or add to existing)
- [ ] Import serializers from rest_framework
- [ ] Create MessageSerializer with fields:
  - [ ] id, content, created_at, is_read
  - [ ] sender_name (SerializerMethodField)
  - [ ] avatar (SerializerMethodField)
  - [ ] is_sent_by_user (SerializerMethodField)
- [ ] Implement get_sender_name method
- [ ] Implement get_avatar method
- [ ] Implement get_is_sent_by_user method

### Step 2.2: Create Conversation Serializer
- [ ] Create ConversationSerializer with fields:
  - [ ] id, church_id, church_name, church_avatar
  - [ ] last_message (SerializerMethodField)
  - [ ] last_message_time (SerializerMethodField)
  - [ ] unread_count (SerializerMethodField)
- [ ] Implement get_church_name method
- [ ] Implement get_church_avatar method
- [ ] Implement get_last_message method
- [ ] Implement get_last_message_time method
- [ ] Implement get_unread_count method

## Phase 3: API Views 🔧

### Step 3.1: Conversations List/Create View
- [ ] Create `chat/views.py` (or add to existing)
- [ ] Import necessary modules
- [ ] Create `conversations_api` view
- [ ] Add `@api_view(['GET', 'POST'])` decorator
- [ ] Add `@login_required` decorator
- [ ] Implement GET logic:
  - [ ] Query user's conversations
  - [ ] Order by updated_at descending
  - [ ] Serialize data
  - [ ] Return JSON response
- [ ] Implement POST logic:
  - [ ] Get church_id from request
  - [ ] Check if conversation exists
  - [ ] Create new conversation if not exists
  - [ ] Serialize and return conversation

### Step 3.2: Messages List/Create View
- [ ] Create `conversation_messages_api` view
- [ ] Add `@api_view(['GET', 'POST'])` decorator
- [ ] Add `@login_required` decorator
- [ ] Implement GET logic:
  - [ ] Get conversation by ID
  - [ ] Check user has access
  - [ ] Query messages
  - [ ] Serialize data
  - [ ] Return JSON response
- [ ] Implement POST logic:
  - [ ] Get conversation by ID
  - [ ] Validate user has access
  - [ ] Get content from request
  - [ ] Validate content (not empty, max length)
  - [ ] Create message
  - [ ] Update conversation updated_at
  - [ ] Serialize and return message

### Step 3.3: Mark as Read View
- [ ] Create `mark_conversation_read` view
- [ ] Add `@api_view(['POST'])` decorator
- [ ] Add `@login_required` decorator
- [ ] Get conversation by ID
- [ ] Check user has access
- [ ] Mark all unread messages as read
- [ ] Return success response

### Step 3.4: Typing Indicator View (Optional)
- [ ] Create `conversation_typing` view
- [ ] Add `@api_view(['POST'])` decorator
- [ ] Add `@login_required` decorator
- [ ] Get is_typing from request
- [ ] Store typing status (cache or database)
- [ ] Return success response

## Phase 4: URL Configuration 🔗

### Step 4.1: Create Chat URLs
- [ ] Create `chat/urls.py` (or add to existing)
- [ ] Import views
- [ ] Add URL patterns:
  ```python
  path('api/conversations/', views.conversations_api),
  path('api/conversations/<int:conversation_id>/messages/', views.conversation_messages_api),
  path('api/conversations/<int:conversation_id>/read/', views.mark_conversation_read),
  path('api/conversations/<int:conversation_id>/typing/', views.conversation_typing),
  ```

### Step 4.2: Include in Main URLs
- [ ] Open main `urls.py`
- [ ] Include chat URLs
- [ ] Test URL routing

## Phase 5: Permissions & Security 🔒

### Step 5.1: Add Permission Checks
- [ ] Verify user owns conversation before accessing
- [ ] Verify user can message church
- [ ] Add rate limiting for message sending
- [ ] Validate message content length

### Step 5.2: Add Input Validation
- [ ] Sanitize message content
- [ ] Check for spam patterns
- [ ] Validate church exists
- [ ] Validate conversation exists

### Step 5.3: Add CSRF Protection
- [ ] Verify CSRF token in views
- [ ] Add CSRF exemption if needed for API
- [ ] Test with frontend

## Phase 6: Testing 🧪

### Step 6.1: Unit Tests
- [ ] Test Conversation model creation
- [ ] Test Message model creation
- [ ] Test get_unread_count method
- [ ] Test get_last_message method
- [ ] Test mark_as_read method

### Step 6.2: API Tests
- [ ] Test GET /api/conversations/
- [ ] Test POST /api/conversations/
- [ ] Test GET /api/conversations/{id}/messages/
- [ ] Test POST /api/conversations/{id}/messages/
- [ ] Test POST /api/conversations/{id}/read/
- [ ] Test unauthorized access
- [ ] Test invalid data

### Step 6.3: Integration Tests
- [ ] Test full conversation flow
- [ ] Test message sending
- [ ] Test unread count updates
- [ ] Test with frontend

## Phase 7: Admin Interface 👨‍💼

### Step 7.1: Register Models
- [ ] Open `chat/admin.py`
- [ ] Register Conversation model
- [ ] Register Message model
- [ ] Add list_display fields
- [ ] Add search_fields
- [ ] Add list_filter

### Step 7.2: Customize Admin
- [ ] Add inline messages in conversation admin
- [ ] Add custom actions (mark as read, delete)
- [ ] Add date hierarchy
- [ ] Add readonly fields

## Phase 8: Optimization 🚀

### Step 8.1: Database Optimization
- [ ] Add database indexes:
  - [ ] Conversation: (user, church)
  - [ ] Message: (conversation, created_at)
  - [ ] Message: (is_read)
- [ ] Add select_related for queries
- [ ] Add prefetch_related for related objects

### Step 8.2: Query Optimization
- [ ] Use annotate for counts
- [ ] Use aggregate for statistics
- [ ] Implement pagination for messages
- [ ] Cache conversation list

### Step 8.3: Performance Testing
- [ ] Test with 100+ conversations
- [ ] Test with 1000+ messages
- [ ] Measure API response times
- [ ] Optimize slow queries

## Phase 9: Notifications 🔔

### Step 9.1: Email Notifications
- [ ] Send email when new message received
- [ ] Add email template
- [ ] Add user preference for email notifications
- [ ] Test email sending

### Step 9.2: In-App Notifications
- [ ] Create notification when new message
- [ ] Update topbar notification count
- [ ] Link notification to chat widget
- [ ] Test notification flow

### Step 9.3: Push Notifications (Optional)
- [ ] Set up push notification service
- [ ] Add service worker
- [ ] Request notification permission
- [ ] Send push on new message

## Phase 10: Advanced Features 🎯

### Step 10.1: WebSocket Support (Recommended)
- [ ] Install Django Channels
- [ ] Create WebSocket consumer
- [ ] Add routing configuration
- [ ] Update frontend to use WebSocket
- [ ] Test real-time updates

### Step 10.2: File Attachments (Optional)
- [ ] Add image field to Message model
- [ ] Add file upload endpoint
- [ ] Validate file types and sizes
- [ ] Update frontend to support files

### Step 10.3: Message Search (Optional)
- [ ] Add search endpoint
- [ ] Implement full-text search
- [ ] Add search UI in frontend
- [ ] Test search functionality

## Verification Checklist ✅

### Before Going Live:
- [ ] All models created and migrated
- [ ] All API endpoints working
- [ ] All tests passing
- [ ] Security checks completed
- [ ] Performance optimized
- [ ] Admin interface configured
- [ ] Documentation updated
- [ ] Frontend integration tested
- [ ] Mobile responsiveness verified
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Monitoring set up

## Estimated Time

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Models | 1-2 hours |
| Phase 2: Serializers | 1 hour |
| Phase 3: Views | 2-3 hours |
| Phase 4: URLs | 30 minutes |
| Phase 5: Security | 1 hour |
| Phase 6: Testing | 2-3 hours |
| Phase 7: Admin | 1 hour |
| Phase 8: Optimization | 1-2 hours |
| Phase 9: Notifications | 2-3 hours |
| Phase 10: Advanced | 4-8 hours |
| **Total** | **16-26 hours** |

## Quick Start (Minimum Viable Product)

For a basic working version, focus on:
1. ✅ Phase 1: Database Models (required)
2. ✅ Phase 2: Serializers (required)
3. ✅ Phase 3: API Views (required)
4. ✅ Phase 4: URL Configuration (required)
5. ✅ Phase 5: Basic Security (required)

**MVP Time: 6-8 hours**

## Resources

- Django REST Framework Docs: https://www.django-rest-framework.org/
- Django Channels Docs: https://channels.readthedocs.io/
- Frontend Implementation: See `CHAT_WIDGET_IMPLEMENTATION.md`
- Quick Start Guide: See `CHAT_WIDGET_QUICK_START.md`

---

**Good luck with the implementation! 🚀**

Check off items as you complete them. Feel free to adjust the order based on your priorities.

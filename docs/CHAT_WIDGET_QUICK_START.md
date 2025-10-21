# Chat Widget Quick Start Guide

## 🎯 What Was Implemented

A **floating chat widget** positioned in the **bottom-right corner** of the screen that allows users to message churches in real-time.

## 📁 Files Created

1. **`templates/partials/chat_widget.html`** - Widget HTML structure
2. **`static/css/components/chat-widget.css`** - Widget styling (warm sacred earth theme)
3. **`static/js/components/chat-widget.js`** - Widget functionality and API integration
4. **`CHAT_WIDGET_IMPLEMENTATION.md`** - Full documentation

## 📝 Files Modified

1. **`templates/layouts/app_base.html`** - Added widget include and scripts
2. **`static/js/core/church_detail.js`** - Added message button handler

## 🚀 Next Steps to Make It Work

### Step 1: Create Backend API Endpoints

You need to implement these Django API endpoints:

```python
# In your views.py or api.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.decorators import login_required

@api_view(['GET', 'POST'])
@login_required
def conversations_api(request):
    """Get all conversations or create a new one"""
    if request.method == 'GET':
        # Return user's conversations
        conversations = []  # TODO: Query from database
        return Response({'conversations': conversations})
    
    elif request.method == 'POST':
        # Create new conversation
        church_id = request.data.get('church_id')
        # TODO: Create conversation in database
        return Response({'conversation': {}})

@api_view(['GET', 'POST'])
@login_required
def conversation_messages_api(request, conversation_id):
    """Get messages or send a new message"""
    if request.method == 'GET':
        # Return messages for this conversation
        messages = []  # TODO: Query from database
        return Response({'messages': messages})
    
    elif request.method == 'POST':
        # Send new message
        content = request.data.get('content')
        # TODO: Save message to database
        return Response({'message': {}})

@api_view(['POST'])
@login_required
def mark_conversation_read(request, conversation_id):
    """Mark all messages in conversation as read"""
    # TODO: Update unread status in database
    return Response({'success': True})
```

### Step 2: Add URL Routes

```python
# In your urls.py

from django.urls import path
from . import views

urlpatterns = [
    # ... existing urls ...
    
    # Chat API endpoints
    path('api/conversations/', views.conversations_api, name='conversations_api'),
    path('api/conversations/<int:conversation_id>/messages/', views.conversation_messages_api, name='conversation_messages_api'),
    path('api/conversations/<int:conversation_id>/read/', views.mark_conversation_read, name='mark_conversation_read'),
]
```

### Step 3: Create Database Models (if not exists)

```python
# In your models.py

from django.db import models
from django.contrib.auth.models import User

class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    church = models.ForeignKey('Church', on_delete=models.CASCADE, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'church']

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(max_length=1000)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
```

### Step 4: Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 5: Test the Widget

1. Start your development server
2. Log in as a user
3. Navigate to a church detail page
4. Click the "Message" button
5. The chat widget should open!

## 🎨 UI/UX Flow

```
User Journey:
1. User clicks "Message" button on church page
   ↓
2. Floating chat widget opens in bottom-right
   ↓
3. User types and sends message
   ↓
4. User can minimize widget and continue browsing
   ↓
5. New messages show unread badge on floating button
   ↓
6. User clicks floating button to reopen chat
```

## 🔧 Quick Customization

### Change Widget Colors

Edit `static/css/components/chat-widget.css`:

```css
/* Line 18-20: Change primary gradient */
.chat-widget-toggle {
  background: linear-gradient(135deg, #YOUR_COLOR 0%, #YOUR_DARKER_COLOR 100%);
}
```

### Change Widget Position

```css
/* Line 12-14 */
.chat-widget {
  bottom: 20px;  /* Change this */
  right: 20px;   /* Change this */
}
```

### Change Widget Size

```css
/* Line 56-58 */
.chat-widget-window {
  width: 380px;  /* Change this */
  height: 600px; /* Change this */
}
```

## 📱 Mobile Behavior

- **Desktop/Tablet**: Floating widget (380x600px)
- **Mobile (<480px)**: Full-screen overlay

## 🐛 Troubleshooting

### Widget Not Showing?
- Check if user is logged in (widget only shows for authenticated users)
- Check browser console for JavaScript errors
- Verify CSS file is loaded

### Message Button Not Working?
- Open browser console and check for errors
- Verify `window.chatWidget` exists: Type `window.chatWidget` in console
- Check if church ID is set on the button

### API Errors?
- Check Django logs for backend errors
- Verify CSRF token is being sent
- Ensure API endpoints are implemented

## 📊 Current Status

✅ **Frontend Complete**
- Widget UI/UX
- Responsive design
- Message button integration
- Theme integration

⏳ **Backend Required**
- API endpoints
- Database models
- Message storage
- Real-time updates (optional)

## 🎯 Recommended Next Features

1. **WebSocket Integration** - Replace polling with real-time updates
2. **Push Notifications** - Browser notifications for new messages
3. **File Attachments** - Send images/documents
4. **Message Search** - Search within conversations
5. **Read Receipts** - Show when messages are read

## 📚 Resources

- Full Documentation: `CHAT_WIDGET_IMPLEMENTATION.md`
- Widget HTML: `templates/partials/chat_widget.html`
- Widget CSS: `static/css/components/chat-widget.css`
- Widget JS: `static/js/components/chat-widget.js`

---

**Need Help?** Check the full documentation in `CHAT_WIDGET_IMPLEMENTATION.md`

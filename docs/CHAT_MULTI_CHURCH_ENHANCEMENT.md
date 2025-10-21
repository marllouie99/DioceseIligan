# Chat System Multi-Church Enhancement Plan

## Current State

The chat system **already supports** multiple churches per manager:
- Conversations are linked to specific churches via `church` foreign key
- API queries all conversations from all churches owned by the user
- Each conversation is unique per user-church pair

## Current Behavior

When a manager owns multiple churches:
- ✅ They see ALL conversations from ALL their churches in one inbox
- ✅ Each conversation is properly associated with a church
- ✅ Messages are separated by conversation
- ❌ No visual indicator showing which church each conversation belongs to
- ❌ No way to filter conversations by church
- ❌ Could be confusing with many churches

## Recommended Enhancements

### 1. **Add Church Context to Conversation List** (Priority: HIGH)

**Problem:** Managers can't easily tell which conversation belongs to which church

**Solution:** Update the conversations API to include church information

**Changes Needed:**
```python
# In chat_api.py - conversations_api()
# Line 71-81 (for church owners)

data.append({
    'id': conv.id,
    'church_id': conv.church.id,
    'church_name': display_name,  # User name
    'church_avatar': avatar,  # User avatar
    'managed_church_name': conv.church.name,  # ADD THIS
    'managed_church_logo': conv.church.logo.url if conv.church.logo else None,  # ADD THIS
    'last_message': last_message.content if last_message else None,
    'last_message_time': last_message.created_at.isoformat() if last_message else conv.created_at.isoformat(),
    'unread_count': unread_count,
    'is_church_owner': True,
    'other_user_id': conv.user.id
})
```

**Frontend Update:**
- Show church badge/tag on each conversation
- Display: "User Name (via Church Name)"
- Example: "John Doe (via St. Michael Cathedral)"

### 2. **Add Church Filter Dropdown** (Priority: HIGH)

**Problem:** No way to filter conversations by specific church

**Solution:** Add a church selector dropdown in the chat interface

**Implementation:**
```javascript
// In chat widget/page
<select id="church-filter">
  <option value="all">All Churches</option>
  <option value="1">St. Michael Cathedral</option>
  <option value="2">Sacred Heart Parish</option>
</select>

// Filter conversations client-side
function filterConversations(churchId) {
  if (churchId === 'all') {
    showAllConversations();
  } else {
    showConversationsForChurch(churchId);
  }
}
```

### 3. **Church-Specific Chat View** (Priority: MEDIUM)

**Problem:** Managers might want to focus on one church at a time

**Solution:** Add church context to manage_church page

**Implementation:**
- Add a "Messages" tab in the manage_church page
- Show only conversations for the currently selected church
- Filter conversations by `church_id` parameter

**Changes:**
```python
# In manage_church view
def manage_church(request, church_id=None):
    # ... existing code ...
    
    # Get conversations for this specific church
    church_conversations = Conversation.objects.filter(
        church=church
    ).select_related('user').annotate(
        last_message_time=Max('messages__created_at')
    ).order_by('-updated_at')
    
    ctx = {
        # ... existing context ...
        'church_conversations': church_conversations,
        'church_unread_messages': sum(conv.get_unread_count(request.user) for conv in church_conversations),
    }
```

### 4. **Unified Inbox with Church Badges** (Priority: MEDIUM)

**Problem:** Current inbox doesn't show which church each conversation is for

**Solution:** Add visual church indicators

**UI Design:**
```
┌─────────────────────────────────────────┐
│ 🔍 Search conversations...              │
│ 📋 Filter: [All Churches ▼]            │
├─────────────────────────────────────────┤
│ 👤 John Doe                             │
│ 🏛️ St. Michael Cathedral               │
│ 💬 "Thank you for the information..."   │
│ 🔴 2 unread · 2 hours ago               │
├─────────────────────────────────────────┤
│ 👤 Mary Smith                           │
│ 🏛️ Sacred Heart Parish                 │
│ 💬 "What time is the mass?"             │
│ ⚪ 1 day ago                            │
└─────────────────────────────────────────┘
```

### 5. **Notification Improvements** (Priority: LOW)

**Problem:** Notifications don't specify which church received a message

**Solution:** Include church name in notifications

**Example:**
- Current: "New message from John Doe"
- Improved: "New message from John Doe (St. Michael Cathedral)"

### 6. **Church Switcher in Chat** (Priority: LOW)

**Problem:** Manager has to leave chat to switch churches

**Solution:** Add quick church switcher in chat interface

**Implementation:**
- Add church dropdown in chat header
- Clicking switches to that church's conversations
- Maintains chat context

## Implementation Priority

### Phase 1: Essential (Do Now)
1. ✅ Add church context to conversation API response
2. ✅ Update frontend to display church badges
3. ✅ Add church filter dropdown

### Phase 2: Enhanced UX (Next Sprint)
4. Add church-specific chat view in manage_church page
5. Improve notifications with church context
6. Add conversation search functionality

### Phase 3: Advanced Features (Future)
7. Church switcher in chat interface
8. Bulk message operations per church
9. Church-specific chat templates/quick replies
10. Analytics per church (response time, message volume, etc.)

## Code Changes Required

### 1. Backend (chat_api.py)
```python
# Update conversations_api() to include church context
# Lines 71-81 and 91-100

# For church owners, add:
'managed_church_name': conv.church.name,
'managed_church_logo': conv.church.logo.url if conv.church.logo else None,
```

### 2. Frontend (JavaScript)
```javascript
// Update conversation rendering
function renderConversation(conv) {
  if (conv.is_church_owner) {
    // Show church badge
    const churchBadge = `
      <div class="church-badge">
        <img src="${conv.managed_church_logo}" alt="${conv.managed_church_name}">
        <span>${conv.managed_church_name}</span>
      </div>
    `;
  }
}

// Add filter functionality
function filterByChurch(churchId) {
  const conversations = document.querySelectorAll('.conversation-item');
  conversations.forEach(conv => {
    if (churchId === 'all' || conv.dataset.churchId === churchId) {
      conv.style.display = 'block';
    } else {
      conv.style.display = 'none';
    }
  });
}
```

### 3. CSS Styling
```css
.church-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(30, 144, 255, 0.1);
  border-radius: 12px;
  font-size: 0.75rem;
  color: #1E90FF;
  margin-top: 0.25rem;
}

.church-badge img {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
}
```

## Testing Checklist

- [ ] Manager with 1 church: Chat works normally
- [ ] Manager with 2+ churches: All conversations visible
- [ ] Church badges display correctly
- [ ] Filter dropdown shows all managed churches
- [ ] Filtering works correctly
- [ ] Unread counts accurate per church
- [ ] Messages sent from correct church context
- [ ] Notifications include church name
- [ ] Mobile responsive design
- [ ] Performance with many conversations

## Benefits

1. **Clarity**: Managers know which church each conversation is for
2. **Organization**: Easy to filter and focus on specific churches
3. **Efficiency**: Quick switching between church contexts
4. **Scalability**: Works for any number of churches
5. **User Experience**: Less confusion, better workflow

## Backward Compatibility

All changes are **backward compatible**:
- Existing conversations continue to work
- No database migrations needed (church field already exists)
- Frontend gracefully handles missing church data
- API adds new fields without breaking existing clients

## Conclusion

The chat system **already supports multiple churches** at the data level. The enhancements focus on **improving the user interface** to make it clearer and easier to manage conversations across multiple churches.

**Recommendation:** Implement Phase 1 enhancements first (church badges and filters) as they provide the most immediate value with minimal effort.

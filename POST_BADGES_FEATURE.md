# Post Badges Feature

## 🎯 Overview
Added visual badges above post captions to indicate post types and features, making it easier for users to identify donation-enabled posts and event posts at a glance.

## ✅ Implementation

### **1. Badge Types**

#### **Event Badge** (Blue)
- **Displayed when:** `post.post_type == 'event'`
- **Icon:** Calendar icon
- **Label:** "Event"
- **Color:** Blue gradient (`#1e40af`)
- **Purpose:** Indicates the post is about an event

#### **Fundraiser Badge** (Pink)
- **Displayed when:** `post.enable_donation == True`
- **Icon:** Heart icon
- **Label:** "Fundraiser"
- **Color:** Pink gradient (`#be185d`)
- **Purpose:** Indicates donations are enabled for this post

### **2. Badge Combinations**

| Post Type | Donation Enabled | Badges Shown |
|-----------|------------------|--------------|
| General   | No               | None |
| General   | Yes              | Fundraiser |
| Event     | No               | Event |
| Event     | Yes              | Event + Fundraiser |
| Prayer    | No               | None |
| Prayer    | Yes              | Fundraiser |
| Photo     | Yes              | Fundraiser |

### **3. Visual Design**

**Badge Structure:**
```
┌─────────────────────────────────┐
│ 📅 Event  💗 Fundraiser          │
│                                  │
│ Post caption text goes here...  │
└─────────────────────────────────┘
```

**Design Features:**
- **Compact:** Small, pill-shaped badges
- **Subtle:** Light gradient backgrounds with borders
- **Informative:** Clear icons and labels
- **Hover effect:** Slightly enhanced on hover
- **Responsive:** Adjusts size on mobile

### **4. CSS Styling**

```css
.post-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
}

.event-badge {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.12));
    color: #1e40af;
    border: 1px solid rgba(59, 130, 246, 0.3);
}

.donation-badge {
    background: linear-gradient(135deg, rgba(233, 30, 99, 0.1), rgba(219, 39, 119, 0.12));
    color: #be185d;
    border: 1px solid rgba(233, 30, 99, 0.3);
}
```

### **5. Template Code** (`templates/partials/post_card.html`)

```html
{% if post.post_type == 'event' or post.enable_donation %}
<div class="post-badges">
  {% if post.post_type == 'event' %}
  <span class="post-badge event-badge">
    <svg>...</svg>
    Event
  </span>
  {% endif %}
  
  {% if post.enable_donation %}
  <span class="post-badge donation-badge">
    <svg>...</svg>
    Fundraiser
  </span>
  {% endif %}
</div>
{% endif %}
```

## 🎨 Visual Examples

### **Event Post with Donations**
```
┌──────────────────────────────────────┐
│ St. Michael's Cathedral Church   ✓   │
├──────────────────────────────────────┤
│ 📅 Event  💗 Fundraiser              │
│                                      │
│ Join us for our annual charity      │
│ fundraising event!                   │
│                                      │
│ [Event Details Card]                 │
│ [Event Image]                        │
│ [Donation Card]                      │
└──────────────────────────────────────┘
```

### **Regular Post with Donations**
```
┌──────────────────────────────────────┐
│ St. Michael's Cathedral Church   ✓   │
├──────────────────────────────────────┤
│ 💗 Fundraiser                        │
│                                      │
│ Please support our building          │
│ renovation project!                  │
│                                      │
│ [Post Image]                         │
│ [Donation Card]                      │
└──────────────────────────────────────┘
```

### **Event Post without Donations**
```
┌──────────────────────────────────────┐
│ St. Michael's Cathedral Church   ✓   │
├──────────────────────────────────────┤
│ 📅 Event                             │
│                                      │
│ Join us for Sunday service!          │
│                                      │
│ [Event Details Card]                 │
└──────────────────────────────────────┘
```

## 📱 Responsive Design

**Desktop (> 640px):**
- Padding: `4px 10px`
- Font size: `12px`
- Icon size: `12px`
- Gap: `8px`

**Mobile (≤ 640px):**
- Padding: `3px 8px`
- Font size: `11px`
- Icon size: `10px`
- Gap: `6px`

## 🎯 User Benefits

1. **Quick Identification:**
   - Users can instantly see if a post has donations enabled
   - Event posts are immediately recognizable

2. **Improved Scanning:**
   - Badges make it easier to scan through feeds
   - Visual cues help users find relevant content faster

3. **Clear Communication:**
   - Churches can clearly indicate fundraising posts
   - Event posts stand out in the feed

4. **Professional Appearance:**
   - Matches modern social media design patterns
   - Clean, polished look

## 💡 Future Enhancements

1. **Additional Badge Types:**
   - Prayer request badge (🙏)
   - Urgent/Important badge
   - Featured post badge
   - Live event badge

2. **Badge Animations:**
   - Subtle pulse animation for urgent posts
   - Shimmer effect for featured content

3. **Badge Interactions:**
   - Click badge to filter by type
   - Tooltip showing more details on hover

4. **Customization:**
   - Allow churches to customize badge colors
   - Add custom badges for specific campaigns

5. **Badge Analytics:**
   - Track click-through rates on badged posts
   - Compare engagement between different badge types

## 📝 Files Modified

- `templates/partials/post_card.html` - Added badge rendering
- `static/css/pages/church_detail.css` - Added badge styles

## ✨ Result

Post badges provide:
- ✅ Clear visual indicators
- ✅ Improved content discovery
- ✅ Professional appearance
- ✅ Better user experience
- ✅ Flexible for future expansion

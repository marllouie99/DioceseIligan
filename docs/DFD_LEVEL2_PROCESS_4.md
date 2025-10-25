# Level 2 DFD - Process 4.0: Post & Content Management

**System:** ChurchIligan  
**Document Type:** Data Flow Diagram - Level 2 Decomposition  
**Parent Process:** Process 4.0  
**Created:** 2025-10-24  

---

## 📊 Process 4.0 Decomposition

### **Sub-Processes:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESS 4.0 DECOMPOSITION                    │
│                Post & Content Management                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   4.1        │      │   4.2        │      │   4.3        │
│     Post     │─────▶│     Post     │─────▶│   Comment    │
│   Creation   │      │ Interaction  │      │  Management  │
└──────────────┘      └──────────────┘      └──────────────┘
                                                    │
                                                    ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   4.4        │      │   4.5        │      │   4.6        │
│     Post     │◀─────│     Post     │◀─────│   Donation   │
│  Moderation  │      │  Analytics   │      │ Integration  │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 🔹 Process 4.1: Post Creation

**Description:** Create and publish church posts (4 types)

**Inputs:**
- Parish Manager → Post Creation Data
  - General Post: Content, Image
  - Photo Post: Images, Caption
  - Event Post: Title, Date, Location, Max Participants
  - Prayer Post: Prayer Request Content

**Outputs:**
- Post Record → D10 (Post Database)
- Post Feed → Regular User

**Logic:**
1. Validate Parish Manager ownership
2. Validate post type and required fields
3. Optimize and upload images
4. Store post in D10
5. Publish to feed
6. Track creation timestamp

**Post Types:**
- **General:** Regular text/image posts
- **Photo:** Image galleries
- **Event:** Church events with RSVP
- **Prayer:** Prayer requests

---

## 🔹 Process 4.2: Post Interaction

**Description:** Handle likes, bookmarks, and shares

**Inputs:**
- Regular User → Post Like
- Regular User → Post Bookmark
- Regular User → Post Share

**Outputs:**
- Interaction Record → D11 (Post Interaction Database)
- Interaction Count → Regular User
- Interaction Notification → Parish Manager
- Interaction Event → Process 8.0

**Logic:**
1. Validate user authentication
2. Check if already liked/bookmarked
3. Store interaction in D11
4. Update interaction counts
5. Notify Parish Manager
6. Track for analytics

---

## 🔹 Process 4.3: Comment Management

**Description:** Handle comments and nested replies

**Inputs:**
- Regular User → Post Comment (Content, Parent Comment ID)
- Regular User → Comment Like

**Outputs:**
- Comment Record → D11
- Comment Display → Regular User
- Comment Notification → Parish Manager

**Logic:**
1. Validate comment content
2. Check if reply (parent_id exists)
3. Store in D11 with nesting level
4. Display in threaded format
5. Notify post owner
6. Support comment likes

**Features:**
- Nested replies support
- Comment likes
- Real-time updates

---

## 🔹 Process 4.4: Post Moderation

**Description:** Handle reported posts and moderation

**Inputs:**
- Regular User → Post Report (Reason, Description)
- Super-Admin → Moderation Decision

**Outputs:**
- Report Record → D12 (Post Report Database)
- Moderation Queue → Super-Admin
- Moderation Action → D10 (update post status)
- Moderation Notification → Parish Manager

**Logic:**
1. User reports post with reason
2. Store report in D12 (Status: Pending)
3. Display in admin moderation queue
4. Admin reviews and decides:
   - Keep post
   - Remove post
   - Warn user
5. Update post status in D10
6. Notify Parish Manager of decision

**Report Reasons:**
- Spam
- Inappropriate content
- Misleading information
- Harassment
- Other

---

## 🔹 Process 4.5: Post Analytics

**Description:** Track post views and generate analytics

**Inputs:**
- Regular User → View Event (Post ID, IP, Timestamp)
- D10 → Post Data
- D11 → Interaction Data

**Outputs:**
- View Record → D11
- Post Analytics → Parish Manager
- View Event → Process 9.0 (Analytics)

**Logic:**
1. Track unique post views (IP-based)
2. Prevent duplicate counting
3. Calculate engagement metrics:
   - Total views
   - Likes count
   - Comments count
   - Shares count
   - Engagement rate
4. Generate analytics dashboard
5. Send data to Process 9.0

**Metrics Tracked:**
- Views
- Likes
- Comments
- Shares
- Engagement rate
- Reach

---

## 🔹 Process 4.6: Donation Integration

**Description:** Enable donations on posts

**Inputs:**
- Parish Manager → Donation Settings (Enable, Goal, PayPal Email)

**Outputs:**
- Donation Settings → Process 5.0
- Updated Post → D10 (enable_donation = True)

**Logic:**
1. Parish Manager enables donation on post
2. Set donation goal (optional)
3. Verify PayPal email from church profile
4. Update post in D10
5. Send settings to Process 5.0
6. Display donation button on post

---

## 📊 Data Stores Used

| ID | Name | Access |
|----|------|--------|
| D10 | Post Database | Read/Write (4.1, 4.4, 4.6) |
| D11 | Post Interaction Database | Read/Write (4.2, 4.3, 4.5) |
| D12 | Post Report Database | Read/Write (4.4) |
| D5 | Church Database | Read (all) |

---

## 🔄 Complete Workflow Example

```
USER INTERACTS WITH POST:

1. Parish Manager → 4.1: Create Event Post (Christmas Mass)
2. 4.1 → D10: Store post (type: event)
3. 4.1 → User: Display in feed
4. User → 4.2: Like post
5. 4.2 → D11: Store like
6. 4.2 → Parish Manager: Notification (User liked your post)
7. User → 4.3: Comment "What time?"
8. 4.3 → D11: Store comment
9. 4.3 → Parish Manager: Notification (New comment)
10. Parish Manager → 4.3: Reply "7:00 PM"
11. 4.3 → D11: Store reply (parent_id = comment.id)
12. User → 4.5: View post
13. 4.5 → D11: Track view
14. 4.5 → Process 9.0: Send analytics data
15. Parish Manager → 4.6: Enable donation (Goal: ₱10,000)
16. 4.6 → D10: Update post (enable_donation = True)
17. 4.6 → Process 5.0: Send donation settings
```

---

**Total Sub-Processes: 6**  
**Data Stores: 4**  
**External Entities: 3 (Regular User, Parish Manager, Super-Admin)**

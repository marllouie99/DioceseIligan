# Super Admin Analytics Summary

## Complete Inventory of Analytics Cards and Charts Across All Super-Admin Pages

### **1. Overview Tab (super_admin.html)** - CURRENT STATE
**Stat Cards (8 total - 4x2 grid):**
1. Total Users - with trend "+X this month"
2. Active Parishes - with trend "+X verified"
3. Total Bookings - with trend "+X this week"
4. Pending Reviews - "Verification + Reports"
5. Parish Follows - with trend "+X this week"
6. Total Donations - with trend "+₱X this month"
7. Post Engagement - "Likes, comments, bookmarks"
8. Posts This Month - with trend "X posted today"

**Charts (3 total):**
1. Post Engagement (Line Chart) - Daily post activity and engagement metrics
2. Parish Outreach (Horizontal Bar Chart) - Engagement and reach across parishes
3. Appointment Status (Bar Chart) - Breakdown by status over 6 months

**Tables:**
- Recent Parish Applications

---

### **2. Parishes Tab (super_admin_churches.html)**
**Stat Cards (3 total):**
1. Total Parishes
2. Verified Parishes
3. Pending Verifications

**Charts (1 total):**
1. Top Parishes by Followers (Horizontal Bar Chart) - Shows verified vs unverified status with follower counts

**Tables:**
- Parish Directory with filters (search, verification status, denomination)
- Verification Requests

---

### **3. Users Tab (super_admin_users.html)**
**Stat Cards (4 total):**
1. Total Users - with "+X this week"
2. Active Users - with "X% of total"
3. Church Admins - "Managing X churches"
4. Inactive Users - "X% of total"

**Charts (2 total):**
1. User Activity Trends (Line Chart) - Active Users vs New Users by week
2. Users by Role (Doughnut Chart) - Distribution of user types

**Tables:**
- All Users with pagination

---

### **4. Posts Tab (super_admin_posts.html)**
**Stat Cards (4 total - with time filter: All Time, 7 Days, 30 Days, 90 Days):**
1. Total Posts - "+X this week"
2. Total Likes - "X avg per post"
3. Total Comments - "X avg per post"
4. Total Shares - "X avg per post"

**Charts (2 total):**
1. Engagement Trends (Line Chart) - Comments, Likes, Shares over time (7/30/90 days filter)
2. Posts by Type (Bar Chart) - Distribution of Update, Event, Photo, Prayer

**Tables:**
- Recent Posts with filters (search, type, status)

---

### **5. Services Tab (super_admin_services.html)**
**Stat Cards (4 total - with time filter: All Time, 7 Days, 30 Days, 90 Days):**
1. Total Services - "All services"
2. Total Bookings - "+X this month"
3. Revenue (Paid) - "+₱X this month"
4. Avg Rating - "From X reviews"

**Charts (2 total):**
1. Booking Trends & Revenue (Dual-axis Line Chart) - Bookings and Revenue over time (7/30/90 days filter)
2. Services by Category (Doughnut Chart) - Distribution of services across categories

**Tables:**
- Bookable Services
- Recent Service Reviews

---

### **6. Bookings Tab (super_admin_bookings.html)**
**Stat Cards (7 total - with time filter: All Time, 7 Days, 30 Days, 90 Days):**
1. Total Bookings
2. Completed Bookings
3. Pending Bookings
4. Cancelled Bookings
5. Total Revenue
6. Average Booking Value
7. Completion Rate

**Charts (4-5 total):**
1. Booking Trends (Line Chart) - Completed, Cancelled, Pending over months
2. Bookings by Service Type (Bar Chart) - Most popular service bookings
3. Revenue Trend Over Time (Line Chart) - Revenue progression
4. Revenue by Parish (Horizontal Bar Chart) - Revenue generated per parish
5. Online Paid Bookings by Parish (Horizontal Bar Chart) - Paid bookings per parish

**Tables:**
- All Bookings with filters (search, status, payment)

---

### **7. Donations Tab (super_admin_donations.html)**
**Stat Cards (3 total + Rank Distribution Cards - with time filter: All Time, 7 Days, 30 Days, 90 Days):**
1. Total Donors
2. Total Donations - "All-time contributions"
3. Average Donation - "Per donor"
4. + Multiple Rank Distribution Cards (Diamond, Platinum, Gold, Silver, Bronze, etc.)

**Charts (2 total):**
1. Donor Rank Distribution (Doughnut Chart) - Breakdown of donors by rank tier
2. Top 10 Donors (Horizontal Bar Chart) - Highest contributing donors

**Tables:**
- All Donors with filters (search, rank, time period, sort)

---

## **CONSOLIDATED ANALYTICS FOR OVERVIEW TAB**

### **Proposed Enhanced Overview Structure:**

#### **Section 1: Key Metrics Dashboard (12 stat cards - 4x3 grid)**
1. **Total Users** - "+X this month"
2. **Active Parishes** - "+X verified"
3. **Total Posts** - "+X this week"
4. **Post Engagement** - "Likes, comments, shares"
5. **Total Services** - "All services"
6. **Total Bookings** - "+X this month"
7. **Booking Revenue** - "+₱X this month"
8. **Total Donations** - "+₱X this month"
9. **Total Donors** - "Active contributors"
10. **Avg Rating** - "Service ratings"
11. **Pending Reviews** - "Verifications + Reports"
12. **System Health** - "Active/Total ratio"

#### **Section 2: Core Analytics Charts (6 charts in 2x3 grid)**
1. **User Growth Trends** (Line) - Active Users + New Users over time
2. **Parish Engagement** (Horizontal Bar) - Top parishes by followers/activity
3. **Post Engagement Trends** (Line) - Posts, Likes, Comments over time
4. **Booking Status Overview** (Bar) - Completed, Pending, Cancelled by month
5. **Revenue Analytics** (Dual-axis Line) - Bookings + Revenue over time
6. **Donation Trends** (Doughnut + Bar) - Donor ranks or top donors

#### **Section 3: Quick Access Tables**
1. **Recent Parish Applications** - Latest verification requests
2. **Top Parishes** - Most active/followed churches
3. **Recent Activity** - Latest posts, bookings, donations

---

## **IMPLEMENTATION NOTES:**

### **Data Requirements for Overview:**
The Overview view needs to aggregate data from:
- User statistics (active, new, roles)
- Church statistics (total, verified, followers)
- Post statistics (total, engagement, types)
- Service statistics (total, bookings, revenue, ratings)
- Booking statistics (status breakdown, revenue trends)
- Donation statistics (total, donors, ranks)

### **Charts to Add:**
1. User Activity Trends (from Users page)
2. Booking Status breakdown (from Bookings page)
3. Revenue trends (from Services/Bookings pages)
4. Donation/Donor visualization (from Donations page)
5. Service category distribution (from Services page)

### **Time Filters:**
Add time filter buttons at the top (All Time, 7 Days, 30 Days, 90 Days) that update:
- All stat cards
- All charts dynamically via AJAX

### **Export Options:**
Keep existing export buttons (Print, CSV, Excel, PDF)

---

## **Color Scheme for Stat Cards:**
- **Primary (Blue)**: Users, Parishes
- **Success (Green)**: Bookings, Revenue, Completed
- **Info (Light Blue)**: Services, Categories
- **Warning (Orange/Yellow)**: Pending, Reviews
- **Purple**: Followers, Social metrics
- **Success-Alt (Green)**: Donations, Financial
- **Pink**: Engagement, Likes
- **Teal**: Posts, Content
- **Red**: Cancelled, Failed items

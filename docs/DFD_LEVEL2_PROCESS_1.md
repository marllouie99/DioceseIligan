# Level 2 DFD - Process 1.0: User Authentication & Account Management

**System:** ChurchIligan  
**Document Type:** Data Flow Diagram - Level 2 Decomposition  
**Parent Process:** Process 1.0  
**Created:** 2025-10-24  

---

## 📊 Process 1.0 Decomposition

### **Sub-Processes:**

```
┌─────────────────────────────────────────────────────────────────┐
│                   PROCESS 1.0 DECOMPOSITION                     │
│          User Authentication & Account Management               │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   1.1        │      │   1.2        │      │   1.3        │
│     User     │─────▶│    Email     │─────▶│    Login     │
│ Registration │      │ Verification │      │    Auth      │
└──────────────┘      └──────────────┘      └──────────────┘
                                                    │
                                                    ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   1.4        │      │   1.5        │      │   1.6        │
│   Password   │      │    Google    │      │   Profile    │
│    Reset     │      │    OAuth     │      │  Management  │
└──────────────┘      └──────────────┘      └──────────────┘
                                                    │
                                                    ▼
                                            ┌──────────────┐
                                            │   1.7        │
                                            │   Activity   │
                                            │   Logging    │
                                            └──────────────┘
```

---

## 🔹 Process 1.1: User Registration

**Description:** Register new users with email verification

**Inputs:**
- Anonymous Visitor → Registration Form
  - Username
  - Email
  - Password
  - Confirm Password

**Outputs:**
- User Record → D1 (User Database) [is_active = False]
- Profile Record → D2 (Profile Database)
- Verification Code → Process 1.2
- Registration Activity → Process 1.7

**Logic:**
1. Validate form data:
   - Username unique
   - Email unique and valid format
   - Password strength (min 8 chars)
   - Passwords match
2. Hash password using Django's PBKDF2
3. Create user in D1 (is_active = False)
4. Create empty profile in D2
5. Route to email verification (Process 1.2)
6. Log registration attempt in Process 1.7

**Validation Rules:**
- Username: 3-150 chars, alphanumeric + underscore
- Email: Valid format, unique
- Password: Min 8 chars, at least 1 letter, 1 number

---

## 🔹 Process 1.2: Email Verification

**Description:** Send and verify 6-digit email codes

**Inputs:**
- Process 1.1 → User Email
- Anonymous Visitor → Verification Code (6 digits)

**Outputs:**
- Verification Code → Email Service
- Verification Record → D3 (Email Verification Database)
- Activation Status → D1 (set is_active = True)
- Verification Activity → Process 1.7

**Logic:**
1. Generate random 6-digit code
2. Store in D3 with:
   - Email
   - Code
   - Expires_at (15 minutes)
   - Attempts (max 5)
   - IP address, User agent, Device info
3. Send code via Email Service
4. User enters code
5. Validate code:
   - Code matches
   - Not expired
   - Attempts < 5
6. If valid:
   - Set user.is_active = True in D1
   - Mark code as used in D3
   - Log successful verification
7. If invalid:
   - Increment attempts
   - Return error

**Security Features:**
- 15-minute expiry
- Max 5 attempts
- Rate limiting
- IP tracking
- Device fingerprinting

---

## 🔹 Process 1.3: Login Authentication

**Description:** Authenticate user credentials

**Inputs:**
- Regular User → Login Credentials
  - Email/Username
  - Password

**Outputs:**
- Session Token → Regular User
- Login Activity → Process 1.7
- Last Login → D1 (update last_login)

**Logic:**
1. Receive login credentials
2. Query user from D1 by email/username
3. Verify password hash
4. Check if user.is_active = True
5. If valid:
   - Create session token
   - Update last_login in D1
   - Log successful login
   - Return session token
6. If invalid:
   - Log failed login attempt
   - Return error
7. Redirect to role-based dashboard:
   - Regular User → /app/feed/
   - Parish Manager → /app/manage-church/
   - Super-Admin → /admin/

**Security Features:**
- Password hashing (PBKDF2)
- Failed login tracking
- Account lockout after 5 failed attempts
- IP logging
- Session management

---

## 🔹 Process 1.4: Password Reset

**Description:** Reset forgotten passwords via email

**Inputs:**
- Regular User → Password Reset Request (Email)
- Regular User → Reset Code + New Password

**Outputs:**
- Reset Code → Email Service
- Reset Record → D3 (Password Reset Database)
- Updated Password → D1
- Reset Activity → Process 1.7

**Logic:**
1. User requests password reset
2. Verify email exists in D1
3. Generate 6-digit reset code
4. Store in D3 with:
   - Email
   - Code
   - Expires_at (15 minutes)
   - Attempts (max 5)
5. Send code via Email Service
6. User enters code + new password
7. Validate code (same as email verification)
8. If valid:
   - Hash new password
   - Update password in D1
   - Mark code as used
   - Log password reset
9. Invalidate all existing sessions

**Security Features:**
- 15-minute expiry
- Max 5 attempts
- Code single-use
- Session invalidation
- Email confirmation

---

## 🔹 Process 1.5: Google OAuth Integration

**Description:** Authenticate via Google account

**Inputs:**
- Regular User → Google Login Request
- Google OAuth → User Profile Data

**Outputs:**
- User Record → D1 (if new user)
- Profile Record → D2 (with Google data)
- Session Token → Regular User
- OAuth Activity → Process 1.7

**Logic:**
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth
3. User authorizes app
4. Receive Google profile data:
   - Email
   - Name
   - Profile picture
5. Check if email exists in D1:
   - **Exists:** Log in user
   - **New:** Create user account
6. If new user:
   - Create user in D1 (is_active = True)
   - Create profile in D2 with Google data
   - Auto-fill display_name and profile_image
7. Create session token
8. Log OAuth login
9. Redirect to dashboard

**Google Data Mapping:**
- google_email → user.email
- google_name → profile.display_name
- google_picture → profile.profile_image

---

## 🔹 Process 1.6: Profile Management

**Description:** Update user profile information

**Inputs:**
- Regular User → Profile Update
  - Display Name
  - Phone
  - Philippine Address (Region, Province, City, Barangay, Street)
  - Date of Birth
  - Bio
  - Profile Image

**Outputs:**
- Updated Profile → D2 (Profile Database)
- Profile Update Activity → Process 1.7

**Logic:**
1. User edits profile form
2. Validate data:
   - Phone format (Philippine)
   - Date of birth (age >= 13)
   - Image size (max 5MB)
3. Optimize profile image
4. Update profile in D2
5. Log profile update
6. Return success message

**Philippine Address Fields:**
- Region (dropdown)
- Province (filtered by region)
- City/Municipality (filtered by province)
- Barangay (filtered by city)
- Street Address (text)
- Postal Code

---

## 🔹 Process 1.7: Activity Logging

**Description:** Log all authentication activities

**Inputs:**
- Process 1.1 → Registration Activity
- Process 1.2 → Verification Activity
- Process 1.3 → Login Activity
- Process 1.4 → Password Reset Activity
- Process 1.5 → OAuth Activity
- Process 1.6 → Profile Update Activity

**Outputs:**
- Activity Record → D4 (User Activity Log)
- Security Alert → Super-Admin (if suspicious)

**Logic:**
1. Receive activity event from any sub-process
2. Collect metadata:
   - User ID (if authenticated)
   - Email
   - Activity Type
   - Success/Failure
   - IP Address
   - User Agent
   - Device Info (Browser, OS)
   - Country/City (from IP)
   - Timestamp
3. Store in D4
4. Analyze for suspicious patterns:
   - Multiple failed logins
   - Login from new location
   - Unusual activity time
5. If suspicious → Alert Super-Admin

**Activity Types Logged:**
- Registration
- Email Verification
- Login (success/failed)
- Logout
- Password Reset
- OAuth Login
- Profile Update
- Account Activation/Deactivation

---

## 📊 Data Stores Used

| ID | Name | Access |
|----|------|--------|
| D1 | User Database | Read/Write (1.1, 1.3, 1.4, 1.5) |
| D2 | Profile Database | Read/Write (1.1, 1.5, 1.6) |
| D3 | Email Verification Database | Read/Write (1.2, 1.4) |
| D4 | User Activity Log | Write (1.7) |

---

## 🔄 Complete Workflow Example

```
NEW USER REGISTRATION:

1. Visitor → 1.1: Register (john@email.com, password)
2. 1.1 → D1: Create user (is_active = False)
3. 1.1 → D2: Create empty profile
4. 1.1 → 1.2: Request email verification
5. 1.2: Generate code (123456)
6. 1.2 → D3: Store code (expires in 15 min)
7. 1.2 → Email Service: Send code to john@email.com
8. User receives email with code
9. User → 1.2: Enter code (123456)
10. 1.2 → D3: Validate code ✓
11. 1.2 → D1: Set is_active = True
12. 1.2 → 1.7: Log verification success
13. 1.7 → D4: Store activity log
14. User → 1.3: Login (john@email.com, password)
15. 1.3 → D1: Verify credentials ✓
16. 1.3 → D1: Update last_login
17. 1.3 → User: Session token
18. 1.3 → 1.7: Log login success
19. User → 1.6: Update profile (add phone, address)
20. 1.6 → D2: Update profile
21. 1.6 → 1.7: Log profile update
```

---

## 🔐 Security Features Summary

- ✅ Password hashing (PBKDF2)
- ✅ Email verification (6-digit codes)
- ✅ Rate limiting (max 5 attempts)
- ✅ Session management
- ✅ IP tracking
- ✅ Device fingerprinting
- ✅ Failed login tracking
- ✅ Account lockout
- ✅ Google OAuth integration
- ✅ Activity logging
- ✅ Suspicious activity detection

---

**Total Sub-Processes: 7**  
**Data Stores: 4**  
**External Entities: 3 (Anonymous Visitor, Regular User, Email Service)**

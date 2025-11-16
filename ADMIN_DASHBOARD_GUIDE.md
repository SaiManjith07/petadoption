# Admin Dashboard & Verification System Guide

## Overview

The PawsUnite admin dashboard provides a centralized interface for administrators to:
1. Review and verify pending lost/found pet reports
2. Monitor user activity and statistics
3. Manage user accounts
4. Track matched and reunited animals

---

## Admin User Setup

### Creating an Admin Account

Admins are created directly in MongoDB with the `role: 'admin'` field.

**Admin Collection Structure:**
```javascript
{
  _id: ObjectId,
  name: "Admin Name",
  email: "admin@pawsunite.com",
  password: "hashed_password",
  role: "admin",  // Must be "admin"
  phone: "+1234567890",
  profile_image: null,
  bio: null,
  address: {
    city: "City",
    state: "State",
    country: "Country"
  },
  is_verified: true,
  is_active: true,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Admin Login Flow

1. Admin enters email and password on Login page (`/auth/login`)
2. Backend validates credentials against User collection
3. If `role === 'admin'`, login succeeds and returns JWT token
4. Frontend checks `user.role` after login:
   - If `role === 'admin'` → redirects to `/admin`
   - If `role === 'user'` or `role === 'rescuer'` → redirects to `/home`

**Login Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "Admin Name",
    "email": "admin@pawsunite.com",
    "role": "admin"
  }
}
```

---

## Admin Dashboard Features

### 1. Dashboard Overview (Stats Grid)

The main dashboard displays key metrics:

**Pending Reports** (Orange highlighted)
- Shows total pending reports waiting for verification
- Split into: Lost reports + Found reports
- Quick visual indicator of verification queue

**Total Users**
- Regular users + Rescuers + Admins
- Helps track community growth

**Active Reports**
- Successfully listed lost and found reports
- Shows distribution between lost vs found

**Matched**
- Reports with potential matches found
- Indicates matching algorithm success

**Reunited**
- Successfully reunited pets
- Measures platform effectiveness

### 2. Pending Reports Tab (Primary Admin Function)

**Location:** First tab in the Admin Dashboard

**Features:**

#### Browse Pending Reports
- Shows all reports with status "Pending Verification"
- Displays:
  - Report type: FOUND or LOST (color-coded badges)
  - Pet species and breed
  - Distinguishing marks/description
  - Location and pincode
  - Date reported
  - Reporter name and email
  - Pet photos (first 3 displayed as thumbnails)

#### Accept Report Action
- **Button:** Green "Accept" button with checkmark icon
- **Process:**
  1. Admin reviews complete report details
  2. Clicks "Accept" button
  3. System updates report status:
     - Found reports → Status: "Listed Found"
     - Lost reports → Status: "Listed Lost"
  4. Marks admin as `verified_by`
  5. Records verification timestamp
  6. Report becomes visible to all users on respective pages
  7. Dashboard stats update automatically

#### Reject Report Action
- **Button:** Red "Reject" button with X icon
- **Process:**
  1. Admin clicks "Reject" button
  2. Modal dialog appears asking for rejection reason
  3. Admin provides detailed feedback (required)
  4. System updates report status: "Rejected"
  5. Sets `verified_by` and `verification_notes`
  6. Reporter is notified (optional notification system)
  7. Report remains in database (soft delete principle)

**Empty State:**
- When all reports are verified:
  - Green checkmark icon displayed
  - Message: "No pending reports! All reports have been verified."

### 3. Recent Users Tab

Shows latest user registrations with ability to:
- View user name, email, role (user/rescuer/admin)
- See registration date
- Deactivate non-admin users (safety feature)

### 4. Recent Pets Tab

Lists all pet reports with:
- Pet details (name, breed, species)
- Report type (found/lost/adoption)
- Location information
- Report status
- Submission date
- Action buttons for management

---

## Backend API Endpoints

All admin endpoints require:
- **Authentication:** Valid JWT token in `Authorization: Bearer <token>` header
- **Authorization:** User must have `role === 'admin'`

### Dashboard Stats
**GET** `/api/admin/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "pending": {
      "lost": 3,
      "found": 2,
      "total": 5
    },
    "active": {
      "lost": 8,
      "found": 12,
      "total": 20
    },
    "matched": 15,
    "reunited": 10,
    "users": {
      "total": 150,
      "regular": 120,
      "rescuers": 28,
      "admins": 2
    }
  }
}
```

### Get Pending Reports
**GET** `/api/admin/pending?report_type=lost|found`

**Query Parameters:**
- `report_type` (optional): Filter by 'lost' or 'found'

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "report_id",
      "report_type": "lost",
      "status": "Pending Verification",
      "species": "Dog",
      "breed": "Golden Retriever",
      "sex": "Male",
      "estimated_age": "adult",
      "color_primary": "Golden",
      "color_secondary": "White",
      "distinguishing_marks": "White patch on chest, friendly demeanor",
      "microchip_id": "ABC123456789",
      "collar_tag": "Max-9876",
      "behavior_notes": "Friendly, trained",
      "medical_notes": "Vaccinated",
      "last_seen_or_found_date": "2024-01-15T10:00:00Z",
      "last_seen_or_found_location_text": "Central Park, New York",
      "last_seen_or_found_pincode": "10024",
      "last_seen_or_found_coords": {
        "type": "Point",
        "coordinates": [-73.9654, 40.7829]
      },
      "photos": [
        {
          "url": "https://...",
          "original_filename": "dog.jpg",
          "uploaded_at": "2024-01-15T10:30:00Z"
        }
      ],
      "additional_tags": ["collar", "friendly"],
      "submitted_by": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "contact_preference": "Email"
      },
      "contact_preference": "Email",
      "allow_public_listing": true,
      "date_submitted": "2024-01-15T10:30:00Z",
      "verified_by": null,
      "verification_date": null,
      "verification_notes": null,
      "is_active": true
    }
  ]
}
```

### Accept Report (Verify)
**POST** `/api/admin/pending/:id/accept`

**Request Body (optional):**
```json
{
  "notes": "Verified and approved for listing"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report accepted and listed as Listed Lost",
  "data": {
    "_id": "report_id",
    "status": "Listed Lost",
    "verified_by": "admin_user_id",
    "verification_date": "2024-01-15T11:00:00Z",
    "verification_notes": "Verified and approved for listing"
  }
}
```

### Reject Report
**POST** `/api/admin/pending/:id/reject`

**Request Body (required):**
```json
{
  "reason": "Insufficient information provided for verification"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report rejected successfully",
  "data": {
    "_id": "report_id",
    "status": "Rejected",
    "verified_by": "admin_user_id",
    "verification_date": "2024-01-15T11:00:00Z",
    "verification_notes": "Rejected: Insufficient information provided for verification"
  }
}
```

### Get All Users
**GET** `/api/admin/users?role=user&is_active=true`

**Query Parameters:**
- `role` (optional): Filter by 'user', 'rescuer', or 'admin'
- `is_active` (optional): Filter by true/false

### Delete User (Deactivate)
**DELETE** `/api/admin/users/:id`

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

### Get All Pets
**GET** `/api/admin/pets?type=lost&status=Listed Lost`

**Query Parameters:**
- `type`: Filter by 'lost' or 'found'
- `status`: Filter by status
- `location`: Filter by location (fuzzy search)

---

## Frontend Implementation

### Key Files

1. **`/src/pages/Admin.tsx`**
   - Main admin dashboard component
   - Manages state for pending reports, users, pets
   - Handles accept/reject report actions
   - Displays stats grid and tabbed interface

2. **`/src/services/api.ts`**
   - `adminAPI.getDashboardStats()` - Fetch dashboard stats
   - `adminAPI.getPendingReports(type?)` - Fetch pending reports
   - `adminAPI.acceptReport(petId, notes?)` - Accept a report
   - `adminAPI.rejectReport(petId, reason)` - Reject a report
   - `adminAPI.getAllUsers(filters?)` - Fetch all users
   - `adminAPI.deleteUser(userId)` - Deactivate user

3. **`/src/lib/auth.tsx`**
   - `useAuth()` hook with `isAdmin` property
   - Auth context management

### Component Features

**Pending Reports Display:**
```tsx
// Shows expandable cards for each pending report
// Each card contains:
// - Report badge (LOST/FOUND)
// - Pet species and breed
// - Distinguishing marks
// - Location details
// - Reporter info
// - Pet photos (thumbnails)
// - Action buttons (Accept/Reject)
```

**Reject Confirmation Modal:**
```tsx
// Shows when admin clicks Reject
// Fields:
// - Rejection reason textarea (required)
// - Cancel button
// - Reject button (destructive)
```

---

## Workflow: Accepting a Report

1. **User submits pet report**
   - Lost pet form or Found pet form
   - Data validation on frontend
   - Uploaded to backend with status: "Pending Verification"

2. **Report appears in Admin Dashboard**
   - Listed in "Pending Reports" tab
   - Pending count increments in stats

3. **Admin reviews report**
   - Views all pet details and photos
   - Checks for accurate information
   - Verifies images are appropriate

4. **Admin clicks "Accept"**
   - Report status changes to "Listed Lost" or "Listed Found"
   - Admin user ID recorded
   - Timestamp recorded
   - Dashboard stats update

5. **Report now visible to users**
   - Found pets appear on `/pets/found` for lost pet owners
   - Lost pets appear on `/pets/lost` for rescuers/finders
   - Can be matched with other reports

---

## Workflow: Rejecting a Report

1. **Admin identifies issue**
   - Insufficient details
   - Inappropriate images
   - Duplicate report
   - Suspicious activity

2. **Admin clicks "Reject"**
   - Modal dialog appears

3. **Admin provides reason**
   - Types detailed feedback
   - Explains why report doesn't meet criteria

4. **Admin confirms**
   - Clicks "Reject Report" button
   - System records rejection

5. **Report marked as rejected**
   - Status: "Rejected"
   - Remains in database for audit trail
   - May be resubmitted by user with improvements

---

## Security Features

1. **Authentication Required**
   - All admin endpoints require valid JWT token
   - Token verified against database

2. **Role-Based Authorization**
   - Only users with `role === 'admin'` can access admin routes
   - Middleware checks role before allowing action

3. **Protected Data**
   - User passwords never returned in responses
   - User email verification status protected
   - Admin actions audit-logged (verified_by, verification_date)

4. **Cannot Delete Admins**
   - Middleware prevents deactivating admin accounts
   - Only other users can be deactivated

---

## Database Indices

The following indices optimize admin operations:

```javascript
// In Pet model:
petSchema.index({ status: 1 });  // Fast filtering by status
petSchema.index({ submitted_by: 1, date_submitted: -1 });  // User reports timeline
petSchema.index({ report_type: 1 });  // Filter lost vs found
petSchema.index({ is_active: 1 });  // Active records only
```

---

## Error Handling

**Common Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "User role 'user' is not authorized to access this route"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Pet report not found"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Report status is Rejected, cannot reject"
}
```

---

## Testing the Admin System

### 1. Create Test Admin Account

```bash
# Use MongoDB Compass or mongosh to insert:
db.users.insertOne({
  name: "Test Admin",
  email: "admin@test.com",
  password: "hashed_password",  // Use bcrypt
  role: "admin",
  phone: "+1234567890",
  is_verified: true,
  is_active: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 2. Login as Admin

- Navigate to `/auth/login`
- Enter admin email and password
- Should be redirected to `/admin` dashboard

### 3. Submit Test Reports

- Create regular user account
- Submit lost and found pet reports
- Reports appear in admin "Pending Reports" tab

### 4. Verify Accept Workflow

- Click "Accept" on a report
- Status should change to "Listed Lost/Found"
- Report should appear on user pages
- Dashboard stats should update

### 5. Verify Reject Workflow

- Click "Reject" on a report
- Enter rejection reason
- Report should show as "Rejected"
- Stats should update

---

## Troubleshooting

**Admin dashboard not loading:**
- Verify user has `role: 'admin'` in database
- Check JWT token is valid in localStorage
- Check browser console for API errors
- Verify admin routes are registered in server.js

**Pending reports not showing:**
- Verify pets have `status: "Pending Verification"`
- Check if pets are in database
- Verify admin has proper authorization token

**Accept/Reject buttons not working:**
- Check network tab in browser DevTools
- Verify backend API is running
- Check API URL is correct in `.env` file
- Verify authorization header is sent

**Can't deactivate user:**
- Cannot deactivate admin accounts (by design)
- Other user roles should be deactivatable
- Check if user is actually admin role

---

## Next Steps

1. **Set up notification system** for report rejections
2. **Add bulk operations** for accepting multiple reports
3. **Create audit logs** for all admin actions
4. **Add search/filter** for pending reports
5. **Implement admin analytics** dashboard
6. **Add report generation** capabilities

---

## Summary

The admin dashboard provides a complete verification system for pet reports:

✅ **Sign in with admin account** → Redirects to `/admin`
✅ **View pending reports** in organized cards
✅ **Accept reports** to list them publicly
✅ **Reject reports** with detailed feedback
✅ **Monitor dashboard stats** in real-time
✅ **Manage users** (view and deactivate)
✅ **Track all activities** with audit trails

All functions work smoothly with proper error handling, validation, and security.

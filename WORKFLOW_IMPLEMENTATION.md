# Complete Pet Report Workflow Implementation

## Overview
This document describes the complete workflow for pet reports (found/lost) with admin approval.

## Flow Diagram

```
User Reports Pet
    ↓
Status: 'Pending', is_verified=False
    ↓
Admin Sees in Dashboard & Found/Lost Pages
    ↓
Admin Approves
    ↓
Status: 'Found' or 'Lost', is_verified=True
    ↓
Pet Visible to Normal Users
    ↓
(For Found Pets Only) After 15 Days
    ↓
Uploader Gives Consent
    ↓
Status: 'Available for Adoption'
```

## Detailed Steps

### 1. User Reports Pet

**Found Pet:**
- User submits found pet report via `/api/found/`
- Backend creates pet with:
  - `adoption_status='Pending'`
  - `is_verified=False`
  - `found_date=<date>` (required for found pets)
  - `posted_by=<user>`

**Lost Pet:**
- User submits lost pet report via `/api/lost/`
- Backend creates pet with:
  - `adoption_status='Pending'`
  - `is_verified=False`
  - `found_date=None` (lost pets don't have found_date)
  - `posted_by=<user>`

### 2. Admin Views Pending Reports

**Admin Dashboard:**
- Calls `/admin/pending?report_type=found` and `/admin/pending?report_type=lost`
- Shows count of pending reports
- Displays pending reports in cards

**Admin Found Pets Page:**
- Calls `/admin/found` - Shows all found pets including pending ones
- Calls `/admin/pending?report_type=found` - Shows pending found pets
- Pending pets are marked with `_isPendingFound: true`

**Admin Lost Pets Page:**
- Calls `/admin/lost` - Shows all lost pets including pending ones
- Calls `/admin/pending?report_type=lost` - Shows pending lost pets
- Pending pets are marked with `_isPendingLost: true`

### 3. Visibility Rules

**Normal Users:**
- Can ONLY see pets with `is_verified=True`
- Cannot see pending pets (status='Pending', is_verified=False)
- Cannot access pet detail pages for unverified pets (404 error)
- Pet list views filter: `is_verified=True`

**Admins:**
- Can see ALL pets including pending ones
- Can access pet detail pages for any pet
- Pet list views show all pets (no is_verified filter)

**Pet Uploader:**
- Can see their own pending pets (even if unverified)
- Can access their own pet detail pages

### 4. Admin Approval

**Process:**
- Admin clicks "Approve" on pending pet
- Backend endpoint: `/admin/pets/<id>/approve`
- Sets:
  - `is_verified=True`
  - `adoption_status='Found'` (if found_date exists)
  - `adoption_status='Lost'` (if found_date is None)
- Creates notification for uploader
- Logs admin action

**After Approval:**
- Pet becomes visible to all normal users
- Pet appears in public pet listings
- Pet can be viewed by anyone

### 5. 15-Day Adoption Rule (Found Pets Only)

**Process:**
- After 15 days from `found_date`, system notifies uploader
- Uploader visits pet detail page
- Consent dialog appears with options:
  - "Keep Pet" → Status becomes 'Adopted', owner set to uploader
  - "Move to Adoption" → Status becomes 'Available for Adoption'
- Only uploader can make this decision

## Backend Implementation

### Key Files

1. **`backend/pets/views.py`**
   - `PetListView.get_queryset()` - Filters by `is_verified=True` for normal users
   - `LostPetListView.get_queryset()` - Filters by `is_verified=True` for normal users
   - `FoundPetListView.get_queryset()` - Filters by `is_verified=True` for normal users
   - `PetDetailView.retrieve()` - Blocks access to unverified pets for normal users
   - `LostPetListView.perform_create()` - Creates with 'Pending' status
   - `FoundPetListView.perform_create()` - Creates with 'Pending' status

2. **`backend/adminpanel/views.py`**
   - `pending_reports()` - Returns pending pets for admin
   - `all_found()` - Returns all found pets including pending
   - `all_lost()` - Returns all lost pets including pending
   - `approve_pet()` - Approves pet and makes it visible

3. **`backend/pets/serializers.py`**
   - `adoption_status` and `is_verified` are read-only
   - Prevents users from setting these fields directly

## Frontend Implementation

### Key Files

1. **`Frontend/src/pages/admin/Admin.tsx`**
   - Fetches pending reports on load
   - Displays pending count in dashboard

2. **`Frontend/src/pages/admin/AdminFoundPets.tsx`**
   - Shows pending found pets
   - Shows approved found pets
   - Admin can approve/reject

3. **`Frontend/src/pages/admin/AdminLostPets.tsx`**
   - Shows pending lost pets
   - Shows approved lost pets
   - Admin can approve/reject

## Testing Checklist

- [ ] User reports found pet → Status is 'Pending', is_verified=False
- [ ] User reports lost pet → Status is 'Pending', is_verified=False
- [ ] Admin sees pending pets in dashboard
- [ ] Admin sees pending pets in Found/Lost pages
- [ ] Normal users cannot see pending pets in listings
- [ ] Normal users cannot access pending pet detail pages (404)
- [ ] Admin approves found pet → Status becomes 'Found', is_verified=True
- [ ] Admin approves lost pet → Status becomes 'Lost', is_verified=True
- [ ] After approval, normal users can see the pet
- [ ] After approval, normal users can access pet detail page
- [ ] Uploader can see their own pending pets
- [ ] 15-day consent dialog appears for found pets after 15 days

## Debug Logging

The system includes debug logging at key points:
- `[DEBUG] Created found pet ID X: status=Pending, is_verified=False`
- `[DEBUG] Created lost pet ID X: status=Pending, is_verified=False`
- `[DEBUG] Found pets query - report_type=found, count=X`
- `[DEBUG] Lost pets query - report_type=lost, count=X`
- `[DEBUG] PetListView: Filtering for normal user - only showing verified pets`

Check backend console for these logs to verify the workflow.


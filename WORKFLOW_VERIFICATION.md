# Pet Report Workflow Verification

## Issue: Admin Not Seeing Pending Reports

### Root Cause Analysis

The issue was that when users report pets, they might not appear as pending for admin approval. This could be due to:

1. **Serializer Override**: The serializer might be setting default values before `perform_create` runs
2. **Status Not Set**: The `adoption_status` or `is_verified` might not be set correctly
3. **Query Filtering**: The pending reports query might not be matching correctly

### Fixes Applied

#### 1. Backend - Serializer (`backend/pets/serializers.py`)
- Made `is_verified` read-only to prevent it from being set incorrectly
- Already had `adoption_status` as read-only

#### 2. Backend - Pet Creation (`backend/pets/views.py`)
- **FoundPetListView.perform_create()**: 
  - Sets `adoption_status='Pending'`
  - Sets `is_verified=False`
  - Sets `found_date` (required for found pets)
  - Added double-check to ensure status is correct even if serializer tries to override
  - Added debug logging

- **LostPetListView.perform_create()**:
  - Sets `adoption_status='Pending'`
  - Sets `is_verified=False`
  - Does NOT set `found_date` (lost pets don't have found_date)
  - Added double-check to ensure status is correct
  - Added debug logging

#### 3. Backend - Pending Reports Query (`backend/adminpanel/views.py`)
- Enhanced query with better debugging
- For found pets: Filters by `is_verified=False`, `found_date__isnull=False`, and `adoption_status in ['Pending', 'Found']`
- For lost pets: Filters by `is_verified=False`, `found_date__isnull=True`, and `adoption_status in ['Pending', 'Lost']`
- Added debug logging to show query results

### Expected Flow

1. **User Reports Pet**:
   - Found Pet: Creates with `adoption_status='Pending'`, `is_verified=False`, `found_date=<date>`
   - Lost Pet: Creates with `adoption_status='Pending'`, `is_verified=False`, `found_date=None`

2. **Admin Views Pending Reports**:
   - Calls `/admin/pending?report_type=found` or `/admin/pending?report_type=lost`
   - Backend returns pets matching the query filters

3. **Admin Approves**:
   - Found pet with `found_date` → Status becomes `'Found'`, `is_verified=True`
   - Lost pet without `found_date` → Status becomes `'Lost'`, `is_verified=True`

### Testing Steps

1. **Test Found Pet Report**:
   - User reports a found pet
   - Check backend logs for: `[DEBUG] Created found pet ID X: status=Pending, is_verified=False`
   - Admin should see it in `/admin/found` page
   - Check backend logs for: `[DEBUG] Found pets query - report_type=found, count=X`

2. **Test Lost Pet Report**:
   - User reports a lost pet
   - Check backend logs for: `[DEBUG] Created lost pet ID X: status=Pending, is_verified=False`
   - Admin should see it in `/admin/lost` page
   - Check backend logs for: `[DEBUG] Lost pets query - report_type=lost, count=X`

3. **Verify Database**:
   - Check that new pets have `adoption_status='Pending'` and `is_verified=False`
   - Found pets should have `found_date` set
   - Lost pets should have `found_date=None`

### Debug Commands

To check pending pets in database:
```python
from pets.models import Pet

# All pending pets
pending = Pet.objects.filter(adoption_status='Pending', is_verified=False)
print(f"Total pending: {pending.count()}")

# Pending found pets
pending_found = Pet.objects.filter(adoption_status='Pending', is_verified=False, found_date__isnull=False)
print(f"Pending found: {pending_found.count()}")

# Pending lost pets
pending_lost = Pet.objects.filter(adoption_status='Pending', is_verified=False, found_date__isnull=True)
print(f"Pending lost: {pending_lost.count()}")
```

### Files Modified

1. `backend/pets/serializers.py` - Made `is_verified` read-only
2. `backend/pets/views.py` - Enhanced `perform_create` with double-checking and logging
3. `backend/adminpanel/views.py` - Enhanced pending reports query with debugging


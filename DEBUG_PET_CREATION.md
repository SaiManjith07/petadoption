# Debug Pet Creation Flow

## Issue
Pets are going directly to adoption instead of pending status.

## Root Cause
The Pet model has a default value of `'Available for Adoption'` for `adoption_status`. When the serializer's `create()` method is called, if `adoption_status` is not explicitly set, the model uses this default.

## Fix Applied

### 1. Serializer (`backend/pets/serializers.py`)
- Updated `create()` method to explicitly set `adoption_status='Pending'` and `is_verified=False`
- This prevents the model default from being used
- Added debug logging to track what's being created

### 2. Views (`backend/pets/views.py`)
- `LostPetListView.perform_create()` - Sets status to 'Pending' and verifies it
- `FoundPetListView.perform_create()` - Sets status to 'Pending' and verifies it
- Both have double-check logic to ensure status is correct

## Flow

1. **User submits form** → Frontend calls `petsApi.create(formData, 'found')` or `petsApi.create(formData, 'lost')`
2. **API endpoint** → `/api/found/` or `/api/lost/` → `FoundPetListView` or `LostPetListView`
3. **Serializer.create()** → Creates instance with `adoption_status='Pending'`, `is_verified=False`
4. **perform_create()** → Verifies and ensures status is 'Pending', sets `found_date` for found pets
5. **Double-check** → If status is wrong, forces it to 'Pending' and saves again

## Debug Logging

Check backend console for these logs:
- `[DEBUG] PetSerializer.create: Created pet ID X with status=Pending, is_verified=False`
- `[DEBUG] Created found pet ID X: status=Pending, is_verified=False, found_date=...`
- `[DEBUG] Created lost pet ID X: status=Pending, is_verified=False, found_date=None`

If you see `[WARNING] Pet X status was Available for Adoption, forcing to 'Pending'`, it means the default was used but was corrected.

## Database Check

To verify pets are created correctly, check the database:
```sql
SELECT id, name, adoption_status, is_verified, found_date, created_at 
FROM pets_pet 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

Expected:
- `adoption_status` should be 'Pending'
- `is_verified` should be False
- `found_date` should be set for found pets, NULL for lost pets

## Testing Steps

1. Submit a found pet report
2. Check backend console logs
3. Check database - verify status is 'Pending' and is_verified is False
4. Check admin dashboard - should see pending report
5. Submit a lost pet report
6. Repeat checks


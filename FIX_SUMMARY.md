# Fix Summary: Pet Creation Going to Adoption Directly

## Problem
When users submit found or lost pet reports, they were going directly to "Available for Adoption" status instead of "Pending" status.

## Root Cause
The Pet model has a default value of `'Available for Adoption'` for the `adoption_status` field:
```python
adoption_status = models.CharField(..., default='Available for Adoption')
```

When the serializer's `create()` method called `super().create(validated_data)`, if `adoption_status` was not explicitly set in `validated_data`, the model would use its default value.

## Solution Applied

### 1. Serializer Fix (`backend/pets/serializers.py`)
Updated the `create()` method to explicitly set `adoption_status='Pending'` and `is_verified=False` in `validated_data` before calling `super().create()`. This prevents the model default from being used.

**Key Changes:**
- Remove `adoption_status` and `is_verified` from validated_data if they exist (they're read-only)
- Explicitly set `adoption_status='Pending'` and `is_verified=False` in validated_data
- This ensures the model doesn't use its default value

### 2. View Verification (`backend/pets/views.py`)
Both `LostPetListView.perform_create()` and `FoundPetListView.perform_create()` already:
- Set `adoption_status='Pending'` when calling `serializer.save()`
- Have double-check logic to verify and correct the status if wrong
- Include debug logging

## Flow After Fix

1. **User submits form** → Frontend calls `petsApi.create(formData, 'found')` or `'lost'`
2. **API endpoint** → `/api/found/` or `/api/lost/` 
3. **Serializer.create()** → Sets `adoption_status='Pending'`, `is_verified=False` in validated_data
4. **Model.create()** → Uses 'Pending' from validated_data (not default)
5. **perform_create()** → Verifies status is 'Pending', sets `found_date` for found pets
6. **Double-check** → If status is wrong, forces it to 'Pending' and saves again

## Expected Result

- Found pets: `adoption_status='Pending'`, `is_verified=False`, `found_date=<date>`
- Lost pets: `adoption_status='Pending'`, `is_verified=False`, `found_date=None`
- Pets appear in admin pending reports
- Pets are NOT visible to normal users until admin approves

## Debug Logging

Check backend console for:
- `[DEBUG] PetSerializer.create: Created pet ID X with status=Pending, is_verified=False`
- `[DEBUG] Created found pet ID X: status=Pending, is_verified=False, found_date=...`
- `[DEBUG] Created lost pet ID X: status=Pending, is_verified=False, found_date=None`

If you see `[WARNING] Pet X status was Available for Adoption, forcing to 'Pending'`, the double-check caught and fixed it.

## Testing

1. Submit a found pet report
2. Check database: `SELECT adoption_status, is_verified FROM pets_pet WHERE id = <new_id>`
   - Should show: `adoption_status='Pending'`, `is_verified=False`
3. Check admin dashboard - should see pending report
4. Submit a lost pet report
5. Repeat checks


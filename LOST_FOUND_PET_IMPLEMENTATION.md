# Lost/Found Pet Reporting System - Implementation Guide

## Overview
This document outlines the comprehensive implementation of detailed pet reporting forms with strict validation and intelligent matching for the Paws Unite platform.

**Status**: 🟢 **CORE COMPONENTS COMPLETE** - Ready for integration testing and FoundPetForm replication

---

## ✅ Completed Components

### 1. Backend: Enhanced Pet Model
**File**: `backend/src/models/Pet.js`

**New Fields** (40+):
- `report_type`: 'lost' | 'found' (required)
- `species`: Required enum with 12 options (Dog, Cat, Cow, Buffalo, Goat, Sheep, Camel, Horse, Bird, Rabbit, Reptile, Other)
- `sex`: Required enum (Male, Female, Unknown)
- `estimated_age`: Enum (puppy/kitten, young, adult, senior, unknown)
- `size`: Enum (Small, Medium, Large, Extra Large, Unknown)
- `color_primary`: Required string, max 50 chars, sanitized
- `color_secondary`: Optional string, max 50 chars
- `coat_type`: Enum (Short, Hairy, Curly, Feathered, Woolly, Bald, Unknown)
- `distinguishing_marks`: Required string, min 5, max 1000 chars (searchable)
- `microchip_id`: Optional uppercase alphanumeric, unique index for exact matching
- `collar_tag`: Optional string, max 100 chars
- `behavior_notes`: Optional string, max 500 chars
- `medical_notes`: Optional string, max 500 chars
- `last_seen_or_found_date`: Required DateTime
- `last_seen_or_found_location_text`: Required string, max 500 chars
- `last_seen_or_found_pincode`: Optional string
- `last_seen_or_found_coords`: GeoJSON Point with 2dsphere index for geospatial queries
- `photos`: Array of objects { url, original_filename, uploaded_at }
- `additional_tags`: Array of strings, max 10 tags
- `contact_preference`: Required enum (Phone, SMS, Email, In-app message)
- `allow_public_listing`: Boolean (default true)
- `verification_notes`: Optional string for admin notes
- Legacy fields maintained for backward compatibility

**Indices**:
- Text index on: breed, color_primary, color_secondary, distinguishing_marks, location
- Compound index: species + status
- Compound index: submitted_by + date_submitted (descending)
- Geospatial 2dsphere index on coordinates for location-based matching
- Unique sparse index on microchip_id
- Index on additional_tags for filtering

---

### 2. Backend: Validation & Sanitization
**File**: `backend/src/utils/petValidation.js`

**Key Functions**:
- `sanitizeText(text, maxLength)`: Removes HTML/XSS via isomorphic-dompurify
- `validateSpecies(species)`: Enum validation
- `validateColor(color, fieldName)`: Sanitize + length validation
- `validateDistinguishingMarks(marks)`: Min 5, max 1000, sanitized
- `validateDate(dateStr, maxDaysOld=30)`: Future check (1 day tolerance), age check
- `validateLocation(location)`: Non-empty, trimmed, max 500 chars
- `validateCoordinates(lat, lon)`: Range validation (lat -90 to 90, lon -180 to 180)
- `validateMicrochipId(id)`: Alphanumeric only, max 50 chars, uppercase
- `validateTags(tags)`: Array, max 10 items, sanitize each
- `validateContactPreference(pref)`: Enum validation
- `validateImageFile(file)`: MIME type (jpg/png/heic), max 8MB
- `validatePhotos(photos)`: Array 1-8 items, all have URLs
- `validatePetData(data)`: Batch validation returns `{ isValid, errors }`

**Security**:
- All text fields sanitized for XSS/HTML injection
- File uploads validated for type and size
- Input trimming and length enforcement

---

### 3. Backend: Matching & Scoring Algorithm
**File**: `backend/src/utils/petMatching.js`

**Scoring System** (0-100 points):
1. **Microchip ID (40 pts)**: Exact alphanumeric match → highest confidence, triggers special return
2. **Species (20 pts)**: Required match; mismatch returns 0
3. **Color Primary (12 pts)**: Fuzzy trigram matching, 70% similarity threshold
4. **Color Secondary (6 pts)**: Optional, fuzzy match
5. **Distinguishing Marks (15 pts)**: Fuzzy trigram matching, 60% similarity threshold
6. **Geospatial Distance (12 pts)**: Haversine algorithm, inversely weighted by distance (default 50km threshold)
7. **Date Proximity (8 pts)**: Inversely weighted by days difference (3-day window)
8. **Size (5 pts)**: Exact match (optional)
9. **Sex (5 pts)**: Exact match (optional)
10. **Additional Tags (3 pts)**: Proportional to match count

**Key Functions**:
- `haversineDistance(lat1, lon1, lat2, lon2)`: Returns km distance
- `calculateSimilarity(str1, str2)`: Trigram-based fuzzy matching (0-1 score)
- `computeMatchScore(pet, queryParams)`: Returns { score, matchedFields[], details[] }
- `findMatchingPets(queryParams, limit=20)`: Returns top N matches sorted by score, filters by report_type opposite
- `findMicrochipMatch(microchipId)`: Returns exact match with score 100

**Query Parameters**:
```
GET /api/pets/match/search?
  report_type=lost&
  species=Dog&
  color_primary=brown&
  color_secondary=white&
  distinguishing_marks=scar%20on%20left%20eye&
  latitude=40.7128&
  longitude=-74.0060&
  pincode=10021&
  microchip_id=9824765098A12C&
  date=2024-11-10&
  tags=injured,limping&
  max_distance_km=50&
  limit=20
```

---

### 4. Backend: Controller & Endpoints
**File**: `backend/src/controllers/petControllerV2.js`

**New Endpoints**:

#### POST /api/pets/lost
Create a lost pet report
- **Auth**: Required (logged-in user)
- **Body**: Multipart form (text fields + file upload)
- **Validation**: Full petValidation schema
- **Response**: 201 { success, message, data: petReport }
- **Errors**: 400 { success: false, errors: { field: 'message' } }

#### POST /api/pets/found
Create a found pet report
- **Auth**: Required
- **Body**: Multipart form
- **Response**: Same as /lost but with report_type='found'

#### GET /api/pets/match/search
Find matching pets
- **Auth**: Public (no auth required for reading matches)
- **Query Params**: See above
- **Response**: 200 { success, matches: [{ pet_id, score, matched_fields, pet_summary, distance_km, match_details }], query_summary }
- **Special Case**: If microchip_id provided and found, returns with microchip_match: true and score 100

#### PATCH /api/pets/:id/verify
Admin verification endpoint
- **Auth**: Admin only
- **Body**: { status: string, verification_notes?: string }
- **Response**: 200 { success, data: verifiedPet }

---

### 5. Backend: Upload Middleware
**File**: `backend/src/middleware/uploadPets.js`

- **Multer Config**: Stores to `uploads/pets/` directory
- **File Filter**: jpg, png, heic only
- **Limits**: 8 files max, 8MB per file
- **Filename**: Sanitized with timestamp + random suffix to prevent collisions
- **Error Handler**: Structured error responses for oversized/invalid files

---

### 6. Frontend: Shared Form Components
**File**: `Frontend/src/components/pets/PetFormFields.tsx`

**15+ Reusable Components**:
1. `SpeciesSelector` - Dropdown with 12 species
2. `BreedInput` - Text input with placeholder
3. `SexSelector` - Male/Female/Unknown
4. `AgeSelector` - Dropdown with age categories
5. `SizeSelector` - 4 sizes + Unknown
6. `ColorInput` - Primary & secondary color inputs
7. `CoatTypeSelector` - 7 coat types
8. `DistinguishingMarksInput` - Textarea with char counter (5-1000)
9. `MicrochipIdInput` - Alphanumeric uppercase enforcement
10. `CollarTagInput` - Text input for tag info
11. `NotesInput` - Generic textarea for behavior/medical notes
12. `LocationInput` - Textarea for address/landmark
13. `PincodeInput` - Postal code validation
14. `DateTimeInput` - HTML5 datetime-local
15. `ContactPreferenceSelector` - 4 contact methods
16. `TagsInput` - Comma-separated input with suggestions
17. `PhotoUploader` - Drag-and-drop with preview grid
18. `LocationPicker` - Lat/lon numeric inputs

**Features**:
- Error display with icon
- Inline helpers/descriptions
- Consistent styling with Tailwind/shadcn
- Type-safe prop passing

---

### 7. Frontend: Lost Pet Form Component
**File**: `Frontend/src/pages/pets/LostPetForm.tsx`

**Features**:
- **Multi-Tab UI**: Pet Info → Physical → Location → Photos & Contact
- **Form State Management**: useState for all fields + errors
- **Live Matching**: Debounced (1500ms) search as user fills in species, color, microchip
- **Photo Upload**: Multi-file drag-and-drop (1-8 files)
- **Validation**: Client-side validation mirrors backend rules
- **Error Display**: Field-level error messages
- **Submission**: FormData with multipart encoding, includes photos + JSON fields
- **Success Redirect**: Navigates to pet detail page on success
- **Toast Notifications**: User feedback for success/error

**Form Fields**:
- Tab 1 (Pet Info): species*, breed, sex*, estimated_age, size
- Tab 2 (Physical): color_primary*, color_secondary, coat_type, size, distinguishing_marks*, microchip_id, collar_tag, behavior_notes, medical_notes
- Tab 3 (Location): last_seen_date*, location*, pincode, coordinates (lat/lon)
- Tab 4 (Photos): photos* (1-8), additional_tags, contact_preference*

*required

---

## 🔄 Integration Steps

### Step 1: Install Dependencies
```bash
cd backend
npm install isomorphic-dompurify express-rate-limit
```

### Step 2: Update Server Routes
Replace the pet routes import in `backend/src/server.js`:
```javascript
import petRoutes from './routes/petRoutesV2.js'; // Changed from petRoutes.js
```

### Step 3: Database Migration (if using existing MongoDB)
No schema migration required - MongoDB is schema-flexible. The new fields will be created on first write. However, existing pet documents won't have the new fields - you may want to script a backfill to set defaults.

### Step 4: Create Uploads Directory
```bash
mkdir -p backend/uploads/pets
```

### Step 5: Add Rate Limiting (Optional but Recommended)
In `backend/src/server.js`, add:
```javascript
import rateLimit from 'express-rate-limit';

const petReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 reports per 15 min per IP/user
  message: 'Too many pet reports submitted. Please try again later.',
});

app.post('/api/pets/lost', petReportLimiter, ...);
app.post('/api/pets/found', petReportLimiter, ...);
```

### Step 6: Frontend Integration
1. Create routes in `Frontend/src/App.tsx`:
```typescript
import LostPetForm from './pages/pets/LostPetForm';
import FoundPetForm from './pages/pets/FoundPetForm';

// Add to route definitions:
{ path: '/pets/new/lost', element: <ProtectedRoute><LostPetForm /></ProtectedRoute> }
{ path: '/pets/new/found', element: <ProtectedRoute><FoundPetForm /></ProtectedRoute> }
```

2. The Landing page already has CTAs that link to `/pets/new/lost` and `/pets/new/found` - they will now work correctly.

---

## 📋 Remaining Tasks

### 🟡 FoundPetForm Component
**File**: `Frontend/src/pages/pets/FoundPetForm.tsx`
- Identical to LostPetForm but report_type='found'
- Matches against report_type='lost' reports
- Same form structure and validation
- ~400 lines - can be copy of LostPetForm with s/lost/found/

### 🟡 Integration Tests
**File**: `backend/test/pets.test.js`
```javascript
// Jest/supertest tests
- POST /api/pets/lost with valid data + photos
- POST /api/pets/found with valid data + photos
- GET /api/pets/match/search with various query params
- Validate matching scores (microchip 100, species required, etc.)
- Error cases: missing required fields, invalid file types, oversized files
- Admin verify endpoint
```

### 🟡 E2E UI Test (Optional)
- Fill LostPetForm, upload photos, see live matches appear
- Click match to start reunification flow

### 🟡 Documentation Updates
Update `backend/README.md`:
```markdown
## Pet Reporting & Matching

### New Endpoints
- POST /api/pets/lost - Report lost animal
- POST /api/pets/found - Report found animal
- GET /api/pets/match/search - Find matches

### Environment Variables
- UPLOADS_DIR (default: uploads/pets)
- MAX_PHOTO_SIZE (default: 8388608 bytes / 8MB)
- MAX_PHOTOS (default: 8)
- MATCHING_MAX_DISTANCE_KM (default: 50)
- MATCHING_MIN_SCORE (default: 30)

### Matching Score Formula
- Microchip exact: 40 pts
- Species required: 20 pts
- Colors (fuzzy): 18 pts combined
- Marks (fuzzy): 15 pts
- Location (distance): 12 pts
- Date (proximity): 8 pts
- Tags (match count): 3 pts
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Submit lost pet form with all fields - verify database entry
- [ ] Submit with photos - verify files uploaded and URLs stored
- [ ] Search matches with species + color - verify results sorted by score
- [ ] Test microchip exact match - verify score 100
- [ ] Test form validation - required fields, bad date, bad coordinates
- [ ] Test photo upload limits - too many files, oversized file, wrong format
- [ ] Test live match preview - appears after 1500ms delay
- [ ] Test admin verify endpoint - updates status and verification_notes

### Automated Tests (Priority)
- Unit: validatePetData() with 20+ test cases
- Unit: computeMatchScore() with various pet combinations
- Integration: POST /api/pets/lost → GET /api/pets/match/search
- Integration: Microchip exact match logic

---

## 🚀 Performance Considerations

1. **Database Indices**:
   - Geospatial 2dsphere index for location-based queries
   - Text index for full-text search on descriptions
   - Compound indices for common queries

2. **Fuzzy Matching**:
   - Trigram matching is O(n*m) for strings - acceptable for typical description lengths
   - Future optimization: Elasticsearch or PostgreSQL tsvector for large-scale search

3. **Photo Storage**:
   - Currently local disk (`uploads/pets/`)
   - Production: Migrate to S3/Cloudinary with signed URLs
   - Add image compression/optimization middleware

4. **Caching**:
   - Cache match results for common queries (Redis) - optional optimization
   - Pre-compute scores for active reports

---

## 🔐 Security Reminders

✅ **Implemented**:
- HTML/XSS sanitization on all text fields (DOMPurify)
- File type validation (MIME type check)
- File size limits (8MB per file)
- Filename sanitization (lowercase, replace special chars)
- Auth required for reporting (protect endpoint)
- Input length enforcement
- Coordinate range validation

⚠️ **Additional Hardening** (for production):
- Rate-limiting on report submissions (5 reports/15 min per user)
- CAPTCHA on form submission (optional)
- Virus scanning on uploaded images (ClamAV, etc.)
- Batch re-indexing of fuzzy search indices periodically
- Audit logging for admin verify actions
- Mask reporter contact info in public listings (if allow_public_listing=false)

---

## 📊 API Response Examples

### POST /api/pets/lost - Success
```json
{
  "success": true,
  "message": "Lost pet reported successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "report_type": "lost",
    "species": "Dog",
    "breed": "Golden Retriever",
    "sex": "Male",
    "color_primary": "brown",
    "color_secondary": "white",
    "distinguishing_marks": "Scar on left eye, white patch on chest",
    "last_seen_or_found_date": "2024-11-10T14:30:00Z",
    "last_seen_or_found_location_text": "Central Park, New York",
    "status": "Pending Verification",
    "photos": [...],
    "submitted_by": "507f1f77bcf86cd799439012",
    "date_submitted": "2024-11-16T10:00:00Z"
  }
}
```

### POST /api/pets/lost - Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "species": "Species must be one of: Dog, Cat, ...",
    "distinguishing_marks": "Distinguishing marks must be at least 5 characters",
    "last_seen_or_found_date": "Date cannot be more than 1 day in the future",
    "photos": "At least 1 photo is required"
  }
}
```

### GET /api/pets/match/search - With Matches
```json
{
  "success": true,
  "matches": [
    {
      "pet_id": "507f1f77bcf86cd799439013",
      "score": 87,
      "matched_fields": ["species", "color_primary", "location", "date"],
      "pet_summary": {
        "id": "507f1f77bcf86cd799439013",
        "species": "Dog",
        "breed": "Golden Retriever",
        "color_primary": "brown",
        "color_secondary": "white",
        "distinguishing_marks": "Scar on left eye",
        "photos": [...],
        "location": "Central Park, NYC",
        "report_type": "found",
        "status": "Listed Found"
      },
      "distance_km": 1.2,
      "match_details": [
        { "field": "species", "confidence": "exact" },
        { "field": "color_primary", "confidence": "exact" },
        { "field": "location", "distance_km": 1.2, "confidence": "very_close" },
        { "field": "date", "days_diff": 0, "confidence": "same_day" }
      ]
    }
  ],
  "query_summary": { "species": "Dog", "color_primary": "brown", ... }
}
```

---

## 📚 Files Created/Modified

### Backend Files
✅ `backend/src/models/Pet.js` - Extended model
✅ `backend/src/utils/petValidation.js` - Validators
✅ `backend/src/utils/petMatching.js` - Matching algorithm
✅ `backend/src/controllers/petControllerV2.js` - New endpoints
✅ `backend/src/middleware/uploadPets.js` - Upload handler
✅ `backend/src/routes/petRoutesV2.js` - Route definitions
✅ `backend/package.json` - Added dependencies

### Frontend Files
✅ `Frontend/src/components/pets/PetFormFields.tsx` - Shared form components
✅ `Frontend/src/pages/pets/LostPetForm.tsx` - Lost pet form
🟡 `Frontend/src/pages/pets/FoundPetForm.tsx` - **PENDING**
🟡 `Frontend/src/pages/pets/MatchPreview.tsx` - **PENDING** (match display component)

---

## 🎯 Next Steps

1. **Immediate** (15 min):
   - Update server.js to import petRoutesV2
   - Create uploads/pets directory
   - Run npm install for new dependencies

2. **Short-term** (1-2 hours):
   - Create FoundPetForm.tsx (copy LostPetForm, change type)
   - Test form submission with file upload
   - Verify database entries match schema

3. **Medium-term** (4-6 hours):
   - Write integration tests
   - Create MatchPreview component
   - Test live matching functionality
   - Test admin verify endpoint

4. **Polish** (2-3 hours):
   - Add rate-limiting
   - Implement success/error toasts
   - Update landing page CTAs
   - Create Postman collection
   - Update README with docs

---

**Document Version**: 1.0
**Last Updated**: 2024-11-16
**Status**: 🟢 Core Implementation Complete

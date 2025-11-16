import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

// Allowed species
export const ALLOWED_SPECIES = ['Dog', 'Cat', 'Cow', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Horse', 'Bird', 'Rabbit', 'Reptile', 'Other'];
export const ALLOWED_SEX = ['Male', 'Female', 'Unknown'];
export const ALLOWED_SIZES = ['Small', 'Medium', 'Large', 'Extra Large', 'Unknown'];
export const ALLOWED_COAT_TYPES = ['Short', 'Hairy', 'Curly', 'Feathered', 'Woolly', 'Bald', 'Unknown'];
export const ALLOWED_CONTACT_PREFERENCES = ['Phone', 'SMS', 'Email', 'In-app message'];
export const ALLOWED_AGES = ['puppy/kitten', 'young', 'adult', 'senior', 'unknown'];
export const ALLOWED_STATUS = ['Pending Verification', 'Listed Found', 'Listed Lost', 'Matched', 'Reunited', 'Pending Adoption', 'Available for Adoption', 'Adopted', 'Rejected'];

// Sanitize text input (remove HTML/XSS)
export const sanitizeText = (text, maxLength = 1000) => {
  if (!text) return null;
  const cleaned = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  return validator.trim(cleaned).substring(0, maxLength);
};

// Validate species
export const validateSpecies = (species) => {
  if (!species) return { valid: false, error: 'Species is required' };
  if (!ALLOWED_SPECIES.includes(species)) {
    return { valid: false, error: `Species must be one of: ${ALLOWED_SPECIES.join(', ')}` };
  }
  return { valid: true };
};

// Validate sex
export const validateSex = (sex) => {
  if (!sex) return { valid: false, error: 'Sex is required' };
  if (!ALLOWED_SEX.includes(sex)) {
    return { valid: false, error: 'Sex must be Male, Female, or Unknown' };
  }
  return { valid: true };
};

// Validate color
export const validateColor = (color, fieldName = 'Color') => {
  if (!color) return { valid: false, error: `${fieldName} is required` };
  const cleaned = sanitizeText(color, 50);
  if (!cleaned || cleaned.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }
  return { valid: true, value: cleaned };
};

// Validate distinguishing marks
export const validateDistinguishingMarks = (marks) => {
  if (!marks) return { valid: false, error: 'Distinguishing marks are required' };
  const cleaned = sanitizeText(marks, 1000);
  if (cleaned.length < 5) {
    return { valid: false, error: 'Distinguishing marks must be at least 5 characters' };
  }
  if (cleaned.length > 1000) {
    return { valid: false, error: 'Distinguishing marks cannot exceed 1000 characters' };
  }
  return { valid: true, value: cleaned };
};

// Validate date (not in future, not too old)
export const validateDate = (dateStr, maxDaysOld = 30) => {
  if (!dateStr) return { valid: false, error: 'Date is required' };
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  const now = new Date();
  const oneDayInFuture = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  if (date > oneDayInFuture) {
    return { valid: false, error: 'Date cannot be more than 1 day in the future' };
  }

  const maxOldDate = new Date(now.getTime() - maxDaysOld * 24 * 60 * 60 * 1000);
  if (date < maxOldDate) {
    return { valid: false, error: `Date cannot be more than ${maxDaysOld} days old` };
  }

  return { valid: true, value: date };
};

// Validate location
export const validateLocation = (location) => {
  if (!location) return { valid: false, error: 'Location is required' };
  const cleaned = sanitizeText(location, 500);
  if (!cleaned || cleaned.length === 0) {
    return { valid: false, error: 'Location cannot be empty' };
  }
  return { valid: true, value: cleaned };
};

// Validate coordinates
export const validateCoordinates = (lat, lon) => {
  if (lat === undefined || lat === null || lon === undefined || lon === null) {
    return { valid: false, error: 'Latitude and longitude are required' };
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return { valid: false, error: 'Coordinates must be valid numbers' };
  }

  if (latitude < -90 || latitude > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (longitude < -180 || longitude > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { valid: true, value: { latitude, longitude } };
};

// Validate pincode (basic format)
export const validatePincode = (pincode) => {
  if (!pincode) return { valid: true, value: null }; // Optional
  const cleaned = validator.trim(pincode);
  if (!/^[0-9\-]{3,10}$/.test(cleaned)) {
    return { valid: false, error: 'Pincode format is invalid' };
  }
  return { valid: true, value: cleaned };
};

// Validate microchip ID
export const validateMicrochipId = (microchipId) => {
  if (!microchipId) return { valid: true, value: null }; // Optional
  const cleaned = validator.trim(microchipId).toUpperCase();
  if (!/^[A-Z0-9]{1,50}$/.test(cleaned)) {
    return { valid: false, error: 'Microchip ID must be alphanumeric and up to 50 characters' };
  }
  return { valid: true, value: cleaned };
};

// Validate tags
export const validateTags = (tags) => {
  if (!tags) return { valid: true, value: [] };
  if (!Array.isArray(tags)) {
    return { valid: false, error: 'Tags must be an array' };
  }
  if (tags.length > 10) {
    return { valid: false, error: 'Cannot have more than 10 tags' };
  }
  const sanitized = tags.map(tag => sanitizeText(tag, 100)).filter(Boolean);
  return { valid: true, value: sanitized };
};

// Validate contact preference
export const validateContactPreference = (pref) => {
  if (!pref) return { valid: false, error: 'Contact preference is required' };
  if (!ALLOWED_CONTACT_PREFERENCES.includes(pref)) {
    return { valid: false, error: `Contact preference must be one of: ${ALLOWED_CONTACT_PREFERENCES.join(', ')}` };
  }
  return { valid: true };
};

// Validate image file
export const validateImageFile = (file) => {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
  const MAX_SIZE = 8 * 1024 * 1024; // 8MB

  if (!file) return { valid: false, error: 'File is required' };
  
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return { valid: false, error: 'Only JPG, PNG, and HEIC formats are allowed' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size must not exceed 8MB' };
  }

  return { valid: true };
};

// Validate photo array
export const validatePhotos = (photos) => {
  if (!photos || photos.length === 0) {
    return { valid: false, error: 'At least 1 photo is required' };
  }

  if (photos.length > 8) {
    return { valid: false, error: 'Cannot have more than 8 photos' };
  }

  for (const photo of photos) {
    if (!photo.url) {
      return { valid: false, error: 'Photo URL is required' };
    }
  }

  return { valid: true };
};

// Sanitize and validate breed
export const validateBreed = (breed) => {
  if (!breed) return { valid: true, value: null }; // Optional
  const cleaned = sanitizeText(breed, 100);
  return { valid: true, value: cleaned };
};

// Validate coat type
export const validateCoatType = (coatType) => {
  if (!coatType) return { valid: true, value: 'Unknown' };
  if (!ALLOWED_COAT_TYPES.includes(coatType)) {
    return { valid: false, error: `Coat type must be one of: ${ALLOWED_COAT_TYPES.join(', ')}` };
  }
  return { valid: true };
};

// Validate size
export const validateSize = (size) => {
  if (!size) return { valid: true, value: 'Unknown' };
  if (!ALLOWED_SIZES.includes(size)) {
    return { valid: false, error: `Size must be one of: ${ALLOWED_SIZES.join(', ')}` };
  }
  return { valid: true };
};

// Validate estimated age
export const validateEstimatedAge = (age) => {
  if (!age) return { valid: true, value: 'unknown' };
  if (!ALLOWED_AGES.includes(age)) {
    return { valid: false, error: `Age must be one of: ${ALLOWED_AGES.join(', ')}` };
  }
  return { valid: true };
};

// Validate behavior/medical notes
export const validateNotes = (notes, fieldName = 'Notes') => {
  if (!notes) return { valid: true, value: null }; // Optional
  const cleaned = sanitizeText(notes, 500);
  return { valid: true, value: cleaned };
};

// Sanitize and validate collar tag
export const validateCollarTag = (tag) => {
  if (!tag) return { valid: true, value: null }; // Optional
  const cleaned = sanitizeText(tag, 100);
  return { valid: true, value: cleaned };
};

// Batch validation for pet creation
export const validatePetData = (data) => {
  const errors = {};

  // Required fields
  const speciesCheck = validateSpecies(data.species);
  if (!speciesCheck.valid) errors.species = speciesCheck.error;

  const sexCheck = validateSex(data.sex);
  if (!sexCheck.valid) errors.sex = sexCheck.error;

  const colorCheck = validateColor(data.color_primary, 'Primary color');
  if (!colorCheck.valid) errors.color_primary = colorCheck.error;

  const marksCheck = validateDistinguishingMarks(data.distinguishing_marks);
  if (!marksCheck.valid) errors.distinguishing_marks = marksCheck.error;

  const dateCheck = validateDate(data.last_seen_or_found_date);
  if (!dateCheck.valid) errors.last_seen_or_found_date = dateCheck.error;

  const locationCheck = validateLocation(data.last_seen_or_found_location_text);
  if (!locationCheck.valid) errors.last_seen_or_found_location_text = locationCheck.error;

  const contactCheck = validateContactPreference(data.contact_preference);
  if (!contactCheck.valid) errors.contact_preference = contactCheck.error;

  // Optional fields
  const secondaryColorCheck = validateColor(data.color_secondary, 'Secondary color');
  if (data.color_secondary && !secondaryColorCheck.valid) {
    errors.color_secondary = secondaryColorCheck.error;
  }

  const breedCheck = validateBreed(data.breed);
  if (data.breed && !breedCheck.valid) errors.breed = breedCheck.error;

  const coatCheck = validateCoatType(data.coat_type);
  if (data.coat_type && !coatCheck.valid) errors.coat_type = coatCheck.error;

  const sizeCheck = validateSize(data.size);
  if (data.size && !sizeCheck.valid) errors.size = sizeCheck.error;

  const ageCheck = validateEstimatedAge(data.estimated_age);
  if (data.estimated_age && !ageCheck.valid) errors.estimated_age = ageCheck.error;

  const pincodeCheck = validatePincode(data.last_seen_or_found_pincode);
  if (data.last_seen_or_found_pincode && !pincodeCheck.valid) {
    errors.last_seen_or_found_pincode = pincodeCheck.error;
  }

  const microchipCheck = validateMicrochipId(data.microchip_id);
  if (data.microchip_id && !microchipCheck.valid) errors.microchip_id = microchipCheck.error;

  const tagsCheck = validateTags(data.additional_tags);
  if (!tagsCheck.valid) errors.additional_tags = tagsCheck.error;

  if (data.behavior_notes) {
    const behaviorCheck = validateNotes(data.behavior_notes, 'Behavior notes');
    if (!behaviorCheck.valid) errors.behavior_notes = behaviorCheck.error;
  }

  if (data.medical_notes) {
    const medicalCheck = validateNotes(data.medical_notes, 'Medical notes');
    if (!medicalCheck.valid) errors.medical_notes = medicalCheck.error;
  }

  if (data.collar_tag) {
    const collarCheck = validateCollarTag(data.collar_tag);
    if (!collarCheck.valid) errors.collar_tag = collarCheck.error;
  }

  // Validate coordinates if provided
  if (data.last_seen_or_found_coords?.latitude !== undefined && data.last_seen_or_found_coords?.longitude !== undefined) {
    const coordCheck = validateCoordinates(
      data.last_seen_or_found_coords.latitude,
      data.last_seen_or_found_coords.longitude
    );
    if (!coordCheck.valid) {
      errors.last_seen_or_found_coords = coordCheck.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  validatePetData,
  validateSpecies,
  validateSex,
  validateColor,
  validateDistinguishingMarks,
  validateDate,
  validateLocation,
  validateCoordinates,
  validatePincode,
  validateMicrochipId,
  validateTags,
  validateContactPreference,
  validateImageFile,
  validatePhotos,
  sanitizeText,
};

import Pet from '../models/Pet.js';

/**
 * Calculate Haversine distance between two coordinate pairs
 * Returns distance in kilometers
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate similarity score between two strings using simple trigram matching
 * Returns score 0-1
 */
export const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1; // Exact match

  const trigrams1 = new Set();
  for (let i = 0; i < s1.length - 2; i++) {
    trigrams1.add(s1.substring(i, i + 3));
  }

  let matches = 0;
  for (let i = 0; i < s2.length - 2; i++) {
    const trigram = s2.substring(i, i + 3);
    if (trigrams1.has(trigram)) matches++;
  }

  const maxTrigrams = Math.max(s1.length - 2, s2.length - 2);
  return maxTrigrams > 0 ? matches / maxTrigrams : 0;
};

/**
 * Compute matching score for a single pet against query parameters
 * Returns object with score (0-100) and matched_fields array
 */
export const computeMatchScore = (pet, queryParams) => {
  let score = 0;
  const matchedFields = [];
  const details = [];

  // 1. Microchip ID - Highest priority (exact match only)
  if (queryParams.microchip_id && pet.microchip_id) {
    if (pet.microchip_id === queryParams.microchip_id.toUpperCase()) {
      score += 40;
      matchedFields.push('microchip_id');
      details.push({ field: 'microchip_id', confidence: 'exact' });
    }
  }

  // 2. Species - Required match, high weight
  if (queryParams.species && pet.species === queryParams.species) {
    score += 20;
    matchedFields.push('species');
    details.push({ field: 'species', confidence: 'exact' });
  } else if (queryParams.species && pet.species !== queryParams.species) {
    // Species mismatch is significant
    return {
      score: 0,
      matchedFields,
      details,
      reason: 'Species mismatch',
    };
  }

  // 3. Primary color - Medium-high weight with fuzzy matching
  if (queryParams.color_primary) {
    const colorSimilarity = calculateSimilarity(pet.color_primary, queryParams.color_primary);
    if (colorSimilarity > 0.7) {
      score += colorSimilarity * 12;
      matchedFields.push('color_primary');
      details.push({
        field: 'color_primary',
        confidence: colorSimilarity === 1 ? 'exact' : 'fuzzy',
        similarity: colorSimilarity,
      });
    }
  }

  // 4. Secondary color - Medium weight if provided
  if (queryParams.color_secondary && pet.color_secondary) {
    const colorSimilarity = calculateSimilarity(pet.color_secondary, queryParams.color_secondary);
    if (colorSimilarity > 0.7) {
      score += colorSimilarity * 6;
      matchedFields.push('color_secondary');
      details.push({
        field: 'color_secondary',
        confidence: colorSimilarity === 1 ? 'exact' : 'fuzzy',
        similarity: colorSimilarity,
      });
    }
  }

  // 5. Distinguishing marks - High weight with fuzzy matching
  if (queryParams.distinguishing_marks && pet.distinguishing_marks) {
    const marksSimilarity = calculateSimilarity(pet.distinguishing_marks, queryParams.distinguishing_marks);
    if (marksSimilarity > 0.6) {
      score += marksSimilarity * 15;
      matchedFields.push('distinguishing_marks');
      details.push({
        field: 'distinguishing_marks',
        confidence: marksSimilarity === 1 ? 'exact' : 'fuzzy',
        similarity: marksSimilarity,
      });
    }
  }

  // 6. Size - Low-medium weight
  if (queryParams.size && pet.size === queryParams.size) {
    score += 5;
    matchedFields.push('size');
    details.push({ field: 'size', confidence: 'exact' });
  }

  // 7. Sex - Low-medium weight
  if (queryParams.sex && pet.sex === queryParams.sex) {
    score += 5;
    matchedFields.push('sex');
    details.push({ field: 'sex', confidence: 'exact' });
  }

  // 8. Geospatial distance - High weight if within threshold
  if (
    queryParams.latitude !== undefined &&
    queryParams.longitude !== undefined &&
    pet.last_seen_or_found_coords?.coordinates
  ) {
    const [petLon, petLat] = pet.last_seen_or_found_coords.coordinates;
    const distance = haversineDistance(
      queryParams.latitude,
      queryParams.longitude,
      petLat,
      petLon
    );

    const MAX_DISTANCE = queryParams.max_distance_km || 50; // Default 50km
    if (distance <= MAX_DISTANCE) {
      // Closer distance = higher score
      const proximityScore = (1 - distance / MAX_DISTANCE) * 12;
      score += proximityScore;
      matchedFields.push('location');
      details.push({
        field: 'location',
        distance_km: parseFloat(distance.toFixed(2)),
        confidence: distance < 5 ? 'very_close' : distance < 15 ? 'close' : 'near',
      });
    }
  }

  // 9. Date proximity - Medium weight
  if (queryParams.date && pet.last_seen_or_found_date) {
    const queryDate = new Date(queryParams.date);
    const petDate = new Date(pet.last_seen_or_found_date);
    const daysDiff = Math.abs((queryDate - petDate) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 3) {
      // Same date or within 3 days
      score += (1 - daysDiff / 3) * 8;
      matchedFields.push('date');
      details.push({
        field: 'date',
        days_diff: daysDiff,
        confidence: daysDiff === 0 ? 'same_day' : 'close_date',
      });
    }
  }

  // 10. Additional tags matching - Low weight
  if (queryParams.tags && queryParams.tags.length > 0 && pet.additional_tags && pet.additional_tags.length > 0) {
    const matchedTags = queryParams.tags.filter(tag =>
      pet.additional_tags.some(petTag => petTag.toLowerCase() === tag.toLowerCase())
    );
    if (matchedTags.length > 0) {
      score += (matchedTags.length / queryParams.tags.length) * 3;
      matchedFields.push('additional_tags');
      details.push({
        field: 'additional_tags',
        matched_tags: matchedTags,
      });
    }
  }

  // Cap score at 100
  score = Math.min(score, 100);

  return {
    score: Math.round(score),
    matchedFields,
    details,
  };
};

/**
 * Find matching pets based on query parameters
 * Returns array of matches sorted by score (descending)
 */
export const findMatchingPets = async (queryParams, limit = 20) => {
  try {
    // Build MongoDB query
    let mongoQuery = { is_active: true };

    // Filter by report type (opposite of the query)
    // If looking for lost pets, match with found reports
    if (queryParams.report_type) {
      mongoQuery.report_type = queryParams.report_type === 'lost' ? 'found' : 'lost';
    }

    // Filter by species (required)
    if (queryParams.species) {
      mongoQuery.species = queryParams.species;
    }

    // Filter by status (exclude rejected, adopted, etc.)
    mongoQuery.status = { $in: ['Pending Verification', 'Listed Found', 'Listed Lost', 'Matched'] };

    // Filter by location (pincode or text search if provided)
    if (queryParams.pincode) {
      mongoQuery.last_seen_or_found_pincode = queryParams.pincode;
    }

    // Get all matching candidates from DB
    const candidates = await Pet.find(mongoQuery)
      .select('+distinguishing_marks')
      .limit(limit * 2) // Get more for scoring
      .lean();

    // Score each candidate
    const scoredResults = candidates
      .map(pet => ({
        ...pet,
        ...computeMatchScore(pet, queryParams),
      }))
      .filter(result => result.score > 0) // Only keep matches with score > 0
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, limit);

    return scoredResults;
  } catch (error) {
    console.error('Error finding matching pets:', error);
    throw error;
  }
};

/**
 * Find exact microchip match (highest confidence)
 */
export const findMicrochipMatch = async (microchipId) => {
  try {
    const pet = await Pet.findOne({
      microchip_id: microchipId.toUpperCase(),
      is_active: true,
    });

    if (pet) {
      return {
        type: 'microchip',
        score: 100,
        matchedFields: ['microchip_id'],
        pet,
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding microchip match:', error);
    throw error;
  }
};

export default {
  haversineDistance,
  calculateSimilarity,
  computeMatchScore,
  findMatchingPets,
  findMicrochipMatch,
};

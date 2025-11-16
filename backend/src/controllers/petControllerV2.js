import Pet from '../models/Pet.js';
import { validatePetData, validatePhotos, sanitizeText } from '../utils/petValidation.js';
import { findMatchingPets, findMicrochipMatch } from '../utils/petMatching.js';

export const getAllPets = async (req, res, next) => {
  try {
    const { status, species, location, report_type, page = 1, limit = 10 } = req.query;

    let filter = { is_active: true };

    if (status) filter.status = status;
    if (species) filter.species = species;
    if (report_type) filter.report_type = report_type;
    if (location) {
      filter.$or = [
        { last_seen_or_found_location_text: { $regex: location, $options: 'i' } },
        { location: { $regex: location, $options: 'i' } }, // Legacy field support
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pets = await Pet.find(filter)
      .populate('submitted_by', 'name email phone profile_image')
      .populate('verified_by', 'name email')
      .sort({ date_submitted: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Pet.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: pets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPetById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pet = await Pet.findById(id)
      .populate('submitted_by', 'name email phone profile_image address')
      .populate('verified_by', 'name email');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    res.status(200).json({
      success: true,
      data: pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create a lost or found pet report
 * POST /api/pets/lost or /api/pets/found
 */
export const createPetReport = async (req, res, next) => {
  try {
    const reportType = req.body.report_type || (req.path.includes('/lost') ? 'lost' : 'found');
    
    // Parse JSON if coming from multipart form
    let data = { ...req.body, report_type: reportType };

    // Handle nested JSON fields from multipart form
    if (typeof data.last_seen_or_found_coords === 'string') {
      try {
        data.last_seen_or_found_coords = JSON.parse(data.last_seen_or_found_coords);
      } catch (e) {
        // Not JSON, continue
      }
    }

    if (typeof data.additional_tags === 'string') {
      try {
        data.additional_tags = JSON.parse(data.additional_tags);
      } catch (e) {
        data.additional_tags = data.additional_tags.split(',').map(t => t.trim());
      }
    }

    // Validate all fields
    const validation = validatePetData(data);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Validate photos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least 1 photo is required',
        errors: { photos: 'At least 1 photo is required' },
      });
    }

    if (req.files.length > 8) {
      return res.status(400).json({
        success: false,
        message: 'Cannot have more than 8 photos',
        errors: { photos: 'Cannot have more than 8 photos' },
      });
    }

    // Format photos with URLs (assumes photos are already uploaded)
    const photos = req.files.map(file => ({
      url: file.path || file.secure_url || `/${file.path}`,
      original_filename: file.originalname || file.filename,
      uploaded_at: new Date(),
    }));

    // Validate photos structure
    const photoValidation = validatePhotos(photos);
    if (!photoValidation.valid) {
      return res.status(400).json({
        success: false,
        message: photoValidation.error,
        errors: { photos: photoValidation.error },
      });
    }

    // Create pet report
    const petData = {
      report_type: reportType,
      species: data.species,
      breed: data.breed || null,
      sex: data.sex,
      estimated_age: data.estimated_age || 'unknown',
      size: data.size || 'Unknown',
      color_primary: data.color_primary,
      color_secondary: data.color_secondary || null,
      coat_type: data.coat_type || 'Unknown',
      distinguishing_marks: data.distinguishing_marks,
      microchip_id: data.microchip_id || null,
      collar_tag: data.collar_tag || null,
      behavior_notes: data.behavior_notes || null,
      medical_notes: data.medical_notes || null,
      last_seen_or_found_date: new Date(data.last_seen_or_found_date),
      last_seen_or_found_location_text: data.last_seen_or_found_location_text,
      last_seen_or_found_pincode: data.last_seen_or_found_pincode || null,
      photos,
      additional_tags: data.additional_tags || [],
      submitted_by: req.user._id,
      contact_preference: data.contact_preference,
      allow_public_listing: data.allow_public_listing !== false,
      status: 'Pending Verification',
    };

    // Add coordinates if provided
    if (data.last_seen_or_found_coords?.latitude && data.last_seen_or_found_coords?.longitude) {
      petData.last_seen_or_found_coords = {
        type: 'Point',
        coordinates: [data.last_seen_or_found_coords.longitude, data.last_seen_or_found_coords.latitude],
      };
    }

    // For backward compatibility, set legacy fields
    petData.location = data.last_seen_or_found_location_text;
    petData.color = data.color_primary;
    petData.date_found_or_lost = petData.last_seen_or_found_date;

    const pet = await Pet.create(petData);

    res.status(201).json({
      success: true,
      message: `${reportType === 'lost' ? 'Lost' : 'Found'} pet reported successfully`,
      data: pet,
    });
  } catch (error) {
    console.error('Error creating pet report:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Find matching pets based on query parameters
 * GET /api/pets/match
 */
export const matchPets = async (req, res, next) => {
  try {
    const {
      species,
      color_primary,
      color_secondary,
      distinguishing_marks,
      latitude,
      longitude,
      location_text,
      pincode,
      microchip_id,
      date,
      tags,
      report_type,
      max_distance_km = 50,
      limit = 20,
    } = req.query;

    // Check for microchip first (highest priority)
    if (microchip_id) {
      const microchipMatch = await findMicrochipMatch(microchip_id);
      if (microchipMatch) {
        return res.status(200).json({
          success: true,
          microchip_match: true,
          matches: [
            {
              pet_id: microchipMatch.pet._id,
              score: microchipMatch.score,
              matched_fields: microchipMatch.matchedFields,
              pet_summary: microchipMatch.pet,
              distance_km: null,
            },
          ],
        });
      }
    }

    // Build query parameters for fuzzy matching
    const queryParams = {
      species,
      color_primary,
      color_secondary,
      distinguishing_marks,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      pincode,
      microchip_id,
      date,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
      report_type,
      max_distance_km: parseFloat(max_distance_km),
    };

    // Find matches
    const matches = await findMatchingPets(queryParams, parseInt(limit));

    res.status(200).json({
      success: true,
      matches: matches.map(m => ({
        pet_id: m._id,
        score: m.score,
        matched_fields: m.matchedFields,
        pet_summary: {
          id: m._id,
          species: m.species,
          breed: m.breed,
          sex: m.sex,
          color_primary: m.color_primary,
          color_secondary: m.color_secondary,
          distinguishing_marks: m.distinguishing_marks,
          photos: m.photos,
          location: m.last_seen_or_found_location_text,
          date_submitted: m.date_submitted,
          report_type: m.report_type,
          status: m.status,
        },
        distance_km: m.details.find(d => d.field === 'location')?.distance_km || null,
        match_details: m.details,
      })),
      query_summary: queryParams,
    });
  } catch (error) {
    console.error('Error matching pets:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pet = await Pet.findById(id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Check authorization
    if (pet.submitted_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this pet',
      });
    }

    const updatedPet = await Pet.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('submitted_by verified_by');

    res.status(200).json({
      success: true,
      message: 'Pet updated successfully',
      data: updatedPet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pet = await Pet.findById(id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Check authorization
    if (pet.submitted_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this pet',
      });
    }

    // Soft delete
    await Pet.findByIdAndUpdate(id, { is_active: false });

    res.status(200).json({
      success: true,
      message: 'Pet deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyPet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, verification_notes } = req.body;

    // Only admin can verify
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can verify pets',
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const pet = await Pet.findByIdAndUpdate(
      id,
      {
        status,
        verified_by: req.user._id,
        verification_date: new Date(),
        verification_notes: verification_notes || null,
      },
      { new: true }
    );

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pet verified successfully',
      data: pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  getAllPets,
  getPetById,
  createPetReport,
  matchPets,
  updatePet,
  deletePet,
  verifyPet,
};

import Pet from '../models/Pet.js';
import { validatePetData, validatePhotos, sanitizeText } from '../utils/petValidation.js';
import { findMatchingPets, findMicrochipMatch } from '../utils/petMatching.js';
import fs from 'fs';

export const getAllPets = async (req, res, next) => {
  try {
    const { status, species, location, report_type, page = 1, limit = 10 } = req.query;

    let filter = { is_active: true };

    // Validate status (prevent injection)
    const allowedStatuses = [
      'Pending Verification',
      'Listed Found',
      'Listed Lost',
      'Matched',
      'Reunited',
      'Pending Adoption',
      'Available for Adoption',
      'Adopted',
      'Rejected',
    ];
    if (status && allowedStatuses.includes(status)) {
      filter.status = status;
    }

    // Validate species (prevent injection)
    const allowedSpecies = ['Dog', 'Cat', 'Cow', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Horse', 'Bird', 'Rabbit', 'Reptile', 'Other'];
    if (species && allowedSpecies.includes(species)) {
      filter.species = species;
    }

    // Validate report_type (prevent injection)
    const allowedReportTypes = ['found', 'lost'];
    if (report_type && allowedReportTypes.includes(report_type)) {
      filter.report_type = report_type;
    }

    // Sanitize location for regex (already sanitized by middleware, but double-check)
    if (location && typeof location === 'string') {
      const sanitizedLocation = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 500);
      if (sanitizedLocation.length > 0) {
        filter.$or = [
          { last_seen_or_found_location_text: { $regex: sanitizedLocation, $options: 'i' } },
          { location: { $regex: sanitizedLocation, $options: 'i' } }, // Legacy field support
        ];
      }
    }

    // Validate and sanitize pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    const pets = await Pet.find(filter)
      .populate('submitted_by', 'name email phone profile_image')
      .populate('verified_by', 'name email')
      .sort({ date_submitted: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Pet.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: pets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get all pets error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching pets',
    });
  }
};

export const getPetById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID exists and is not undefined/null
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID provided',
      });
    }

    // Validate MongoDB ObjectId format (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID format',
      });
    }

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
    console.error('Get pet by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching pet',
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
    console.log('📸 Received files:', req.files ? req.files.length : 0, 'files');
    console.log('📸 Request body keys:', Object.keys(req.body));
    console.log('📸 Request files type:', typeof req.files);
    console.log('📸 Request files is array:', Array.isArray(req.files));
    
    if (req.files && req.files.length > 0) {
      console.log('📸 File details:', req.files.map(f => ({ 
        originalname: f.originalname, 
        filename: f.filename, 
        path: f.path,
        size: f.size,
        mimetype: f.mimetype
      })));
    } else {
      console.error('❌ No files in req.files');
      console.error('❌ req.files value:', req.files);
    }
    
    if (!req.files || req.files.length === 0) {
      console.error('❌ No photos received in request');
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

    // Convert uploaded images to base64 data URLs and store in database
    const photos = await Promise.all(
      req.files.map(async (file, index) => {
        try {
          // Read the file and convert to base64
          const fileBuffer = fs.readFileSync(file.path);
          const base64Image = fileBuffer.toString('base64');
          const mimeType = file.mimetype || 'image/jpeg';
          
          // Create data URL
          const dataUrl = `data:${mimeType};base64,${base64Image}`;
          
          // Optionally keep the file on disk for static serving
          // Or delete it if you only want base64 storage
          // For now, we'll keep both - file on disk AND base64 in DB
          
          // Get base URL for file serving (fallback option)
          const getBaseUrl = () => {
            if (process.env.BACKEND_URL) {
              return process.env.BACKEND_URL;
            }
            const protocol = req.protocol || 'http';
            const host = req.get('host') || `localhost:${process.env.PORT || 8000}`;
            return `${protocol}://${host}`;
          };
          
          const baseUrl = getBaseUrl();
          const fileUrl = `${baseUrl}/uploads/pets/${file.filename}`;
          
          // Store both data URL and file URL
          // Data URL for immediate display, file URL as fallback
          const photoObj = {
            url: dataUrl, // Store base64 data URL in database
            file_url: fileUrl, // Also store file URL as backup
            original_filename: file.originalname || file.filename,
            uploaded_at: new Date(),
          };
          
          console.log(`📸 Photo ${index + 1} converted to data URL`);
          console.log(`📸 Photo ${index + 1} data URL length:`, dataUrl.length, 'characters');
          console.log(`📸 Photo ${index + 1} file URL:`, fileUrl);
          
          return photoObj;
        } catch (error) {
          console.error(`❌ Error converting photo ${index + 1}:`, error);
          // Fallback to file URL if base64 conversion fails
          const getBaseUrl = () => {
            if (process.env.BACKEND_URL) {
              return process.env.BACKEND_URL;
            }
            const protocol = req.protocol || 'http';
            const host = req.get('host') || `localhost:${process.env.PORT || 8000}`;
            return `${protocol}://${host}`;
          };
          const baseUrl = getBaseUrl();
          return {
            url: `${baseUrl}/uploads/pets/${file.filename}`,
            original_filename: file.originalname || file.filename,
            uploaded_at: new Date(),
          };
        }
      })
    );
    
    console.log('📸 Total photos converted:', photos.length);
    console.log('📸 Photos array structure:', photos.map(p => ({
      url_length: p.url?.length || 0,
      has_file_url: !!p.file_url,
      original_filename: p.original_filename
    })));

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
      collar_tag: data.collar_tag || null,
      behavior_notes: data.behavior_notes || null,
      medical_notes: data.medical_notes || null,
      last_seen_or_found_date: new Date(data.last_seen_or_found_date),
      last_seen_or_found_location_text: data.last_seen_or_found_location_text,
      last_seen_or_found_pincode: data.last_seen_or_found_pincode || null,
      photos: photos, // Ensure photos array is included
      additional_tags: data.additional_tags || [],
      submitted_by: req.user._id,
      contact_preference: data.contact_preference,
      allow_public_listing: data.allow_public_listing !== false,
      status: 'Pending Verification',
    };
    
    // Log petData before saving to verify photos are included
    console.log('📝 Pet data to save:', {
      ...petData,
      photos: petData.photos,
      photosCount: petData.photos?.length || 0,
    });

    // Only set microchip_id if provided (don't set to null or undefined)
    // This ensures the field is omitted from the document if not provided
    if (data.microchip_id && data.microchip_id.trim() !== '') {
      petData.microchip_id = data.microchip_id.trim().toUpperCase();
    }

    // Add coordinates if provided (only set if both lat and lon are valid numbers)
    // IMPORTANT: Only set coordinates if we have valid values, otherwise leave it undefined/null
    if (data.last_seen_or_found_coords && 
        data.last_seen_or_found_coords.latitude !== undefined && 
        data.last_seen_or_found_coords.longitude !== undefined) {
      const lat = parseFloat(data.last_seen_or_found_coords.latitude);
      const lon = parseFloat(data.last_seen_or_found_coords.longitude);
      
      if (!isNaN(lat) && !isNaN(lon) && 
          lat >= -90 && lat <= 90 && 
          lon >= -180 && lon <= 180) {
        petData.last_seen_or_found_coords = {
          type: 'Point',
          coordinates: [lon, lat], // MongoDB format: [longitude, latitude]
        };
      } else {
        // Invalid coordinates - don't set the field at all
        delete petData.last_seen_or_found_coords;
      }
    } else {
      // No coordinates provided - explicitly don't set the field
      delete petData.last_seen_or_found_coords;
    }

    // For backward compatibility, set legacy fields
    petData.location = data.last_seen_or_found_location_text;
    petData.color = data.color_primary;
    petData.date_found_or_lost = petData.last_seen_or_found_date;

    // Ensure microchip_id is completely omitted if not provided (not null)
    // This is important for sparse unique indexes
    if (!petData.microchip_id) {
      delete petData.microchip_id;
    }

    const pet = await Pet.create(petData);
    
    // Log saved pet to verify photos were saved
    console.log('✅ Pet created successfully:');
    console.log('   - Pet ID:', pet._id);
    console.log('   - Photos count:', pet.photos?.length || 0);
    console.log('   - Photos array:', JSON.stringify(pet.photos, null, 2));
    
    // Verify by querying the pet back from database
    const savedPet = await Pet.findById(pet._id);
    console.log('✅ Verified from database:');
    console.log('   - Saved photos count:', savedPet?.photos?.length || 0);
    console.log('   - Saved photos:', JSON.stringify(savedPet?.photos, null, 2));

    res.status(201).json({
      success: true,
      message: `${reportType === 'lost' ? 'Lost' : 'Found'} pet reported successfully`,
      data: pet,
    });
  } catch (error) {
    console.error('Error creating pet report:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating pet report',
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
      message: 'An error occurred while matching pets',
    });
  }
};

export const updatePet = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID format',
      });
    }

    const pet = await Pet.findById(id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Check authorization (prevent unauthorized updates)
    const petOwnerId = pet.submitted_by?.toString() || pet.submitted_by?._id?.toString();
    const userId = req.user._id?.toString() || req.user.id?.toString();
    
    if (petOwnerId !== userId && req.user.role !== 'admin') {
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
    console.error('Update pet error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating pet',
    });
  }
};

export const deletePet = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID format',
      });
    }

    const pet = await Pet.findById(id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Check authorization (prevent unauthorized deletions)
    const petOwnerId = pet.submitted_by?.toString() || pet.submitted_by?._id?.toString();
    const userId = req.user._id?.toString() || req.user.id?.toString();
    
    if (petOwnerId !== userId && req.user.role !== 'admin') {
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
    console.error('Delete pet error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting pet',
    });
  }
};

export const verifyPet = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID format',
      });
    }

    const { status, verification_notes } = req.body;

    // Validate status
    const allowedStatuses = [
      'Pending Verification',
      'Listed Found',
      'Listed Lost',
      'Matched',
      'Reunited',
      'Pending Adoption',
      'Available for Adoption',
      'Adopted',
      'Rejected',
    ];
    
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    // Sanitize verification notes
    const sanitizedNotes = verification_notes && typeof verification_notes === 'string' 
      ? verification_notes.substring(0, 500) 
      : null;

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
    console.error('Verify pet error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying pet',
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

import ShelterRegistration from '../models/ShelterRegistration.js';
import User from '../models/User.js';

/**
 * Register a new shelter
 */
export const registerShelter = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      shelter_name,
      location,
      area_sqft,
      capacity,
      facilities,
      contact_info,
      documents,
      accepts_feeding_data,
    } = req.body;

    // Check if user already has a pending or approved shelter
    const existingShelter = await ShelterRegistration.findOne({
      user: userId,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingShelter) {
      return res.status(400).json({
        success: false,
        message: 'You already have a shelter registration pending or approved',
      });
    }

    const shelter = await ShelterRegistration.create({
      user: userId,
      shelter_name,
      location,
      area_sqft,
      capacity,
      current_occupancy: 0,
      facilities: facilities || [],
      contact_info,
      documents: documents || [],
      accepts_feeding_data: accepts_feeding_data || false,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Shelter registration submitted. Waiting for admin approval.',
      data: shelter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all shelter registrations (admin)
 */
export const getAllShelterRegistrations = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const shelters = await ShelterRegistration.find(filter)
      .populate('user', 'name email phone role')
      .populate('verified_by', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: shelters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get my shelter registration
 */
export const getMyShelter = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const shelter = await ShelterRegistration.findOne({ user: userId })
      .populate('user', 'name email phone')
      .populate('verified_by', 'name email');

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'No shelter registration found',
      });
    }

    res.status(200).json({
      success: true,
      data: shelter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Approve shelter registration (admin)
 */
export const approveShelter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;
    const adminId = req.user._id || req.user.id;

    const shelter = await ShelterRegistration.findById(id);
    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter registration not found',
      });
    }

    shelter.status = 'approved';
    shelter.verified_by = adminId;
    shelter.verified_at = new Date();
    if (admin_notes) shelter.admin_notes = admin_notes;

    await shelter.save();

    // Update user role if needed
    const user = await User.findById(shelter.user);
    if (user && !user.role.includes('shelter')) {
      // You might want to add 'shelter' as a role or use a different approach
    }

    res.status(200).json({
      success: true,
      message: 'Shelter registration approved',
      data: shelter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reject shelter registration (admin)
 */
export const rejectShelter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;
    const adminId = req.user._id || req.user.id;

    const shelter = await ShelterRegistration.findById(id);
    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter registration not found',
      });
    }

    shelter.status = 'rejected';
    shelter.verified_by = adminId;
    shelter.verified_at = new Date();
    if (admin_notes) shelter.admin_notes = admin_notes;

    await shelter.save();

    res.status(200).json({
      success: true,
      message: 'Shelter registration rejected',
      data: shelter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Add shelter directly
 */
export const addShelterByAdmin = async (req, res, next) => {
  try {
    const {
      user_id,
      shelter_name,
      location,
      area_sqft,
      capacity,
      facilities,
      contact_info,
      accepts_feeding_data,
    } = req.body;

    const shelter = await ShelterRegistration.create({
      user: user_id,
      shelter_name,
      location,
      area_sqft,
      capacity,
      current_occupancy: 0,
      facilities: facilities || [],
      contact_info,
      accepts_feeding_data: accepts_feeding_data || false,
      status: 'approved',
      verified_by: req.user._id || req.user.id,
      verified_at: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Shelter added successfully',
      data: shelter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


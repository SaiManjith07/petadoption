import ShelterCapacity from '../models/ShelterCapacity.js';
import Notification from '../models/Notification.js';

/**
 * Create or update shelter capacity
 */
export const createOrUpdateShelterCapacity = async (req, res, next) => {
  try {
    const {
      shelter_name,
      location,
      total_beds,
      available_beds,
      contact_info,
    } = req.body;

    const userId = req.user._id || req.user.id;

    // Check if shelter already exists (by name and location)
    let shelter = await ShelterCapacity.findOne({
      shelter_name,
      'location.pincode': location.pincode,
    });

    if (shelter) {
      // Update existing shelter
      shelter.available_beds = available_beds;
      shelter.total_beds = total_beds;
      shelter.occupied_beds = total_beds - available_beds;
      shelter.last_updated = new Date();
      shelter.updated_by = userId;
      if (contact_info) {
        shelter.contact_info = { ...shelter.contact_info, ...contact_info };
      }
      await shelter.save();
    } else {
      // Create new shelter
      shelter = await ShelterCapacity.create({
        shelter_name,
        location,
        total_beds,
        available_beds,
        occupied_beds: total_beds - available_beds,
        updated_by: userId,
        contact_info: contact_info || {},
      });
    }

    res.status(201).json({
      success: true,
      message: 'Shelter capacity updated successfully',
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
 * Get all shelter capacities
 */
export const getAllShelterCapacities = async (req, res, next) => {
  try {
    const { pincode, city, min_available } = req.query;
    const filter = { is_active: true };

    if (pincode) {
      filter['location.pincode'] = pincode;
    }
    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }
    if (min_available) {
      filter.available_beds = { $gte: parseInt(min_available) };
    }

    const shelters = await ShelterCapacity.find(filter)
      .populate('updated_by', 'name email')
      .sort({ available_beds: -1 });

    res.status(200).json({
      success: true,
      count: shelters.length,
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
 * Get shelter by ID
 */
export const getShelterById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shelter ID format',
      });
    }

    const shelter = await ShelterCapacity.findById(id)
      .populate('updated_by', 'name email');

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found',
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
 * Admin: Approve shelter capacity entry
 */
export const approveShelterCapacity = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shelter ID format',
      });
    }

    const shelter = await ShelterCapacity.findById(id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found',
      });
    }

    shelter.is_active = true;
    await shelter.save();

    res.status(200).json({
      success: true,
      message: 'Shelter capacity approved',
      data: shelter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


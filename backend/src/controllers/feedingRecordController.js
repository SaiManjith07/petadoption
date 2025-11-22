import FeedingRecord from '../models/FeedingRecord.js';
import FeedingPoint from '../models/FeedingPoint.js';
import ShelterRegistration from '../models/ShelterRegistration.js';

/**
 * Create a feeding record
 */
export const createFeedingRecord = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      feeding_point,
      shelter,
      location,
      menu,
      feeding_date,
      photos,
      number_of_animals,
      notes,
    } = req.body;

    // Validate that either feeding_point or shelter is provided
    if (!feeding_point && !shelter) {
      return res.status(400).json({
        success: false,
        message: 'Either feeding_point or shelter must be provided',
      });
    }

    // If feeding_point is provided, verify it exists and is approved
    if (feeding_point) {
      const point = await FeedingPoint.findById(feeding_point);
      if (!point || point.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Feeding point not found or not approved',
        });
      }
    }

    // If shelter is provided, verify it exists and is approved
    if (shelter) {
      const shelterDoc = await ShelterRegistration.findById(shelter);
      if (!shelterDoc || shelterDoc.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Shelter not found or not approved',
        });
      }
      if (!shelterDoc.accepts_feeding_data) {
        return res.status(400).json({
          success: false,
          message: 'This shelter does not accept feeding data',
        });
      }
    }

    const feedingRecord = await FeedingRecord.create({
      feeding_point: feeding_point || null,
      shelter: shelter || null,
      fed_by: userId,
      location,
      menu,
      feeding_date: new Date(feeding_date),
      photos: photos || [],
      number_of_animals: number_of_animals || 1,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Feeding record created successfully',
      data: feedingRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all feeding records
 */
export const getAllFeedingRecords = async (req, res, next) => {
  try {
    const { feeding_point, shelter, fed_by, start_date, end_date } = req.query;
    const filter = {};

    if (feeding_point) filter.feeding_point = feeding_point;
    if (shelter) filter.shelter = shelter;
    if (fed_by) filter.fed_by = fed_by;
    if (start_date || end_date) {
      filter.feeding_date = {};
      if (start_date) filter.feeding_date.$gte = new Date(start_date);
      if (end_date) filter.feeding_date.$lte = new Date(end_date);
    }

    const records = await FeedingRecord.find(filter)
      .populate('feeding_point', 'name location')
      .populate('shelter', 'shelter_name location')
      .populate('fed_by', 'name email')
      .sort({ feeding_date: -1 });

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get my feeding records
 */
export const getMyFeedingRecords = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const records = await FeedingRecord.find({ fed_by: userId })
      .populate('feeding_point', 'name location')
      .populate('shelter', 'shelter_name location')
      .sort({ feeding_date: -1 });

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


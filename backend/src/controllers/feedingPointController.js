import FeedingPoint from '../models/FeedingPoint.js';
import Notification from '../models/Notification.js';
import ShelterRegistration from '../models/ShelterRegistration.js';

/**
 * Create a feeding point
 * Only admins and users with approved shelters can add feeding points
 */
export const createFeedingPoint = async (req, res, next) => {
  try {
    const { name, location, type, description, photos } = req.body;
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    // Check if user is admin or has an approved shelter
    let canAddFeedingPoint = false;
    let autoApprove = false;

    if (userRole === 'admin') {
      canAddFeedingPoint = true;
      autoApprove = true; // Admins get auto-approved
    } else {
      // Check if user has an approved shelter
      const shelter = await ShelterRegistration.findOne({
        user: userId,
        status: 'approved',
      });

      if (shelter) {
        canAddFeedingPoint = true;
        // Shelter users still need admin approval
        autoApprove = false;
      }
    }

    if (!canAddFeedingPoint) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and users with approved shelters can add feeding points. Please register a shelter first.',
      });
    }

    const feedingPoint = await FeedingPoint.create({
      name,
      location,
      type: type || 'both',
      description: description || '',
      added_by: userId,
      photos: photos || [],
      status: autoApprove ? 'approved' : 'pending',
    });

    // If auto-approved (admin), create notification
    if (autoApprove) {
      await Notification.create({
        user: userId,
        type: 'feeding_point_approved',
        title: 'Feeding Point Added',
        message: `Your feeding point "${feedingPoint.name}" has been added and is now visible on the map.`,
        metadata: {
          feeding_point_id: feedingPoint._id,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: autoApprove
        ? 'Feeding point added successfully and is now visible on the map.'
        : 'Feeding point submitted successfully. Admin will review it shortly.',
      data: feedingPoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all feeding points
 */
export const getAllFeedingPoints = async (req, res, next) => {
  try {
    const { pincode, type, status, lat, lng, radius } = req.query;
    const filter = { is_active: true };

    if (pincode) {
      filter['location.pincode'] = pincode;
    }
    if (type) {
      filter.type = type;
    }
    if (status) {
      filter.status = status;
    } else {
      filter.status = 'approved'; // Only show approved by default
    }

    let feedingPoints = await FeedingPoint.find(filter)
      .populate('added_by', 'name email')
      .populate('maintained_by', 'name email')
      .sort({ createdAt: -1 });

    // Filter by radius if coordinates provided
    if (lat && lng && radius) {
      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      feedingPoints = feedingPoints.filter(point => {
        if (!point.location.coordinates.lat || !point.location.coordinates.lng) {
          return false;
        }
        const distance = getDistance(
          centerLat,
          centerLng,
          point.location.coordinates.lat,
          point.location.coordinates.lng
        );
        return distance <= radiusKm;
      });
    }

    res.status(200).json({
      success: true,
      count: feedingPoints.length,
      data: feedingPoints,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get feeding point by ID
 */
export const getFeedingPointById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feeding point ID format',
      });
    }

    const feedingPoint = await FeedingPoint.findById(id)
      .populate('added_by', 'name email')
      .populate('maintained_by', 'name email');

    if (!feedingPoint) {
      return res.status(404).json({
        success: false,
        message: 'Feeding point not found',
      });
    }

    res.status(200).json({
      success: true,
      data: feedingPoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Approve feeding point
 */
export const approveFeedingPoint = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feeding point ID format',
      });
    }

    const feedingPoint = await FeedingPoint.findById(id).populate('added_by');

    if (!feedingPoint) {
      return res.status(404).json({
        success: false,
        message: 'Feeding point not found',
      });
    }

    feedingPoint.status = 'approved';
    await feedingPoint.save();

    // Create notification
    if (feedingPoint.added_by) {
      await Notification.create({
        user: feedingPoint.added_by._id,
        type: 'feeding_point_approved',
        title: 'Feeding Point Approved',
        message: `Your feeding point "${feedingPoint.name}" has been approved and is now visible on the map.`,
        metadata: {
          feeding_point_id: feedingPoint._id,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feeding point approved',
      data: feedingPoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Reject feeding point
 */
export const rejectFeedingPoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feeding point ID format',
      });
    }

    const feedingPoint = await FeedingPoint.findById(id).populate('added_by');

    if (!feedingPoint) {
      return res.status(404).json({
        success: false,
        message: 'Feeding point not found',
      });
    }

    feedingPoint.status = 'rejected';
    await feedingPoint.save();

    // Create notification
    if (feedingPoint.added_by) {
      await Notification.create({
        user: feedingPoint.added_by._id,
        type: 'feeding_point_rejected',
        title: 'Feeding Point Not Approved',
        message: `Your feeding point "${feedingPoint.name}" was not approved. ${reason || 'Please contact support for more information.'}`,
        metadata: {
          feeding_point_id: feedingPoint._id,
          reason,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feeding point rejected',
      data: feedingPoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Helper function to calculate distance between two coordinates (Haversine formula)
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}


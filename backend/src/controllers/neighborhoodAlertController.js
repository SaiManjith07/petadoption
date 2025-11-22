import NeighborhoodAlert from '../models/NeighborhoodAlert.js';
import Pet from '../models/Pet.js';
import Notification from '../models/Notification.js';

/**
 * Create a neighborhood alert
 */
export const createNeighborhoodAlert = async (req, res, next) => {
  try {
    const { pincode, alert_type, pet_id, title, description, location, priority, expires_in_days } = req.body;
    const userId = req.user._id || req.user.id;

    // If pet_id is provided, validate it exists
    if (pet_id) {
      const pet = await Pet.findById(pet_id);
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Pet not found',
        });
      }
    }

    // Calculate expiration date
    const expires_at = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

    const alert = await NeighborhoodAlert.create({
      pincode,
      alert_type,
      pet: pet_id || null,
      title,
      description,
      location: location || {},
      created_by: userId,
      status: 'pending', // Requires admin approval
      priority: priority || 'medium',
      expires_at,
    });

    res.status(201).json({
      success: true,
      message: 'Neighborhood alert submitted successfully. Admin will review it shortly.',
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get alerts by pincode
 */
export const getAlertsByPincode = async (req, res, next) => {
  try {
    const { pincode } = req.params;
    const { alert_type, status } = req.query;

    const filter = {
      pincode,
      status: status || 'active',
    };

    if (alert_type) {
      filter.alert_type = alert_type;
    }

    const alerts = await NeighborhoodAlert.find(filter)
      .populate('pet', 'breed species photos')
      .populate('created_by', 'name email')
      .sort({ priority: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user's alerts
 */
export const getMyAlerts = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status, alert_type } = req.query;

    const filter = { created_by: userId };

    if (status) {
      filter.status = status;
    }
    if (alert_type) {
      filter.alert_type = alert_type;
    }

    const alerts = await NeighborhoodAlert.find(filter)
      .populate('pet', 'breed species photos')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Get all pending alerts
 */
export const getPendingAlerts = async (req, res, next) => {
  try {
    const alerts = await NeighborhoodAlert.find({ status: 'pending' })
      .populate('pet', 'breed species photos')
      .populate('created_by', 'name email')
      .sort({ priority: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Approve alert
 */
export const approveAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id || req.user.id;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert ID format',
      });
    }

    const alert = await NeighborhoodAlert.findById(id).populate('created_by');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    alert.status = 'active';
    alert.verified_by = adminId;
    alert.verified_at = new Date();
    await alert.save();

    // Create notification
    if (alert.created_by) {
      await Notification.create({
        user: alert.created_by._id,
        type: 'alert_approved',
        title: 'Neighborhood Alert Approved',
        message: `Your alert "${alert.title}" has been approved and is now active in pincode ${alert.pincode}.`,
        metadata: {
          alert_id: alert._id,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alert approved successfully',
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Reject alert
 */
export const rejectAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert ID format',
      });
    }

    const alert = await NeighborhoodAlert.findById(id).populate('created_by');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    alert.status = 'rejected';
    alert.verified_by = adminId;
    alert.verified_at = new Date();
    await alert.save();

    // Create notification
    if (alert.created_by) {
      await Notification.create({
        user: alert.created_by._id,
        type: 'alert_rejected',
        title: 'Neighborhood Alert Not Approved',
        message: `Your alert "${alert.title}" was not approved. ${reason || 'Please contact support for more information.'}`,
        metadata: {
          alert_id: alert._id,
          reason,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alert rejected',
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


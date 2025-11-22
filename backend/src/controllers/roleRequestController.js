import RoleRequest from '../models/RoleRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

/**
 * Create a role request (rescuer, feeder, transporter)
 */
export const createRoleRequest = async (req, res, next) => {
  try {
    const { requested_role, reason, experience, availability, resources } = req.body;
    const userId = req.user._id || req.user.id;

    // Validate requested role
    const allowedRoles = ['rescuer', 'feeder', 'transporter'];
    if (!allowedRoles.includes(requested_role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed roles: rescuer, feeder, transporter',
      });
    }

    // Check if user already has this role
    const user = await User.findById(userId);
    if (user.role === requested_role) {
      return res.status(400).json({
        success: false,
        message: `You already have the ${requested_role} role`,
      });
    }

    // Check if there's already a pending request
    const existingRequest = await RoleRequest.findOne({
      user: userId,
      requested_role,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this role',
      });
    }

    // Create new request
    const roleRequest = await RoleRequest.create({
      user: userId,
      requested_role,
      reason: reason || '',
      experience: experience || '',
      availability: availability || '',
      resources: resources || {},
    });

    res.status(201).json({
      success: true,
      message: 'Role request submitted successfully. Admin will review it shortly.',
      data: roleRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user's role requests
 */
export const getMyRoleRequests = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const requests = await RoleRequest.find({ user: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Get all pending role requests
 */
export const getPendingRoleRequests = async (req, res, next) => {
  try {
    const requests = await RoleRequest.find({ status: 'pending' })
      .populate('user', 'name email phone role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Approve role request
 */
export const approveRoleRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format',
      });
    }

    const roleRequest = await RoleRequest.findById(id).populate('user');

    if (!roleRequest) {
      return res.status(404).json({
        success: false,
        message: 'Role request not found',
      });
    }

    if (roleRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${roleRequest.status}`,
      });
    }

    // Update user role
    const user = await User.findById(roleRequest.user._id);
    user.role = roleRequest.requested_role;
    await user.save();

    // Update request status
    roleRequest.status = 'approved';
    roleRequest.reviewed_by = adminId;
    roleRequest.reviewed_at = new Date();
    roleRequest.admin_notes = admin_notes || '';
    await roleRequest.save();

    // Create notification
    await Notification.create({
      user: roleRequest.user._id,
      type: 'role_approved',
      title: `Your ${roleRequest.requested_role} role request has been approved!`,
      message: `Congratulations! Your request to become a ${roleRequest.requested_role} has been approved. You can now access ${roleRequest.requested_role} features.`,
      metadata: {
        role: roleRequest.requested_role,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Role request approved successfully',
      data: roleRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Reject role request
 */
export const rejectRoleRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_notes, reason } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format',
      });
    }

    const roleRequest = await RoleRequest.findById(id).populate('user');

    if (!roleRequest) {
      return res.status(404).json({
        success: false,
        message: 'Role request not found',
      });
    }

    if (roleRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${roleRequest.status}`,
      });
    }

    // Update request status
    roleRequest.status = 'rejected';
    roleRequest.reviewed_by = adminId;
    roleRequest.reviewed_at = new Date();
    roleRequest.admin_notes = admin_notes || reason || '';
    await roleRequest.save();

    // Create notification
    await Notification.create({
      user: roleRequest.user._id,
      type: 'role_rejected',
      title: `Your ${roleRequest.requested_role} role request`,
      message: `Unfortunately, your request to become a ${roleRequest.requested_role} was not approved. ${admin_notes || reason || 'Please contact support for more information.'}`,
      metadata: {
        role: roleRequest.requested_role,
        reason: admin_notes || reason,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Role request rejected',
      data: roleRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


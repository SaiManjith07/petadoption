import User from '../models/User.js';
import Pet from '../models/Pet.js';

/**
 * Admin Dashboard - Get statistics and analytics
 * Only accessible to admin users
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalRescuers = await User.countDocuments({ role: 'rescuer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // Get total pets count
    const totalPets = await Pet.countDocuments();
    const foundPets = await Pet.countDocuments({ type: 'found' });
    const lostPets = await Pet.countDocuments({ type: 'lost' });
    const adoptablePets = await Pet.countDocuments({ type: 'adoption' });

    // Get recent users (last 10)
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent pets (last 10)
    const recentPets = await Pet.find()
      .select('name type breed location status createdAt owner_id')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers + totalRescuers + totalAdmins,
          regular: totalUsers,
          rescuers: totalRescuers,
          admins: totalAdmins,
        },
        pets: {
          total: totalPets,
          found: foundPets,
          lost: lostPets,
          adoptable: adoptablePets,
        },
        recentUsers,
        recentPets,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Get all users with filtering
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, is_active } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (is_active !== undefined) filter.is_active = is_active === 'true';

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Get all pets with filtering
 */
export const getAllPets = async (req, res, next) => {
  try {
    const { type, status, location } = req.query;
    const filter = {};

    if (type) filter.type = type; // 'found', 'lost', 'adoption'
    if (status) filter.status = status; // 'active', 'resolved', 'adopted'
    if (location) filter['location.city'] = new RegExp(location, 'i');

    const pets = await Pet.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pets.length,
      data: pets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Update user status or role
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active, role } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (is_active !== undefined) user.is_active = is_active;
    if (role && role !== 'admin') user.role = role; // Prevent changing to admin via this route

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Delete or deactivate a user
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin accounts',
      });
    }

    // Soft delete - deactivate instead of removing
    user.is_active = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Delete or mark pet as resolved
 */
export const deletePet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'delete' or 'resolve'

    const pet = await Pet.findById(id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    if (action === 'resolve') {
      pet.status = 'resolved';
      await pet.save();
      return res.status(200).json({
        success: true,
        message: 'Pet marked as resolved',
        data: pet,
      });
    }

    // Hard delete
    await Pet.findByIdAndDelete(id);

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

/**
 * Admin: Get all pending pet reports (not verified)
 */
export const getPendingReports = async (req, res, next) => {
  try {
    const { report_type } = req.query; // 'lost', 'found', or both
    const filter = { status: 'Pending Verification' };

    if (report_type && ['lost', 'found'].includes(report_type)) {
      filter.report_type = report_type;
    }

    const pendingReports = await Pet.find(filter)
      .populate('submitted_by', 'name email phone contact_preference')
      .sort({ date_submitted: -1 });

    res.status(200).json({
      success: true,
      count: pendingReports.length,
      data: pendingReports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Accept and verify a pet report
 */
export const acceptReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const pet = await Pet.findById(id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet report not found',
      });
    }

    if (pet.status !== 'Pending Verification') {
      return res.status(400).json({
        success: false,
        message: `Report status is ${pet.status}, cannot verify again`,
      });
    }

    // Update pet status based on report type
    pet.status = pet.report_type === 'found' ? 'Listed Found' : 'Listed Lost';
    pet.verified_by = req.user.id;
    pet.verification_date = new Date();
    pet.verification_notes = notes || 'Approved by admin';

    await pet.save();

    res.status(200).json({
      success: true,
      message: `Report accepted and listed as ${pet.status}`,
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
 * Admin: Reject a pet report
 */
export const rejectReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejection',
      });
    }

    const pet = await Pet.findById(id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet report not found',
      });
    }

    if (pet.status !== 'Pending Verification') {
      return res.status(400).json({
        success: false,
        message: `Report status is ${pet.status}, cannot reject`,
      });
    }

    // Mark as rejected
    pet.status = 'Rejected';
    pet.verified_by = req.user.id;
    pet.verification_date = new Date();
    pet.verification_notes = `Rejected: ${reason}`;

    await pet.save();

    res.status(200).json({
      success: true,
      message: 'Report rejected successfully',
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
 * Admin: Get dashboard stats with pending counts
 */
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    // Pending reports count
    const pendingLostReports = await Pet.countDocuments({
      status: 'Pending Verification',
      report_type: 'lost',
    });
    const pendingFoundReports = await Pet.countDocuments({
      status: 'Pending Verification',
      report_type: 'found',
    });

    // Verified/Active reports count
    const listedLostReports = await Pet.countDocuments({
      status: 'Listed Lost',
    });
    const listedFoundReports = await Pet.countDocuments({
      status: 'Listed Found',
    });

    // Matched reports
    const matchedReports = await Pet.countDocuments({
      status: 'Matched',
    });

    // Reunited reports
    const reunitedReports = await Pet.countDocuments({
      status: 'Reunited',
    });

    // User stats
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalRescuers = await User.countDocuments({ role: 'rescuer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    res.status(200).json({
      success: true,
      data: {
        pending: {
          lost: pendingLostReports,
          found: pendingFoundReports,
          total: pendingLostReports + pendingFoundReports,
        },
        active: {
          lost: listedLostReports,
          found: listedFoundReports,
          total: listedLostReports + listedFoundReports,
        },
        matched: matchedReports,
        reunited: reunitedReports,
        users: {
          total: totalUsers + totalRescuers + totalAdmins,
          regular: totalUsers,
          rescuers: totalRescuers,
          admins: totalAdmins,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

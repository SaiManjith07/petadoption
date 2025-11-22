import User from '../models/User.js';
import Pet from '../models/Pet.js';
import Notification from '../models/Notification.js';
import Chat from '../models/Chat.js';
import ChatRequest from '../models/ChatRequest.js';
import RoleRequest from '../models/RoleRequest.js';
import FeedingPoint from '../models/FeedingPoint.js';
import NeighborhoodAlert from '../models/NeighborhoodAlert.js';
import ShelterRegistration from '../models/ShelterRegistration.js';
import DashboardCache from '../models/DashboardCache.js';

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

    // Validate and sanitize role (prevent injection)
    const allowedRoles = ['user', 'rescuer', 'admin'];
    if (role && allowedRoles.includes(role)) {
      filter.role = role;
    }

    // Validate is_active (must be boolean string)
    if (is_active !== undefined) {
      if (is_active === 'true' || is_active === 'false') {
        filter.is_active = is_active === 'true';
      }
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching users',
    });
  }
};

/**
 * Admin: Get all pets with filtering
 */
export const getAllPets = async (req, res, next) => {
  try {
    const { type, report_type, status, location } = req.query;
    const filter = {};

    // Validate report_type (prevent injection)
    const allowedReportTypes = ['found', 'lost'];
    if (type && allowedReportTypes.includes(type)) {
      filter.report_type = type;
    }
    if (report_type && allowedReportTypes.includes(report_type)) {
      filter.report_type = report_type;
    }

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

    // Sanitize location for regex (already sanitized by middleware, but double-check)
    if (location && typeof location === 'string') {
      const sanitizedLocation = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 500);
      if (sanitizedLocation.length > 0) {
        filter['last_seen_or_found_location_text'] = new RegExp(sanitizedLocation, 'i');
      }
    }

    const pets = await Pet.find(filter)
      .populate('submitted_by', 'name email phone contact_preference is_verified')
      .sort({ date_submitted: -1 });

    res.status(200).json({
      success: true,
      count: pets.length,
      data: pets,
    });
  } catch (error) {
    console.error('Get all pets error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching pets',
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

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deactivating themselves
    if (is_active === false && user._id.toString() === req.user._id?.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    // Validate role (prevent role escalation)
    const allowedRoles = ['user', 'rescuer'];
    if (is_active !== undefined) user.is_active = is_active;
    if (role && allowedRoles.includes(role)) {
      user.role = role; // Prevent changing to admin via this route
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating user',
    });
  }
};

/**
 * Admin: Delete or deactivate a user
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

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
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deactivating user',
    });
  }
};

/**
 * Admin: Delete or mark pet as resolved
 */
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

    const { action } = req.body; // 'delete' or 'resolve'

    // Validate action
    const allowedActions = ['delete', 'resolve'];
    if (action && !allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "delete" or "resolve"',
      });
    }

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
      .populate('submitted_by', 'name email phone contact_preference is_verified')
      .sort({ date_submitted: -1 });

    res.status(200).json({
      success: true,
      count: pendingReports.length,
      data: pendingReports,
    });
  } catch (error) {
    console.error('Get pending reports error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching pending reports',
    });
  }
};

/**
 * Admin: Get all pending adoption requests
 */
export const getPendingAdoptionRequests = async (req, res, next) => {
  try {
    const filter = { status: 'Pending Adoption' };

    const pendingAdoptions = await Pet.find(filter)
      .populate('submitted_by', 'name email phone contact_preference is_verified')
      .sort({ date_submitted: -1 });

    res.status(200).json({
      success: true,
      count: pendingAdoptions.length,
      data: pendingAdoptions,
    });
  } catch (error) {
    console.error('Get pending adoptions error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching pending adoptions',
    });
  }
};

/**
 * Admin: Accept and verify a pet report (Lost/Found)
 * Verification parameters are checked before acceptance
 */
export const acceptReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format',
      });
    }

    const { 
      notes,
      verification_params = {}
    } = req.body;

    // Validate and sanitize verification parameters
    const {
      verified_photos = false,
      verified_location = false,
      verified_contact = false,
      verified_identity = false,
      additional_notes = ''
    } = verification_params;

    // Ensure boolean values
    const verificationChecks = {
      verified_photos: typeof verified_photos === 'boolean' ? verified_photos : false,
      verified_location: typeof verified_location === 'boolean' ? verified_location : false,
      verified_contact: typeof verified_contact === 'boolean' ? verified_contact : false,
      verified_identity: typeof verified_identity === 'boolean' ? verified_identity : false,
    };

    // Sanitize notes
    const sanitizedNotes = notes && typeof notes === 'string' ? notes.substring(0, 500) : null;
    const sanitizedAdditionalNotes = additional_notes && typeof additional_notes === 'string' ? additional_notes.substring(0, 500) : '';

    const pet = await Pet.findById(id).populate('submitted_by', 'name email phone is_verified');

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

    // Verification checks - Admin must verify at least some parameters
    const verificationStatus = {
      photos: verificationChecks.verified_photos || pet.photos?.length > 0,
      location: verificationChecks.verified_location || (pet.last_seen_or_found_location_text && pet.last_seen_or_found_coords),
      contact: verificationChecks.verified_contact || (pet.submitted_by?.phone || pet.submitted_by?.email),
      identity: verificationChecks.verified_identity || pet.submitted_by?.is_verified,
    };

    // Count verified parameters
    const verifiedCount = Object.values(verificationStatus).filter(Boolean).length;
    
    if (verifiedCount < 2) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient verification. At least 2 parameters must be verified (photos, location, contact, identity)',
        verification_status: verificationStatus,
      });
    }

    // Update pet status based on report type
    pet.status = pet.report_type === 'found' ? 'Listed Found' : 'Listed Lost';
    pet.verified_by = req.user.id;
    pet.verification_date = new Date();
    pet.verification_notes = sanitizedNotes || sanitizedAdditionalNotes || `Approved by admin. Verified: ${Object.entries(verificationStatus).filter(([_, v]) => v).map(([k]) => k).join(', ')}`;

    await pet.save();

    // Create notification for the user
    if (pet.submitted_by && pet.submitted_by._id) {
      await Notification.create({
        user: pet.submitted_by._id,
        type: 'report_accepted',
        title: `Your ${pet.report_type === 'found' ? 'Found' : 'Lost'} Pet Report Has Been Accepted!`,
        message: `Great news! Your ${pet.report_type === 'found' ? 'found' : 'lost'} pet report for ${pet.breed || pet.species} has been verified and is now listed. ${notes ? `Admin notes: ${notes}` : ''}`,
        related_pet: pet._id,
        metadata: {
          report_type: pet.report_type,
          status: pet.status,
          verification_notes: pet.verification_notes,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Report accepted and listed as ${pet.status}`,
      data: pet,
      verification_status: verificationChecks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Accept adoption request
 * Verifies adopter before approving adoption
 */
export const acceptAdoptionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid adoption request ID format',
      });
    }

    const { 
      notes,
      verification_params = {}
    } = req.body;

    const {
      verified_adopter_identity = false,
      verified_home_check = false,
      verified_references = false,
      verified_financial_stability = false,
      adopter_id = null,
      additional_notes = ''
    } = verification_params;

    // Validate adopter_id if provided
    if (adopter_id && !/^[0-9a-fA-F]{24}$/.test(adopter_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid adopter ID format',
      });
    }

    // Validate and sanitize verification parameters
    const verificationChecks = {
      verified_adopter_identity: typeof verified_adopter_identity === 'boolean' ? verified_adopter_identity : false,
      verified_home_check: typeof verified_home_check === 'boolean' ? verified_home_check : false,
      verified_references: typeof verified_references === 'boolean' ? verified_references : false,
      verified_financial_stability: typeof verified_financial_stability === 'boolean' ? verified_financial_stability : false,
    };

    // Sanitize notes
    const sanitizedNotes = notes && typeof notes === 'string' ? notes.substring(0, 500) : null;
    const sanitizedAdditionalNotes = additional_notes && typeof additional_notes === 'string' ? additional_notes.substring(0, 500) : '';

    const pet = await Pet.findById(id).populate('submitted_by', 'name email phone');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Check if pet is available for adoption
    if (!['Available for Adoption', 'Pending Adoption'].includes(pet.status)) {
      return res.status(400).json({
        success: false,
        message: `Pet status is ${pet.status}, cannot approve adoption`,
      });
    }

    // Verification status for adoption - More strict requirements
    const verificationStatus = {
      adopter_identity: verificationChecks.verified_adopter_identity,
      home_check: verificationChecks.verified_home_check,
      references: verificationChecks.verified_references,
      financial_stability: verificationChecks.verified_financial_stability,
    };

    // Count verified parameters
    const verifiedCount = Object.values(verificationStatus).filter(Boolean).length;
    
    if (verifiedCount < 3) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient verification for adoption. At least 3 parameters must be verified (identity, home check, references, financial stability)',
        verification_status: verificationStatus,
      });
    }

    // Verify adopter exists if provided
    if (adopter_id) {
      const adopter = await User.findById(adopter_id);
      if (!adopter) {
        return res.status(404).json({
          success: false,
          message: 'Adopter not found',
        });
      }
      if (!adopter.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Adopter account is not active',
        });
      }
    }

    // Update pet status to Adopted
    pet.status = 'Adopted';
    pet.verified_by = req.user.id;
    pet.verification_date = new Date();
    pet.verification_notes = sanitizedNotes || sanitizedAdditionalNotes || `Adoption approved by admin. Verified: ${Object.entries(verificationStatus).filter(([_, v]) => v).map(([k]) => k).join(', ')}`;

    // Store adopter information if provided
    if (adopter_id) {
      pet.adopted_by = adopter_id;
      pet.adoption_date = new Date();
    }

    await pet.save();

    // Create notifications for both submitter and adopter
    if (pet.submitted_by && pet.submitted_by._id) {
      await Notification.create({
        user: pet.submitted_by._id,
        type: 'adoption_accepted',
        title: 'Adoption Request Approved!',
        message: `Your adoption request for ${pet.breed || pet.species} has been approved! ${sanitizedNotes ? `Admin notes: ${sanitizedNotes}` : ''}`,
        related_pet: pet._id,
        metadata: {
          status: pet.status,
          adopter_id: adopter_id,
          verification_notes: pet.verification_notes,
        },
      });
    }

    if (adopter_id) {
      await Notification.create({
        user: adopter_id,
        type: 'adoption_accepted',
        title: 'Congratulations! Your Adoption is Approved!',
        message: `Your adoption request for ${pet.breed || pet.species} has been approved! Please contact the shelter to complete the adoption process.`,
        related_pet: pet._id,
        metadata: {
          status: pet.status,
          verification_notes: pet.verification_notes,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Adoption request approved successfully',
      data: pet,
      verification_status: verificationChecks,
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
    
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format',
      });
    }

    const { reason } = req.body;
    
    // Sanitize rejection reason
    const sanitizedReason = reason && typeof reason === 'string' ? reason.substring(0, 500) : 'No reason provided';

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejection',
      });
    }

    const pet = await Pet.findById(id).populate('submitted_by', 'name email phone');

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
    pet.verification_notes = `Rejected: ${sanitizedReason}`;

    await pet.save();

    // Create notification for the user
    if (pet.submitted_by && pet.submitted_by._id) {
      await Notification.create({
        user: pet.submitted_by._id,
        type: 'report_rejected',
        title: `Your ${pet.report_type === 'found' ? 'Found' : 'Lost'} Pet Report Was Not Approved`,
        message: `Unfortunately, your ${pet.report_type === 'found' ? 'found' : 'lost'} pet report for ${pet.breed || pet.species} was not approved. Reason: ${reason}`,
        related_pet: pet._id,
        metadata: {
          report_type: pet.report_type,
          status: pet.status,
          rejection_reason: reason,
        },
      });
    }

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
 * Admin: Get dashboard stats with pending counts (with caching)
 */
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    const cacheKey = 'admin_dashboard_stats';
    const cacheExpiry = 2 * 60 * 1000; // 2 minutes cache
    
    // Try to get from cache first
    const cached = await DashboardCache.findOne({ 
      cache_key: cacheKey,
      expires_at: { $gt: new Date() }
    });
    
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached.data,
        cached: true,
      });
    }

    // If not cached, fetch fresh data
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

    // Pet stats by report type
    const totalFoundPets = await Pet.countDocuments({ report_type: 'found' });
    const totalLostPets = await Pet.countDocuments({ report_type: 'lost' });
    const adoptablePets = await Pet.countDocuments({
      status: { $in: ['Available for Adoption', 'Pending Adoption'] },
    });

    // User stats
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalRescuers = await User.countDocuments({ role: 'rescuer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const dashboardData = {
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
      pets: {
        found: totalFoundPets,
        lost: totalLostPets,
        adoptable: adoptablePets,
        total: totalFoundPets + totalLostPets + adoptablePets,
      },
      users: {
        total: totalUsers + totalRescuers + totalAdmins,
        regular: totalUsers,
        rescuers: totalRescuers,
        admins: totalAdmins,
      },
    };

    // Cache the data
    await DashboardCache.findOneAndUpdate(
      { cache_key: cacheKey },
      {
        cache_key: cacheKey,
        data: dashboardData,
        expires_at: new Date(Date.now() + cacheExpiry),
        updated_at: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: dashboardData,
      cached: false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin Chat Management - Get all chat requests
 * GET /api/admin/chats/requests
 */
export const getAllChatRequests = async (req, res) => {
  try {
    const requests = await ChatRequest.find()
      .populate('pet_id', 'species breed color_primary')
      .populate('requester_id', 'name email')
      .populate('owner_id', 'name email')
      .sort({ createdAt: -1 });

    // Transform to match frontend expectations
    const transformedRequests = requests.map((req) => ({
      id: req._id,
      _id: req._id,
      petId: req.pet_id?._id || req.pet_id,
      requesterId: req.requester_id?._id || req.requester_id,
      ownerId: req.owner_id?._id || req.owner_id,
      type: req.type,
      message: req.message,
      status: req.status,
      roomId: req.room_id,
      createdAt: req.createdAt,
      respondedAt: req.responded_at,
    }));

    res.status(200).json({
      success: true,
      data: transformedRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch chat requests',
    });
  }
};

/**
 * Admin Chat Management - Get all active chats
 * GET /api/admin/chats
 */
export const getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find({ is_active: true })
      .populate('pet_id', 'species breed color_primary report_type')
      .populate('participants', 'name email')
      .populate('messages.sender_id', 'name email')
      .sort({ createdAt: -1 });

    // Transform to match frontend expectations
    const transformedChats = chats.map((chat) => ({
      roomId: chat.room_id,
      _id: chat._id,
      petId: chat.pet_id?._id || chat.pet_id,
      type: chat.pet_id?.report_type === 'found' ? 'claim' : 'adoption',
      participants: chat.participants?.map((p) => p._id || p) || [],
      messages: chat.messages?.map((msg) => ({
        id: msg._id,
        sender: {
          id: msg.sender_id?._id || msg.sender_id,
          name: msg.sender_id?.name || 'Unknown',
        },
        text: msg.message,
        timestamp: msg.timestamp,
      })) || [],
      createdAt: chat.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: transformedChats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch chats',
    });
  }
};

/**
 * Admin Chat Management - Get chat statistics
 * GET /api/admin/chats/stats
 */
export const getChatStats = async (req, res) => {
  try {
    const pendingRequests = await ChatRequest.countDocuments({ status: 'pending' });
    const activeChats = await Chat.countDocuments({ is_active: true });
    const totalRequests = await ChatRequest.countDocuments();
    const approvedRequests = await ChatRequest.countDocuments({ status: 'approved' });
    const rejectedRequests = await ChatRequest.countDocuments({ status: 'rejected' });

    res.status(200).json({
      success: true,
      data: {
        pending_requests: pendingRequests,
        active_chats: activeChats,
        total_requests: totalRequests,
        approved_requests: approvedRequests,
        rejected_requests: rejectedRequests,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch chat stats',
    });
  }
};

/**
 * Admin Chat Management - Respond to chat request
 * POST /api/admin/chats/requests/:id/respond
 */
export const respondToChatRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format',
      });
    }

    const { approved, admin_notes } = req.body;

    // Validate approved field
    if (typeof approved !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Approved field must be a boolean',
      });
    }

    // Sanitize admin notes
    const sanitizedAdminNotes = admin_notes && typeof admin_notes === 'string' ? admin_notes.substring(0, 500) : null;

    const request = await ChatRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Chat request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed',
      });
    }

    request.status = approved ? 'approved' : 'rejected';
    request.admin_notes = sanitizedAdminNotes;
    request.responded_at = new Date();

    if (approved) {
      // Create chat room when approved
      const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const chat = new Chat({
        room_id: roomId,
        pet_id: request.pet_id,
        participants: [request.requester_id, request.owner_id],
        messages: [],
        is_active: true,
      });
      await chat.save();
      request.room_id = roomId;
    }

    await request.save();

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to respond to chat request',
    });
  }
};

/**
 * Admin Chat Management - Get chat room details
 * GET /api/admin/chats/:roomId
 */
export const getChatRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const chat = await Chat.findOne({ room_id: roomId })
      .populate('pet_id', 'species breed color_primary')
      .populate('participants', 'name email')
      .populate('messages.sender_id', 'name email');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch chat room',
    });
  }
};

/**
 * Admin Chat Management - Close a chat
 * POST /api/admin/chats/:roomId/close
 */
export const closeChat = async (req, res) => {
  try {
    const { roomId } = req.params;
    const chat = await Chat.findOne({ room_id: roomId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    chat.is_active = false;
    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Chat closed successfully',
      data: chat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to close chat',
    });
  }
};

/**
 * Admin: Get user by ID with full details
 * GET /api/admin/users/:id
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user',
    });
  }
};

/**
 * Admin: Get all pending requests (role requests, feeding points, alerts, shelter registrations)
 */
export const getAllPendingRequests = async (req, res, next) => {
  try {
    const [roleRequests, feedingPoints, alerts, shelterRegistrations] = await Promise.all([
      RoleRequest.find({ status: 'pending' })
        .populate('user', 'name email phone role')
        .sort({ createdAt: -1 }),
      FeedingPoint.find({ status: 'pending' })
        .populate('added_by', 'name email')
        .sort({ createdAt: -1 }),
      NeighborhoodAlert.find({ status: 'pending' })
        .populate('created_by', 'name email')
        .populate('pet', 'breed species')
        .sort({ createdAt: -1 }),
      ShelterRegistration.find({ status: 'pending' })
        .populate('user', 'name email phone role')
        .populate('verified_by', 'name email')
        .sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        role_requests: roleRequests,
        feeding_points: feedingPoints,
        alerts: alerts,
        shelter_registrations: shelterRegistrations,
        totals: {
          role_requests: roleRequests.length,
          feeding_points: feedingPoints.length,
          alerts: alerts.length,
          shelter_registrations: shelterRegistrations.length,
          total: roleRequests.length + feedingPoints.length + alerts.length + shelterRegistrations.length,
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

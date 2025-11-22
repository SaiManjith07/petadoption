import HomeCheck from '../models/HomeCheck.js';
import Pet from '../models/Pet.js';
import Notification from '../models/Notification.js';

/**
 * Create a home check request
 */
export const createHomeCheck = async (req, res, next) => {
  try {
    const { pet_id, adopter_id, check_type, scheduled_date } = req.body;
    const userId = req.user._id || req.user.id;

    // Validate pet exists
    const pet = await Pet.findById(pet_id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Create home check
    const homeCheck = await HomeCheck.create({
      pet: pet_id,
      adopter: adopter_id || userId,
      check_type,
      scheduled_date: new Date(scheduled_date),
      conducted_by: userId,
    });

    // Create notification for admin/NGO
    await Notification.create({
      user: userId,
      type: 'home_check_scheduled',
      title: 'Home Check Scheduled',
      message: `A ${check_type === 'pre_adoption' ? 'pre-adoption' : 'post-adoption'} home check has been scheduled for ${pet.breed || pet.species}`,
      related_pet: pet_id,
      metadata: {
        home_check_id: homeCheck._id,
        check_type,
        scheduled_date,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Home check scheduled successfully',
      data: homeCheck,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get home checks for a user
 */
export const getMyHomeChecks = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { check_type, status } = req.query;
    const filter = { $or: [{ adopter: userId }, { conducted_by: userId }] };

    if (check_type) {
      filter.check_type = check_type;
    }
    if (status) {
      filter.status = status;
    }

    const homeChecks = await HomeCheck.find(filter)
      .populate('pet', 'breed species photos')
      .populate('adopter', 'name email phone')
      .populate('conducted_by', 'name email')
      .populate('ngo_id', 'name email')
      .sort({ scheduled_date: -1 });

    res.status(200).json({
      success: true,
      data: homeChecks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update home check (complete it)
 */
export const updateHomeCheck = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { findings, photos, status, next_followup_date } = req.body;
    const userId = req.user._id || req.user.id;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid home check ID format',
      });
    }

    const homeCheck = await HomeCheck.findById(id).populate('pet');

    if (!homeCheck) {
      return res.status(404).json({
        success: false,
        message: 'Home check not found',
      });
    }

    // Update home check
    if (findings) homeCheck.findings = { ...homeCheck.findings, ...findings };
    if (photos) homeCheck.photos = photos;
    if (status) homeCheck.status = status;
    if (next_followup_date) homeCheck.next_followup_date = new Date(next_followup_date);

    if (status === 'completed') {
      homeCheck.completed_date = new Date();
      homeCheck.conducted_by = userId;
    }

    await homeCheck.save();

    // Create notification
    if (status === 'completed') {
      await Notification.create({
        user: homeCheck.adopter,
        type: 'home_check_completed',
        title: 'Home Check Completed',
        message: `The ${homeCheck.check_type === 'pre_adoption' ? 'pre-adoption' : 'post-adoption'} home check has been completed.`,
        related_pet: homeCheck.pet._id,
        metadata: {
          home_check_id: homeCheck._id,
          findings: homeCheck.findings,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Home check updated successfully',
      data: homeCheck,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin/NGO: Get all home checks
 */
export const getAllHomeChecks = async (req, res, next) => {
  try {
    const { check_type, status, ngo_id } = req.query;
    const filter = {};

    if (check_type) filter.check_type = check_type;
    if (status) filter.status = status;
    if (ngo_id) filter.ngo_id = ngo_id;

    const homeChecks = await HomeCheck.find(filter)
      .populate('pet', 'breed species photos')
      .populate('adopter', 'name email phone')
      .populate('conducted_by', 'name email')
      .populate('ngo_id', 'name email')
      .sort({ scheduled_date: -1 });

    res.status(200).json({
      success: true,
      count: homeChecks.length,
      data: homeChecks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


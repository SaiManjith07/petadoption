import Pet from '../models/Pet.js';

export const getAllPets = async (req, res, next) => {
  try {
    const { status, species, location, page = 1, limit = 10 } = req.query;

    let filter = { is_active: true };

    if (status) filter.status = status;
    if (species) filter.species = species;
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pets = await Pet.find(filter)
      .populate('submitted_by', 'name email phone profile_image')
      .populate('verified_by', 'name email')
      .sort({ date_submitted: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Pet.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: pets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPetById = async (req, res, next) => {
  try {
    const { id } = req.params;

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createPet = async (req, res, next) => {
  try {
    const { species, breed, color, location, date_found_or_lost, distinguishing_marks, description } = req.body;

    // Validation
    if (!species || !breed || !color || !location || !date_found_or_lost) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const pet = await Pet.create({
      ...req.body,
      submitted_by: req.user._id,
      status: 'Pending Verification',
    });

    res.status(201).json({
      success: true,
      message: 'Pet reported successfully',
      data: pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pet = await Pet.findById(id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Check authorization
    if (pet.submitted_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pet = await Pet.findById(id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Check authorization
    if (pet.submitted_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this pet',
      });
    }

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

export const verifyPet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Only admin can verify
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can verify pets',
      });
    }

    const pet = await Pet.findByIdAndUpdate(
      id,
      {
        status,
        verified_by: req.user._id,
        verification_date: new Date(),
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

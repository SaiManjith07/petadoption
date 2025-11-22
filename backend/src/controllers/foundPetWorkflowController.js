import Pet from '../models/Pet.js';
import User from '../models/User.js';
import ShelterRegistration from '../models/ShelterRegistration.js';
import ShelterCapacity from '../models/ShelterCapacity.js';
import ChatRequest from '../models/ChatRequest.js';

/**
 * Handle found pet workflow - Step 1: Check if user is volunteer and ask about shelter
 */
export const handleFoundPetInitial = async (req, res, next) => {
  try {
    const { petId } = req.body;
    const userId = req.user._id || req.user.id;

    const pet = await Pet.findById(petId).populate('submitted_by');
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Check if user is the reporter
    const reporterId = pet.submitted_by._id || pet.submitted_by.id;
    if (String(reporterId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to manage this pet',
      });
    }

    const user = await User.findById(userId);
    const isVolunteer = ['rescuer', 'feeder', 'transporter'].includes(user.role);

    // Check if user has registered shelter
    const userShelter = await ShelterRegistration.findOne({
      user: userId,
      status: 'approved',
    });

    res.status(200).json({
      success: true,
      data: {
        is_volunteer: isVolunteer,
        has_shelter: !!userShelter,
        shelter: userShelter,
        pet: pet,
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
 * Handle found pet - User wants to provide shelter
 */
export const offerShelterForFoundPet = async (req, res, next) => {
  try {
    const { petId, shelterId, notes } = req.body;
    const userId = req.user._id || req.user.id;

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Add shelter offer
    pet.shelter_offers.push({
      offered_by: userId,
      shelter_id: shelterId,
      status: 'pending',
      notes,
    });

    await pet.save();

    res.status(200).json({
      success: true,
      message: 'Shelter offer submitted',
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
 * Handle found pet - User doesn't want to provide shelter, suggest nearby shelters
 */
export const getNearbyShelters = async (req, res, next) => {
  try {
    const { petId } = req.params;
    const { pincode, city } = req.query;

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    const searchPincode = pincode || pet.last_seen_or_found_pincode;
    const searchCity = city || pet.last_seen_or_found_location_text;

    let filter = { is_active: true, available_beds: { $gt: 0 } };
    if (searchPincode) {
      filter['location.pincode'] = searchPincode;
    }
    if (searchCity) {
      filter['location.city'] = { $regex: searchCity, $options: 'i' };
    }

    const shelters = await ShelterCapacity.find(filter)
      .sort({ available_beds: -1 })
      .limit(10);

    // Also get registered shelters
    const registeredShelters = await ShelterRegistration.find({
      status: 'approved',
      ...filter,
    })
      .populate('user', 'name email phone')
      .sort({ capacity: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        capacity_shelters: shelters,
        registered_shelters: registeredShelters,
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
 * Handle found pet - User willing to move pet to nearby shelter
 */
export const movePetToShelter = async (req, res, next) => {
  try {
    const { petId, shelterId, received } = req.body;
    const userId = req.user._id || req.user.id;

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    pet.reporter_willing_to_move_to_shelter = true;
    pet.reporter_received_pet = received || false;

    if (shelterId) {
      pet.current_shelter = shelterId;
      pet.current_location_type = 'shelter';
    }

    await pet.save();

    res.status(200).json({
      success: true,
      message: 'Pet movement information updated',
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
 * Handle found pet - Send to nearby volunteers
 */
export const sendToNearbyVolunteers = async (req, res, next) => {
  try {
    const { petId } = req.body;
    const userId = req.user._id || req.user.id;

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Find volunteers near the pet location
    const pincode = pet.last_seen_or_found_pincode;
    const city = pet.last_seen_or_found_location_text;

    let locationFilter = {};
    if (pincode) {
      locationFilter['address.pincode'] = pincode;
    }

    // Find volunteers (rescuer, feeder, transporter roles)
    const volunteers = await User.find({
      role: { $in: ['rescuer', 'feeder', 'transporter'] },
      is_active: true,
      ...locationFilter,
    }).limit(20);

    // Create volunteer offers for the pet
    const volunteerOffers = volunteers.map(volunteer => ({
      volunteer_id: volunteer._id,
      status: 'pending',
      notes: `Pet found near ${city || pincode}`,
    }));

    pet.volunteer_offers = volunteerOffers;
    await pet.save();

    res.status(200).json({
      success: true,
      message: `Pet information sent to ${volunteers.length} nearby volunteers`,
      data: {
        pet,
        volunteers_notified: volunteers.length,
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
 * Volunteer accepts to take care of pet
 */
export const volunteerAcceptsPet = async (req, res, next) => {
  try {
    const { petId } = req.body;
    const volunteerId = req.user._id || req.user.id;

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Find and update volunteer offer
    const offer = pet.volunteer_offers.find(
      (o) => String(o.volunteer_id) === String(volunteerId)
    );

    if (!offer) {
      return res.status(400).json({
        success: false,
        message: 'No volunteer offer found for this pet',
      });
    }

    offer.status = 'accepted';
    pet.current_care_provider = volunteerId;
    pet.current_location_type = 'volunteer';
    pet.care_start_date = new Date();

    // Reject other offers
    pet.volunteer_offers.forEach((o) => {
      if (String(o.volunteer_id) !== String(volunteerId)) {
        o.status = 'rejected';
      }
    });

    await pet.save();

    // Create chat request between reporter and volunteer
    const chatRequest = await ChatRequest.create({
      petId: pet._id,
      requesterId: pet.submitted_by,
      responderId: volunteerId,
      type: 'claim',
      message: `Volunteer ${req.user.name} has accepted to take care of the found pet`,
      status: 'approved',
    });

    res.status(200).json({
      success: true,
      message: 'You have accepted to take care of this pet',
      data: {
        pet,
        chat_request: chatRequest,
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
 * Check if pet should move to adoption (15 days)
 */
export const checkAdoptionEligibility = async (req, res, next) => {
  try {
    const { petId } = req.params;

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    const careStartDate = pet.care_start_date || pet.date_submitted || pet.createdAt;
    const daysInCare = Math.floor(
      (new Date().getTime() - new Date(careStartDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    pet.days_in_care = daysInCare;

    const eligibleForAdoption = daysInCare >= 15;

    res.status(200).json({
      success: true,
      data: {
        pet,
        days_in_care: daysInCare,
        eligible_for_adoption: eligibleForAdoption,
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
 * Move pet to adoption after 15 days
 */
export const moveToAdoption = async (req, res, next) => {
  try {
    const { petId, reporter_wants_to_keep, shelter_wants_to_keep } = req.body;

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // If reporter wants to keep, don't move to adoption
    if (reporter_wants_to_keep) {
      pet.reporter_wants_to_keep = true;
      pet.status = 'Reunited';
      await pet.save();
      return res.status(200).json({
        success: true,
        message: 'Pet will remain with reporter',
        data: pet,
      });
    }

    // If in shelter and shelter wants to keep
    if (pet.current_shelter && shelter_wants_to_keep) {
      pet.status = 'Reunited';
      await pet.save();
      return res.status(200).json({
        success: true,
        message: 'Pet will remain with shelter',
        data: pet,
      });
    }

    // Move to adoption
    pet.status = 'Available for Adoption';
    await pet.save();

    res.status(200).json({
      success: true,
      message: 'Pet moved to adoption',
      data: pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


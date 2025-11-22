import Pet from '../models/Pet.js';
import User from '../models/User.js';
import ShelterRegistration from '../models/ShelterRegistration.js';
import ChatRequest from '../models/ChatRequest.js';

/**
 * Match lost pet with found pets (including in shelters and with users)
 */
export const matchLostPet = async (req, res, next) => {
  try {
    const { petId } = req.params;

    const lostPet = await Pet.findById(petId)
      .populate('submitted_by', 'name email phone');
    
    if (!lostPet || lostPet.report_type !== 'lost') {
      return res.status(400).json({
        success: false,
        message: 'Pet not found or not a lost pet',
      });
    }

    // Find matching found pets
    const matchingCriteria = {
      report_type: 'found',
      species: lostPet.species,
      is_active: true,
      status: { $in: ['Listed Found', 'Pending Verification'] },
    };

    // If breed is known, include it
    if (lostPet.breed) {
      matchingCriteria.breed = lostPet.breed;
    }

    // If pincode is known, search nearby
    if (lostPet.last_seen_or_found_pincode) {
      matchingCriteria.last_seen_or_found_pincode = lostPet.last_seen_or_found_pincode;
    }

    const foundPets = await Pet.find(matchingCriteria)
      .populate('submitted_by', 'name email phone')
      .populate('current_care_provider', 'name email phone')
      .populate('current_shelter')
      .limit(20);

    // Also check pets in shelters
    const shelterPets = await Pet.find({
      ...matchingCriteria,
      current_location_type: 'shelter',
    })
      .populate('current_shelter')
      .populate('submitted_by', 'name email phone');

    // Also check pets with volunteers/users
    const userPets = await Pet.find({
      ...matchingCriteria,
      current_location_type: { $in: ['volunteer', 'reporter'] },
    })
      .populate('current_care_provider', 'name email phone')
      .populate('submitted_by', 'name email phone');

    const allMatches = [...foundPets, ...shelterPets, ...userPets];

    res.status(200).json({
      success: true,
      data: {
        lost_pet: lostPet,
        matches: allMatches,
        match_count: allMatches.length,
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
 * Request claim for lost pet
 */
export const requestClaim = async (req, res, next) => {
  try {
    const { lostPetId, foundPetId } = req.body;
    const userId = req.user._id || req.user.id;

    const lostPet = await Pet.findById(lostPetId);
    const foundPet = await Pet.findById(foundPetId)
      .populate('submitted_by')
      .populate('current_care_provider')
      .populate('current_shelter');

    if (!lostPet || !foundPet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Determine who to contact
    let contactUserId = null;
    if (foundPet.current_location_type === 'shelter' && foundPet.current_shelter) {
      const shelter = await ShelterRegistration.findById(foundPet.current_shelter);
      contactUserId = shelter?.user;
    } else if (foundPet.current_location_type === 'volunteer' && foundPet.current_care_provider) {
      contactUserId = foundPet.current_care_provider._id || foundPet.current_care_provider.id;
    } else {
      contactUserId = foundPet.submitted_by._id || foundPet.submitted_by.id;
    }

    // Create chat request
    const chatRequest = await ChatRequest.create({
      petId: foundPetId,
      requesterId: userId,
      responderId: contactUserId,
      type: 'claim',
      message: `I believe this is my lost pet. Please verify.`,
      status: 'pending',
    });

    // Update lost pet status
    lostPet.status = 'Matched';
    await lostPet.save();

    res.status(201).json({
      success: true,
      message: 'Claim request submitted. Waiting for admin verification.',
      data: {
        chat_request: chatRequest,
        lost_pet: lostPet,
        found_pet: foundPet,
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
 * Admin verifies claim and connects users
 */
export const verifyClaim = async (req, res, next) => {
  try {
    const { chatRequestId, approved } = req.body;
    const adminId = req.user._id || req.user.id;

    const chatRequest = await ChatRequest.findById(chatRequestId)
      .populate('petId')
      .populate('requesterId')
      .populate('responderId');

    if (!chatRequest) {
      return res.status(404).json({
        success: false,
        message: 'Chat request not found',
      });
    }

    if (approved) {
      chatRequest.status = 'approved';
      await chatRequest.save();

      // Update pet status
      const pet = await Pet.findById(chatRequest.petId);
      if (pet) {
        pet.status = 'Reunited';
        await pet.save();
      }
    } else {
      chatRequest.status = 'rejected';
      await chatRequest.save();
    }

    res.status(200).json({
      success: true,
      message: approved ? 'Claim verified. Users can now chat.' : 'Claim rejected',
      data: chatRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


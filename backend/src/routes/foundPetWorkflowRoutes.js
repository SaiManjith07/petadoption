import express from 'express';
import { protect } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/security.js';
import {
  handleFoundPetInitial,
  offerShelterForFoundPet,
  getNearbyShelters,
  movePetToShelter,
  sendToNearbyVolunteers,
  volunteerAcceptsPet,
  checkAdoptionEligibility,
  moveToAdoption,
} from '../controllers/foundPetWorkflowController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/initial-check', handleFoundPetInitial);
router.post('/offer-shelter', offerShelterForFoundPet);
router.get('/nearby-shelters/:petId', validateObjectId, getNearbyShelters);
router.post('/move-to-shelter', movePetToShelter);
router.post('/send-to-volunteers', sendToNearbyVolunteers);
router.post('/volunteer-accept', volunteerAcceptsPet);
router.get('/adoption-eligibility/:petId', validateObjectId, checkAdoptionEligibility);
router.post('/move-to-adoption', moveToAdoption);

export default router;


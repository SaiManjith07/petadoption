import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/security.js';
import {
  matchLostPet,
  requestClaim,
  verifyClaim,
} from '../controllers/lostPetWorkflowController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/match/:petId', validateObjectId, matchLostPet);
router.post('/request-claim', requestClaim);
router.post('/verify-claim', authorize('admin'), verifyClaim);

export default router;


import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/security.js';
import {
  createOrUpdateShelterCapacity,
  getAllShelterCapacities,
  getShelterById,
  approveShelterCapacity,
} from '../controllers/shelterCapacityController.js';

const router = express.Router();

// Public routes
router.get('/', getAllShelterCapacities);
router.get('/:id', validateObjectId, getShelterById);

// Protected routes (users with rescuer/feeder/transporter/admin roles)
router.post('/', protect, createOrUpdateShelterCapacity);

// Admin routes
router.post('/:id/approve', protect, authorize('admin'), validateObjectId, approveShelterCapacity);

export default router;


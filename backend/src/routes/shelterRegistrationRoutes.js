import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/security.js';
import {
  registerShelter,
  getAllShelterRegistrations,
  getMyShelter,
  approveShelter,
  rejectShelter,
  addShelterByAdmin,
} from '../controllers/shelterRegistrationController.js';

const router = express.Router();

// User routes
router.post('/', protect, registerShelter);
router.get('/my', protect, getMyShelter);

// Admin routes
router.get('/all', protect, authorize('admin'), getAllShelterRegistrations);
router.post('/:id/approve', protect, authorize('admin'), validateObjectId, approveShelter);
router.post('/:id/reject', protect, authorize('admin'), validateObjectId, rejectShelter);
router.post('/add', protect, authorize('admin'), addShelterByAdmin);

export default router;


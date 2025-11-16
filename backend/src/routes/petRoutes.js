import express from 'express';
import {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  verifyPet,
} from '../controllers/petController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllPets);
router.get('/:id', getPetById);

// Protected routes
router.post('/', protect, createPet);
router.put('/:id', protect, updatePet);
router.delete('/:id', protect, deletePet);

// Admin routes
router.patch('/:id/verify', protect, authorize('admin'), verifyPet);

export default router;

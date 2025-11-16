import express from 'express';
import {
  getAllPets,
  getPetById,
  createPetReport,
  matchPets,
  updatePet,
  deletePet,
  verifyPet,
} from '../controllers/petControllerV2.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadPetPhotos, handleUploadErrors } from '../middleware/uploadPets.js';

const router = express.Router();

// Public routes
router.get('/', getAllPets);
router.get('/:id', getPetById);

// Search & matching endpoints
router.get('/match/search', matchPets); // GET /api/pets/match/search?species=Dog&color=brown&lat=...

// Protected routes for creating reports
router.post('/lost', protect, uploadPetPhotos, handleUploadErrors, createPetReport);
router.post('/found', protect, uploadPetPhotos, handleUploadErrors, createPetReport);

// Generic create (for backward compatibility)
router.post('/', protect, uploadPetPhotos, handleUploadErrors, createPetReport);

// Update & delete
router.put('/:id', protect, updatePet);
router.delete('/:id', protect, deletePet);

// Admin routes
router.patch('/:id/verify', protect, authorize('admin'), verifyPet);

export default router;

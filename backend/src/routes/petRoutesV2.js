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
import { validateObjectId, petCreationRateLimiter, uploadRateLimiter } from '../middleware/security.js';

const router = express.Router();

// Public routes
router.get('/', getAllPets);
router.get('/:id', validateObjectId, getPetById);

// Search & matching endpoints
router.get('/match/search', matchPets); // GET /api/pets/match/search?species=Dog&color=brown&lat=...

// Protected routes for creating reports (with rate limiting)
router.post('/lost', protect, petCreationRateLimiter, uploadRateLimiter, uploadPetPhotos, handleUploadErrors, createPetReport);
router.post('/found', protect, petCreationRateLimiter, uploadRateLimiter, uploadPetPhotos, handleUploadErrors, createPetReport);

// Generic create (for backward compatibility)
router.post('/', protect, petCreationRateLimiter, uploadRateLimiter, uploadPetPhotos, handleUploadErrors, createPetReport);

// Update & delete (with ObjectId validation)
router.put('/:id', protect, validateObjectId, updatePet);
router.delete('/:id', protect, validateObjectId, deletePet);

// Admin routes
router.patch('/:id/verify', protect, authorize('admin'), validateObjectId, verifyPet);

export default router;

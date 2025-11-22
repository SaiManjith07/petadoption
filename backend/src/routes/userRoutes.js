import express from 'express';
import { protect } from '../middleware/auth.js';
import { updateUser, getUser } from '../controllers/userController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Update user profile
router.patch('/:id', updateUser);

// Get user by ID
router.get('/:id', getUser);

export default router;


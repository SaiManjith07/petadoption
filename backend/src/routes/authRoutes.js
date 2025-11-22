import express from 'express';
import { register, login, getMe, updatePassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/security.js';

const router = express.Router();

// Apply rate limiting to authentication routes
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', protect, getMe);
router.patch('/update-password', protect, authRateLimiter, updatePassword);

export default router;

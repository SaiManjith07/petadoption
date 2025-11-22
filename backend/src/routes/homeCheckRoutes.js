import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/security.js';
import {
  createHomeCheck,
  getMyHomeChecks,
  updateHomeCheck,
  getAllHomeChecks,
} from '../controllers/homeCheckController.js';

const router = express.Router();

// User routes
router.post('/', protect, createHomeCheck);
router.get('/my', protect, getMyHomeChecks);
router.patch('/:id', protect, validateObjectId, updateHomeCheck);

// Admin/NGO routes
router.get('/all', protect, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'rescuer') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin or rescuer role required.',
  });
}, getAllHomeChecks);

export default router;


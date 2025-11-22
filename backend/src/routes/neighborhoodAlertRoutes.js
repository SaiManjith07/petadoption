import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/security.js';
import {
  createNeighborhoodAlert,
  getAlertsByPincode,
  getMyAlerts,
  getPendingAlerts,
  approveAlert,
  rejectAlert,
} from '../controllers/neighborhoodAlertController.js';

const router = express.Router();

// Public routes
router.get('/pincode/:pincode', getAlertsByPincode);

// User routes
router.post('/', protect, createNeighborhoodAlert);
router.get('/my', protect, getMyAlerts);

// Admin routes
router.get('/pending', protect, authorize('admin'), getPendingAlerts);
router.post('/:id/approve', protect, authorize('admin'), validateObjectId, approveAlert);
router.post('/:id/reject', protect, authorize('admin'), validateObjectId, rejectAlert);

export default router;


import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/security.js';
import {
  createFeedingPoint,
  getAllFeedingPoints,
  getFeedingPointById,
  approveFeedingPoint,
  rejectFeedingPoint,
} from '../controllers/feedingPointController.js';

const router = express.Router();

// Public routes
router.get('/', getAllFeedingPoints);
router.get('/:id', validateObjectId, getFeedingPointById);

// User routes
router.post('/', protect, createFeedingPoint);

// Admin routes
router.post('/:id/approve', protect, authorize('admin'), validateObjectId, approveFeedingPoint);
router.post('/:id/reject', protect, authorize('admin'), validateObjectId, rejectFeedingPoint);

export default router;


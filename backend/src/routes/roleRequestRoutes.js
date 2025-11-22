import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/security.js';
import {
  createRoleRequest,
  getMyRoleRequests,
  getPendingRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
} from '../controllers/roleRequestController.js';

const router = express.Router();

// User routes
router.post('/', protect, createRoleRequest);
router.get('/my', protect, getMyRoleRequests);

// Admin routes
router.get('/pending', protect, authorize('admin'), getPendingRoleRequests);
router.post('/:id/approve', protect, authorize('admin'), validateObjectId, approveRoleRequest);
router.post('/:id/reject', protect, authorize('admin'), validateObjectId, rejectRoleRequest);

export default router;


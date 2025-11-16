import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getDashboardStats,
  getAdminDashboardStats,
  getAllUsers,
  getAllPets,
  updateUser,
  deleteUser,
  deletePet,
  getPendingReports,
  acceptReport,
  rejectReport,
} from '../controllers/adminController.js';

const router = express.Router();

// Protect all admin routes - only admins can access
router.use(protect, authorize('admin'));

/**
 * Dashboard Stats
 * GET /api/admin/dashboard - Enhanced dashboard with pending counts
 */
router.get('/dashboard', getAdminDashboardStats);

/**
 * Pending Reports Management
 * GET /api/admin/pending - Get all pending reports (not verified)
 * POST /api/admin/pending/:id/accept - Accept and verify a report
 * POST /api/admin/pending/:id/reject - Reject a report
 */
router.get('/pending', getPendingReports);
router.post('/pending/:id/accept', acceptReport);
router.post('/pending/:id/reject', rejectReport);

/**
 * User Management
 * GET /api/admin/users - Get all users
 * PATCH /api/admin/users/:id - Update user
 * DELETE /api/admin/users/:id - Deactivate user
 */
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

/**
 * Pet Management
 * GET /api/admin/pets - Get all pets
 * DELETE /api/admin/pets/:id - Delete or resolve pet
 */
router.get('/pets', getAllPets);
router.delete('/pets/:id', deletePet);

export default router;

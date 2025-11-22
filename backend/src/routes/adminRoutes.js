import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId, adminRateLimiter } from '../middleware/security.js';
import {
  getDashboardStats,
  getAdminDashboardStats,
  getAllUsers,
  getUserById,
  getAllPets,
  updateUser,
  deleteUser,
  deletePet,
  getPendingReports,
  acceptReport,
  rejectReport,
  acceptAdoptionRequest,
  getPendingAdoptionRequests,
  getAllChatRequests,
  getAllChats,
  getChatStats,
  respondToChatRequest,
  getChatRoom,
  closeChat,
  getAllPendingRequests,
} from '../controllers/adminController.js';

const router = express.Router();

// Protect all admin routes - only admins can access
router.use(protect, authorize('admin'));

// Apply more lenient rate limiting for admin routes
router.use(adminRateLimiter);

/**
 * Dashboard Stats
 * GET /api/admin/dashboard - Enhanced dashboard with pending counts
 */
router.get('/dashboard', getAdminDashboardStats);

/**
 * Pending Reports Management
 * GET /api/admin/pending - Get all pending reports (not verified)
 * POST /api/admin/pending/:id/accept - Accept and verify a report (Lost/Found)
 * POST /api/admin/pending/:id/reject - Reject a report
 */
router.get('/pending', getPendingReports);
router.post('/pending/:id/accept', validateObjectId, acceptReport);
router.post('/pending/:id/reject', validateObjectId, rejectReport);

/**
 * Adoption Management
 * GET /api/admin/adoptions/pending - Get all pending adoption requests
 * POST /api/admin/adoptions/:id/accept - Accept and verify an adoption request
 */
router.get('/adoptions/pending', getPendingAdoptionRequests);
router.post('/adoptions/:id/accept', validateObjectId, acceptAdoptionRequest);

/**
 * User Management
 * GET /api/admin/users - Get all users
 * GET /api/admin/users/:id - Get user by ID
 * PATCH /api/admin/users/:id - Update user
 * DELETE /api/admin/users/:id - Deactivate user
 */
router.get('/users', getAllUsers);
router.get('/users/:id', validateObjectId, getUserById);
router.patch('/users/:id', validateObjectId, updateUser);
router.delete('/users/:id', validateObjectId, deleteUser);

/**
 * Pet Management
 * GET /api/admin/pets - Get all pets
 * DELETE /api/admin/pets/:id - Delete or resolve pet
 */
router.get('/pets', getAllPets);
router.delete('/pets/:id', validateObjectId, deletePet);

/**
 * Chat Management
 * GET /api/admin/chats/requests - Get all chat requests
 * GET /api/admin/chats - Get all active chats
 * GET /api/admin/chats/stats - Get chat statistics
 * GET /api/admin/chats/:roomId - Get chat room details
 * POST /api/admin/chats/requests/:id/respond - Respond to chat request
 * POST /api/admin/chats/:roomId/close - Close a chat
 */
router.get('/chats/requests', getAllChatRequests);
router.get('/chats', getAllChats);
router.get('/chats/stats', getChatStats);
router.get('/chats/:roomId', getChatRoom);
router.post('/chats/requests/:id/respond', validateObjectId, respondToChatRequest);
router.post('/chats/:roomId/close', closeChat);

/**
 * All Pending Requests
 * GET /api/admin/pending-requests - Get all pending requests (role requests, feeding points, alerts)
 */
router.get('/pending-requests', getAllPendingRequests);

export default router;

import express from 'express';
import { protect } from '../middleware/auth.js';
import { adminRateLimiter } from '../middleware/security.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// Apply more lenient rate limiting for notifications
router.use(adminRateLimiter);

/**
 * Notification Routes
 * GET /api/notifications - Get all notifications
 * GET /api/notifications/unread-count - Get unread count
 * PATCH /api/notifications/:id/read - Mark notification as read
 * PATCH /api/notifications/read-all - Mark all as read
 * DELETE /api/notifications/:id - Delete notification
 */
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;



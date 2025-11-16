import express from 'express';
import { protect } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/security.js';
import {
  getUserChats,
  getChatRequests,
  respondToChatRequest,
  getChatRoom,
  sendMessage,
  requestChat,
} from '../controllers/chatController.js';

const router = express.Router();

// All chat routes require authentication
router.use(protect);

/**
 * User Chat Routes
 * GET /api/chats - Get all chats for the authenticated user
 * GET /api/chats/requests - Get chat requests for the user
 * GET /api/chats/:roomId - Get specific chat room
 * POST /api/chats/request - Request a chat with pet owner/finder
 * POST /api/chats/requests/:id/respond - Approve/reject chat request
 * POST /api/chats/:roomId/message - Send a message in a chat room
 */
router.get('/', getUserChats);
router.get('/requests', getChatRequests);
router.get('/:roomId', getChatRoom);
router.post('/request', requestChat);
router.post('/requests/:id/respond', validateObjectId, respondToChatRequest);
router.post('/:roomId/message', sendMessage);

export default router;


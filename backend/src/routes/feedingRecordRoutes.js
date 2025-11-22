import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createFeedingRecord,
  getAllFeedingRecords,
  getMyFeedingRecords,
} from '../controllers/feedingRecordController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes
router.post('/', createFeedingRecord);
router.get('/my', getMyFeedingRecords);
router.get('/', getAllFeedingRecords);

export default router;


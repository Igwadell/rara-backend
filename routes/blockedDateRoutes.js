import express from 'express';
import {
  getBlockedDates,
  createBlockedDate,
  updateBlockedDate,
  deleteBlockedDate,
  getBlockedDate
} from '../controllers/blockedDateController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Public routes
router.get('/', getBlockedDates);
router.get('/:id', getBlockedDate);

// Protected routes (Landlord, Admin)
router.post('/', protect, authorize('landlord', 'admin'), createBlockedDate);
router.put('/:id', protect, authorize('landlord', 'admin'), updateBlockedDate);
router.delete('/:id', protect, authorize('landlord', 'admin'), deleteBlockedDate);

export default router; 
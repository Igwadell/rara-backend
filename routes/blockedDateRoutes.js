import express from 'express';
import {
  getBlockedDates,
  createBlockedDate,
  updateBlockedDate,
  deleteBlockedDate,
  getBlockedDate,
  blockPastDates,
  unblockPastDates,
  checkPastDatesBlocked
} from '../controllers/blockedDateController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Public routes
router.get('/', getBlockedDates);
router.get('/check-past-dates', checkPastDatesBlocked);

// Protected routes (Landlord, Admin) - specific routes first
router.post('/', protect, authorize('landlord', 'admin'), createBlockedDate);
router.post('/block-past-dates', protect, authorize('landlord', 'admin'), blockPastDates);
router.delete('/unblock-past-dates', protect, authorize('landlord', 'admin'), unblockPastDates);

// Parameterized routes last
router.get('/:id', getBlockedDate);
router.put('/:id', protect, authorize('landlord', 'admin'), updateBlockedDate);
router.delete('/:id', protect, authorize('landlord', 'admin'), deleteBlockedDate);

export default router; 
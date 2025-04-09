import express from 'express';
import {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  cancelBooking,
  completeBooking
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';

// Include payment router
import paymentRouter from './paymentRoutes.js';

const router = express.Router({ mergeParams: true });

// Re-route into payment router
router.use('/:bookingId/payments', paymentRouter);

// Protected routes for all users
router.get('/', protect, getBookings);
router.get('/:id', protect, getBooking);
router.post('/', protect, createBooking);
router.put('/:id', protect, updateBooking);

// Protected routes for booking owner or admin
router.delete('/:id', protect, authorize('user', 'admin'), deleteBooking);
router.put('/:id/cancel', protect, authorize('user', 'admin'), cancelBooking);

// Protected routes for property owner or admin
router.put('/:id/complete', protect, authorize('landlord', 'admin'), completeBooking);

export default router;
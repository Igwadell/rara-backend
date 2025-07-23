import express from 'express';
import {
  getLandlordProperties,
  createLandlordProperty,
  updateLandlordProperty,
  getLandlordBookings,
  getLandlordEarnings,
  getLandlordAnalytics
} from '../controllers/landlordController.js';
import { protect, authorize } from '../middleware/auth.js';
import advancedResults from '../middleware/advancedResults.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Protect all routes and require landlord role
router.use(protect);
router.use(authorize('landlord'));

// Property Management Routes
router
  .route('/properties')
  .get(advancedResults(Property), getLandlordProperties)
  .post(createLandlordProperty);

router.put('/properties/:id', updateLandlordProperty);

// Booking Management Routes
router
  .route('/bookings')
  .get(getLandlordBookings);

// Analytics & Earnings Routes
router.get('/earnings', getLandlordEarnings);
router.get('/analytics', getLandlordAnalytics);

export default router; 
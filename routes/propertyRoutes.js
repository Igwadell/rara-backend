import express from 'express';
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  propertyPhotoUpload,
  getPropertiesInRadius,
  verifyProperty,
  uploadPropertyImages,
  getPropertyAvailability,
  getPropertyPricing,
  updatePropertyPricing,
  blockDates,
  unblockDates,
  getBookingWindow,
  updateBookingWindow,
  getStayLimits,
  updateStayLimits
} from '../controllers/propertyController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadPropertyPhotos } from '../middleware/upload.js';
import advancedResults from '../middleware/advancedResults.js';
import Property from '../models/Property.js';

// Include other resource routers
import bookingRouter from './bookingRoutes.js';
import reviewRouter from './reviewRoutes.js';
import blockedDateRouter from './blockedDateRoutes.js';

const router = express.Router();

// Re-route into other resource routers
router.use('/:propertyId/bookings', bookingRouter);
router.use('/:propertyId/reviews', reviewRouter);
router.use('/:propertyId/blocked-dates', blockedDateRouter);

// Public routes
router.get('/', advancedResults(Property, {
  path: 'landlord',
  select: 'name email phone'
}), getProperties);
router.get('/:id', getProperty);
router.get('/radius/:zipcode/:distance', getPropertiesInRadius);

// Property availability and management routes
router.get('/:id/availability', getPropertyAvailability);
router.get('/:id/pricing', getPropertyPricing);
router.put('/:id/pricing', protect, authorize('landlord', 'admin'), updatePropertyPricing);
router.post('/:id/block-dates', protect, authorize('landlord', 'admin'), blockDates);
router.delete('/:id/block-dates', protect, authorize('landlord', 'admin'), unblockDates);
router.get('/:id/booking-window', getBookingWindow);
router.put('/:id/booking-window', protect, authorize('landlord', 'admin'), updateBookingWindow);
router.get('/:id/stay-limits', getStayLimits);
router.put('/:id/stay-limits', protect, authorize('landlord', 'admin'), updateStayLimits);

// Protected routes
router.post('/', protect, authorize('landlord', 'admin'), createProperty);
router.put('/:id', protect, authorize('landlord', 'admin'), updateProperty);
router.delete('/:id', protect, authorize('landlord', 'admin'), deleteProperty);
router.put('/:id/verify', protect, authorize('admin'), verifyProperty);
router.put('/:id/photo', protect, authorize('landlord', 'admin'), uploadPropertyPhotos, propertyPhotoUpload);
router.post('/upload', protect, authorize('landlord', 'admin'), uploadPropertyImages);

export default router;
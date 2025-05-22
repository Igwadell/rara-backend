import express from 'express';
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  propertyPhotoUpload,
  getPropertiesInRadius,
  verifyProperty
} from '../controllers/propertyController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadPropertyPhotos } from '../middleware/upload.js';
import advancedResults from '../middleware/advancedResults.js';
import Property from '../models/Property.js';

// Include other resource routers
import bookingRouter from './bookingRoutes.js';
import reviewRouter from './reviewRoutes.js';

const router = express.Router();

// Re-route into other resource routers
router.use('/:propertyId/bookings', bookingRouter);
router.use('/:propertyId/reviews', reviewRouter);

// Public routes
router.get('/', advancedResults(Property, {
  path: 'landlord',
  select: 'name email phone'
}), getProperties);
router.get('/:id', getProperty);
router.get('/radius/:zipcode/:distance', getPropertiesInRadius);

// Protected routes
router.post('/', protect, authorize('landlord', 'admin'), createProperty);
router.put('/:id', protect, authorize('landlord', 'admin'), updateProperty);
router.delete('/:id', protect, authorize('landlord', 'admin'), deleteProperty);
router.put('/:id/verify', protect, authorize('admin'), verifyProperty);
router.put('/:id/photo', protect, authorize('landlord', 'admin'), uploadPropertyPhotos, propertyPhotoUpload);

export default router;
import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getUserSettings,
  updateUserSettings,
  uploadUserAvatar,
  getSavedProperties,
  addSavedProperty,
  removeSavedProperty
} from '../controllers/userProfileController.js';
import { protect } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Profile routes
router
  .route('/profile')
  .get(getUserProfile)
  .put(updateUserProfile);

// Settings routes
router
  .route('/settings')
  .get(getUserSettings)
  .put(updateUserSettings);

// Avatar upload
router.post('/avatar', uploadAvatar, uploadUserAvatar);

// Saved properties
router
  .route('/saved-properties')
  .get(getSavedProperties)
  .post(addSavedProperty);

router.delete('/saved-properties/:propertyId', removeSavedProperty);

export default router; 
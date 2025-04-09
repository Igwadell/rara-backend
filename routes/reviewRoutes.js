import express from 'express';
import {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  respondToReview
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

/**
 * @desc    Review routes
 * @route   GET /api/v1/properties/:propertyId/reviews
 * @route   GET /api/v1/reviews
 * @route   GET /api/v1/reviews/:id
 * @route   POST /api/v1/properties/:propertyId/reviews
 * @route   PUT /api/v1/reviews/:id
 * @route   DELETE /api/v1/reviews/:id
 * @route   PUT /api/v1/reviews/:id/respond
 */

// Public routes (get reviews)
router.get('/', getReviews);
router.get('/:id', getReview);

// Protected routes (logged-in users)
router.post(
  '/',
  protect,
  authorize('user'),
  createReview
);

router.put(
  '/:id',
  protect,
  authorize('user'),
  updateReview
);

router.delete(
  '/:id',
  protect,
  authorize('user', 'admin'),
  deleteReview
);

// Landlord response to review
router.put(
  '/:id/respond',
  protect,
  authorize('landlord', 'admin'),
  respondToReview
);

export default router;
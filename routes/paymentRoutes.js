import express from 'express';
import {
  getPayments,
  getPayment,
  processPayment,
  verifyPayment,
  processRefund,
  handlePaymentWebhook,
  getPaymentHistory,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  getRefunds
} from '../controllers/paymentController.js';
import advancedResults from '../middleware/advancedResults.js';
import Payment from '../models/Payment.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Public routes (webhooks)
// Note: In production, these should be properly secured
router.post('/webhook', handlePaymentWebhook);

// Protected routes
router.use(protect);

// Payment routes
router
  .route('/')
  .get(advancedResults(Payment, 'user booking'), getPayments)
  .post(processPayment);

router
  .route('/:id')
  .get(getPayment);

router.post('/:id/refund', processRefund);
router.post('/verify', verifyPayment);

// Payment history
router.get('/history', getPaymentHistory);

// Payment methods
router
  .route('/methods')
  .get(getPaymentMethods)
  .post(addPaymentMethod);

router.delete('/methods/:id', removePaymentMethod);

router.get('/refunds', authorize('admin'), getRefunds);

export default router;
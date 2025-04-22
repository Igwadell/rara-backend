import express from 'express';
import {
  getPayments,
  getPayment,
  processPayment,
  verifyPayment,
  processRefund,
  handlePaymentWebhook
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Public routes (webhooks)
// Note: In production, these should be properly secured
router.post('/webhook', handlePaymentWebhook);

// Protected routes
router.get('/', protect, getPayments);
router.get('/:id', protect, getPayment);
router.post('/', protect, processPayment);
router.get('/verify/:transactionId', protect, verifyPayment);

// Admin/Landlord routes
router.post('/:id/refund', protect, authorize('landlord', 'admin'), processRefund);

export default router;
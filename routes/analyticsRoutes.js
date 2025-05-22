import express from 'express';
import {
  getDashboardStats,
  getRevenueData,
  getBookingStats,
  getUserActivity,
  getFinancialReport
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/revenue', getRevenueData);
router.get('/bookings', getBookingStats);
router.get('/user-activity', getUserActivity);
router.get('/reports/financial', getFinancialReport);

export default router; 
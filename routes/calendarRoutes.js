import express from 'express';
import {
  getCalendarEvents,
  getCalendarAnalytics
} from '../controllers/calendarController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Calendar events route
router.get('/events', protect, authorize('landlord', 'admin'), getCalendarEvents);

// Calendar analytics route
router.get('/analytics', protect, authorize('landlord', 'admin'), getCalendarAnalytics);

export default router; 
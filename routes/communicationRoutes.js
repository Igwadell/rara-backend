import express from 'express';
import {
  getNotifications,
  sendNotification,
  getMessages,
  sendMessage,
  getEmailTemplates,
  updateEmailTemplate
} from '../controllers/communicationController.js';
import { protect, authorize } from '../middleware/auth.js';
import advancedResults from '../middleware/advancedResults.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Notification routes
router
  .route('/notifications')
  .get(advancedResults(Notification), getNotifications)
  .post(authorize('admin'), sendNotification);

// Message routes
router
  .route('/messages')
  .get(getMessages)
  .post(sendMessage);

// Email template routes
router
  .route('/email-templates')
  .get(authorize('admin'), getEmailTemplates);

router
  .route('/email-templates/:id')
  .put(authorize('admin'), updateEmailTemplate);

export default router; 
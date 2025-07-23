import express from 'express';
import {
  getNotifications,
  sendNotification,
  markNotificationAsRead,
  deleteNotification,
  updateNotificationSettings,
  getMessages,
  sendMessage,
  getEmailTemplates,
  updateEmailTemplate,
  getConversationWithUser
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

router.put('/notifications/:id/read', markNotificationAsRead);
router.delete('/notifications/:id', deleteNotification);
router.post('/notifications/settings', updateNotificationSettings);

// Message routes
router
  .route('/messages')
  .get(getMessages)
  .post(sendMessage);

router.get('/messages/conversation/:userId', getConversationWithUser);

// Email template routes
router
  .route('/email-templates')
  .get(authorize('admin'), getEmailTemplates);

router
  .route('/email-templates/:id')
  .put(authorize('admin'), updateEmailTemplate);

export default router; 
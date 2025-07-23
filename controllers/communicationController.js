import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import EmailTemplate from '../models/EmailTemplate.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Get all notifications
// @route   GET /api/v1/communication/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Send notification
// @route   POST /api/v1/communication/notifications
// @access  Private/Admin
export const sendNotification = asyncHandler(async (req, res, next) => {
  const { users, title, message, type } = req.body;

  // Create notifications for each user
  const notifications = await Promise.all(
    users.map(userId =>
      Notification.create({
        user: userId,
        title,
        message,
        type
      })
    )
  );

  res.status(201).json({
    success: true,
    data: notifications
  });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/communication/notifications/:id/read
// @access  Private
export const markNotificationAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the notification
  if (notification.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this notification`, 401));
  }

  notification.isRead = true;
  notification.readAt = Date.now();
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Delete notification
// @route   DELETE /api/v1/communication/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the notification
  if (notification.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this notification`, 401));
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update notification settings
// @route   POST /api/v1/communication/notifications/settings
// @access  Private
export const updateNotificationSettings = asyncHandler(async (req, res, next) => {
  // This would typically update user settings for notifications
  // For now, we'll just return a success response
  // In a real implementation, you'd update the UserSettings model

  res.status(200).json({
    success: true,
    data: 'Notification settings updated successfully'
  });
});

// @desc    Get all messages
// @route   GET /api/v1/communication/messages
// @access  Private
export const getMessages = asyncHandler(async (req, res, next) => {
  const messages = await Message.find({
    $or: [{ from: req.user.id }, { to: req.user.id }]
  })
    .populate('from', 'name email')
    .populate('to', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    data: messages
  });
});

// @desc    Send message
// @route   POST /api/v1/communication/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res, next) => {
  req.body.from = req.user.id;

  const message = await Message.create(req.body);

  // Populate sender and receiver info
  const populatedMessage = await Message.findById(message._id)
    .populate('from', 'name email')
    .populate('to', 'name email');

  // Send email notification to receiver
  const receiver = populatedMessage.to;
  const sender = populatedMessage.from;

  try {
    await sendEmail({
      email: receiver.email,
      subject: `New message from ${sender.name}`,
      message: `You have received a new message from ${sender.name}:\n\n${req.body.content}`
    });
  } catch (err) {
    console.error('Failed to send email notification:', err);
  }

  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});

// @desc    Get conversation with a specific user
// @route   GET /api/v1/communication/messages/conversation/:userId
// @access  Private
export const getConversationWithUser = asyncHandler(async (req, res, next) => {
  const otherUserId = req.params.userId;
  const userId = req.user.id;
  const messages = await Message.find({
    $or: [
      { from: userId, to: otherUserId },
      { from: otherUserId, to: userId }
    ]
  })
    .populate('from', 'name email')
    .populate('to', 'name email')
    .sort('createdAt');

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Get all email templates
// @route   GET /api/v1/communication/email-templates
// @access  Private/Admin
export const getEmailTemplates = asyncHandler(async (req, res, next) => {
  const templates = await EmailTemplate.find();

  res.status(200).json({
    success: true,
    data: templates
  });
});

// @desc    Update email template
// @route   PUT /api/v1/communication/email-templates/:id
// @access  Private/Admin
export const updateEmailTemplate = asyncHandler(async (req, res, next) => {
  let template = await EmailTemplate.findById(req.params.id);

  if (!template) {
    return next(
      new ErrorResponse(`Template not found with id of ${req.params.id}`, 404)
    );
  }

  template = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: template
  });
}); 
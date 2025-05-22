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
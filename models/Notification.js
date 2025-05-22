import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a notification title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Please add a notification message']
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  link: {
    type: String
  },
  relatedModel: {
    type: String,
    enum: ['Booking', 'Property', 'Payment', 'Message', null],
    default: null
  },
  relatedId: {
    type: mongoose.Schema.ObjectId,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, read: 1 });

export default mongoose.model('Notification', NotificationSchema); 
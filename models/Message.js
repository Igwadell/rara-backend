import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Please add a message content'],
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'video']
    },
    url: String,
    name: String,
    size: Number
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
MessageSchema.index({ from: 1, to: 1 });
MessageSchema.index({ to: 1, read: 1 });
MessageSchema.index({ createdAt: -1 });

// Mark message as read
MessageSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  await this.save();
};

export default mongoose.model('Message', MessageSchema); 
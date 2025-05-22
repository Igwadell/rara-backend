import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  type: {
    type: String,
    enum: ['image', 'video', 'document'],
    required: true
  },
  url: {
    type: String,
    required: [true, 'Please add a URL']
  },
  publicId: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  size: {
    type: Number
  },
  format: {
    type: String
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number
  },
  tags: [String],
  altText: String,
  caption: String
}, {
  timestamps: true
});

// Add indexes for better query performance
MediaSchema.index({ user: 1, type: 1 });
MediaSchema.index({ tags: 1 });
MediaSchema.index({ createdAt: -1 });

export default mongoose.model('Media', MediaSchema); 
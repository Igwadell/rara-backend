import mongoose from 'mongoose';

const SavedPropertySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.ObjectId,
    ref: 'Property',
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevent user from saving the same property more than once
SavedPropertySchema.index({ user: 1, property: 1 }, { unique: true });

export default mongoose.model('SavedProperty', SavedPropertySchema); 
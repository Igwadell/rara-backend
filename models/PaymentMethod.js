import mongoose from 'mongoose';

const PaymentMethodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['card', 'bank_account', 'paypal', 'crypto']
  },
  provider: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'square', 'other']
  },
  last4: {
    type: String,
    maxlength: 4
  },
  brand: {
    type: String
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure only one default payment method per user
PaymentMethodSchema.index({ user: 1, isDefault: 1 }, { 
  unique: true, 
  partialFilterExpression: { isDefault: true } 
});

export default mongoose.model('PaymentMethod', PaymentMethodSchema); 
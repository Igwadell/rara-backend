import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add the payment amount'],
    min: [0, 'Amount must be at least 0']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Please add a payment method'],
    enum: [
      'mobile_money',
      'credit_card',
      'bank_transfer',
      'paypal',
      'cash'
    ]
  },
  paymentDetails: {
    // Generic field that can store different payment method details
    type: mongoose.Schema.Types.Mixed
  },
  transactionId: {
    type: String,
    required: [true, 'Please add a transaction ID']
  },
  status: {
    type: String,
    enum: [
      'pending',
      'completed',
      'failed',
      'refunded',
      'partially_refunded'
    ],
    default: 'pending'
  },
  refundDetails: {
    amount: Number,
    reason: String,
    processedAt: Date,
    refundId: String
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  receiptUrl: String,
  currency: {
    type: String,
    default: 'RWF',
    enum: ['RWF', 'USD', 'EUR']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
PaymentSchema.index({ transactionId: 1 }, { unique: true });
PaymentSchema.index({ booking: 1 });
PaymentSchema.index({ user: 1 });

// Update booking payment status when payment is saved
PaymentSchema.post('save', async function(doc) {
  const booking = await this.model('Booking').findById(doc.booking);
  
  if (booking) {
    // Calculate total paid amount for this booking
    const payments = await this.model('Payment').find({
      booking: doc.booking,
      status: { $in: ['completed', 'partially_refunded'] }
    });
    
    const totalPaid = payments.reduce((sum, payment) => {
      return sum + (payment.status === 'partially_refunded' 
        ? (payment.amount - (payment.refundDetails?.amount || 0))
        : payment.amount);
    }, 0);

    // Update booking status based on payment
    let paymentStatus = 'pending';
    if (totalPaid >= booking.amount) {
      paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'partially_paid';
    } else if (doc.status === 'failed') {
      paymentStatus = 'failed';
    }

    if (booking.paymentStatus !== paymentStatus) {
      booking.paymentStatus = paymentStatus;
      await booking.save();
    }
  }
});

export default mongoose.model('Payment', PaymentSchema);
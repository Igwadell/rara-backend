import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.ObjectId,
    ref: 'Property',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  checkInDate: {
    type: Date,
    required: [true, 'Please add a check-in date']
  },
  checkOutDate: {
    type: Date,
    required: [true, 'Please add a check-out date'],
    validate: {
      validator: function(value) {
        return value > this.checkInDate;
      },
      message: 'Check-out date must be after check-in date'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Please add the booking amount'],
    min: [0, 'Amount must be at least 0']
  },
  guests: {
    adults: {
      type: Number,
      required: true,
      min: [1, 'At least one adult is required'],
      default: 1
    },
    children: {
      type: Number,
      min: [0, 'Children count cannot be negative'],
      default: 0
    },
    infants: {
      type: Number,
      min: [0, 'Infants count cannot be negative'],
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid', 'refunded', 'failed'],
    default: 'pending'
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot be more than 500 characters']
  },
  cancellationReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevent duplicate bookings for same property and dates
BookingSchema.index(
  { 
    property: 1, 
    user: 1, 
    checkInDate: 1, 
    checkOutDate: 1 
  }, 
  { unique: true }
);

// Validate booking dates don't overlap with existing bookings or blocked dates
BookingSchema.pre('save', async function(next) {
  if (this.isModified('checkInDate') || this.isModified('checkOutDate') || this.isNew) {
    // Check for overlapping bookings
    const overlappingBooking = await this.constructor.findOne({
      property: this.property,
      _id: { $ne: this._id },
      $or: [
        {
          checkInDate: { $lt: this.checkOutDate },
          checkOutDate: { $gt: this.checkInDate }
        }
      ],
      status: { $nin: ['cancelled', 'completed'] }
    });

    if (overlappingBooking) {
      const err = new Error('Property is already booked for the selected dates');
      err.name = 'ValidationError';
      return next(err);
    }

    // Check for blocked dates
    const BlockedDate = mongoose.model('BlockedDate');
    const blockedDate = await BlockedDate.findOne({
      property: this.property,
      $or: [
        {
          startDate: { $lte: this.checkOutDate },
          endDate: { $gte: this.checkInDate }
        }
      ]
    });

    if (blockedDate) {
      const err = new Error('Property is blocked for the selected dates');
      err.name = 'ValidationError';
      return next(err);
    }
  }
  next();
});

// Calculate amount before saving if dates changed
BookingSchema.pre('save', async function(next) {
  if (this.isModified('checkInDate') || this.isModified('checkOutDate') || this.isNew) {
    const property = await this.model('Property').findById(this.property);
    if (property) {
      const duration = (this.checkOutDate - this.checkInDate) / (1000 * 60 * 60 * 24);
      this.amount = property.price * duration;
    }
  }
  next();
});

// Reverse populate with virtuals
BookingSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'booking',
  justOne: false
});

// Update property's booking count when booking is saved
BookingSchema.post('save', async function(doc) {
  await this.model('Property').updateOne(
    { _id: doc.property },
    { $inc: { totalBookings: 1 } }
  );
});

// Update property's booking count when booking is removed
BookingSchema.post('remove', async function(doc) {
  await this.model('Property').updateOne(
    { _id: doc.property },
    { $inc: { totalBookings: -1 } }
  );
});

export default mongoose.model('Booking', BookingSchema);
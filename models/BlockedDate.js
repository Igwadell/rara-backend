import mongoose from 'mongoose';

const BlockedDateSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.ObjectId,
    ref: 'Property',
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date'],
    validate: {
      validator: function(value) {
        return value >= this.startDate;
      },
      message: 'End date must be on or after start date'
    }
  },
  reason: {
    type: String,
    maxlength: [200, 'Reason cannot be more than 200 characters']
  },
  blockedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevent duplicate blocked date ranges for the same property
BlockedDateSchema.index(
  { 
    property: 1, 
    startDate: 1, 
    endDate: 1 
  }, 
  { unique: true }
);

// Validate that blocked dates don't overlap with existing blocked dates
BlockedDateSchema.pre('save', async function(next) {
  if (this.isModified('startDate') || this.isModified('endDate') || this.isNew) {
    const overlappingBlock = await this.constructor.findOne({
      property: this.property,
      _id: { $ne: this._id },
      $or: [
        {
          startDate: { $lte: this.endDate },
          endDate: { $gte: this.startDate }
        }
      ]
    });

    if (overlappingBlock) {
      const err = new Error('This date range overlaps with an existing blocked date');
      err.name = 'ValidationError';
      return next(err);
    }
  }
  next();
});

export default mongoose.model('BlockedDate', BlockedDateSchema); 
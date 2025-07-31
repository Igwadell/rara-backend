import mongoose from 'mongoose';
import geocoder from '../utils/geocoder.js';

const PropertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  location: {
    // GeoJSON Point
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    },
    formattedAddress: String,
    street: String,
    city: String,
    district: String,
    country: String,
    countryCode: String
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be at least 0']
  },
  cleaningFee: {
    type: Number,
    default: 0,
    min: [0, 'Cleaning fee must be at least 0']
  },
  serviceFee: {
    type: Number,
    default: 0,
    min: [0, 'Service fee must be at least 0']
  },
  securityDeposit: {
    type: Number,
    default: 0,
    min: [0, 'Security deposit must be at least 0']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  pricingRules: [{
    startDate: Date,
    endDate: Date,
    price: Number,
    type: {
      type: String,
      enum: ['seasonal', 'weekend', 'holiday', 'custom']
    }
  }],
  // Booking window settings
  advanceBookingDays: {
    type: Number,
    default: 365,
    min: [1, 'Advance booking days must be at least 1']
  },
  sameDayBooking: {
    type: Boolean,
    default: false
  },
  instantBooking: {
    type: Boolean,
    default: false
  },
  bookingLeadTime: {
    type: Number,
    default: 0,
    min: [0, 'Booking lead time must be at least 0']
  },
  // Stay limits
  minimumStay: {
    type: Number,
    default: 1,
    min: [1, 'Minimum stay must be at least 1']
  },
  maximumStay: {
    type: Number,
    default: 30,
    min: [1, 'Maximum stay must be at least 1']
  },
  minimumAdvanceNotice: {
    type: Number,
    default: 0,
    min: [0, 'Minimum advance notice must be at least 0']
  },
  maximumAdvanceNotice: {
    type: Number,
    default: 365,
    min: [1, 'Maximum advance notice must be at least 1']
  },
  bedrooms: {
    type: Number,
    required: [true, 'Please add number of bedrooms'],
    min: [0, 'Bedrooms must be at least 0']
  },
  bathrooms: {
    type: Number,
    required: [true, 'Please add number of bathrooms'],
    min: [0, 'Bathrooms must be at least 0']
  },
  area: {
    type: Number,
    required: [true, 'Please add area in square meters'],
    min: [0, 'Area must be at least 0']
  },
  propertyType: {
    type: String,
    required: true,
    enum: [
      'house',
      'apartment',
      'villa',
      'condo',
      'studio',
      'townhouse',
      'land',
      'commercial',
      'other'
    ]
  },
  amenities: {
    type: [String],
    required: true,
    enum: [
      'wi-fi',
      'parking',
      'swimming-pool',
      'kitchen',
      'air-conditioning',
      'heating',
      'laundry',
      'tv',
      'security',
      'elevator',
      'gym',
      'furnished',
      'garden',
      'balcony',
      'pet-friendly',
      'wheelchair-accessible'
    ]
  },
  photos: [{
    url: String,
    public_id: String,
    width: Number,
    height: Number
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationNotes: String,
  landlord: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must not be more than 5'],
    set: val => Math.round(val * 10) / 10
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  listingType: {
    type: String,
    enum: ['rent', 'sale'],
    required: true
  },
  state: String,
  zipCode: String,
  totalRooms: Number,
  yearBuilt: Number,
  parkingSpaces: Number,
  furnished: Boolean,
  petFriendly: Boolean,
  images: [String],
  virtualTourLink: String,
  videoLink: String,
  availableFrom: Date,
  minimumLeasePeriod: String,
  maximumOccupants: Number,
  utilities: [{
    type: String,
    enum: [
      'Water',
      'Electricity',
      'Gas',
      'Internet',
      'Cable TV',
      'Trash Collection',
      'Heating'
    ]
  }],
  rules: [String],
  contactName: String,
  contactEmail: String,
  contactPhone: String,
  showContactInfo: Boolean,
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive'],
    default: 'active'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Geocode & create location field
// PropertySchema.pre('save', async function(next) {
//   if (!this.isModified('address')) {
//     return next();
//   }

//   const loc = await geocoder.geocode(this.address);
//   this.location = {
//     type: 'Point',
//     coordinates: [loc[0].longitude, loc[0].latitude],
//     formattedAddress: loc[0].formattedAddress,
//     street: loc[0].streetName,
//     city: loc[0].city,
//     district: loc[0].administrativeLevels.level2long,
//     country: loc[0].country,
//     countryCode: loc[0].countryCode
//   };

//   // Do not save address in DB
//   this.address = undefined;
//   next();
// });

// Cascade delete bookings when property is deleted
PropertySchema.pre('remove', async function(next) {
  await this.model('Booking').deleteMany({ property: this._id });
  await this.model('Review').deleteMany({ property: this._id });
  next();
});

// Reverse populate with virtuals
PropertySchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'property',
  justOne: false
});

PropertySchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'property',
  justOne: false
});

// Create compound index for text search
PropertySchema.index({
  title: 'text',
  description: 'text',
  'location.formattedAddress': 'text',
  'location.city': 'text'
});

export default mongoose.model('Property', PropertySchema);
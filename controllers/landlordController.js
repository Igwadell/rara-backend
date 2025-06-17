import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';

// @desc    Get landlord's properties
// @route   GET /api/v1/landlord/properties
// @access  Private/Landlord
export const getLandlordProperties = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Create property for landlord
// @route   POST /api/v1/landlord/properties
// @access  Private/Landlord
export const createLandlordProperty = asyncHandler(async (req, res, next) => {
  // Add landlord to req.body
  req.body.landlord = req.user.id;

  const property = await Property.create(req.body);

  res.status(201).json({
    success: true,
    data: property
  });
});

// @desc    Update landlord's property
// @route   PUT /api/v1/landlord/properties/:id
// @access  Private/Landlord
export const updateLandlordProperty = asyncHandler(async (req, res, next) => {
  let property = await Property.findById(req.params.id);

  if (!property) {
    return next(new ErrorResponse(`Property not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is property landlord
  if (property.landlord.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this property`, 401));
  }

  property = await Property.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: property
  });
});

// @desc    Get landlord's bookings
// @route   GET /api/v1/landlord/bookings
// @access  Private/Landlord
export const getLandlordBookings = asyncHandler(async (req, res, next) => {
  // Get properties owned by the landlord
  const properties = await Property.find({ landlord: req.user.id });
  const propertyIds = properties.map(property => property._id);

  // Add filter to only show bookings for landlord's properties
  req.query.property = { $in: propertyIds };

  res.status(200).json(res.advancedResults);
});

// @desc    Get landlord's earnings
// @route   GET /api/v1/landlord/earnings
// @access  Private/Landlord
export const getLandlordEarnings = asyncHandler(async (req, res, next) => {
  // Get properties owned by the landlord
  const properties = await Property.find({ landlord: req.user.id });
  const propertyIds = properties.map(property => property._id);

  // Calculate earnings from completed bookings
  const earnings = await Booking.aggregate([
    {
      $match: {
        property: { $in: propertyIds },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$totalAmount' },
        totalBookings: { $sum: 1 },
        avgBookingValue: { $avg: '$totalAmount' }
      }
    }
  ]);

  // Get monthly earnings
  const monthlyEarnings = await Booking.aggregate([
    {
      $match: {
        property: { $in: propertyIds },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        earnings: { $sum: '$totalAmount' },
        bookings: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      total: earnings[0] || { totalEarnings: 0, totalBookings: 0, avgBookingValue: 0 },
      monthly: monthlyEarnings
    }
  });
});

// @desc    Get landlord analytics
// @route   GET /api/v1/landlord/analytics
// @access  Private/Landlord
export const getLandlordAnalytics = asyncHandler(async (req, res, next) => {
  // Get properties owned by the landlord
  const properties = await Property.find({ landlord: req.user.id });
  const propertyIds = properties.map(property => property._id);

  // Get booking statistics
  const bookingStats = await Booking.aggregate([
    {
      $match: {
        property: { $in: propertyIds }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get property statistics
  const propertyStats = await Property.aggregate([
    {
      $match: {
        landlord: req.user.id
      }
    },
    {
      $group: {
        _id: null,
        totalProperties: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        verifiedProperties: {
          $sum: { $cond: ['$isVerified', 1, 0] }
        },
        featuredProperties: {
          $sum: { $cond: ['$isFeatured', 1, 0] }
        }
      }
    }
  ]);

  // Get recent activity
  const recentBookings = await Booking.find({
    property: { $in: propertyIds }
  })
    .populate('user', 'name email')
    .populate('property', 'title')
    .sort('-createdAt')
    .limit(5);

  res.status(200).json({
    success: true,
    data: {
      bookingStats,
      propertyStats: propertyStats[0] || {
        totalProperties: 0,
        avgPrice: 0,
        verifiedProperties: 0,
        featuredProperties: 0
      },
      recentBookings
    }
  });
}); 
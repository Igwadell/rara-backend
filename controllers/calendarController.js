import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import BlockedDate from '../models/BlockedDate.js';

// @desc    Get calendar events for a property or all properties
// @route   GET /api/v1/calendar/events
// @access  Private (Landlord, Admin)
export const getCalendarEvents = asyncHandler(async (req, res, next) => {
  const { propertyId, startDate, endDate } = req.query;
  
  let query = {};
  
  // Filter by property if specified
  if (propertyId) {
    query.property = propertyId;
  }
  
  // Filter by date range if specified
  if (startDate && endDate) {
    query.$or = [
      {
        checkIn: { $gte: new Date(startDate), $lte: new Date(endDate) }
      },
      {
        checkOut: { $gte: new Date(startDate), $lte: new Date(endDate) }
      },
      {
        checkIn: { $lte: new Date(startDate) },
        checkOut: { $gte: new Date(endDate) }
      }
    ];
  }
  
  // Get bookings
  const bookings = await Booking.find(query)
    .populate('property', 'name address')
    .populate('user', 'name email')
    .sort({ checkIn: 1 });
  
  // Get blocked dates
  const blockedDates = await BlockedDate.find(query)
    .populate('property', 'name address')
    .sort({ startDate: 1 });
  
  // Format events
  const events = [
    ...bookings.map(booking => ({
      id: booking._id,
      type: 'booking',
      title: `Booking - ${booking.user.name}`,
      start: booking.checkIn,
      end: booking.checkOut,
      status: booking.status,
      property: booking.property,
      user: booking.user,
      totalAmount: booking.totalAmount
    })),
    ...blockedDates.map(blocked => ({
      id: blocked._id,
      type: 'blocked',
      title: `Blocked - ${blocked.reason || 'No reason specified'}`,
      start: blocked.startDate,
      end: blocked.endDate,
      reason: blocked.reason,
      property: blocked.property
    }))
  ];
  
  res.status(200).json({
    success: true,
    count: events.length,
    data: events
  });
});

// @desc    Get calendar analytics
// @route   GET /api/v1/calendar/analytics
// @access  Private (Landlord, Admin)
export const getCalendarAnalytics = asyncHandler(async (req, res, next) => {
  const { propertyId, startDate, endDate } = req.query;
  
  let propertyQuery = {};
  let dateQuery = {};
  
  // Filter by property if specified
  if (propertyId) {
    propertyQuery.property = propertyId;
  }
  
  // Filter by date range if specified
  if (startDate && endDate) {
    dateQuery = {
      checkIn: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };
  }
  
  // Get booking statistics
  const bookingStats = await Booking.aggregate([
    { $match: { ...propertyQuery, ...dateQuery } },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageBookingValue: { $avg: '$totalAmount' },
        confirmedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
        },
        pendingBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);
  
  // Get occupancy rate
  const totalDays = endDate && startDate 
    ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    : 30; // Default to 30 days if no date range specified
  
  const occupiedDays = await Booking.aggregate([
    { $match: { ...propertyQuery, ...dateQuery } },
    {
      $project: {
        daysOccupied: {
          $ceil: {
            $divide: [
              { $subtract: ['$checkOut', '$checkIn'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        totalOccupiedDays: { $sum: '$daysOccupied' }
      }
    }
  ]);
  
  // Get blocked dates count
  const blockedDatesCount = await BlockedDate.countDocuments({
    ...propertyQuery,
    ...(startDate && endDate ? {
      startDate: { $gte: new Date(startDate) },
      endDate: { $lte: new Date(endDate) }
    } : {})
  });
  
  const analytics = {
    bookingStats: bookingStats[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      averageBookingValue: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
      cancelledBookings: 0
    },
    occupancyRate: occupiedDays[0] 
      ? (occupiedDays[0].totalOccupiedDays / totalDays) * 100 
      : 0,
    blockedDatesCount,
    totalDays
  };
  
  res.status(200).json({
    success: true,
    data: analytics
  });
}); 
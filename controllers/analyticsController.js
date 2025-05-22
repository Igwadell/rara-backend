import asyncHandler from '../utils/asyncHandler.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Property from '../models/Property.js';

// @desc    Get dashboard statistics
// @route   GET /api/v1/analytics/dashboard
// @access  Private/Admin
export const getDashboardStats = asyncHandler(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const totalProperties = await Property.countDocuments();
  const totalBookings = await Booking.countDocuments();
  const totalRevenue = await Payment.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const recentBookings = await Booking.find()
    .sort('-createdAt')
    .limit(5)
    .populate('user', 'name email')
    .populate('property', 'title');

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentBookings
    }
  });
});

// @desc    Get revenue data
// @route   GET /api/v1/analytics/revenue
// @access  Private/Admin
export const getRevenueData = asyncHandler(async (req, res, next) => {
  const { period = 'monthly', year = new Date().getFullYear() } = req.query;

  let groupBy = {
    monthly: { $month: '$createdAt' },
    daily: { $dayOfMonth: '$createdAt' },
    yearly: { $year: '$createdAt' }
  };

  const revenue = await Payment.aggregate([
    { $match: { 
      status: 'completed',
      createdAt: { 
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31)
      }
    }},
    { $group: {
      _id: groupBy[period],
      total: { $sum: '$amount' }
    }},
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: revenue
  });
});

// @desc    Get booking statistics
// @route   GET /api/v1/analytics/bookings
// @access  Private/Admin
export const getBookingStats = asyncHandler(async (req, res, next) => {
  const stats = await Booking.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const bookingTrends = await Booking.aggregate([
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      statusDistribution: stats,
      bookingTrends
    }
  });
});

// @desc    Get user activity data
// @route   GET /api/v1/analytics/user-activity
// @access  Private/Admin
export const getUserActivity = asyncHandler(async (req, res, next) => {
  const newUsers = await User.aggregate([
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const activeUsers = await Booking.aggregate([
    {
      $group: {
        _id: '$user',
        bookingCount: { $sum: 1 }
      }
    },
    { $sort: { bookingCount: -1 } },
    { $limit: 10 }
  ]);

  const populatedActiveUsers = await User.populate(activeUsers, {
    path: '_id',
    select: 'name email'
  });

  res.status(200).json({
    success: true,
    data: {
      newUsers,
      activeUsers: populatedActiveUsers
    }
  });
});

// @desc    Generate financial report
// @route   GET /api/v1/analytics/reports/financial
// @access  Private/Admin
export const getFinancialReport = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const query = {
    status: 'completed',
    ...(startDate && endDate ? {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    } : {})
  };

  const revenue = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        averageBookingValue: { $avg: '$amount' },
        totalTransactions: { $sum: 1 }
      }
    }
  ]);

  const paymentMethods = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: revenue[0] || {
        totalRevenue: 0,
        averageBookingValue: 0,
        totalTransactions: 0
      },
      paymentMethods
    }
  });
}); 
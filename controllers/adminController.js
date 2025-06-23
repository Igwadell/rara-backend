import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import PropertyCategory from '../models/PropertyCategory.js';

// ==================== USER MANAGEMENT ====================

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single user
// @route   GET /api/v1/admin/users/:id
// @access  Private/Admin
export const getUserDetails = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/v1/admin/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Change user role
// @route   PUT /api/v1/admin/users/:id/role
// @access  Private/Admin
export const changeUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  if (!role) {
    return next(new ErrorResponse('Role is required', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Get landlords
// @route   GET /api/v1/admin/users/landlords
// @access  Private/Admin
export const getLandlords = asyncHandler(async (req, res, next) => {
  const landlords = await User.find({ role: 'landlord' }).select('-password');

  res.status(200).json({
    success: true,
    count: landlords.length,
    data: landlords
  });
});

// @desc    Get tenants
// @route   GET /api/v1/admin/users/tenants
// @access  Private/Admin
export const getTenants = asyncHandler(async (req, res, next) => {
  const tenants = await User.find({ role: 'user' }).select('-password');

  res.status(200).json({
    success: true,
    count: tenants.length,
    data: tenants
  });
});

// @desc    Get agents
// @route   GET /api/v1/admin/users/agents
// @access  Private/Admin
export const getAgents = asyncHandler(async (req, res, next) => {
  const agents = await User.find({ role: 'agent' }).select('-password');

  res.status(200).json({
    success: true,
    count: agents.length,
    data: agents
  });
});

// ==================== PROPERTY MANAGEMENT ====================

// @desc    Get all properties for admin
// @route   GET /api/v1/admin/properties
// @access  Private/Admin
export const getAllPropertiesForAdmin = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Verify property
// @route   PUT /api/v1/admin/properties/:id/verify
// @access  Private/Admin
export const verifyProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { isVerified: true, verifiedAt: Date.now() },
    { new: true }
  );

  if (!property) {
    return next(new ErrorResponse(`Property not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: property
  });
});

// @desc    Feature property
// @route   PUT /api/v1/admin/properties/:id/feature
// @access  Private/Admin
export const featureProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { isFeatured: true, featuredAt: Date.now() },
    { new: true }
  );

  if (!property) {
    return next(new ErrorResponse(`Property not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: property
  });
});

// @desc    Delete property
// @route   DELETE /api/v1/admin/properties/:id
// @access  Private/Admin
export const deleteProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(new ErrorResponse(`Property not found with id of ${req.params.id}`, 404));
  }

  await property.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// ==================== PROPERTY CATEGORIES ====================

// @desc    Get property categories
// @route   GET /api/v1/admin/properties/categories
// @access  Private/Admin
export const getPropertyCategories = asyncHandler(async (req, res, next) => {
  const categories = await PropertyCategory.find({ isActive: true });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Create property category
// @route   POST /api/v1/admin/properties/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;
  
  const category = await PropertyCategory.create(req.body);

  res.status(201).json({
    success: true,
    data: category
  });
});

// @desc    Update property category
// @route   PUT /api/v1/admin/properties/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req, res, next) => {
  const category = await PropertyCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Delete property category
// @route   DELETE /api/v1/admin/properties/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await PropertyCategory.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// ==================== BOOKING MANAGEMENT ====================

// @desc    Get all bookings
// @route   GET /api/v1/admin/bookings
// @access  Private/Admin
export const getAllBookings = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Approve booking
// @route   PUT /api/v1/admin/bookings/:id/approve
// @access  Private/Admin
export const approveBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status: 'approved', approvedAt: Date.now() },
    { new: true }
  );

  if (!booking) {
    return next(new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Reject booking
// @route   PUT /api/v1/admin/bookings/:id/reject
// @access  Private/Admin
export const rejectBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected', rejectedAt: Date.now() },
    { new: true }
  );

  if (!booking) {
    return next(new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Get pending bookings
// @route   GET /api/v1/admin/bookings/pending
// @access  Private/Admin
export const getPendingBookings = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find({ status: 'pending' })
    .populate('user', 'name email')
    .populate('property', 'title price');

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// ==================== ANALYTICS & REPORTS ====================

// @desc    Get analytics data
// @route   GET /api/v1/admin/analytics
// @access  Private/Admin
export const getAnalyticsData = asyncHandler(async (req, res, next) => {
  // Totals
  const totalUsers = await User.countDocuments();
  const totalProperties = await Property.countDocuments();
  const totalBookings = await Booking.countDocuments();
  const totalRevenueAgg = await Booking.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalRevenue = totalRevenueAgg[0]?.total || 0;

  // User growth by month
  const userGrowthAgg = await User.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  const userGrowth = userGrowthAgg.map(u => ({ month: u._id, count: u.count }));

  // Booking growth by month
  const bookingGrowthAgg = await Booking.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  const bookingGrowth = bookingGrowthAgg.map(b => ({ month: b._id, count: b.count }));

  // Revenue growth by month
  const revenueGrowthAgg = await Booking.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        amount: { $sum: '$amount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  const revenueGrowth = revenueGrowthAgg.map(r => ({ month: r._id, amount: r.amount }));

  // Properties by type
  const propertiesByTypeAgg = await Property.aggregate([
    {
      $group: {
        _id: '$propertyType',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  const propertiesByType = propertiesByTypeAgg.map(p => ({ type: p._id, count: p.count }));

  // Bookings by status
  const bookingsByStatusAgg = await Booking.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  const bookingsByStatus = bookingsByStatusAgg.map(b => ({ status: b._id, count: b.count }));

  // Recent users (last 5)
  const recentUsersDocs = await User.find({}, { name: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .limit(5);
  const recentUsers = recentUsersDocs.map(u => ({ id: u._id, name: u.name, joinedAt: u.createdAt }));

  // Recent bookings (last 5)
  const recentBookingsDocs = await Booking.find({}, { createdAt: 1 })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name')
    .populate('property', 'title');
  const recentBookings = recentBookingsDocs.map(b => ({
    id: b._id,
    user: b.user?.name || '',
    property: b.property?.title || '',
    date: b.createdAt
  }));

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue,
      userGrowth,
      bookingGrowth,
      revenueGrowth,
      propertiesByType,
      bookingsByStatus,
      recentUsers,
      recentBookings
    }
  });
});

// @desc    Get financial reports
// @route   GET /api/v1/admin/reports/financial
// @access  Private/Admin
export const getFinancialReports = asyncHandler(async (req, res, next) => {
  const financialData = await Booking.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: financialData
  });
});

// @desc    Get user activity reports
// @route   GET /api/v1/admin/reports/user-activity
// @access  Private/Admin
export const getUserActivityReports = asyncHandler(async (req, res, next) => {
  const userActivity = await User.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        newUsers: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: userActivity
  });
});

// @desc    Get property views reports
// @route   GET /api/v1/admin/reports/property-views
// @access  Private/Admin
export const getPropertyViewsReports = asyncHandler(async (req, res, next) => {
  const propertyViews = await Property.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: propertyViews
  });
}); 
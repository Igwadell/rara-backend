import asyncHandler from '../middleware/async.js';
import BlockedDate from '../models/BlockedDate.js';
import Property from '../models/Property.js';

// @desc    Get all blocked dates for a property
// @route   GET /api/v1/properties/:propertyId/blocked-dates
// @access  Public
export const getBlockedDates = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.params;
  const { startDate, endDate } = req.query;

  let query = { property: propertyId };

  // Filter by date range if provided
  if (startDate && endDate) {
    query.$or = [
      {
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) }
      }
    ];
  }

  const blockedDates = await BlockedDate.find(query)
    .populate('blockedBy', 'name email')
    .sort({ startDate: 1 });

  res.status(200).json({
    success: true,
    count: blockedDates.length,
    data: blockedDates
  });
});

// @desc    Create a new blocked date
// @route   POST /api/v1/properties/:propertyId/blocked-dates
// @access  Private (Landlord, Admin)
export const createBlockedDate = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.params;
  const { startDate, endDate, reason } = req.body;

  // Verify property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  // Verify user has permission to block dates for this property
  if (req.user.role !== 'admin' && property.landlord.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to block dates for this property'
    });
  }

  const blockedDate = await BlockedDate.create({
    property: propertyId,
    startDate,
    endDate,
    reason,
    blockedBy: req.user.id
  });

  await blockedDate.populate('blockedBy', 'name email');

  res.status(201).json({
    success: true,
    data: blockedDate
  });
});

// @desc    Update a blocked date
// @route   PUT /api/v1/properties/:propertyId/blocked-dates/:id
// @access  Private (Landlord, Admin)
export const updateBlockedDate = asyncHandler(async (req, res, next) => {
  const { propertyId, id } = req.params;
  const { startDate, endDate, reason } = req.body;

  let blockedDate = await BlockedDate.findById(id);

  if (!blockedDate) {
    return res.status(404).json({
      success: false,
      message: 'Blocked date not found'
    });
  }

  // Verify user has permission to update this blocked date
  if (req.user.role !== 'admin' && blockedDate.blockedBy.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this blocked date'
    });
  }

  blockedDate = await BlockedDate.findByIdAndUpdate(
    id,
    { startDate, endDate, reason },
    {
      new: true,
      runValidators: true
    }
  ).populate('blockedBy', 'name email');

  res.status(200).json({
    success: true,
    data: blockedDate
  });
});

// @desc    Delete a blocked date
// @route   DELETE /api/v1/properties/:propertyId/blocked-dates/:id
// @access  Private (Landlord, Admin)
export const deleteBlockedDate = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const blockedDate = await BlockedDate.findById(id);

  if (!blockedDate) {
    return res.status(404).json({
      success: false,
      message: 'Blocked date not found'
    });
  }

  // Verify user has permission to delete this blocked date
  if (req.user.role !== 'admin' && blockedDate.blockedBy.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this blocked date'
    });
  }

  await blockedDate.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Blocked date removed successfully'
  });
});

// @desc    Get a single blocked date
// @route   GET /api/v1/properties/:propertyId/blocked-dates/:id
// @access  Public
export const getBlockedDate = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const blockedDate = await BlockedDate.findById(id)
    .populate('blockedBy', 'name email');

  if (!blockedDate) {
    return res.status(404).json({
      success: false,
      message: 'Blocked date not found'
    });
  }

  res.status(200).json({
    success: true,
    data: blockedDate
  });
}); 
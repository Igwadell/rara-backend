import asyncHandler from '../utils/asyncHandler.js';
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

  // Check for overlapping blocked dates before creating
  const overlappingBlock = await BlockedDate.findOne({
    property: propertyId,
    $or: [
      {
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) }
      }
    ]
  });

  if (overlappingBlock) {
    return res.status(400).json({
      success: false,
      message: 'This date range overlaps with an existing blocked date',
      data: overlappingBlock
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
    message: 'Dates blocked successfully',
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

// @desc    Block all past dates for a property
// @route   POST /api/v1/properties/:propertyId/blocked-dates/block-past-dates
// @access  Private (Landlord, Admin)
export const blockPastDates = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.params;

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

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today

  // Check if there's already a blocked date that covers past dates
  const existingPastBlock = await BlockedDate.findOne({
    property: propertyId,
    startDate: { $lte: today },
    endDate: { $gte: today }
  });

  if (existingPastBlock) {
    return res.status(400).json({
      success: false,
      message: 'Past dates are already blocked for this property',
      data: existingPastBlock
    });
  }

  // Create a blocked date from a far past date to today
  const pastDate = new Date('2020-01-01'); // Start from a reasonable past date
  pastDate.setHours(0, 0, 0, 0);

  const blockedDate = await BlockedDate.create({
    property: propertyId,
    startDate: pastDate,
    endDate: today,
    reason: 'Past dates blocked - cannot book in the past',
    blockedBy: req.user.id
  });

  await blockedDate.populate('blockedBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Past dates have been blocked successfully',
    data: blockedDate
  });
});

// @desc    Unblock past dates for a property
// @route   DELETE /api/v1/properties/:propertyId/blocked-dates/unblock-past-dates
// @access  Private (Landlord, Admin)
export const unblockPastDates = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.params;

  // Verify property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  // Verify user has permission to unblock dates for this property
  if (req.user.role !== 'admin' && property.landlord.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to unblock dates for this property'
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find and delete past date blocks
  const deletedBlocks = await BlockedDate.deleteMany({
    property: propertyId,
    startDate: { $lte: today },
    endDate: { $gte: today }
  });

  if (deletedBlocks.deletedCount === 0) {
    return res.status(404).json({
      success: false,
      message: 'No past date blocks found for this property'
    });
  }

  res.status(200).json({
    success: true,
    message: `Successfully unblocked past dates. Removed ${deletedBlocks.deletedCount} blocked date entries.`,
    data: {
      deletedCount: deletedBlocks.deletedCount
    }
  });
});

// @desc    Check if past dates are blocked for a property
// @route   GET /api/v1/properties/:propertyId/blocked-dates/check-past-dates
// @access  Public
export const checkPastDatesBlocked = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.params;

  // Verify property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if past dates are blocked
  const pastDateBlock = await BlockedDate.findOne({
    property: propertyId,
    startDate: { $lte: today },
    endDate: { $gte: today }
  });

  res.status(200).json({
    success: true,
    data: {
      isPastDatesBlocked: !!pastDateBlock,
      blockedDate: pastDateBlock
    }
  });
}); 
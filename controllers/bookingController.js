import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import sendEmail from '../utils/sendEmail.js';
import Payment from '../models/Payment.js';

/**
 * @desc    Get all bookings
 * @route   GET /api/v1/bookings
 * @route   GET /api/v1/properties/:propertyId/bookings
 * @access  Private (admin, landlord)
 */
export const getBookings = asyncHandler(async (req, res, next) => {
  if (req.params.propertyId) {
    // Get bookings for a specific property
    const bookings = await Booking.find({ property: req.params.propertyId })
      .populate({
        path: 'user',
        select: 'name email phone'
      })
      .populate({
        path: 'property',
        select: 'title price'
      });

    // Check if the user is authorized (either admin or the property owner)
    if (bookings.length > 0) {
      const property = await Property.findById(req.params.propertyId);
      if (
        req.user.role !== 'admin' &&
        property.landlord.toString() !== req.user.id
      ) {
        return next(
          new ErrorResponse(
            `User ${req.user.id} is not authorized to access these bookings`,
            401
          )
        );
      }
    }

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } else if (req.user.role === 'admin') {
    // Admin can see all bookings
    res.status(200).json(res.advancedResults);
  } else if (req.user.role === 'landlord') {
    // Landlord can only see bookings for their properties
    const properties = await Property.find({ landlord: req.user.id });
    const propertyIds = properties.map(property => property._id);

    const query = Booking.find({ property: { $in: propertyIds } })
      .populate({
        path: 'user',
        select: 'name email phone'
      })
      .populate({
        path: 'property',
        select: 'title price landlord',
        populate: {
          path: 'landlord',
          select: 'name email phone'
        }
      });

    // Copy advancedResults functionality for landlords
    const bookings = await query;

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } else {
    // Regular users can only see their own bookings
    const bookings = await Booking.find({ user: req.user.id })
      .populate({
        path: 'property',
        select: 'title price photos'
      })
      .populate({
        path: 'user',
        select: 'name email phone'
      });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  }
});

/**
 * @desc    Get single booking
 * @route   GET /api/v1/bookings/:id
 * @access  Private (user, landlord, admin)
 */
export const getBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate({
      path: 'property',
      select: 'title price landlord',
      populate: {
        path: 'landlord',
        select: 'name email phone'
      }
    })
    .populate({
      path: 'user',
      select: 'name email phone'
    });

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is booking owner, property owner or admin
  if (
    booking.user._id.toString() !== req.user.id &&
    booking.property.landlord._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this booking`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Create new booking
 * @route   POST /api/v1/properties/:propertyId/bookings
 * @access  Private
 */
export const createBooking = asyncHandler(async (req, res, next) => {
  // Add property and user to req.body
  req.body.property = req.params.propertyId;
  req.body.user = req.user.id;

  const property = await Property.findById(req.params.propertyId);

  if (!property) {
    return next(
      new ErrorResponse(
        `Property not found with id of ${req.params.propertyId}`,
        404
      )
    );
  }

  // Check if property is available
  if (!property.isAvailable) {
    return next(new ErrorResponse(`Property is not available for booking`, 400));
  }

  // Check if property is verified
  if (!property.isVerified && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `Property is not verified and cannot be booked yet`,
        400
      )
    );
  }

  // Parse dates
  const checkInDate = new Date(req.body.checkInDate);
  const checkOutDate = new Date(req.body.checkOutDate);

  // Validate dates
  if (checkOutDate <= checkInDate) {
    return next(
      new ErrorResponse(`Check-out date must be after check-in date`, 400)
    );
  }

  // Check if property is already booked for these dates
  const existingBooking = await Booking.findOne({
    property: req.params.propertyId,
    $or: [
      {
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gt: checkInDate }
      }
    ],
    status: { $nin: ['cancelled', 'completed'] }
  });

  if (existingBooking) {
    return next(
      new ErrorResponse(
        `Property is already booked for the selected dates`,
        400
      )
    );
  }

  // Calculate duration in days
  const duration = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24);
  req.body.amount = property.price * duration;

  // Create booking
  const booking = await Booking.create(req.body);

  // Populate data for email
  const populatedBooking = await Booking.findById(booking._id)
    .populate({
      path: 'property',
      select: 'title'
    })
    .populate({
      path: 'user',
      select: 'name email'
    });

  // Send confirmation email to user
  const userMessage = `Dear ${populatedBooking.user.name},\n\nYou have successfully booked ${populatedBooking.property.title} from ${checkInDate.toLocaleDateString()} to ${checkOutDate.toLocaleDateString()}.\n\nTotal amount: ${req.body.amount} RWF.\n\nThank you for using Rara.com!`;

  try {
    await sendEmail({
      email: populatedBooking.user.email,
      subject: 'Rara.com - Booking Confirmation',
      message: userMessage
    });
  } catch (err) {
    console.error('Failed to send confirmation email:', err);
  }

  // If landlord exists, send notification email
  if (property.landlord) {
    const landlord = await User.findById(property.landlord);
    if (landlord && landlord.email) {
      const landlordMessage = `Dear ${landlord.name},\n\nYour property ${property.title} has been booked by ${populatedBooking.user.name} from ${checkInDate.toLocaleDateString()} to ${checkOutDate.toLocaleDateString()}.\n\nTotal amount: ${req.body.amount} RWF.\n\nPlease log in to your Rara.com account to manage this booking.`;

      try {
        await sendEmail({
          email: landlord.email,
          subject: 'Rara.com - New Booking Notification',
          message: landlordMessage
        });
      } catch (err) {
        console.error('Failed to send landlord notification email:', err);
      }
    }
  }

  res.status(201).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Update booking
 * @route   PUT /api/v1/bookings/:id
 * @access  Private (user, admin)
 */
export const updateBooking = asyncHandler(async (req, res, next) => {
  let booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is booking owner or admin
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this booking`,
        401
      )
    );
  }

  // Check if booking can be updated (not completed or cancelled)
  if (booking.status === 'completed' || booking.status === 'cancelled') {
    return next(
      new ErrorResponse(`Booking cannot be updated in its current state`, 400)
    );
  }

  // If dates are being updated, validate them
  if (req.body.checkInDate || req.body.checkOutDate) {
    const checkInDate = req.body.checkInDate
      ? new Date(req.body.checkInDate)
      : new Date(booking.checkInDate);
    const checkOutDate = req.body.checkOutDate
      ? new Date(req.body.checkOutDate)
      : new Date(booking.checkOutDate);

    if (checkOutDate <= checkInDate) {
      return next(
        new ErrorResponse(`Check-out date must be after check-in date`, 400)
      );
    }

    // Check if property is available for new dates
    const existingBooking = await Booking.findOne({
      property: booking.property,
      _id: { $ne: booking._id }, // Exclude current booking
      $or: [
        {
          checkInDate: { $lt: checkOutDate },
          checkOutDate: { $gt: checkInDate }
        }
      ],
      status: { $nin: ['cancelled', 'completed'] }
    });

    if (existingBooking) {
      return next(
        new ErrorResponse(
          `Property is already booked for the selected dates`,
          400
        )
      );
    }

    // Recalculate amount if dates changed
    if (req.body.checkInDate || req.body.checkOutDate) {
      const property = await Property.findById(booking.property);
      const duration =
        (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24);
      req.body.amount = property.price * duration;
    }
  }

  booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Cancel booking
 * @route   PUT /api/v1/bookings/:id/cancel
 * @access  Private (user, admin)
 */
export const cancelBooking = asyncHandler(async (req, res, next) => {
  let booking = await Booking.findById(req.params.id).populate({
    path: 'property',
    select: 'title landlord'
  });

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is booking owner or admin
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to cancel this booking`,
        401
      )
    );
  }

  // Check if booking can be cancelled
  if (booking.status === 'completed' || booking.status === 'cancelled') {
    return next(
      new ErrorResponse(`Booking cannot be cancelled in its current state`, 400)
    );
  }

  // Update booking status
  booking.status = 'cancelled';
  await booking.save();

  // Get user details for email
  const user = await User.findById(booking.user);

  // Send cancellation email to user
  const userMessage = `Dear ${user.name},\n\nYour booking for ${booking.property.title} has been cancelled.\n\nIf you have any questions, please contact our support team.\n\nThank you for using Rara.com!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Rara.com - Booking Cancellation',
      message: userMessage
    });
  } catch (err) {
    console.error('Failed to send cancellation email:', err);
  }

  // If landlord exists, send notification email
  if (booking.property.landlord) {
    const landlord = await User.findById(booking.property.landlord);
    if (landlord && landlord.email) {
      const landlordMessage = `Dear ${landlord.name},\n\nThe booking for your property ${booking.property.title} by ${user.name} has been cancelled.\n\nPlease log in to your Rara.com account for more details.`;

      try {
        await sendEmail({
          email: landlord.email,
          subject: 'Rara.com - Booking Cancellation Notification',
          message: landlordMessage
        });
      } catch (err) {
        console.error('Failed to send landlord notification email:', err);
      }
    }
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Complete booking (mark as completed)
 * @route   PUT /api/v1/bookings/:id/complete
 * @access  Private (landlord, admin)
 */
export const completeBooking = asyncHandler(async (req, res, next) => {
  let booking = await Booking.findById(req.params.id).populate({
    path: 'property',
    select: 'title landlord'
  });

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is property owner or admin
  if (
    booking.property.landlord.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to complete this booking`,
        401
      )
    );
  }

  // Check if booking can be completed
  if (booking.status === 'completed') {
    return next(new ErrorResponse(`Booking is already completed`, 400));
  }

  if (booking.status === 'cancelled') {
    return next(
      new ErrorResponse(`Cancelled bookings cannot be completed`, 400)
    );
  }

  // Update booking status
  booking.status = 'completed';
  await booking.save();

  // Get user details for email
  const user = await User.findById(booking.user);

  // Send completion email to user
  const userMessage = `Dear ${user.name},\n\nYour stay at ${booking.property.title} has been marked as completed by the property owner.\n\nWe hope you enjoyed your stay!\n\nThank you for using Rara.com!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Rara.com - Booking Completed',
      message: userMessage
    });
  } catch (err) {
    console.error('Failed to send completion email:', err);
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Get bookings statistics
 * @route   GET /api/v1/bookings/stats
 * @access  Private (admin, landlord)
 */
export const getBookingStats = asyncHandler(async (req, res, next) => {
  let match = {};

  // If user is landlord, only show stats for their properties
  if (req.user.role === 'landlord') {
    const properties = await Property.find({ landlord: req.user.id });
    const propertyIds = properties.map(property => property._id);
    match.property = { $in: propertyIds };
  }

  const stats = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: '$count' },
        totalRevenue: { $sum: '$totalAmount' },
        statuses: { $push: '$$ROOT' }
      }
    },
    {
      $project: {
        _id: 0,
        totalBookings: 1,
        totalRevenue: 1,
        statuses: 1
      }
    }
  ]);

  // Get recent bookings
  const recentBookings = await Booking.find(match)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate({
      path: 'property',
      select: 'title'
    })
    .populate({
      path: 'user',
      select: 'name'
    });

  res.status(200).json({
    success: true,
    data: {
      stats: stats.length > 0 ? stats[0] : { totalBookings: 0, totalRevenue: 0, statuses: [] },
      recentBookings
    }
  });
});
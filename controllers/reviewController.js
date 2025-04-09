import Review from '../models/Review.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get all reviews
 * @route   GET /api/v1/reviews
 * @route   GET /api/v1/properties/:propertyId/reviews
 * @access  Public
 */
export const getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.propertyId) {
    // Get reviews for a specific property
    const reviews = await Review.find({ property: req.params.propertyId })
      .populate({
        path: 'user',
        select: 'name photo'
      })
      .populate({
        path: 'property',
        select: 'title'
      });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } else {
    // Get all reviews with advanced filtering
    res.status(200).json(res.advancedResults);
  }
});

/**
 * @desc    Get single review
 * @route   GET /api/v1/reviews/:id
 * @access  Public
 */
export const getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate({
      path: 'user',
      select: 'name photo'
    })
    .populate({
      path: 'property',
      select: 'title landlord',
      populate: {
        path: 'landlord',
        select: 'name'
      }
    });

  if (!review) {
    return next(
      new ErrorResponse(`Review not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

/**
 * @desc    Create new review
 * @route   POST /api/v1/properties/:propertyId/reviews
 * @access  Private (user)
 */
export const createReview = asyncHandler(async (req, res, next) => {
  // Add property and user to req.body
  req.body.property = req.params.propertyId;
  req.body.user = req.user.id;

  const property = await Property.findById(req.params.propertyId);

  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.propertyId}`, 404)
    );
  }

  // Check if user has a completed booking for this property
  const booking = await Booking.findOne({
    user: req.user.id,
    property: req.params.propertyId,
    status: 'completed'
  });

  if (!booking) {
    return next(
      new ErrorResponse(
        `You can only review properties you've stayed at`,
        400
      )
    );
  }

  // Check if user already reviewed this booking
  const existingReview = await Review.findOne({
    user: req.user.id,
    booking: booking._id
  });

  if (existingReview) {
    return next(
      new ErrorResponse(
        `You have already reviewed this booking`,
        400
      )
    );
  }

  // Add booking reference to review
  req.body.booking = booking._id;

  const review = await Review.create(req.body);

  res.status(201).json({
    success: true,
    data: review
  });
});

/**
 * @desc    Update review
 * @route   PUT /api/v1/reviews/:id
 * @access  Private (user)
 */
export const updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`Review not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this review`,
        401
      )
    );
  }

  // Prevent updating response field through this route
  if (req.body.response) {
    return next(
      new ErrorResponse(
        `You cannot update the response field through this route`,
        400
      )
    );
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: review
  });
});

/**
 * @desc    Delete review
 * @route   DELETE /api/v1/reviews/:id
 * @access  Private (user, admin)
 */
export const deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`Review not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this review`,
        401
      )
    );
  }

  await review.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Respond to review (landlord)
 * @route   PUT /api/v1/reviews/:id/respond
 * @access  Private (landlord, admin)
 */
export const respondToReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id)
    .populate({
      path: 'property',
      select: 'landlord'
    });

  if (!review) {
    return next(
      new ErrorResponse(`Review not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is property owner or admin
  if (
    review.property.landlord.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to respond to this review`,
        401
      )
    );
  }

  // Check if response already exists
  if (review.response && review.response.text) {
    return next(
      new ErrorResponse(
        `You have already responded to this review`,
        400
      )
    );
  }

  // Update response
  review.response = {
    text: req.body.response,
    respondedAt: Date.now()
  };

  await review.save();

  res.status(200).json({
    success: true,
    data: review
  });
});
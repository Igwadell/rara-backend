import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import BlockedDate from '../models/BlockedDate.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import geocoder from '../utils/geocoder.js';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../config/cloudinary.js';

// @desc    Get all properties
// @route   GET /api/v1/properties
// @route   GET /api/v1/landlords/:landlordId/properties
// @access  Public
export const getProperties = asyncHandler(async (req, res, next) => {
  if (req.params.landlordId) {
    const properties = await Property.find({ landlord: req.params.landlordId });

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single property
// @route   GET /api/v1/properties/:id
// @access  Public
export const getProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id).populate({
    path: 'landlord',
    select: 'name email phone'
  });

  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: property
  });
});

// @desc    Create new property
// @route   POST /api/v1/properties
// @access  Private (landlord, admin)
export const createProperty = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.landlord = req.user.id;

  // Removed single property restriction for landlords

  const property = await Property.create(req.body);

  res.status(201).json({
    success: true,
    data: property
  });
});

// @desc    Update property
// @route   PUT /api/v1/properties/:id
// @access  Private (landlord, admin)
export const updateProperty = asyncHandler(async (req, res, next) => {
  let property = await Property.findById(req.params.id);

  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is property owner or admin
  if (
    property.landlord.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this property`,
        401
      )
    );
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

// @desc    Delete property
// @route   DELETE /api/v1/properties/:id
// @access  Private (landlord, admin)
export const deleteProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is property owner or admin
  if (
    property.landlord.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this property`,
        401
      )
    );
  }

  await property.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get properties within a radius
// @route   GET /api/v1/properties/radius/:zipcode/:distance
// @access  Public
export const getPropertiesInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide dist by radius of Earth
  // Earth Radius = 6,378 km / 3,963 mi
  const radius = distance / 6378;

  const properties = await Property.find({
    location: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] }
    }
  });

  res.status(200).json({
    success: true,
    count: properties.length,
    data: properties
  });
});

// @desc    Upload photo for property
// @route   PUT /api/v1/properties/:id/photo
// @access  Private (landlord, admin)
export const propertyPhotoUpload = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is property owner or admin
  if (
    property.landlord.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this property`,
        401
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // Upload image to cloudinary
  const result = await cloudinary.uploader.upload(file.tempFilePath, {
    folder: 'rara/properties',
    width: 1500,
    height: 1000,
    crop: 'scale'
  });

  // Add photo to property
  property.photos.push(result.secure_url);
  await property.save();

  res.status(200).json({
    success: true,
    data: result.secure_url
  });
});

// @desc    Verify property
// @route   PUT /api/v1/properties/:id/verify
// @access  Private (admin)
export const verifyProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }

  property.isVerified = true;
  await property.save();

  res.status(200).json({
    success: true,
    data: property
  });
});

// @desc    Upload multiple images for a property (gallery)
// @route   POST /api/v1/properties/upload
// @access  Private (landlord, admin)
export const uploadPropertyImages = asyncHandler(async (req, res, next) => {
  if (!req.files || !req.files.files) {
    return next(new ErrorResponse('Please upload one or more image files', 400));
  }

  const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
  const urls = [];

  for (const file of files) {
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse('Please upload only image files', 400));
    }
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400));
    }
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'rara/properties',
      width: 1500,
      height: 1000,
      crop: 'scale'
    });
    urls.push({ url: result.secure_url, public_id: result.public_id, width: result.width, height: result.height });
  }

  res.status(200).json({
    success: true,
    data: urls
  });
});

// @desc    Get property availability
// @route   GET /api/v1/properties/:id/availability
// @access  Public
export const getPropertyAvailability = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  const property = await Property.findById(req.params.id);
  
  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Get bookings for the date range
  const bookings = await Booking.find({
    property: req.params.id,
    $or: [
      {
        checkIn: { $gte: new Date(startDate || new Date()), $lte: new Date(endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) }
      },
      {
        checkOut: { $gte: new Date(startDate || new Date()), $lte: new Date(endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) }
      },
      {
        checkIn: { $lte: new Date(startDate || new Date()) },
        checkOut: { $gte: new Date(endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) }
      }
    ]
  }).select('checkIn checkOut status');
  
  // Get blocked dates for the date range
  const blockedDates = await BlockedDate.find({
    property: req.params.id,
    startDate: { $gte: new Date(startDate || new Date()) },
    endDate: { $lte: new Date(endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) }
  }).select('startDate endDate reason');
  
  // Generate availability calendar
  const availability = {
    property: {
      id: property._id,
      name: property.name,
      address: property.address
    },
    bookings,
    blockedDates,
    isAvailable: property.isAvailable
  };
  
  res.status(200).json({
    success: true,
    data: availability
  });
});

// @desc    Get property pricing
// @route   GET /api/v1/properties/:id/pricing
// @access  Public
export const getPropertyPricing = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);
  
  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }
  
  const pricing = {
    basePrice: property.price,
    cleaningFee: property.cleaningFee || 0,
    serviceFee: property.serviceFee || 0,
    securityDeposit: property.securityDeposit || 0,
    currency: property.currency || 'USD',
    pricingRules: property.pricingRules || []
  };
  
  res.status(200).json({
    success: true,
    data: pricing
  });
});

// @desc    Update property pricing
// @route   PUT /api/v1/properties/:id/pricing
// @access  Private (landlord, admin)
export const updatePropertyPricing = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);
  
  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is property owner or admin
  if (
    property.landlord.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this property`,
        401
      )
    );
  }
  
  const { price, cleaningFee, serviceFee, securityDeposit, currency, pricingRules } = req.body;
  
  const updatedProperty = await Property.findByIdAndUpdate(
    req.params.id,
    {
      price,
      cleaningFee,
      serviceFee,
      securityDeposit,
      currency,
      pricingRules
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: updatedProperty
  });
});

// @desc    Block dates for a property
// @route   POST /api/v1/properties/:id/block-dates
// @access  Private (landlord, admin)
export const blockDates = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);
  
  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is property owner or admin
  if (
    property.landlord.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this property`,
        401
      )
    );
  }
  
  // Check if request body contains dates array or single date range
  let datesToBlock = [];
  
  if (Array.isArray(req.body)) {
    // Handle array of date objects
    datesToBlock = req.body;
  } else if (req.body.startDate && req.body.endDate) {
    // Handle single date range (backward compatibility)
    datesToBlock = [req.body];
  } else {
    return next(
      new ErrorResponse(
        `Invalid request format. Expected array of date objects or single date range`,
        400
      )
    );
  }
  
  // Validate each date object
  for (const dateObj of datesToBlock) {
    if (!dateObj.startDate || !dateObj.endDate) {
      return next(
        new ErrorResponse(
          `Each date object must have startDate and endDate`,
          400
        )
      );
    }
    
    // Validate date format
    const startDate = new Date(dateObj.startDate);
    const endDate = new Date(dateObj.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return next(
        new ErrorResponse(
          `Invalid date format. Use YYYY-MM-DD format`,
          400
        )
      );
    }
    
    if (endDate < startDate) {
      return next(
        new ErrorResponse(
          `End date must be on or after start date`,
          400
        )
      );
    }
  }
  
  // Create blocked date records
  const blockedDates = [];
  const errors = [];
  
  for (const dateObj of datesToBlock) {
    try {
      const blockedDate = await BlockedDate.create({
        property: req.params.id,
        startDate: new Date(dateObj.startDate),
        endDate: new Date(dateObj.endDate),
        reason: dateObj.reason || 'Blocked by owner',
        blockedBy: req.user.id
      });
      blockedDates.push(blockedDate);
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - date range already exists
        errors.push(`Date range ${dateObj.startDate} to ${dateObj.endDate} already blocked`);
      } else if (error.name === 'ValidationError') {
        errors.push(`Invalid date range: ${dateObj.startDate} to ${dateObj.endDate} - ${error.message}`);
      } else {
        errors.push(`Error blocking dates ${dateObj.startDate} to ${dateObj.endDate}: ${error.message}`);
      }
    }
  }
  
  res.status(201).json({
    success: true,
    data: {
      blockedDates,
      errors,
      totalRequested: datesToBlock.length,
      successfullyBlocked: blockedDates.length,
      failedToBlock: errors.length
    }
  });
});

// @desc    Unblock dates for a property
// @route   DELETE /api/v1/properties/:id/block-dates
// @access  Private (landlord, admin)
export const unblockDates = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);
  
  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is property owner or admin
  if (
    property.landlord.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this property`,
        401
      )
    );
  }
  
  // Check if request body contains dates array or single date range
  let datesToUnblock = [];
  
  if (Array.isArray(req.body)) {
    // Handle array of date objects
    datesToUnblock = req.body;
  } else if (req.body.startDate && req.body.endDate) {
    // Handle single date range (backward compatibility)
    datesToUnblock = [req.body];
  } else {
    return next(
      new ErrorResponse(
        `Invalid request format. Expected array of date objects or single date range`,
        400
      )
    );
  }
  
  // Validate each date object
  for (const dateObj of datesToUnblock) {
    if (!dateObj.startDate || !dateObj.endDate) {
      return next(
        new ErrorResponse(
          `Each date object must have startDate and endDate`,
          400
        )
      );
    }
    
    // Validate date format
    const startDate = new Date(dateObj.startDate);
    const endDate = new Date(dateObj.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return next(
        new ErrorResponse(
          `Invalid date format. Use YYYY-MM-DD format`,
          400
        )
      );
    }
    
    if (endDate < startDate) {
      return next(
        new ErrorResponse(
          `End date must be on or after start date`,
          400
        )
      );
    }
  }
  
  // Delete blocked date records
  const deletedDates = [];
  const errors = [];
  let totalDeletedCount = 0;
  
  for (const dateObj of datesToUnblock) {
    try {
      const deletedBlockedDates = await BlockedDate.deleteMany({
        property: req.params.id,
        startDate: { $gte: new Date(dateObj.startDate) },
        endDate: { $lte: new Date(dateObj.endDate) }
      });
      
      if (deletedBlockedDates.deletedCount > 0) {
        deletedDates.push({
          startDate: dateObj.startDate,
          endDate: dateObj.endDate,
          deletedCount: deletedBlockedDates.deletedCount
        });
        totalDeletedCount += deletedBlockedDates.deletedCount;
      } else {
        errors.push(`No blocked dates found for range ${dateObj.startDate} to ${dateObj.endDate}`);
      }
    } catch (error) {
      errors.push(`Error unblocking dates ${dateObj.startDate} to ${dateObj.endDate}: ${error.message}`);
    }
  }
  
  res.status(200).json({
    success: true,
    data: {
      deletedDates,
      errors,
      totalRequested: datesToUnblock.length,
      successfullyUnblocked: deletedDates.length,
      failedToUnblock: errors.length,
      totalDeletedCount
    }
  });
});

// @desc    Get booking window for a property
// @route   GET /api/v1/properties/:id/booking-window
// @access  Public
export const getBookingWindow = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);
  
  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }
  
  const bookingWindow = {
    advanceBookingDays: property.advanceBookingDays || 365,
    sameDayBooking: property.sameDayBooking || false,
    instantBooking: property.instantBooking || false,
    bookingLeadTime: property.bookingLeadTime || 0
  };
  
  res.status(200).json({
    success: true,
    data: bookingWindow
  });
});

// @desc    Update booking window for a property
// @route   PUT /api/v1/properties/:id/booking-window
// @access  Private (landlord, admin)
export const updateBookingWindow = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);
  
  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is property owner or admin
  if (
    property.landlord.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this property`,
        401
      )
    );
  }
  
  const { advanceBookingDays, sameDayBooking, instantBooking, bookingLeadTime } = req.body;
  
  const updatedProperty = await Property.findByIdAndUpdate(
    req.params.id,
    {
      advanceBookingDays,
      sameDayBooking,
      instantBooking,
      bookingLeadTime
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: updatedProperty
  });
});

// @desc    Get stay limits for a property
// @route   GET /api/v1/properties/:id/stay-limits
// @access  Public
export const getStayLimits = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);
  
  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }
  
  const stayLimits = {
    minimumStay: property.minimumStay || 1,
    maximumStay: property.maximumStay || 30,
    minimumAdvanceNotice: property.minimumAdvanceNotice || 0,
    maximumAdvanceNotice: property.maximumAdvanceNotice || 365
  };
  
  res.status(200).json({
    success: true,
    data: stayLimits
  });
});

// @desc    Update stay limits for a property
// @route   PUT /api/v1/properties/:id/stay-limits
// @access  Private (landlord, admin)
export const updateStayLimits = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);
  
  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is property owner or admin
  if (
    property.landlord.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this property`,
        401
      )
    );
  }
  
  const { minimumStay, maximumStay, minimumAdvanceNotice, maximumAdvanceNotice } = req.body;
  
  const updatedProperty = await Property.findByIdAndUpdate(
    req.params.id,
    {
      minimumStay,
      maximumStay,
      minimumAdvanceNotice,
      maximumAdvanceNotice
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: updatedProperty
  });
});
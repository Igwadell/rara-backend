import Property from '../models/Property.js';
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
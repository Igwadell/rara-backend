import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';
import SavedProperty from '../models/SavedProperty.js';
import Property from '../models/Property.js';
import path from 'path';

// @desc    Get user profile
// @route   GET /api/v1/user/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password');
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/user/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    bio: req.body.bio,
    address: req.body.address
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  }).select('-password');

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Get user settings
// @route   GET /api/v1/user/settings
// @access  Private
export const getUserSettings = asyncHandler(async (req, res, next) => {
  let settings = await UserSettings.findOne({ user: req.user.id });
  
  if (!settings) {
    settings = await UserSettings.create({ user: req.user.id });
  }

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Update user settings
// @route   PUT /api/v1/user/settings
// @access  Private
export const updateUserSettings = asyncHandler(async (req, res, next) => {
  let settings = await UserSettings.findOne({ user: req.user.id });
  
  if (!settings) {
    settings = await UserSettings.create({ user: req.user.id });
  }

  settings = await UserSettings.findOneAndUpdate(
    { user: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Upload user avatar
// @route   POST /api/v1/user/avatar
// @access  Private
export const uploadUserAvatar = asyncHandler(async (req, res, next) => {
  if (!req.files || !req.files.avatar) {
    return next(new ErrorResponse('Please upload an image', 400));
  }

  const file = req.files.avatar;

  // Check file type
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  // Check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400));
  }

  // Create custom filename
  file.name = `avatar_${req.user.id}_${Date.now()}${path.parse(file.name).ext}`;

  file.mv(`./uploads/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Problem with file upload', 500));
    }

    const user = await User.findByIdAndUpdate(req.user.id, {
      avatar: file.name
    }, { new: true }).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  });
});

// @desc    Get user's saved properties
// @route   GET /api/v1/user/saved-properties
// @access  Private
export const getSavedProperties = asyncHandler(async (req, res, next) => {
  const savedProperties = await SavedProperty.find({ user: req.user.id })
    .populate({
      path: 'property',
      select: 'title description price location images'
    });

  res.status(200).json({
    success: true,
    count: savedProperties.length,
    data: savedProperties
  });
});

// @desc    Add property to saved list
// @route   POST /api/v1/user/saved-properties
// @access  Private
export const addSavedProperty = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.body;

  if (!propertyId) {
    return next(new ErrorResponse('Property ID is required', 400));
  }

  // Check if property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    return next(new ErrorResponse('Property not found', 404));
  }

  // Check if already saved
  const existingSave = await SavedProperty.findOne({
    user: req.user.id,
    property: propertyId
  });

  if (existingSave) {
    return next(new ErrorResponse('Property already saved', 400));
  }

  const savedProperty = await SavedProperty.create({
    user: req.user.id,
    property: propertyId
  });

  res.status(201).json({
    success: true,
    data: savedProperty
  });
});

// @desc    Remove property from saved list
// @route   DELETE /api/v1/user/saved-properties/:propertyId
// @access  Private
export const removeSavedProperty = asyncHandler(async (req, res, next) => {
  const savedProperty = await SavedProperty.findOneAndDelete({
    user: req.user.id,
    property: req.params.propertyId
  });

  if (!savedProperty) {
    return next(new ErrorResponse('Saved property not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {}
  });
}); 
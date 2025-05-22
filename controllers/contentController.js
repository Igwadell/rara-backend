import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import BlogPost from '../models/BlogPost.js';
import Page from '../models/Page.js';
import Media from '../models/Media.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get all blog posts
// @route   GET /api/v1/content/blog
// @access  Public
export const getBlogPosts = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Create blog post
// @route   POST /api/v1/content/blog
// @access  Private/Admin
export const createBlogPost = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.author = req.user.id;

  const blogPost = await BlogPost.create(req.body);

  res.status(201).json({
    success: true,
    data: blogPost
  });
});

// @desc    Get all pages
// @route   GET /api/v1/content/pages
// @access  Public
export const getPages = asyncHandler(async (req, res, next) => {
  const pages = await Page.find();

  res.status(200).json({
    success: true,
    data: pages
  });
});

// @desc    Update page
// @route   PUT /api/v1/content/pages/:id
// @access  Private/Admin
export const updatePage = asyncHandler(async (req, res, next) => {
  let page = await Page.findById(req.params.id);

  if (!page) {
    return next(new ErrorResponse(`Page not found with id of ${req.params.id}`, 404));
  }

  page = await Page.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: page
  });
});

// @desc    Upload media
// @route   POST /api/v1/content/media
// @access  Private
export const uploadMedia = asyncHandler(async (req, res, next) => {
  if (!req.files || !req.files.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const file = req.files.file;

  // Check file type
  if (!file.mimetype.startsWith('image') && !file.mimetype.startsWith('video')) {
    return next(new ErrorResponse('Please upload an image or video file', 400));
  }

  // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload a file less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // Upload to cloudinary
  const result = await cloudinary.uploader.upload(file.tempFilePath, {
    resource_type: 'auto',
    folder: 'media'
  });

  // Create media record
  const media = await Media.create({
    user: req.user.id,
    title: req.body.title || file.name,
    type: file.mimetype.startsWith('image') ? 'image' : 'video',
    url: result.secure_url,
    publicId: result.public_id
  });

  res.status(201).json({
    success: true,
    data: media
  });
});

// @desc    Get all media
// @route   GET /api/v1/content/media
// @access  Private
export const getMedia = asyncHandler(async (req, res, next) => {
  const media = await Media.find().populate('user', 'name email');

  res.status(200).json({
    success: true,
    data: media
  });
}); 
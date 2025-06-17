import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import Media from '../models/Media.js';
import path from 'path';

// @desc    Upload images
// @route   POST /api/v1/upload/images
// @access  Private
export const uploadImages = asyncHandler(async (req, res, next) => {
  if (!req.files || !req.files.images) {
    return next(new ErrorResponse('Please upload images', 400));
  }

  const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
  const uploadedFiles = [];

  for (const file of files) {
    // Check file type
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse('Please upload image files only', 400));
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(new ErrorResponse(`Please upload images less than ${process.env.MAX_FILE_UPLOAD}`, 400));
    }

    // Create custom filename
    file.name = `image_${req.user.id}_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.parse(file.name).ext}`;

    file.mv(`./uploads/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse('Problem with file upload', 500));
      }

      // Save to database
      const media = await Media.create({
        user: req.user.id,
        filename: file.name,
        originalName: file.name,
        mimetype: file.mimetype,
        size: file.size,
        type: 'image'
      });

      uploadedFiles.push(media);
    });
  }

  res.status(200).json({
    success: true,
    count: uploadedFiles.length,
    data: uploadedFiles
  });
});

// @desc    Upload documents
// @route   POST /api/v1/upload/documents
// @access  Private
export const uploadDocuments = asyncHandler(async (req, res, next) => {
  if (!req.files || !req.files.documents) {
    return next(new ErrorResponse('Please upload documents', 400));
  }

  const files = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];
  const uploadedFiles = [];

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  for (const file of files) {
    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return next(new ErrorResponse('Please upload valid document files (PDF, DOC, DOCX, TXT)', 400));
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(new ErrorResponse(`Please upload documents less than ${process.env.MAX_FILE_UPLOAD}`, 400));
    }

    // Create custom filename
    file.name = `doc_${req.user.id}_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.parse(file.name).ext}`;

    file.mv(`./uploads/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse('Problem with file upload', 500));
      }

      // Save to database
      const media = await Media.create({
        user: req.user.id,
        filename: file.name,
        originalName: file.name,
        mimetype: file.mimetype,
        size: file.size,
        type: 'document'
      });

      uploadedFiles.push(media);
    });
  }

  res.status(200).json({
    success: true,
    count: uploadedFiles.length,
    data: uploadedFiles
  });
});

// @desc    Delete uploaded file
// @route   DELETE /api/v1/upload/:id
// @access  Private
export const deleteUploadedFile = asyncHandler(async (req, res, next) => {
  const media = await Media.findById(req.params.id);

  if (!media) {
    return next(new ErrorResponse(`File not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the file
  if (media.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this file`, 401));
  }

  // Delete file from filesystem
  const fs = await import('fs');
  const filePath = `./uploads/${media.filename}`;
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await media.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
}); 
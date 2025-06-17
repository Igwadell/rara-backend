import { v2 as cloudinary } from 'cloudinary';
import ErrorResponse from '../utils/errorResponse.js';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * @desc    Middleware to handle property photo uploads
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @param   {Function} next - Next middleware function
 */
export const uploadPropertyPhotos = async (req, res, next) => {
  try {
    if (!req.files || !req.files.photos) {
      return next(new ErrorResponse('Please upload at least one photo', 400));
    }

    // Convert to array if single file
    const files = Array.isArray(req.files.photos)
      ? req.files.photos
      : [req.files.photos];

    // Validate files
    for (const file of files) {
      // Check if image
      if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse('Please upload image files only', 400));
      }

      // Check file size
      if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
          new ErrorResponse(
            `Please upload an image less than ${process.env.MAX_FILE_UPLOAD / 1000000}MB`,
            400
          )
        );
      }
    }

    // Process uploads
    const uploadResults = [];
    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'rara/temp_uploads',
        transformation: [
          { width: 1500, height: 1000, crop: 'limit' },
          { quality: 'auto:good' }
        ]
      });

      uploadResults.push({
        tempUrl: result.secure_url,
        publicId: result.public_id,
        fileInfo: {
          name: file.name,
          size: file.size,
          mimetype: file.mimetype
        }
      });
    }

    // Attach to request object for controller
    req.uploadResults = uploadResults;
    next();
  } catch (err) {
    console.error('Upload middleware error:', err);
    next(new ErrorResponse('File upload failed', 500));
  }
};

/**
 * @desc    Middleware to handle user avatar upload
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @param   {Function} next - Next middleware function
 */
export const uploadUserAvatar = async (req, res, next) => {
  try {
    if (!req.files || !req.files.avatar) {
      return next(new ErrorResponse('Please upload an avatar image', 400));
    }

    const file = req.files.avatar;

    // Validate image
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse('Please upload an image file', 400));
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Please upload an image less than ${process.env.MAX_FILE_UPLOAD / 1000000}MB`,
          400
        )
      );
    }

    // Process upload
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'rara/temp_avatars',
      transformation: [
        { width: 500, height: 500, crop: 'thumb', gravity: 'face' },
        { quality: 'auto:best' }
      ]
    });

    // Attach to request object
    req.avatarUpload = {
      tempUrl: result.secure_url,
      publicId: result.public_id,
      fileInfo: {
        name: file.name,
        size: file.size,
        mimetype: file.mimetype
      }
    };

    next();
  } catch (err) {
    console.error('Avatar upload middleware error:', err);
    next(new ErrorResponse('Avatar upload failed', 500));
  }
};

/**
 * @desc    Middleware to handle document uploads for verification
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @param   {Function} next - Next middleware function
 */
export const uploadVerificationDocument = async (req, res, next) => {
  try {
    if (!req.files || !req.files.document) {
      return next(new ErrorResponse('Please upload a document', 400));
    }

    const file = req.files.document;

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'image/jpg'
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return next(
        new ErrorResponse(
          'Please upload a JPEG, PNG, or PDF document',
          400
        )
      );
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Please upload a document less than ${process.env.MAX_FILE_UPLOAD / 1000000}MB`,
          400
        )
      );
    }

    // Process upload
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'rara/temp_documents',
      resource_type: 'auto', // Detect if image or raw file
      format: file.mimetype === 'application/pdf' ? 'pdf' : undefined
    });

    // Attach to request object
    req.documentUpload = {
      tempUrl: result.secure_url,
      publicId: result.public_id,
      fileInfo: {
        name: file.name,
        size: file.size,
        mimetype: file.mimetype,
        documentType: req.body.documentType || 'identity'
      }
    };

    next();
  } catch (err) {
    console.error('Document upload middleware error:', err);
    next(new ErrorResponse('Document upload failed', 500));
  }
};

/**
 * @desc    Middleware to clean up temporary uploads if request fails
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @param   {Function} next - Next middleware function
 */
export const cleanupUploads = async (req, res, next) => {
  // Cleanup function to be called on error
  res.cleanupUploads = async () => {
    try {
      if (req.uploadResults) {
        for (const upload of req.uploadResults) {
          await cloudinary.uploader.destroy(upload.publicId);
        }
      }
      if (req.avatarUpload) {
        await cloudinary.uploader.destroy(req.avatarUpload.publicId);
      }
      if (req.documentUpload) {
        await cloudinary.uploader.destroy(req.documentUpload.publicId);
      }
    } catch (err) {
      console.error('Cleanup uploads error:', err);
    }
  };

  // Attach to response finish event
  const originalEnd = res.end;
  res.end = async function (chunk, encoding) {
    if (res.statusCode >= 400) {
      await res.cleanupUploads();
    }
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * @desc    Middleware to handle avatar upload
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @param   {Function} next - Next middleware function
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.files || !req.files.avatar) {
      return next(new ErrorResponse('Please upload an avatar image', 400));
    }

    const file = req.files.avatar;

    // Validate image
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse('Please upload an image file', 400));
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Please upload an image less than ${process.env.MAX_FILE_UPLOAD / 1000000}MB`,
          400
        )
      );
    }

    next();
  } catch (err) {
    console.error('Avatar upload middleware error:', err);
    next(new ErrorResponse('Avatar upload failed', 500));
  }
};

/**
 * @desc    Middleware to handle image uploads
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @param   {Function} next - Next middleware function
 */
export const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || !req.files.images) {
      return next(new ErrorResponse('Please upload images', 400));
    }

    const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

    // Validate files
    for (const file of files) {
      if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse('Please upload image files only', 400));
      }

      if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
          new ErrorResponse(
            `Please upload images less than ${process.env.MAX_FILE_UPLOAD / 1000000}MB`,
            400
          )
        );
      }
    }

    next();
  } catch (err) {
    console.error('Image upload middleware error:', err);
    next(new ErrorResponse('Image upload failed', 500));
  }
};

/**
 * @desc    Middleware to handle document uploads
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @param   {Function} next - Next middleware function
 */
export const uploadDocuments = async (req, res, next) => {
  try {
    if (!req.files || !req.files.documents) {
      return next(new ErrorResponse('Please upload documents', 400));
    }

    const files = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    // Validate files
    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return next(new ErrorResponse('Please upload valid document files (PDF, DOC, DOCX, TXT)', 400));
      }

      if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
          new ErrorResponse(
            `Please upload documents less than ${process.env.MAX_FILE_UPLOAD / 1000000}MB`,
            400
          )
        );
      }
    }

    next();
  } catch (err) {
    console.error('Document upload middleware error:', err);
    next(new ErrorResponse('Document upload failed', 500));
  }
};
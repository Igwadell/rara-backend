import express from 'express';
import {
  uploadImages,
  uploadDocuments,
  deleteUploadedFile
} from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import { uploadImages as uploadImagesMiddleware, uploadDocuments as uploadDocumentsMiddleware } from '../middleware/upload.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Upload routes
router.post('/images', uploadImagesMiddleware, uploadImages);
router.post('/documents', uploadDocumentsMiddleware, uploadDocuments);
router.delete('/:id', deleteUploadedFile);

export default router; 
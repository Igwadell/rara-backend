import express from 'express';
import {
  getBlogPosts,
  createBlogPost,
  getPages,
  updatePage,
  uploadMedia,
  getMedia
} from '../controllers/contentController.js';
import { protect, authorize } from '../middleware/auth.js';
import advancedResults from '../middleware/advancedResults.js';
import BlogPost from '../models/BlogPost.js';

const router = express.Router();

// Blog routes
router
  .route('/blog')
  .get(advancedResults(BlogPost), getBlogPosts)
  .post(protect, authorize('admin'), createBlogPost);

// Pages routes
router
  .route('/pages')
  .get(getPages);

router
  .route('/pages/:id')
  .put(protect, authorize('admin'), updatePage);

// Media routes
router
  .route('/media')
  .get(protect, getMedia)
  .post(protect, uploadMedia);

export default router; 
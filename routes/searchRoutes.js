import express from 'express';
import {
  searchProperties,
  searchNearby,
  searchWithinArea,
  searchByPOI,
  searchByImage,
  getTravelTime,
  getAutocompleteSuggestions
} from '../controllers/searchController.js';
import { uploadPropertyPhotos } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', searchProperties);
router.get('/nearby', searchNearby);
router.get('/area', searchWithinArea);
router.get('/poi', searchByPOI);
router.post('/image', uploadPropertyPhotos, searchByImage);
router.get('/travel-time', getTravelTime);
router.get('/autocomplete', getAutocompleteSuggestions);

export default router;
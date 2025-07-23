import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  updateAvatar,
  getAdminsPublic
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import advancedResults from '../middleware/advancedResults.js';
import User from '../models/User.js';

const router = express.Router();

// Use protect middleware for all routes
router.use(protect);

// Public for any logged-in user
router.get('/admins', getAdminsPublic);

// Routes that require admin privileges
router.use(authorize('admin'));

router
  .route('/')
  .get(advancedResults(User), getUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.get('/roles', getRoles);
router.put('/:id/avatar', updateAvatar);

export default router; 
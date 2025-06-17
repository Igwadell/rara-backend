import express from 'express';
import {
  // User Management
  getAllUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  changeUserRole,
  getLandlords,
  getTenants,
  getAgents,
  
  // Property Management
  getAllPropertiesForAdmin,
  verifyProperty,
  featureProperty,
  deleteProperty,
  getPropertyCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Booking Management
  getAllBookings,
  approveBooking,
  rejectBooking,
  getPendingBookings,
  
  // Analytics & Reports
  getAnalyticsData,
  getFinancialReports,
  getUserActivityReports,
  getPropertyViewsReports
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import advancedResults from '../middleware/advancedResults.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Protect all routes and require admin role
router.use(protect);
router.use(authorize('admin'));

// User Management Routes
router
  .route('/users')
  .get(advancedResults(User), getAllUsers);

router
  .route('/users/:id')
  .get(getUserDetails)
  .put(updateUser)
  .delete(deleteUser);

router.put('/users/:id/role', changeUserRole);
router.get('/users/landlords', getLandlords);
router.get('/users/tenants', getTenants);
router.get('/users/agents', getAgents);

// Property Management Routes
router
  .route('/properties')
  .get(advancedResults(Property), getAllPropertiesForAdmin);

router.put('/properties/:id/verify', verifyProperty);
router.put('/properties/:id/feature', featureProperty);
router.delete('/properties/:id', deleteProperty);

// Property Categories
router
  .route('/properties/categories')
  .get(getPropertyCategories)
  .post(createCategory);

router
  .route('/properties/categories/:id')
  .put(updateCategory)
  .delete(deleteCategory);

// Booking Management Routes
router
  .route('/bookings')
  .get(advancedResults(Booking), getAllBookings);

router.put('/bookings/:id/approve', approveBooking);
router.put('/bookings/:id/reject', rejectBooking);
router.get('/bookings/pending', getPendingBookings);

// Analytics & Reports Routes
router.get('/analytics', getAnalyticsData);
router.get('/reports/financial', getFinancialReports);
router.get('/reports/user-activity', getUserActivityReports);
router.get('/reports/property-views', getPropertyViewsReports);

export default router; 
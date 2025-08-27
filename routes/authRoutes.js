import express from 'express';
import {
  register,
  verifyUser,
  login,
  logout,
  refresh,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  googleLogin
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.get('/verify/:verificationToken', verifyUser);
router.post('/login', login);
router.post("/google", googleLogin);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/verify-email', verifyEmail);

export default router;
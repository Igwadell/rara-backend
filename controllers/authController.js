import fetch from 'node-fetch';

// Polyfill fetch globally for Node 22+
globalThis.fetch = fetch;

import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
// import { OAuth2Client } from 'google-auth-library';
import { generateToken } from '../utils/generateToken.js';
import * as jose from 'jose';

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone, isVerified } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    isVerified: isVerified || false
  });

  // If user is already verified, send token response
  if (isVerified) {
    return sendTokenResponse(user, 200, res);
  }

  // Create verification token
  const verificationToken = user.getVerificationToken();
  console.log("verificationToken:",verificationToken);
  
  await user.save({ validateBeforeSave: false });

  // Create verification URL
  const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify/${verificationToken}`;

  const message = `You are receiving this email because you (or someone else) has registered an account with Rara.com. Please verify your account by clicking on the following link: \n\n ${verificationUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Raraiwacu.com - Account Verification',
      message
    });

    res.status(200).json({
      success: true,
      data: 'Verification email sent'
    });
  } catch (err) {
    console.error(err);
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Verify user
// @route   GET /api/v1/auth/verify/:verificationToken
// @access  Public
export const verifyUser = asyncHandler(async (req, res, next) => {
  const verificationToken = crypto
    .createHash('sha256')
    .update(req.params.verificationToken)
    .digest('hex');

  const user = await User.findOne({
    verificationToken,
    isVerified: false
  });

  if (!user) {
    return next(new ErrorResponse('Invalid verification token', 400));
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
console.log("pass&Ema:",email,password);

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');
 console.log("user:",user);
 
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if user is verified
  if (!user.isVerified) {
    return next(new ErrorResponse('Please verify your email first', 401));
  }

  sendTokenResponse(user, 200, res);
});





// Google Login controller
export const googleLogin = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) return next(new ErrorResponse("Google token is required", 400));

  let payload;
  try {
    // Verify token using Google's JWKS
    const { payload: verifiedPayload } = await jose.jwtVerify(
      token,
      async (header) => {
        // Fetch Google's public keys
        const res = await fetch('https://www.googleapis.com/oauth2/v3/certs');
        const jwks = await res.json();
        const keyData = jwks.keys.find(k => k.kid === header.kid);
        if (!keyData) throw new Error('Key not found');

        return jose.importJWK(keyData);
      },
      {
        audience: process.env.GOOGLE_CLIENT_ID,
        issuer: 'https://accounts.google.com',
      }
    );

    payload = verifiedPayload;
  } catch (err) {
    console.error("Google token verification error:", err);
    return next(new ErrorResponse("Invalid Google token", 401));
  }

  const { email, name, picture } = payload;

  if (!email) return next(new ErrorResponse("Google account has no email", 400));

  // Check if user exists
  let user = await User.findOne({ email });

  if (!user) {
    // Create a new user
    user = await User.create({
      name,
      email,
      password: "google-oauth", // placeholder password
      photo: picture,
      isVerified: true,
      role: "user", // default role
      isGoogleUser: true 
    });
  }

  // Ensure existing user is marked verified if they login via Google
  if (!user.isVerified) {
    user.isVerified = true;
    await user.save({ validateBeforeSave: false });
  }

  // Generate JWT token for your app
  const authToken = generateToken(user._id);

  res.status(200).json({
    success: true,
    token: authToken,
    role: user.role,
    user,
  });
});





// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
export const updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
export const updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Rara.com - Password Reset Token',
      message
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Logout user / clear cookie
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Refresh token
// @route   POST /api/v1/auth/refresh
// @access  Public
export const refresh = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new ErrorResponse('Refresh token is required', 400));
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    return next(new ErrorResponse('Invalid refresh token', 401));
  }
});

// @desc    Verify email
// @route   POST /api/v1/auth/verify-email
// @access  Public
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Email is required', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.isVerified) {
    return next(new ErrorResponse('Email is already verified', 400));
  }

  // Create verification token
  const verificationToken = user.getVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Create verification URL
  const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify/${verificationToken}`;

  const message = `You are receiving this email because you requested to verify your account. Please verify your account by clicking on the following link: \n\n ${verificationUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Rara.com - Account Verification',
      message
    });

    res.status(200).json({
      success: true,
      data: 'Verification email sent'
    });
  } catch (err) {
    console.error(err);
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      role: user.role
    });
};
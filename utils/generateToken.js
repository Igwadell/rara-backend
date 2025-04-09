import jwt from 'jsonwebtoken';
import ErrorResponse from './errorResponse.js';

/**
 * @desc    Generate JWT token
 * @param   {string} userId - User ID
 * @returns {string} - JWT token
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

/**
 * @desc    Verify JWT token
 * @param   {string} token - JWT token
 * @returns {Object} - Decoded token payload
 * @throws  {ErrorResponse} - If token is invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ErrorResponse('Invalid token', 401);
  }
};

/**
 * @desc    Generate random token for email verification/password reset
 * @returns {string} - Random token
 */
export const generateRandomToken = () => {
  return crypto.randomBytes(20).toString('hex');
};
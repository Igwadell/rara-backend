import ErrorResponse from '../utils/errorResponse.js';

 const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  // Log to console for dev
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    errors: err.errors
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    let message = 'Validation error';
    if (err.errors && Object.keys(err.errors).length > 0) {
      message = Object.values(err.errors).map(val => val.message).join(', ');
    }
    error = new ErrorResponse(message, 400);
  }

  // Handle cases where error.message might be undefined
  const errorMessage = error.message || err.message || 'Server Error';
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: errorMessage
  });
};

export default errorHandler;
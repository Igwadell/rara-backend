/**
 * @desc    Custom error class for API errors
 * @extends Error
 */
class ErrorResponse extends Error {
    /**
     * @param   {string} message - Error message
     * @param   {number} statusCode - HTTP status code
     */
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
  
      // Capture stack trace (excluding constructor call)
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export default ErrorResponse;
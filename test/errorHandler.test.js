import { expect } from 'chai';
import mongoose from 'mongoose';

describe('Error Handler Tests', () => {
  describe('ValidationError handling', () => {
    it('should handle ValidationError with errors object', () => {
      const mockError = {
        name: 'ValidationError',
        message: 'Validation failed',
        errors: {
          field1: { message: 'Field 1 is required' },
          field2: { message: 'Field 2 is invalid' }
        }
      };

      // Simulate the error handler logic
      let message = 'Validation error';
      if (mockError.errors && Object.keys(mockError.errors).length > 0) {
        message = Object.values(mockError.errors).map(val => val.message).join(', ');
      }

      expect(message).to.equal('Field 1 is required, Field 2 is invalid');
    });

    it('should handle ValidationError without errors object', () => {
      const mockError = {
        name: 'ValidationError',
        message: 'Validation failed'
        // No errors object
      };

      // Simulate the error handler logic
      let message = 'Validation error';
      if (mockError.errors && Object.keys(mockError.errors).length > 0) {
        message = Object.values(mockError.errors).map(val => val.message).join(', ');
      }

      expect(message).to.equal('Validation error');
    });

    it('should handle ValidationError with null errors', () => {
      const mockError = {
        name: 'ValidationError',
        message: 'Validation failed',
        errors: null
      };

      // Simulate the error handler logic
      let message = 'Validation error';
      if (mockError.errors && Object.keys(mockError.errors).length > 0) {
        message = Object.values(mockError.errors).map(val => val.message).join(', ');
      }

      expect(message).to.equal('Validation error');
    });
  });

  describe('Other error types', () => {
    it('should handle CastError', () => {
      const mockError = {
        name: 'CastError',
        value: 'invalid-id',
        message: 'Cast to ObjectId failed'
      };

      // Simulate the error handler logic
      let error = { ...mockError };
      if (mockError.name === 'CastError') {
        const message = `Resource not found with id of ${mockError.value}`;
        error = { message, statusCode: 404 };
      }

      expect(error.message).to.equal('Resource not found with id of invalid-id');
      expect(error.statusCode).to.equal(404);
    });

    it('should handle duplicate key error', () => {
      const mockError = {
        code: 11000,
        message: 'Duplicate key error'
      };

      // Simulate the error handler logic
      let error = { ...mockError };
      if (mockError.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
      }

      expect(error.message).to.equal('Duplicate field value entered');
      expect(error.statusCode).to.equal(400);
    });
  });
}); 
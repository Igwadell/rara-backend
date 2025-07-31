import mongoose from 'mongoose';
import { expect } from 'chai';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import User from '../models/User.js';

describe('Past Date Validation', () => {
  let testProperty;
  let testUser;

  before(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    });

    // Create test property
    testProperty = await Property.create({
      title: 'Test Property',
      description: 'Test property for past date validation',
      price: 100,
      landlord: testUser._id,
      isAvailable: true,
      isVerified: true
    });
  });

  after(async () => {
    // Clean up test data
    await Booking.deleteMany({});
    await Property.deleteMany({});
    await User.deleteMany({});
  });

  describe('Booking Model Validation', () => {
    it('should prevent booking with past check-in date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const bookingData = {
        property: testProperty._id,
        user: testUser._id,
        checkInDate: yesterday,
        checkOutDate: tomorrow,
        amount: 100
      };

      try {
        await Booking.create(bookingData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).to.include('Check-in date cannot be in the past');
      }
    });

    it('should allow booking with future check-in date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const bookingData = {
        property: testProperty._id,
        user: testUser._id,
        checkInDate: tomorrow,
        checkOutDate: dayAfterTomorrow,
        amount: 100
      };

      const booking = await Booking.create(bookingData);
      expect(booking).to.exist;
      expect(booking.checkInDate.getTime()).to.equal(tomorrow.getTime());
    });

    it('should allow booking with today as check-in date', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const bookingData = {
        property: testProperty._id,
        user: testUser._id,
        checkInDate: today,
        checkOutDate: tomorrow,
        amount: 100
      };

      const booking = await Booking.create(bookingData);
      expect(booking).to.exist;
      expect(booking.checkInDate.getTime()).to.equal(today.getTime());
    });
  });
}); 
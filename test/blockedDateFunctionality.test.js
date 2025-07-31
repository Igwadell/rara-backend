import mongoose from 'mongoose';
import { expect } from 'chai';
import BlockedDate from '../models/BlockedDate.js';
import Property from '../models/Property.js';
import User from '../models/User.js';

describe('Blocked Date Functionality', () => {
  let testProperty;
  let testUser;

  before(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'landlord'
    });

    // Create test property
    testProperty = await Property.create({
      title: 'Test Property',
      description: 'Test property for blocked date functionality',
      price: 100,
      landlord: testUser._id,
      isAvailable: true,
      isVerified: true
    });
  });

  after(async () => {
    // Clean up test data
    await BlockedDate.deleteMany({});
    await Property.deleteMany({});
    await User.deleteMany({});
  });

  describe('Past Date Blocking', () => {
    it('should block past dates for a property', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const pastDate = new Date('2020-01-01');
      pastDate.setHours(0, 0, 0, 0);

      const blockedDate = await BlockedDate.create({
        property: testProperty._id,
        startDate: pastDate,
        endDate: today,
        reason: 'Past dates blocked - cannot book in the past',
        blockedBy: testUser._id
      });

      expect(blockedDate).to.exist;
      expect(blockedDate.property.toString()).to.equal(testProperty._id.toString());
      expect(blockedDate.startDate.getTime()).to.equal(pastDate.getTime());
      expect(blockedDate.endDate.getTime()).to.equal(today.getTime());
    });

    it('should prevent duplicate past date blocking', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const pastDate = new Date('2020-01-01');
      pastDate.setHours(0, 0, 0, 0);

      // Try to create another past date block
      try {
        await BlockedDate.create({
          property: testProperty._id,
          startDate: pastDate,
          endDate: today,
          reason: 'Another past date block',
          blockedBy: testUser._id
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).to.include('overlaps with an existing blocked date');
      }
    });

    it('should allow unblocking past dates', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Delete past date blocks
      const result = await BlockedDate.deleteMany({
        property: testProperty._id,
        startDate: { $lte: today },
        endDate: { $gte: today }
      });

      expect(result.deletedCount).to.be.greaterThan(0);
    });

    it('should check if past dates are blocked', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if past dates are blocked
      const pastDateBlock = await BlockedDate.findOne({
        property: testProperty._id,
        startDate: { $lte: today },
        endDate: { $gte: today }
      });

      // After unblocking, should not find any blocks
      expect(pastDateBlock).to.be.null;
    });
  });

  describe('General Blocked Date Functionality', () => {
    it('should create a blocked date for specific dates', async () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-05');

      const blockedDate = await BlockedDate.create({
        property: testProperty._id,
        startDate,
        endDate,
        reason: 'Maintenance',
        blockedBy: testUser._id
      });

      expect(blockedDate).to.exist;
      expect(blockedDate.reason).to.equal('Maintenance');
    });

    it('should prevent overlapping blocked dates', async () => {
      const startDate = new Date('2024-02-03');
      const endDate = new Date('2024-02-07');

      try {
        await BlockedDate.create({
          property: testProperty._id,
          startDate,
          endDate,
          reason: 'Overlapping dates',
          blockedBy: testUser._id
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).to.include('overlaps with an existing blocked date');
      }
    });
  });
}); 
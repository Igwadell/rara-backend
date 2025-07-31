import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BlockedDate from '../models/BlockedDate.js';
import Property from '../models/Property.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Block past dates for all properties
const blockPastDatesForAllProperties = async () => {
  try {
    console.log('Starting to block past dates for all properties...');
    
    // Get all properties
    const properties = await Property.find({});
    console.log(`Found ${properties.length} properties`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let blockedCount = 0;
    let skippedCount = 0;
    
    for (const property of properties) {
      // Check if past dates are already blocked for this property
      const existingPastBlock = await BlockedDate.findOne({
        property: property._id,
        startDate: { $lte: today },
        endDate: { $gte: today }
      });
      
      if (existingPastBlock) {
        console.log(`Past dates already blocked for property: ${property.title}`);
        skippedCount++;
        continue;
      }
      
      // Create a blocked date from a far past date to today
      const pastDate = new Date('2020-01-01');
      pastDate.setHours(0, 0, 0, 0);
      
      await BlockedDate.create({
        property: property._id,
        startDate: pastDate,
        endDate: today,
        reason: 'Past dates blocked - cannot book in the past',
        blockedBy: property.landlord // Use property landlord as the blocker
      });
      
      console.log(`Blocked past dates for property: ${property.title}`);
      blockedCount++;
    }
    
    console.log(`\nScript completed successfully!`);
    console.log(`Properties with past dates blocked: ${blockedCount}`);
    console.log(`Properties skipped (already blocked): ${skippedCount}`);
    console.log(`Total properties processed: ${properties.length}`);
    
  } catch (error) {
    console.error('Error blocking past dates:', error);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await blockPastDatesForAllProperties();
  process.exit(0);
};

runScript(); 
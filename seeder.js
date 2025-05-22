import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Property from './models/Property.js';
import Booking from './models/Booking.js';
import Payment from './models/Payment.js';
import BlogPost from './models/BlogPost.js';
import Page from './models/Page.js';
import EmailTemplate from './models/EmailTemplate.js';
import Review from './models/Review.js';
import Notification from './models/Notification.js';
import Message from './models/Message.js';
import Media from './models/Media.js';

// Connect to DB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Admin User ID (Mucyo's account)
const ADMIN_USER_ID = new mongoose.Types.ObjectId('682ee46f86e11c808cf5f232');

// Sample Users
const users = [
  {
    _id: ADMIN_USER_ID,
    name: 'Mucyo Fred',
    email: 'mucyofred6@gmail.com',
    role: 'admin',
    password: await bcrypt.hash('password123', 10),
    phone: '+250780000000',
    isVerified: true
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'John Landlord',
    email: 'john@example.com',
    role: 'landlord',
    password: await bcrypt.hash('password123', 10),
    phone: '+250781111111',
    isVerified: true
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Jane User',
    email: 'jane@example.com',
    role: 'user',
    password: await bcrypt.hash('password123', 10),
    phone: '+250782222222',
    isVerified: true
  }
];

// Sample Properties
const properties = [
  {
    title: 'Luxury Beach Villa',
    description: 'Beautiful beachfront villa with amazing views',
    address: '123 Beach Road, Miami, FL 33139',
    price: 500000,
    bedrooms: 4,
    bathrooms: 3,
    area: 2500,
    propertyType: 'villa',
    amenities: ['wifi', 'parking', 'pool', 'air-conditioning', 'security'],
    photos: [{
      url: '/uploads/placeholder-villa1.jpg',
      public_id: 'placeholder-villa1',
      width: 1200,
      height: 800
    }],
    location: {
      type: 'Point',
      coordinates: [-80.1300, 25.7867]
    },
    isAvailable: true,
    isVerified: true,
    landlord: ADMIN_USER_ID
  },
  {
    title: 'Modern Downtown Apartment',
    description: 'Sleek apartment in the heart of the city',
    address: '456 Downtown Ave, New York, NY 10001',
    price: 300000,
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    propertyType: 'apartment',
    amenities: ['wifi', 'parking', 'gym', 'security', 'elevator'],
    photos: [{
      url: '/uploads/placeholder-apartment1.jpg',
      public_id: 'placeholder-apartment1',
      width: 1200,
      height: 800
    }],
    location: {
      type: 'Point',
      coordinates: [-74.0060, 40.7128]
    },
    isAvailable: true,
    isVerified: true,
    landlord: ADMIN_USER_ID
  },
  {
    title: 'Cozy Studio in San Francisco',
    description: 'Perfect starter home in vibrant neighborhood',
    address: '789 Market St, San Francisco, CA 94103',
    price: 250000,
    bedrooms: 1,
    bathrooms: 1,
    area: 500,
    propertyType: 'studio',
    amenities: ['wifi', 'laundry', 'kitchen', 'furnished'],
    photos: [{
      url: '/uploads/placeholder-studio1.jpg',
      public_id: 'placeholder-studio1',
      width: 1200,
      height: 800
    }],
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749]
    },
    isAvailable: true,
    isVerified: true,
    landlord: ADMIN_USER_ID
  },
  {
    title: 'Suburban Family Home',
    description: 'Spacious house perfect for families',
    address: '321 Oak St, Austin, TX 78701',
    price: 450000,
    bedrooms: 4,
    bathrooms: 3,
    area: 2200,
    propertyType: 'house',
    amenities: ['parking', 'garden', 'air-conditioning', 'kitchen', 'pet-friendly'],
    photos: [{
      url: '/uploads/placeholder-house1.jpg',
      public_id: 'placeholder-house1',
      width: 1200,
      height: 800
    }],
    location: {
      type: 'Point',
      coordinates: [-97.7431, 30.2672]
    },
    isAvailable: true,
    isVerified: true,
    landlord: ADMIN_USER_ID
  },
  {
    title: 'Luxury Condo with City Views',
    description: 'High-rise living with amazing amenities',
    address: '555 Downtown Blvd, Chicago, IL 60601',
    price: 600000,
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    propertyType: 'condo',
    amenities: ['wifi', 'parking', 'gym', 'pool', 'security', 'elevator'],
    photos: [{
      url: '/uploads/placeholder-condo1.jpg',
      public_id: 'placeholder-condo1',
      width: 1200,
      height: 800
    }],
    location: {
      type: 'Point',
      coordinates: [-87.6298, 41.8781]
    },
    isAvailable: true,
    isVerified: true,
    landlord: ADMIN_USER_ID
  },
  {
    title: 'Mountain View Townhouse',
    description: 'Beautiful townhouse with mountain views',
    address: '777 Pine St, Denver, CO 80202',
    price: 400000,
    bedrooms: 3,
    bathrooms: 2.5,
    area: 1600,
    propertyType: 'townhouse',
    amenities: ['parking', 'heating', 'furnished', 'balcony'],
    photos: [{
      url: '/uploads/placeholder-townhouse1.jpg',
      public_id: 'placeholder-townhouse1',
      width: 1200,
      height: 800
    }],
    location: {
      type: 'Point',
      coordinates: [-104.9903, 39.7392]
    },
    isAvailable: true,
    isVerified: true,
    landlord: ADMIN_USER_ID
  },
  {
    title: 'Commercial Space Downtown',
    description: 'Prime location for business',
    address: '999 Business Ave, Seattle, WA 98101',
    price: 800000,
    bedrooms: 0,
    bathrooms: 2,
    area: 3000,
    propertyType: 'commercial',
    amenities: ['parking', 'security', 'elevator', 'wheelchair-accessible'],
    photos: [{
      url: '/uploads/placeholder-commercial1.jpg',
      public_id: 'placeholder-commercial1',
      width: 1200,
      height: 800
    }],
    location: {
      type: 'Point',
      coordinates: [-122.3321, 47.6062]
    },
    isAvailable: true,
    isVerified: true,
    landlord: ADMIN_USER_ID
  },
  {
    title: 'Beachfront Land',
    description: 'Build your dream home by the beach',
    address: '111 Coastal Hwy, San Diego, CA 92101',
    price: 1000000,
    bedrooms: 0,
    bathrooms: 0,
    area: 5000,
    propertyType: 'land',
    amenities: [],
    photos: [{
      url: '/uploads/placeholder-land1.jpg',
      public_id: 'placeholder-land1',
      width: 1200,
      height: 800
    }],
    location: {
      type: 'Point',
      coordinates: [-117.1611, 32.7157]
    },
    isAvailable: true,
    isVerified: true,
    landlord: ADMIN_USER_ID
  },
  {
    title: 'Historic Brownstone',
    description: 'Beautifully restored historic property',
    address: '222 Heritage St, Boston, MA 02108',
    price: 750000,
    bedrooms: 3,
    bathrooms: 2.5,
    area: 2000,
    propertyType: 'house',
    amenities: ['parking', 'furnished', 'garden', 'heating'],
    photos: [{
      url: '/uploads/placeholder-historic1.jpg',
      public_id: 'placeholder-historic1',
      width: 1200,
      height: 800
    }],
    location: {
      type: 'Point',
      coordinates: [-71.0589, 42.3601]
    },
    isAvailable: true,
    isVerified: true,
    landlord: ADMIN_USER_ID
  },
  {
    title: 'Modern Eco-House',
    description: 'Sustainable living with solar power',
    address: '333 Green St, Portland, OR 97201',
    price: 550000,
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    propertyType: 'house',
    amenities: ['parking', 'garden', 'air-conditioning', 'wheelchair-accessible'],
    photos: [{
      url: '/uploads/placeholder-eco1.jpg',
      public_id: 'placeholder-eco1',
      width: 1200,
      height: 800
    }],
    location: {
      type: 'Point',
      coordinates: [-122.6784, 45.5155]
    },
    isAvailable: true,
    isVerified: true,
    landlord: ADMIN_USER_ID
  }
];

// Sample Blog Posts
const blogPosts = [
  {
    title: 'Top 10 Property Investment Tips',
    content: 'Detailed content about property investment tips...',
    category: 'Investment',
    tags: ['investment', 'tips', 'property'],
    status: 'published',
    metaDescription: 'Learn the top 10 property investment tips from experts',
    author: ADMIN_USER_ID
  },
  {
    title: 'Guide to Real Estate Market 2024',
    content: 'Comprehensive guide about the real estate market...',
    category: 'Market Analysis',
    tags: ['market', 'analysis', 'trends'],
    status: 'published',
    metaDescription: 'Understand the real estate market trends for 2024',
    author: ADMIN_USER_ID
  },
  {
    title: 'How to Stage Your Home for Sale',
    content: 'Expert tips on home staging...',
    category: 'Property Tips',
    tags: ['staging', 'selling', 'home improvement'],
    status: 'published',
    metaDescription: 'Learn how to stage your home for a quick sale',
    author: ADMIN_USER_ID
  },
  {
    title: 'Understanding Mortgage Rates',
    content: 'Everything you need to know about mortgage rates...',
    category: 'Market Analysis',
    tags: ['mortgage', 'finance', 'loans'],
    status: 'published',
    metaDescription: 'Guide to understanding mortgage rates and terms',
    author: ADMIN_USER_ID
  },
  {
    title: 'First-Time Homebuyer Guide',
    content: 'Complete guide for first-time homebuyers...',
    category: 'Property Tips',
    tags: ['first-time buyer', 'guide', 'tips'],
    status: 'published',
    metaDescription: 'Essential guide for first-time homebuyers',
    author: ADMIN_USER_ID
  },
  {
    title: 'Rental Property Management Tips',
    content: 'Best practices for managing rental properties...',
    category: 'Property Tips',
    tags: ['rental', 'management', 'landlord'],
    status: 'published',
    metaDescription: 'Learn how to effectively manage rental properties',
    author: ADMIN_USER_ID
  },
  {
    title: 'Smart Home Technology Trends',
    content: 'Latest trends in smart home technology...',
    category: 'Lifestyle',
    tags: ['smart home', 'technology', 'trends'],
    status: 'published',
    metaDescription: 'Discover the latest smart home technology trends',
    author: ADMIN_USER_ID
  },
  {
    title: 'Real Estate Tax Benefits',
    content: 'Understanding tax benefits in real estate...',
    category: 'Investment',
    tags: ['tax', 'finance', 'benefits'],
    status: 'published',
    metaDescription: 'Learn about tax benefits for property owners',
    author: ADMIN_USER_ID
  },
  {
    title: 'Sustainable Housing Solutions',
    content: 'Guide to eco-friendly housing options...',
    category: 'Lifestyle',
    tags: ['eco-friendly', 'sustainable', 'green'],
    status: 'published',
    metaDescription: 'Explore sustainable housing solutions',
    author: ADMIN_USER_ID
  },
  {
    title: 'Latest Real Estate Market News',
    content: 'Breaking news and updates from the real estate market...',
    category: 'News',
    tags: ['news', 'market', 'updates'],
    status: 'published',
    metaDescription: 'Stay updated with the latest real estate news',
    author: ADMIN_USER_ID
  }
];

// Sample Pages
const pages = [
  {
    title: 'About Us',
    slug: 'about-us',
    content: 'Welcome to our real estate platform...',
    metaTitle: 'About Our Real Estate Platform',
    metaDescription: 'Learn about our mission and values',
    status: 'published',
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    title: 'Terms and Conditions',
    slug: 'terms',
    content: 'Terms and conditions of using our platform...',
    metaTitle: 'Terms of Service',
    metaDescription: 'Read our terms and conditions',
    status: 'published',
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    content: 'Our privacy policy and data handling practices...',
    metaTitle: 'Privacy Policy',
    metaDescription: 'Learn how we protect your privacy',
    status: 'published',
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    title: 'Contact Us',
    slug: 'contact',
    content: 'Get in touch with our team...',
    metaTitle: 'Contact Our Team',
    metaDescription: 'Contact information and form',
    status: 'published',
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    title: 'FAQ',
    slug: 'faq',
    content: 'Frequently asked questions about our services...',
    metaTitle: 'Frequently Asked Questions',
    metaDescription: 'Find answers to common questions',
    status: 'published',
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    title: 'Services',
    slug: 'services',
    content: 'Our real estate services...',
    metaTitle: 'Our Services',
    metaDescription: 'Explore our real estate services',
    status: 'published',
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    title: 'Careers',
    slug: 'careers',
    content: 'Join our team...',
    metaTitle: 'Career Opportunities',
    metaDescription: 'Find job opportunities with us',
    status: 'published',
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    title: 'Press Room',
    slug: 'press',
    content: 'Latest news and press releases...',
    metaTitle: 'Press and Media',
    metaDescription: 'Latest company news and updates',
    status: 'published',
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    title: 'Testimonials',
    slug: 'testimonials',
    content: 'What our clients say about us...',
    metaTitle: 'Client Testimonials',
    metaDescription: 'Read what our clients say',
    status: 'published',
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    title: 'Partner With Us',
    slug: 'partnership',
    content: 'Information about partnership opportunities...',
    metaTitle: 'Partnership Opportunities',
    metaDescription: 'Learn about partnership programs',
    status: 'published',
    lastModifiedBy: ADMIN_USER_ID
  }
];

// Sample Email Templates
const emailTemplates = [
  {
    name: 'welcome_email',
    subject: 'Welcome to Our Platform',
    content: 'Hello {{name}},\n\nWelcome to our platform...',
    description: 'Welcome email for new users',
    variables: [
      {
        name: 'name',
        description: 'User\'s full name',
        required: true
      }
    ],
    category: 'user',
    active: true,
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    name: 'booking_confirmation',
    subject: 'Booking Confirmation',
    content: 'Dear {{name}},\n\nYour booking for {{property}} has been confirmed...',
    description: 'Booking confirmation email',
    variables: [
      {
        name: 'name',
        description: 'User\'s full name',
        required: true
      },
      {
        name: 'property',
        description: 'Property name',
        required: true
      }
    ],
    category: 'booking',
    active: true,
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    name: 'password_reset',
    subject: 'Password Reset Request',
    content: 'Hello {{name}},\n\nClick the link below to reset your password: {{resetLink}}',
    description: 'Password reset email',
    variables: [
      {
        name: 'name',
        description: 'User\'s full name',
        required: true
      },
      {
        name: 'resetLink',
        description: 'Password reset link',
        required: true
      }
    ],
    category: 'user',
    active: true,
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    name: 'property_inquiry',
    subject: 'New Property Inquiry',
    content: 'Dear {{landlordName}},\n\nYou have received an inquiry about {{propertyTitle}}...',
    description: 'Property inquiry notification',
    variables: [
      {
        name: 'landlordName',
        description: 'Landlord\'s name',
        required: true
      },
      {
        name: 'propertyTitle',
        description: 'Property title',
        required: true
      }
    ],
    category: 'property',
    active: true,
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    name: 'payment_receipt',
    subject: 'Payment Receipt',
    content: 'Dear {{name}},\n\nThank you for your payment of {{amount}} for {{property}}...',
    description: 'Payment confirmation receipt',
    variables: [
      {
        name: 'name',
        description: 'User\'s full name',
        required: true
      },
      {
        name: 'amount',
        description: 'Payment amount',
        required: true
      },
      {
        name: 'property',
        description: 'Property name',
        required: true
      }
    ],
    category: 'payment',
    active: true,
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    name: 'booking_reminder',
    subject: 'Upcoming Booking Reminder',
    content: 'Dear {{name}},\n\nThis is a reminder about your upcoming booking at {{property}}...',
    description: 'Booking reminder notification',
    variables: [
      {
        name: 'name',
        description: 'User\'s full name',
        required: true
      },
      {
        name: 'property',
        description: 'Property name',
        required: true
      }
    ],
    category: 'booking',
    active: true,
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    name: 'property_approved',
    subject: 'Property Listing Approved',
    content: 'Dear {{name}},\n\nYour property listing {{propertyTitle}} has been approved...',
    description: 'Property approval notification',
    variables: [
      {
        name: 'name',
        description: 'User\'s full name',
        required: true
      },
      {
        name: 'propertyTitle',
        description: 'Property title',
        required: true
      }
    ],
    category: 'property',
    active: true,
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    name: 'system_maintenance',
    subject: 'Scheduled System Maintenance',
    content: 'Dear {{name}},\n\nOur system will be undergoing maintenance on {{date}}...',
    description: 'System maintenance notification',
    variables: [
      {
        name: 'name',
        description: 'User\'s full name',
        required: true
      },
      {
        name: 'date',
        description: 'Maintenance date',
        required: true
      }
    ],
    category: 'system',
    active: true,
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    name: 'payment_reminder',
    subject: 'Payment Due Reminder',
    content: 'Dear {{name}},\n\nThis is a reminder that your payment of {{amount}} for {{property}} is due on {{dueDate}}...',
    description: 'Payment due reminder',
    variables: [
      {
        name: 'name',
        description: 'User\'s full name',
        required: true
      },
      {
        name: 'amount',
        description: 'Payment amount',
        required: true
      },
      {
        name: 'property',
        description: 'Property name',
        required: true
      },
      {
        name: 'dueDate',
        description: 'Payment due date',
        required: true
      }
    ],
    category: 'payment',
    active: true,
    lastModifiedBy: ADMIN_USER_ID
  },
  {
    name: 'account_verification',
    subject: 'Verify Your Account',
    content: 'Hello {{name}},\n\nPlease verify your account by clicking this link: {{verificationLink}}',
    description: 'Account verification email',
    variables: [
      {
        name: 'name',
        description: 'User\'s full name',
        required: true
      },
      {
        name: 'verificationLink',
        description: 'Verification link',
        required: true
      }
    ],
    category: 'user',
    active: true,
    lastModifiedBy: ADMIN_USER_ID
  }
];

// Sample Media
const media = [
  {
    title: 'Property Image 1',
    type: 'image',
    url: 'https://example.com/image1.jpg',
    publicId: 'properties/image1',
    user: ADMIN_USER_ID,
    size: 1024 * 1024, // 1MB
    format: 'jpg',
    metadata: {
      width: 1920,
      height: 1080
    },
    tags: ['property', 'featured'],
    altText: 'Beautiful property exterior view',
    caption: 'Front view of the luxury villa'
  },
  {
    title: 'Property Document',
    type: 'document',
    url: 'https://example.com/doc1.pdf',
    publicId: 'documents/doc1',
    user: ADMIN_USER_ID,
    size: 2048 * 1024, // 2MB
    format: 'pdf',
    tags: ['document', 'contract'],
    caption: 'Property ownership documents'
  }
];

// Import Data
const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Property.deleteMany();
    await Booking.deleteMany();
    await Payment.deleteMany();
    await BlogPost.deleteMany();
    await Page.deleteMany();
    await EmailTemplate.deleteMany();
    await Review.deleteMany();
    await Notification.deleteMany();
    await Message.deleteMany();
    await Media.deleteMany();

    // Insert users first
    console.log('Creating users...');
    const createdUsers = await User.create(users);

    // Update properties with correct landlord reference
    console.log('Creating properties...');
    const propertiesWithLandlord = properties.map(property => ({
      ...property,
      landlord: createdUsers[1]._id // Assign to John Landlord instead of admin
    }));
    const createdProperties = await Property.create(propertiesWithLandlord);

    // Create bookings with correct property and user references
    console.log('Creating bookings...');
    const bookingsWithRefs = createdProperties.slice(0, 5).map((property, index) => ({
      property: property._id,
      user: createdUsers[2]._id, // Jane books properties
      checkInDate: new Date(2024, 0, index + 1),
      checkOutDate: new Date(2024, 0, index + 8),
      amount: property.price * 7,
      guests: {
        adults: 2,
        children: 1,
        infants: 0
      },
      status: 'confirmed',
      paymentStatus: 'paid',
      specialRequests: 'Early check-in requested'
    }));
    const createdBookings = await Booking.create(bookingsWithRefs);

    // Create payments with correct booking references
    console.log('Creating payments...');
    const paymentsWithRefs = createdBookings.map(booking => ({
      booking: booking._id,
      user: booking.user,
      amount: booking.amount,
      currency: 'RWF',
      status: 'completed',
      paymentMethod: 'credit_card',
      transactionId: `tr_${Math.random().toString(36).substr(2, 9)}`,
      paymentDate: new Date()
    }));
    await Payment.create(paymentsWithRefs);

    // Create reviews with correct references
    console.log('Creating reviews...');
    const reviewsWithRefs = createdBookings.map(booking => ({
      title: `Great Stay at ${booking.property.title}`,
      text: 'Wonderful experience, highly recommended!',
      rating: Math.floor(Math.random() * 2) + 4,
      property: booking.property,
      user: booking.user,
      booking: booking._id
    }));
    await Review.create(reviewsWithRefs);

    // Create notifications with correct references
    console.log('Creating notifications...');
    const notificationsWithRefs = [
      {
        user: createdUsers[2]._id,
        title: 'Booking Confirmed',
        message: 'Your booking has been confirmed',
        type: 'success',
        relatedModel: 'Booking',
        relatedId: createdBookings[0]._id
      },
      {
        user: createdUsers[1]._id,
        title: 'New Booking',
        message: 'You have a new booking for your property',
        type: 'info',
        relatedModel: 'Booking',
        relatedId: createdBookings[0]._id
      }
    ];
    await Notification.create(notificationsWithRefs);

    // Create messages with correct references
    console.log('Creating messages...');
    const messagesWithRefs = [
      {
        from: createdUsers[2]._id,
        to: createdUsers[1]._id,
        content: 'I am interested in your property',
        property: createdProperties[0]._id,
        read: true
      },
      {
        from: createdUsers[1]._id,
        to: createdUsers[2]._id,
        content: 'Thank you for your interest',
        property: createdProperties[0]._id,
        read: false
      }
    ];
    await Message.create(messagesWithRefs);

    // Create media with correct user reference
    console.log('Creating media...');
    const mediaWithRefs = media.map(item => ({
      ...item,
      user: createdUsers[0]._id // Admin uploads media
    }));
    await Media.create(mediaWithRefs);

    // Create blog posts with correct author
    console.log('Creating blog posts...');
    const blogPostsWithAuthor = blogPosts.map(post => ({
      ...post,
      author: createdUsers[0]._id // Admin creates blog posts
    }));
    await BlogPost.create(blogPostsWithAuthor);

    // Create pages with correct modifier
    console.log('Creating pages...');
    const pagesWithModifier = pages.map(page => ({
      ...page,
      lastModifiedBy: createdUsers[0]._id // Admin modifies pages
    }));
    await Page.create(pagesWithModifier);

    // Create email templates with correct modifier
    console.log('Creating email templates...');
    const templatesWithModifier = emailTemplates.map(template => ({
      ...template,
      lastModifiedBy: createdUsers[0]._id // Admin creates templates
    }));
    await EmailTemplate.create(templatesWithModifier);

    console.log('Data Imported Successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Delete Data
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Property.deleteMany();
    await Booking.deleteMany();
    await Payment.deleteMany();
    await BlogPost.deleteMany();
    await Page.deleteMany();
    await EmailTemplate.deleteMany();
    await Review.deleteMany();
    await Notification.deleteMany();
    await Message.deleteMany();
    await Media.deleteMany();

    console.log('Data Destroyed Successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Connect to database
await connectDB();

// Check command line argument
if (process.argv[2] === '-d') {
  deleteData();
} else {
  importData();
} 
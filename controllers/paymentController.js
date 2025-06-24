import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import sendEmail from '../utils/sendEmail.js';
import axios from 'axios';

/**
 * @desc    Get all payments
 * @route   GET /api/v1/payments
 * @route   GET /api/v1/bookings/:bookingId/payments
 * @access  Private (admin, landlord)
 */
export const getPayments = asyncHandler(async (req, res, next) => {
  if (req.params.bookingId) {
    // Get payments for a specific booking
    const payments = await Payment.find({ booking: req.params.bookingId })
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'booking',
        select: 'checkInDate checkOutDate amount'
      });

    // Verify authorization
    const booking = await Booking.findById(req.params.bookingId).populate({
      path: 'property',
      select: 'landlord'
    });

    if (!booking) {
      return next(
        new ErrorResponse(
          `Booking not found with id of ${req.params.bookingId}`,
          404
        )
      );
    }

    if (
      req.user.role !== 'admin' &&
      booking.user.toString() !== req.user.id &&
      booking.property.landlord.toString() !== req.user.id
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to access these payments`,
          401
        )
      );
    }

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } else if (req.user.role === 'admin') {
    // Admin can see all payments
    console.log('advancedResults:', res.advancedResults);
    res.status(200).json(res.advancedResults);
  } else if (req.user.role === 'landlord') {
    // Landlord can only see payments for their properties
    const properties = await Property.find({ landlord: req.user.id });
    const propertyIds = properties.map(property => property._id);

    const bookings = await Booking.find({ property: { $in: propertyIds } });
    const bookingIds = bookings.map(booking => booking._id);

    const payments = await Payment.find({ booking: { $in: bookingIds } })
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'booking',
        select: 'checkInDate checkOutDate amount',
        populate: {
          path: 'property',
          select: 'title'
        }
      });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } else {
    // Regular users can only see their own payments
    const payments = await Payment.find({ user: req.user.id })
      .populate({
        path: 'booking',
        select: 'checkInDate checkOutDate amount',
        populate: {
          path: 'property',
          select: 'title'
        }
      });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  }
});

/**
 * @desc    Get single payment
 * @route   GET /api/v1/payments/:id
 * @access  Private (user, landlord, admin)
 */
export const getPayment = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate({
      path: 'user',
      select: 'name email'
    })
    .populate({
      path: 'booking',
      select: 'checkInDate checkOutDate amount',
      populate: {
        path: 'property',
        select: 'title landlord'
      }
    });

  if (!payment) {
    return next(
      new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is payment owner, property owner or admin
  if (
    payment.user._id.toString() !== req.user.id &&
    payment.booking.property.landlord.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this payment`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

/**
 * @desc    Process payment for booking
 * @route   POST /api/v1/bookings/:bookingId/payments
 * @access  Private
 */
export const processPayment = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId).populate({
    path: 'property',
    select: 'title landlord'
  });

  if (!booking) {
    return next(
      new ErrorResponse(
        `Booking not found with id of ${req.params.bookingId}`,
        404
      )
    );
  }

  // Verify authorization
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to pay for this booking`,
        401
      )
    );
  }

  // Check if booking is already paid
  if (booking.paymentStatus === 'paid') {
    return next(new ErrorResponse(`Booking is already paid`, 400));
  }

  // Check if booking is cancelled
  if (booking.status === 'cancelled') {
    return next(new ErrorResponse(`Cancelled bookings cannot be paid`, 400));
  }

  // In a real implementation, you would integrate with a payment gateway here
  // This is a mock implementation for demonstration purposes

  const { paymentMethod, paymentDetails } = req.body;

  // Validate payment method
  const validPaymentMethods = ['mobile_money', 'credit_card', 'bank_transfer'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    return next(new ErrorResponse(`Invalid payment method`, 400));
  }

  // Mock payment processing
  let transactionId;
  let paymentStatus = 'pending';

  try {
    // In a real app, this would call your payment gateway API
    // For example, for mobile money:
    if (paymentMethod === 'mobile_money') {
      // Validate mobile money details
      if (!paymentDetails.phone || !paymentDetails.network) {
        return next(
          new ErrorResponse(`Phone number and network are required`, 400)
        );
      }

      // Mock API call to payment processor
      const mockResponse = await mockPaymentGatewayRequest({
        amount: booking.amount,
        currency: 'RWF',
        paymentMethod,
        paymentDetails
      });

      transactionId = mockResponse.transactionId;
      paymentStatus = mockResponse.status;
    } else if (paymentMethod === 'credit_card') {
      // Validate credit card details
      if (
        !paymentDetails.cardNumber ||
        !paymentDetails.expiry ||
        !paymentDetails.cvv
      ) {
        return next(
          new ErrorResponse(
            `Card number, expiry and CVV are required`,
            400
          )
        );
      }

      // Mock API call to payment processor
      const mockResponse = await mockPaymentGatewayRequest({
        amount: booking.amount,
        currency: 'RWF',
        paymentMethod,
        paymentDetails
      });

      transactionId = mockResponse.transactionId;
      paymentStatus = mockResponse.status;
    } else if (paymentMethod === 'bank_transfer') {
      // Validate bank transfer details
      if (!paymentDetails.accountNumber || !paymentDetails.bankName) {
        return next(
          new ErrorResponse(`Account number and bank name are required`, 400)
        );
      }

      // Mock API call to payment processor
      const mockResponse = await mockPaymentGatewayRequest({
        amount: booking.amount,
        currency: 'RWF',
        paymentMethod,
        paymentDetails
      });

      transactionId = mockResponse.transactionId;
      paymentStatus = mockResponse.status;
    }

    // Create payment record
    const payment = await Payment.create({
      booking: booking._id,
      user: req.user.id,
      amount: booking.amount,
      paymentMethod,
      transactionId,
      status: paymentStatus,
      paymentDetails
    });

    // Update booking payment status
    booking.paymentStatus = paymentStatus;
    await booking.save();

    // Get user details for email
    const user = await User.findById(req.user.id);

    // Send payment confirmation email
    const message = `Dear ${user.name},\n\nYour payment of ${booking.amount} RWF for booking ${booking.property.title} has been processed successfully.\n\nPayment Method: ${paymentMethod}\nTransaction ID: ${transactionId}\n\nThank you for using Rara.com!`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Rara.com - Payment Confirmation',
        message
      });
    } catch (err) {
      console.error('Failed to send payment confirmation email:', err);
    }

    // If landlord exists, send payment notification
    if (booking.property.landlord) {
      const landlord = await User.findById(booking.property.landlord);
      if (landlord && landlord.email) {
        const landlordMessage = `Dear ${landlord.name},\n\nA payment of ${booking.amount} RWF has been made for your property ${booking.property.title}.\n\nPayment Method: ${paymentMethod}\nTransaction ID: ${transactionId}\n\nPlease log in to your Rara.com account for more details.`;

        try {
          await sendEmail({
            email: landlord.email,
            subject: 'Rara.com - Payment Notification',
            message: landlordMessage
          });
        } catch (err) {
          console.error('Failed to send landlord notification email:', err);
        }
      }
    }

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (err) {
    console.error('Payment processing error:', err);

    // Create failed payment record
    const payment = await Payment.create({
      booking: booking._id,
      user: req.user.id,
      amount: booking.amount,
      paymentMethod,
      status: 'failed',
      paymentDetails,
      error: err.message
    });

    // Update booking payment status
    booking.paymentStatus = 'failed';
    await booking.save();

    return next(
      new ErrorResponse(`Payment processing failed: ${err.message}`, 500)
    );
  }
});

/**
 * @desc    Verify payment
 * @route   GET /api/v1/payments/verify/:transactionId
 * @access  Private (user, landlord, admin)
 */
export const verifyPayment = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findOne({
    transactionId: req.params.transactionId
  }).populate({
    path: 'booking',
    select: 'property',
    populate: {
      path: 'property',
      select: 'landlord'
    }
  });

  if (!payment) {
    return next(
      new ErrorResponse(
        `Payment not found with transaction ID ${req.params.transactionId}`,
        404
      )
    );
  }

  // Make sure user is payment owner, property owner or admin
  if (
    payment.user.toString() !== req.user.id &&
    payment.booking.property.landlord.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to verify this payment`,
        401
      )
    );
  }

  // In a real implementation, you would verify with the payment gateway
  // This is a mock implementation
  const verificationStatus = await mockPaymentVerification(
    req.params.transactionId
  );

  // Update payment status if it changed
  if (verificationStatus.status !== payment.status) {
    payment.status = verificationStatus.status;
    await payment.save();

    // Update booking payment status if needed
    if (payment.booking) {
      const booking = await Booking.findById(payment.booking);
      if (booking && booking.paymentStatus !== verificationStatus.status) {
        booking.paymentStatus = verificationStatus.status;
        await booking.save();
      }
    }
  }

  res.status(200).json({
    success: true,
    data: {
      payment,
      verification: verificationStatus
    }
  });
});

/**
 * @desc    Refund payment
 * @route   POST /api/v1/payments/:id/refund
 * @access  Private (admin, landlord)
 */
export const processRefund = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id).populate({
    path: 'booking',
    populate: {
      path: 'property',
      select: 'landlord'
    }
  });

  if (!payment) {
    return next(new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404));
  }

  // Check authorization
  if (
    payment.booking.property.landlord.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to process this refund`, 401));
  }

  // Check if payment can be refunded
  if (payment.status !== 'completed') {
    return next(new ErrorResponse(`Payment cannot be refunded`, 400));
  }

  // In a real implementation, you would integrate with a payment gateway here
  // This is a mock implementation
  payment.status = 'refunded';
  payment.refundedAt = Date.now();
  payment.refundAmount = req.body.amount || payment.amount;
  await payment.save();

  // Update booking payment status
  await Booking.findByIdAndUpdate(payment.booking._id, {
    paymentStatus: 'refunded'
  });

  res.status(200).json({
    success: true,
    data: payment
  });
});

/**
 * @desc    Get payment history
 * @route   GET /api/v1/payments/history
 * @access  Private
 */
export const getPaymentHistory = asyncHandler(async (req, res, next) => {
  const payments = await Payment.find({ user: req.user.id })
    .populate({
      path: 'booking',
      select: 'checkInDate checkOutDate amount',
      populate: {
        path: 'property',
        select: 'title'
      }
    })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments
  });
});

/**
 * @desc    Get payment methods
 * @route   GET /api/v1/payments/methods
 * @access  Private
 */
export const getPaymentMethods = asyncHandler(async (req, res, next) => {
  // In a real implementation, you would fetch from PaymentMethod model
  // For now, return mock data
  const paymentMethods = [
    {
      id: '1',
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      isDefault: true
    }
  ];

  res.status(200).json({
    success: true,
    data: paymentMethods
  });
});

/**
 * @desc    Add payment method
 * @route   POST /api/v1/payments/methods
 * @access  Private
 */
export const addPaymentMethod = asyncHandler(async (req, res, next) => {
  // In a real implementation, you would integrate with a payment gateway
  // and save to PaymentMethod model
  const paymentMethod = {
    id: Date.now().toString(),
    type: req.body.type,
    brand: req.body.brand,
    last4: req.body.last4,
    isDefault: req.body.isDefault || false
  };

  res.status(201).json({
    success: true,
    data: paymentMethod
  });
});

/**
 * @desc    Remove payment method
 * @route   DELETE /api/v1/payments/methods/:id
 * @access  Private
 */
export const removePaymentMethod = asyncHandler(async (req, res, next) => {
  // In a real implementation, you would delete from PaymentMethod model
  // and remove from payment gateway

  res.status(200).json({
    success: true,
    data: {}
  });
});

export const handlePaymentWebhook = async (req, res) => {
  try {
    // Your webhook logic here
    console.log('Webhook received:', req.body);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook failed' });
  }
};

/**
 * @desc    Get payment statistics
 * @route   GET /api/v1/payments/stats
 * @access  Private (admin, landlord)
 */
export const getPaymentStats = asyncHandler(async (req, res, next) => {
  let match = {};

  // If user is landlord, only show stats for their properties
  if (req.user.role === 'landlord') {
    const properties = await Property.find({ landlord: req.user.id });
    const propertyIds = properties.map(property => property._id);

    const bookings = await Booking.find({ property: { $in: propertyIds } });
    const bookingIds = bookings.map(booking => booking._id);

    match.booking = { $in: bookingIds };
  }

  const stats = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: '$count' },
        totalRevenue: { $sum: '$totalAmount' },
        statuses: { $push: '$$ROOT' }
      }
    },
    {
      $project: {
        _id: 0,
        totalPayments: 1,
        totalRevenue: 1,
        statuses: 1
      }
    }
  ]);

  

  // Get payment methods distribution
  const methods = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  // Get recent payments
  const recentPayments = await Payment.find(match)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate({
      path: 'booking',
      select: 'checkInDate checkOutDate',
      populate: {
        path: 'property',
        select: 'title'
      }
    })
    .populate({
      path: 'user',
      select: 'name'
    });

  res.status(200).json({
    success: true,
    data: {
      stats: stats.length > 0 ? stats[0] : { totalPayments: 0, totalRevenue: 0, statuses: [] },
      methods,
      recentPayments
    }
  });
});

// Mock payment gateway integration
// In a real implementation, replace with actual payment gateway API calls
const mockPaymentGatewayRequest = async paymentData => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate mock transaction ID
  const transactionId = `txn_${Math.random().toString(36).substring(2, 15)}`;

  // 90% success rate for demo purposes
  const success = Math.random() < 0.9;

  return {
    transactionId,
    status: success ? 'completed' : 'failed',
    message: success ? 'Payment processed successfully' : 'Payment failed',
    timestamp: new Date().toISOString()
  };
};

// Mock payment verification
const mockPaymentVerification = async transactionId => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Randomly return verified or pending status
  const statuses = ['completed', 'pending', 'failed'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    transactionId,
    status: randomStatus,
    verified: randomStatus === 'completed',
    timestamp: new Date().toISOString()
  };
};

// @desc    Get all refunds
// @route   GET /api/v1/refunds
// @access  Private/Admin
export const getRefunds = asyncHandler(async (req, res, next) => {
  const refunds = await Payment.find({
    status: { $in: ['refunded', 'partially_refunded'] }
  })
    .populate('user', 'name email')
    .populate({
      path: 'booking',
      select: 'checkInDate checkOutDate amount',
      populate: { path: 'property', select: 'title' }
    })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: refunds.length,
    data: refunds
  });
});
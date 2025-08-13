import axios from 'axios';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';

// MTN MoMo Configuration
const MTN_CONFIG = {
  COLLECTION_PRIMARY_KEY: process.env.MTN_COLLECTION_PRIMARY_KEY,
  COLLECTION_USER_ID: process.env.MTN_COLLECTION_USER_ID,
  COLLECTION_API_SECRET: process.env.MTN_COLLECTION_API_SECRET,
  COLLECTION_SUBSCRIPTION_KEY: process.env.MTN_COLLECTION_SUBSCRIPTION_KEY,
  BASE_URL: process.env.MTN_ENV === 'production' 
    ? 'https://momodeveloper.mtn.com' 
    : 'https://sandbox.momodeveloper.mtn.com'
};

// Generate UUID for transaction reference
const generateReferenceId = () => {
  return `RARA-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
};

// Get authentication token
export const getMomoToken = async () => {
  try {
    const response = await axios.post(
      `${MTN_CONFIG.BASE_URL}/collection/token/`,
      {},
      {
        headers: {
          'Ocp-Apim-Subscription-Key': MTN_CONFIG.COLLECTION_SUBSCRIPTION_KEY,
          'Authorization': `Basic ${Buffer.from(`${MTN_CONFIG.COLLECTION_USER_ID}:${MTN_CONFIG.COLLECTION_PRIMARY_KEY}`).toString('base64')}`
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting MoMo token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with MoMo API');
  }
};

// Initiate MoMo payment
export const initiateMomoPayment = async (amount, phoneNumber, externalId, callbackUrl) => {
  const token = await getMomoToken();
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-Target-Environment': process.env.MTN_ENV === 'production' ? 'production' : 'sandbox',
    'Ocp-Apim-Subscription-Key': MTN_CONFIG.COLLECTION_SUBSCRIPTION_KEY,
    'X-Reference-Id': externalId,
    'Content-Type': 'application/json'
  };

  const payload = {
    amount: amount.toString(),
    currency: 'RWF',
    externalId: externalId,
    payer: {
      partyIdType: 'MSISDN',
      partyId: phoneNumber.startsWith('250') ? phoneNumber : `250${phoneNumber}`
    },
    payerMessage: 'Property Rental Payment',
    payeeNote: 'Thank you for using Rara.com'
  };

  try {
    const response = await axios.post(
      `${MTN_CONFIG.BASE_URL}/collection/v1_0/requesttopay`,
      payload,
      { headers }
    );
    
    return {
      status: response.status === 202 ? 'PENDING' : 'FAILED',
      transactionId: externalId,
      momoResponse: response.data
    };
  } catch (error) {
    console.error('MoMo payment error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Payment initiation failed');
  }
};

// Verify payment status
export const verifyMomoPayment = async (transactionId) => {
  const token = await getMomoToken();
  
  try {
    const response = await axios.get(
      `${MTN_CONFIG.BASE_URL}/collection/v1_0/requesttopay/${transactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': process.env.MTN_ENV === 'production' ? 'production' : 'sandbox',
          'Ocp-Apim-Subscription-Key': MTN_CONFIG.COLLECTION_SUBSCRIPTION_KEY
        }
      }
    );
    
    return {
      status: response.data.status,
      amount: response.data.amount,
      currency: response.data.currency,
      financialTransactionId: response.data.financialTransactionId,
      payer: response.data.payer
    };
  } catch (error) {
    console.error('MoMo verification error:', error.response?.data || error.message);
    throw new Error('Payment verification failed');
  }
};
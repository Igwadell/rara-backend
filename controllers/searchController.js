import Property from '../models/Property.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import geocoder from '../utils/geocoder.js';
import axios from 'axios';
import { createClient } from '@google/maps';

// Initialize Google Maps client (for distance matrix calculations)
const googleMapsClient = createClient({
  key: process.env.GOOGLE_MAPS_API_KEY,
  Promise: Promise
});

/**
 * @desc    Search properties with filters
 * @route   GET /api/v1/search
 * @access  Public
 */
export const searchProperties = asyncHandler(async (req, res, next) => {
  // Copy query params
  const reqQuery = { ...req.query };

  // Fields to exclude from filtering
  const removeFields = ['select', 'sort', 'page', 'limit', 'near', 'radius', 'maxDistance'];
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Basic filtering
  let query = Property.find(JSON.parse(queryStr)).where('isVerified').equals(true);

  // Select fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Property.countDocuments(JSON.parse(queryStr)).where('isVerified').equals(true);

  query = query.skip(startIndex).limit(limit);

  // Populate landlord info
  query = query.populate({
    path: 'landlord',
    select: 'name email phone'
  });

  // Execute query
  const properties = await query;

  // Pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: properties.length,
    pagination,
    data: properties
  });
});

/**
 * @desc    Search properties near a location
 * @route   GET /api/v1/search/nearby
 * @access  Public
 */
export const searchNearby = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, maxDistance = 10 } = req.query;

  if (!latitude || !longitude) {
    return next(
      new ErrorResponse(
        'Please provide latitude and longitude parameters',
        400
      )
    );
  }

  // Calculate distance in radians
  // Earth radius = 6,378 km
  const radius = maxDistance / 6378;

  const properties = await Property.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: radius * 6378 * 1000 // Convert to meters
      }
    },
    isVerified: true
  }).populate({
    path: 'landlord',
    select: 'name email phone'
  });

  res.status(200).json({
    success: true,
    count: properties.length,
    data: properties
  });
});

/**
 * @desc    Search properties within a specific area (polygon)
 * @route   GET /api/v1/search/area
 * @access  Public
 */
export const searchWithinArea = asyncHandler(async (req, res, next) => {
  const { coordinates } = req.query;

  if (!coordinates) {
    return next(
      new ErrorResponse(
        'Please provide coordinates parameter as an array of [lng,lat] pairs',
        400
      )
    );
  }

  let coords;
  try {
    coords = JSON.parse(coordinates);
  } catch (err) {
    return next(
      new ErrorResponse(
        'Invalid coordinates format. Please provide valid JSON array',
        400
      )
    );
  }

  // Ensure the polygon is closed (first and last points are the same)
  if (coords.length > 0 && coords[0].toString() !== coords[coords.length - 1].toString()) {
    coords.push(coords[0]);
  }

  const properties = await Property.find({
    location: {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: [coords]
        }
      }
    },
    isVerified: true
  }).populate({
    path: 'landlord',
    select: 'name email phone'
  });

  res.status(200).json({
    success: true,
    count: properties.length,
    data: properties
  });
});

/**
 * @desc    Search properties by proximity to points of interest
 * @route   GET /api/v1/search/poi
 * @access  Public
 */
export const searchByPOI = asyncHandler(async (req, res, next) => {
  const { poi, maxDistance = 5 } = req.query;

  if (!poi) {
    return next(
      new ErrorResponse(
        'Please provide a point of interest (poi) parameter',
        400
      )
    );
  }

  // Geocode the point of interest
  const geocodeRes = await geocoder.geocode(poi);
  if (!geocodeRes || geocodeRes.length === 0) {
    return next(
      new ErrorResponse(
        `Could not geocode the point of interest: ${poi}`,
        404
      )
    );
  }

  const [lng, lat] = [geocodeRes[0].longitude, geocodeRes[0].latitude];

  // Find properties within maxDistance km of the POI
  const radius = maxDistance / 6378;

  const properties = await Property.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance * 1000 // Convert to meters
      }
    },
    isVerified: true
  }).populate({
    path: 'landlord',
    select: 'name email phone'
  });

  res.status(200).json({
    success: true,
    count: properties.length,
    data: properties,
    poiLocation: {
      type: 'Point',
      coordinates: [lng, lat],
      formattedAddress: geocodeRes[0].formattedAddress
    }
  });
});

/**
 * @desc    Search properties by image similarity
 * @route   POST /api/v1/search/image
 * @access  Public
 */
export const searchByImage = asyncHandler(async (req, res, next) => {
  if (!req.files || !req.files.image) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  const imageFile = req.files.image;

  // Validate image
  if (!imageFile.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  // In a production environment, you would:
  // 1. Upload the image to your image search service (like Google Vision AI)
  // 2. Get back image features/descriptors
  // 3. Compare with your property images in the database
  // 4. Return the most similar properties

  // For demo purposes, we'll implement a simplified version:
  // 1. Get all properties with images
  // 2. Return a random sample (mocking similarity results)

  // Get all verified properties with at least one image
  const properties = await Property.find({
    isVerified: true,
    photos: { $exists: true, $not: { $size: 0 } }
  }).populate({
    path: 'landlord',
    select: 'name email phone'
  });

  // Mock "similarity" by returning a random sample
  const sampleSize = Math.min(10, properties.length);
  const shuffled = properties.sort(() => 0.5 - Math.random());
  const similarProperties = shuffled.slice(0, sampleSize);

  res.status(200).json({
    success: true,
    count: similarProperties.length,
    data: similarProperties
  });
});

/**
 * @desc    Get travel time/distance for properties from a location
 * @route   GET /api/v1/search/travel-time
 * @access  Public
 */
export const getTravelTime = asyncHandler(async (req, res, next) => {
  const { origin, propertyIds } = req.query;

  if (!origin || !propertyIds) {
    return next(
      new ErrorResponse(
        'Please provide origin and propertyIds parameters',
        400
      )
    );
  }

  // Get property locations
  const ids = propertyIds.split(',');
  const properties = await Property.find({
    _id: { $in: ids },
    isVerified: true
  }).select('location title');

  if (properties.length === 0) {
    return next(new ErrorResponse('No properties found with the provided IDs', 404));
  }

  // Prepare destinations for distance matrix
  const destinations = properties.map(property => ({
    lat: property.location.coordinates[1],
    lng: property.location.coordinates[0]
  }));

  try {
    // Get distance matrix from Google Maps API
    const response = await googleMapsClient.distanceMatrix({
      origins: [origin],
      destinations,
      mode: 'driving',
      units: 'metric'
    }).asPromise();

    if (response.status !== 200) {
      return next(
        new ErrorResponse('Error getting travel information', 500)
      );
    }

    // Combine property data with travel info
    const results = properties.map((property, index) => {
      const element = response.json.rows[0].elements[index];
      return {
        property: {
          _id: property._id,
          title: property.title,
          location: property.location
        },
        distance: element.distance,
        duration: element.duration,
        status: element.status
      };
    });

    res.status(200).json({
      success: true,
      count: results.length,
      origin: response.json.origin_addresses[0],
      data: results
    });
  } catch (err) {
    console.error('Distance Matrix API error:', err);
    return next(
      new ErrorResponse('Error getting travel information', 500)
    );
  }
});

/**
 * @desc    Get autocomplete suggestions for property searches
 * @route   GET /api/v1/search/autocomplete
 * @access  Public
 */
export const getAutocompleteSuggestions = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  if (!query || query.length < 2) {
    return next(
      new ErrorResponse('Please provide a search query with at least 2 characters', 400)
    );
  }

  // Search in property titles, descriptions, and addresses
  const properties = await Property.find(
    {
      $text: { $search: query },
      isVerified: true
    },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(5)
    .select('title address propertyType');

  // Get suggestions from addresses (cities, neighborhoods)
  const addressTerms = await Property.aggregate([
    {
      $match: {
        $text: { $search: query },
        isVerified: true
      }
    },
    {
      $project: {
        city: { $arrayElemAt: [{ $split: ['$address', ','] }, -2] },
        neighborhood: { $arrayElemAt: [{ $split: ['$address', ','] }, 0] }
      }
    },
    {
      $group: {
        _id: null,
        cities: { $addToSet: '$city' },
        neighborhoods: { $addToSet: '$neighborhood' }
      }
    }
  ]);

  // Get unique property types matching the query
  const propertyTypes = await Property.aggregate([
    {
      $match: {
        $text: { $search: query },
        isVerified: true
      }
    },
    {
      $group: {
        _id: '$propertyType'
      }
    },
    {
      $limit: 5
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      properties,
      locations: addressTerms.length > 0 ? {
        cities: addressTerms[0].cities.filter(Boolean),
        neighborhoods: addressTerms[0].neighborhoods.filter(Boolean)
      } : { cities: [], neighborhoods: [] },
      propertyTypes: propertyTypes.map(pt => pt._id)
    }
  });
});
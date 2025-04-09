import NodeGeocoder from 'node-geocoder';
import ErrorResponse from './errorResponse.js';

// Configure geocoder
const options = {
  provider: process.env.GEOCODER_PROVIDER || 'mapquest',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null, // 'gpx', 'string', ...
  httpAdapter: 'https',
  country: 'RW', // Rwanda
  countryCode: 'RW',
};

const geocoder = NodeGeocoder(options);

/**
 * @desc    Geocode an address and return formatted location data
 * @param   {string} address - Address to geocode
 * @returns {Promise<Object>} - Geocoded location data
 * @throws  {ErrorResponse} - If geocoding fails
 */
export const geocodeAddress = async (address) => {
  try {
    const results = await geocoder.geocode(address);
    
    if (!results || results.length === 0) {
      throw new ErrorResponse(`No results found for address: ${address}`, 404);
    }

    // Extract the first result
    const location = results[0];

    return {
      formattedAddress: location.formattedAddress,
      street: location.streetName || location.streetNumber,
      city: location.city,
      district: location.administrativeLevels.level2long,
      state: location.administrativeLevels.level1long,
      country: location.country,
      countryCode: location.countryCode,
      latitude: location.latitude,
      longitude: location.longitude,
      zipcode: location.zipcode,
      provider: location.provider
    };
  } catch (err) {
    console.error('Geocoding error:', err);
    throw new ErrorResponse('Geocoding service failed', 500);
  }
};

/**
 * @desc    Reverse geocode coordinates to get address
 * @param   {number} lat - Latitude
 * @param   {number} lng - Longitude
 * @returns {Promise<Object>} - Reverse geocoded address data
 * @throws  {ErrorResponse} - If reverse geocoding fails
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const results = await geocoder.reverse({ lat, lon: lng });
    
    if (!results || results.length === 0) {
      throw new ErrorResponse(`No results found for coordinates: ${lat},${lng}`, 404);
    }

    // Extract the first result
    const location = results[0];

    return {
      formattedAddress: location.formattedAddress,
      street: location.streetName || location.streetNumber,
      city: location.city,
      district: location.administrativeLevels.level2long,
      state: location.administrativeLevels.level1long,
      country: location.country,
      countryCode: location.countryCode,
      zipcode: location.zipcode,
      provider: location.provider
    };
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    throw new ErrorResponse('Reverse geocoding service failed', 500);
  }
};

export default geocoder;
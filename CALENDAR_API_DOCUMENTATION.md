# Calendar and Property Management API Documentation

This document outlines the new calendar and property management endpoints implemented for the Rara backend.

## Base URL
All endpoints are prefixed with `/api/v1`

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Calendar Endpoints

### 1. Get Calendar Events
**GET** `/calendar/events`

Get all calendar events (bookings and blocked dates) for properties.

**Query Parameters:**
- `propertyId` (optional): Filter events by specific property
- `startDate` (optional): Start date for filtering (ISO format)
- `endDate` (optional): End date for filtering (ISO format)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "booking_id",
      "type": "booking",
      "title": "Booking - John Doe",
      "start": "2024-01-15T00:00:00.000Z",
      "end": "2024-01-20T00:00:00.000Z",
      "status": "confirmed",
      "property": {
        "id": "property_id",
        "name": "Beach House",
        "address": "123 Beach St"
      },
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "totalAmount": 500
    },
    {
      "id": "blocked_id",
      "type": "blocked",
      "title": "Blocked - Maintenance",
      "start": "2024-01-25T00:00:00.000Z",
      "end": "2024-01-30T00:00:00.000Z",
      "reason": "Maintenance",
      "property": {
        "id": "property_id",
        "name": "Beach House",
        "address": "123 Beach St"
      }
    }
  ]
}
```

### 2. Get Calendar Analytics
**GET** `/calendar/analytics`

Get analytics data for calendar events including booking statistics and occupancy rates.

**Query Parameters:**
- `propertyId` (optional): Filter analytics by specific property
- `startDate` (optional): Start date for filtering (ISO format)
- `endDate` (optional): End date for filtering (ISO format)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingStats": {
      "totalBookings": 15,
      "totalRevenue": 7500,
      "averageBookingValue": 500,
      "confirmedBookings": 12,
      "pendingBookings": 2,
      "cancelledBookings": 1
    },
    "occupancyRate": 65.5,
    "blockedDatesCount": 3,
    "totalDays": 30
  }
}
```

## Property Management Endpoints

### 3. Get Property Availability
**GET** `/properties/:id/availability`

Get availability information for a specific property including bookings and blocked dates.

**Query Parameters:**
- `startDate` (optional): Start date for filtering (ISO format)
- `endDate` (optional): End date for filtering (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "property": {
      "id": "property_id",
      "name": "Beach House",
      "address": "123 Beach St"
    },
    "bookings": [
      {
        "checkIn": "2024-01-15T00:00:00.000Z",
        "checkOut": "2024-01-20T00:00:00.000Z",
        "status": "confirmed"
      }
    ],
    "blockedDates": [
      {
        "startDate": "2024-01-25T00:00:00.000Z",
        "endDate": "2024-01-30T00:00:00.000Z",
        "reason": "Maintenance"
      }
    ],
    "isAvailable": true
  }
}
```

### 4. Get Property Pricing
**GET** `/properties/:id/pricing`

Get pricing information for a specific property.

**Response:**
```json
{
  "success": true,
  "data": {
    "basePrice": 100,
    "cleaningFee": 50,
    "serviceFee": 10,
    "securityDeposit": 200,
    "currency": "USD",
    "pricingRules": [
      {
        "startDate": "2024-06-01T00:00:00.000Z",
        "endDate": "2024-08-31T00:00:00.000Z",
        "price": 150,
        "type": "seasonal"
      }
    ]
  }
}
```

### 5. Update Property Pricing
**PUT** `/properties/:id/pricing`

Update pricing information for a specific property.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "price": 120,
  "cleaningFee": 60,
  "serviceFee": 12,
  "securityDeposit": 250,
  "currency": "USD",
  "pricingRules": [
    {
      "startDate": "2024-06-01T00:00:00.000Z",
      "endDate": "2024-08-31T00:00:00.000Z",
      "price": 180,
      "type": "seasonal"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "property_id",
    "price": 120,
    "cleaningFee": 60,
    "serviceFee": 12,
    "securityDeposit": 250,
    "currency": "USD",
    "pricingRules": [...]
  }
}
```

### 6. Block Dates
**POST** `/properties/:id/block-dates`

Block specific dates for a property.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "startDate": "2024-01-25T00:00:00.000Z",
  "endDate": "2024-01-30T00:00:00.000Z",
  "reason": "Maintenance"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "blocked_date_id",
    "property": "property_id",
    "startDate": "2024-01-25T00:00:00.000Z",
    "endDate": "2024-01-30T00:00:00.000Z",
    "reason": "Maintenance",
    "blockedBy": "user_id"
  }
}
```

### 6.1. Block Past Dates
**POST** `/properties/:id/blocked-dates/block-past-dates`

Automatically block all dates before today for a property to prevent bookings in the past.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Past dates have been blocked successfully",
  "data": {
    "id": "blocked_date_id",
    "property": "property_id",
    "startDate": "2020-01-01T00:00:00.000Z",
    "endDate": "2024-01-15T00:00:00.000Z",
    "reason": "Past dates blocked - cannot book in the past",
    "blockedBy": "user_id"
  }
}
```

**Error Response (if already blocked):**
```json
{
  "success": false,
  "message": "Past dates are already blocked for this property",
  "data": {
    "id": "existing_blocked_date_id",
    "property": "property_id",
    "startDate": "2020-01-01T00:00:00.000Z",
    "endDate": "2024-01-15T00:00:00.000Z",
    "reason": "Past dates blocked - cannot book in the past",
    "blockedBy": "user_id"
  }
}
```

### 6.2. Unblock Past Dates
**DELETE** `/properties/:id/blocked-dates/unblock-past-dates`

Remove past date blocks for a property.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully unblocked past dates. Removed 1 blocked date entries.",
  "data": {
    "deletedCount": 1
  }
}
```

### 6.3. Check Past Dates Blocked
**GET** `/properties/:id/blocked-dates/check-past-dates`

Check if past dates are blocked for a property.

**Response:**
```json
{
  "success": true,
  "data": {
    "isPastDatesBlocked": true,
    "blockedDate": {
      "id": "blocked_date_id",
      "property": "property_id",
      "startDate": "2020-01-01T00:00:00.000Z",
      "endDate": "2024-01-15T00:00:00.000Z",
      "reason": "Past dates blocked - cannot book in the past",
      "blockedBy": "user_id"
    }
  }
}
```

### 7. Unblock Dates
**DELETE** `/properties/:id/block-dates`

Remove blocked dates for a property.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "startDate": "2024-01-25T00:00:00.000Z",
  "endDate": "2024-01-30T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deletedCount": 1
  }
}
```

### 8. Get Booking Window
**GET** `/properties/:id/booking-window`

Get booking window settings for a property.

**Response:**
```json
{
  "success": true,
  "data": {
    "advanceBookingDays": 365,
    "sameDayBooking": false,
    "instantBooking": true,
    "bookingLeadTime": 2
  }
}
```

### 9. Update Booking Window
**PUT** `/properties/:id/booking-window`

Update booking window settings for a property.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "advanceBookingDays": 180,
  "sameDayBooking": true,
  "instantBooking": false,
  "bookingLeadTime": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "property_id",
    "advanceBookingDays": 180,
    "sameDayBooking": true,
    "instantBooking": false,
    "bookingLeadTime": 1
  }
}
```

### 10. Get Stay Limits
**GET** `/properties/:id/stay-limits`

Get stay limit settings for a property.

**Response:**
```json
{
  "success": true,
  "data": {
    "minimumStay": 2,
    "maximumStay": 14,
    "minimumAdvanceNotice": 1,
    "maximumAdvanceNotice": 365
  }
}
```

### 11. Update Stay Limits
**PUT** `/properties/:id/stay-limits`

Update stay limit settings for a property.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "minimumStay": 3,
  "maximumStay": 21,
  "minimumAdvanceNotice": 2,
  "maximumAdvanceNotice": 180
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "property_id",
    "minimumStay": 3,
    "maximumStay": 21,
    "minimumAdvanceNotice": 2,
    "maximumAdvanceNotice": 180
  }
}
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## Authorization

The following endpoints require authentication and specific roles:

**Landlord and Admin Access:**
- All PUT/POST/DELETE endpoints
- Calendar events and analytics

**Public Access:**
- GET property availability
- GET property pricing
- GET booking window
- GET stay limits

## Notes

1. All dates should be provided in ISO 8601 format
2. Property IDs should be valid MongoDB ObjectIds
3. JWT tokens should be included in the Authorization header for protected routes
4. The system automatically handles timezone conversions
5. Pricing rules support seasonal, weekend, holiday, and custom pricing
6. Blocked dates can overlap with existing bookings (they take precedence)
7. Analytics are calculated based on confirmed bookings only
8. The system automatically prevents bookings for past dates - check-in dates must be today or in the future
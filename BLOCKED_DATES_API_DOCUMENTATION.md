# Blocked Dates API Documentation

This document outlines the backend API endpoints for managing blocked dates on properties. Blocked dates prevent any bookings from being made on those specific dates.

## Base URL
All endpoints are prefixed with `/api/v1/properties/:propertyId/blocked-dates`

## Authentication
Protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get All Blocked Dates
- **URL**: `GET /api/v1/properties/:propertyId/blocked-dates`
- **Access**: Public
- **Query Parameters**:
  - `startDate` (optional): Filter blocked dates from this date (ISO string)
  - `endDate` (optional): Filter blocked dates until this date (ISO string)

**Response**:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "property": "60d21b4667d0d8992e610c84",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-01-20T00:00:00.000Z",
      "reason": "Maintenance work",
      "blockedBy": {
        "_id": "60d21b4667d0d8992e610c83",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-10T10:00:00.000Z"
    }
  ]
}
```

### 2. Get Single Blocked Date
- **URL**: `GET /api/v1/properties/:propertyId/blocked-dates/:id`
- **Access**: Public

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "property": "60d21b4667d0d8992e610c84",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-01-20T00:00:00.000Z",
    "reason": "Maintenance work",
    "blockedBy": {
      "_id": "60d21b4667d0d8992e610c83",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

### 3. Create Blocked Date
- **URL**: `POST /api/v1/properties/:propertyId/blocked-dates`
- **Access**: Private (Landlord, Admin)
- **Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-20T00:00:00.000Z",
  "reason": "Maintenance work"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "property": "60d21b4667d0d8992e610c84",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-01-20T00:00:00.000Z",
    "reason": "Maintenance work",
    "blockedBy": {
      "_id": "60d21b4667d0d8992e610c83",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

### 4. Update Blocked Date
- **URL**: `PUT /api/v1/properties/:propertyId/blocked-dates/:id`
- **Access**: Private (Landlord, Admin)
- **Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "startDate": "2024-01-16T00:00:00.000Z",
  "endDate": "2024-01-21T00:00:00.000Z",
  "reason": "Extended maintenance work"
}
```

**Response**: Same as create response

### 5. Delete Blocked Date
- **URL**: `DELETE /api/v1/properties/:propertyId/blocked-dates/:id`
- **Access**: Private (Landlord, Admin)
- **Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Blocked date removed successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "End date must be on or after start date"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Not authorized to block dates for this property"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Property not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "This date range overlaps with an existing blocked date"
}
```

## Frontend Integration Notes

1. **Booking Validation**: When users try to make a booking, the system automatically checks for blocked dates and prevents bookings on blocked dates.

2. **Permission Check**: Only landlords (owners of the property) and admins can create, update, or delete blocked dates.

3. **Date Overlap Prevention**: The system prevents creating overlapping blocked date ranges for the same property.

4. **Real-time Updates**: When blocked dates are added or removed, existing bookings are not affected, but new bookings will respect the blocked dates.

## Example Frontend Usage

```javascript
// Get blocked dates for a property
const response = await fetch('/api/v1/properties/123/blocked-dates');
const blockedDates = await response.json();

// Create a blocked date (requires authentication)
const response = await fetch('/api/v1/properties/123/blocked-dates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    startDate: '2024-01-15T00:00:00.000Z',
    endDate: '2024-01-20T00:00:00.000Z',
    reason: 'Maintenance work'
  })
});
``` 
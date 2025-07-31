# Past Date Blocking Feature

This feature automatically prevents bookings for past dates and provides tools to block all past dates for properties.

## Overview

The system now includes comprehensive validation to prevent bookings for past dates:

1. **Model-level validation**: The `Booking` model validates that check-in dates cannot be in the past
2. **Controller-level validation**: Both create and update booking controllers check for past dates
3. **Automatic blocking**: Tools to automatically block all past dates for properties

## Features

### 1. Automatic Past Date Validation

The system automatically prevents bookings for past dates at multiple levels:

- **Database Level**: The `Booking` model includes validation that prevents check-in dates from being in the past
- **API Level**: Both create and update booking endpoints validate dates before processing
- **Error Messages**: Clear error messages inform users that past dates are not allowed

### 2. Manual Past Date Blocking

Landlords and admins can manually block past dates for their properties:

**Endpoint**: `POST /api/v1/properties/:propertyId/blocked-dates/block-past-dates`

**Headers**: 
```
Authorization: Bearer <token>
```

**Response**:
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

**Error Response (if already blocked)**:
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

### 3. Unblock Past Dates

Landlords and admins can unblock past dates for their properties:

**Endpoint**: `DELETE /api/v1/properties/:propertyId/blocked-dates/unblock-past-dates`

**Headers**: 
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully unblocked past dates. Removed 1 blocked date entries.",
  "data": {
    "deletedCount": 1
  }
}
```

### 4. Check Past Dates Status

Check if past dates are blocked for a property:

**Endpoint**: `GET /api/v1/properties/:propertyId/blocked-dates/check-past-dates`

**Response**:
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

### 5. Bulk Past Date Blocking Script

A script is available to automatically block past dates for all properties:

**File**: `scripts/blockPastDates.js`

**Usage**:
```bash
node scripts/blockPastDates.js
```

This script will:
- Find all properties in the database
- Check if past dates are already blocked
- Create blocked date entries for properties that don't have them
- Provide a summary of the operation

## Implementation Details

### Validation Logic

The system considers "today" as the cutoff date for valid bookings:

```javascript
const today = new Date();
today.setHours(0, 0, 0, 0); // Set to start of today

if (checkInDate < today) {
  // Reject the booking
}
```

### Blocked Date Range

When blocking past dates, the system creates a blocked date entry from January 1, 2020 to today. This ensures all past dates are covered while maintaining a reasonable start date.

### Error Handling

The system provides clear error messages:

- **Model validation**: "Check-in date cannot be in the past"
- **API validation**: "Cannot book dates in the past. Check-in date must be today or in the future"

## Usage Examples

### 1. Creating a Booking (Valid)
```javascript
// This will succeed
const bookingData = {
  property: propertyId,
  user: userId,
  checkInDate: new Date('2024-02-01'), // Future date
  checkOutDate: new Date('2024-02-05'),
  amount: 400
};
```

### 2. Creating a Booking (Invalid - Past Date)
```javascript
// This will fail
const bookingData = {
  property: propertyId,
  user: userId,
  checkInDate: new Date('2023-01-01'), // Past date
  checkOutDate: new Date('2023-01-05'),
  amount: 400
};
// Error: "Cannot book dates in the past. Check-in date must be today or in the future"
```

### 3. Blocking Past Dates for a Property
```javascript
// Using the API endpoint
const response = await fetch('/api/v1/properties/propertyId/blocked-dates/block-past-dates', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  }
});
```

### 4. Unblocking Past Dates for a Property
```javascript
// Using the API endpoint
const response = await fetch('/api/v1/properties/propertyId/blocked-dates/unblock-past-dates', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  }
});
```

### 5. Checking Past Dates Status
```javascript
// Using the API endpoint
const response = await fetch('/api/v1/properties/propertyId/blocked-dates/check-past-dates', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
if (data.data.isPastDatesBlocked) {
  console.log('Past dates are blocked for this property');
} else {
  console.log('Past dates are not blocked for this property');
}
```

## Testing

A test file is included to verify the past date validation:

**File**: `test/pastDateValidation.test.js`

Run the tests to ensure the validation works correctly:

```bash
npm test test/pastDateValidation.test.js
```

## Benefits

1. **Prevents Invalid Bookings**: No more accidental bookings for past dates
2. **Improves User Experience**: Clear error messages guide users
3. **Maintains Data Integrity**: Database-level validation ensures consistency
4. **Flexible Implementation**: Manual and automatic blocking options available
5. **Comprehensive Coverage**: Multiple validation layers prevent edge cases
6. **Block/Unblock Control**: Users can block and unblock past dates as needed
7. **Duplicate Prevention**: System prevents blocking the same dates multiple times
8. **Status Checking**: Easy way to check if past dates are blocked for a property

## Security Considerations

- Only landlords and admins can block dates for properties
- All date validations are performed server-side
- JWT authentication is required for blocking operations
- Property ownership is verified before allowing date blocking

## Future Enhancements

Potential improvements for the future:

1. **Configurable Past Date Range**: Allow setting custom start dates for blocked ranges
2. **Automatic Cleanup**: Remove old blocked date entries periodically
3. **Timezone Support**: Enhanced timezone handling for international properties
4. **Bulk Operations**: API endpoints for bulk past date blocking
5. **Audit Trail**: Track who blocked dates and when 
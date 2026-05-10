# OneTap Microservices API Documentation

Welcome to the OneTap API Documentation. This guide provides all the necessary information to integrate frontend or mobile applications with the OneTap backend services.

## 🚀 Base Configuration

- **API Gateway URL**: `http://localhost:3000`
- **API Version**: `v1`
- **Content Type**: `application/json`

All requests and responses must use JSON format.

## 🔐 Authentication Guide

The system uses stateful session-based authentication (Better Auth) to manage user sessions securely.

### 1. Authentication Token
After a successful login, the API returns a session token.
- This token represents a session stored in the database.
- It must be included in all protected API requests.
- **Header Format**: `Authorization: Bearer <your_token>`

### 2. Session Expiry & Renewal
- **Default Expiry**: 7 days
- **Sliding Window**: Each valid request refreshes the session expiry. If the user is active at least once every 7 days, the session remains valid indefinitely.

### 3. Why No Refresh Tokens?
Unlike traditional JWT-based systems, this API does not use refresh tokens because:
- **Stateful Sessions**: Tokens are stored in the database, allowing server-side control and instant invalidation.
- **Automatic Renewal**: Session expiry is extended automatically with user activity.
- **Simplified Frontend Logic**: Only one token needs to be stored and managed.

---

## 📂 Authentication Endpoints

### 1. User Registration
Create a new user account.

- **Endpoint**: `/api/v1/auth/register`
- **Method**: `POST`
- **Authentication Required**: ❌ No

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "user",
  "lat": 19.0760,
  "lng": 72.8777
}
```
*Note: `role` is optional (default: `user`). Allowed values: `user`, `vendor`, `seller`, `admin`.*

---

### 2. User Login
Authenticate a user and receive a session token.

- **Endpoint**: `/api/v1/auth/login`
- **Method**: `POST`
- **Authentication Required**: ❌ No

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged in successfully",
  "data": {
    "user": { ... },
    "token": "..."
  }
}
```

---

### 3. Update User Profile
Update personal details of the authenticated user.

- **Endpoint**: `/api/v1/auth/profile`
- **Method**: `PUT`
- **Authentication Required**: ✅ Yes

**Request Body (All fields are optional)**:
```json
{
  "name": "John Updated",
  "phone": "+1234567890",
  "lat": 19.0760,
  "lng": 72.8777,
  "interests": "coding, music, travel"
}
```

---

### 4. Get Current User (Profile)
Retrieve details of the authenticated user.

- **Endpoint**: `/api/v1/auth/me`
- **Method**: `GET`
- **Authentication Required**: ✅ Yes

---

## ⚠️ Error Handling
All API errors follow a consistent response structure:
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized: Please log in to access this resource",
  "errors": []
}
```

### Common HTTP Status Codes
- `400 Bad Request`: Validation errors (e.g., duplicate email)
- `401 Unauthorized`: Missing, invalid, or expired token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Unexpected server issue

# Task Manager API Documentation

**Base URL:** `http://localhost:8000/api`

**API Version:** v1  
**Last Updated:** May 8, 2026

---

## Table of Contents
1. [Authentication](#authentication)
2. [User Endpoints](#user-endpoints)
3. [Task Endpoints](#task-endpoints)
4. [Category Endpoints](#category-endpoints)
5. [Dashboard Endpoints](#dashboard-endpoints)
6. [Error Handling](#error-handling)

---

## Authentication

### Register
Create a new user account.

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** 200 OK
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-05-08T12:00:00Z",
    "updated_at": "2026-05-08T12:00:00Z"
  }
}
```

**Validation Rules:**
- `name` - Required, string, max 255 characters
- `email` - Required, unique email, valid format
- `password` - Required, minimum 8 characters

**Error Responses:**
- `422 Unprocessable Entity` - Validation failed

---

### Login
Authenticate and receive a token.

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** 200 OK
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-05-08T12:00:00Z",
    "updated_at": "2026-05-08T12:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `422 Unprocessable Entity` - Validation failed

---

### Logout
Revoke the authentication token.

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** 200 OK
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

## User Endpoints

### Get Current User
Retrieve the authenticated user's profile.

**Endpoint:** `GET /user`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** 200 OK
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "email_verified_at": null,
  "created_at": "2026-05-08T12:00:00Z",
  "updated_at": "2026-05-08T12:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

## Task Endpoints

### List Tasks
Retrieve all tasks for the authenticated user with optional filters.

**Endpoint:** `GET /tasks`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `category_id` (integer, optional) - Filter by category
- `priority` (string, optional) - Filter by priority (high, medium, low)
- `completed` (boolean, optional) - Filter by completion status
- `overdue` (boolean, optional) - Filter overdue tasks

**Example:** `GET /tasks?category_id=1&priority=high&completed=false`

**Response:** 200 OK
```json
[
  {
    "id": 1,
    "title": "Complete project proposal",
    "description": "Finish the Q2 project proposal",
    "completed": false,
    "priority": "high",
    "due_date": "2026-05-15T00:00:00Z",
    "reminder_at": "2026-05-14T00:00:00Z",
    "category_id": 1,
    "user_id": 1,
    "category": {
      "id": 1,
      "name": "Work",
      "color": "#0b5fff"
    },
    "created_at": "2026-05-08T12:00:00Z",
    "updated_at": "2026-05-08T12:00:00Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

### Create Task
Create a new task.

**Endpoint:** `POST /tasks`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Complete project proposal",
  "description": "Finish the Q2 project proposal",
  "priority": "high",
  "due_date": "2026-05-15T00:00:00Z",
  "reminder_at": "2026-05-14T00:00:00Z",
  "category_id": 1
}
```

**Response:** 201 Created
```json
{
  "id": 1,
  "title": "Complete project proposal",
  "description": "Finish the Q2 project proposal",
  "completed": false,
  "priority": "high",
  "due_date": "2026-05-15T00:00:00Z",
  "reminder_at": "2026-05-14T00:00:00Z",
  "category_id": 1,
  "user_id": 1,
  "category": {
    "id": 1,
    "name": "Work",
    "color": "#0b5fff"
  },
  "created_at": "2026-05-08T12:00:00Z",
  "updated_at": "2026-05-08T12:00:00Z"
}
```

**Validation Rules:**
- `title` - Required, string, max 255 characters
- `description` - Optional, string
- `priority` - Required, one of: high, medium, low
- `due_date` - Optional, valid date
- `reminder_at` - Optional, must be before or equal to due_date
- `category_id` - Optional, must exist and belong to user

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `422 Unprocessable Entity` - Validation failed

---

### Get Task
Retrieve a specific task.

**Endpoint:** `GET /tasks/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** 200 OK
```json
{
  "id": 1,
  "title": "Complete project proposal",
  "description": "Finish the Q2 project proposal",
  "completed": false,
  "priority": "high",
  "due_date": "2026-05-15T00:00:00Z",
  "reminder_at": "2026-05-14T00:00:00Z",
  "category_id": 1,
  "user_id": 1,
  "category": {
    "id": 1,
    "name": "Work",
    "color": "#0b5fff"
  },
  "created_at": "2026-05-08T12:00:00Z",
  "updated_at": "2026-05-08T12:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Task not found or doesn't belong to user

---

### Update Task
Update an existing task (supports PATCH for partial updates).

**Endpoint:** `PUT /tasks/{id}` or `PATCH /tasks/{id}`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Updated task title",
  "completed": true,
  "priority": "medium"
}
```

**Response:** 200 OK
```json
{
  "id": 1,
  "title": "Updated task title",
  "description": "Finish the Q2 project proposal",
  "completed": true,
  "priority": "medium",
  "due_date": "2026-05-15T00:00:00Z",
  "reminder_at": "2026-05-14T00:00:00Z",
  "category_id": 1,
  "user_id": 1,
  "category": {
    "id": 1,
    "name": "Work",
    "color": "#0b5fff"
  },
  "created_at": "2026-05-08T12:00:00Z",
  "updated_at": "2026-05-08T12:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Task not found or doesn't belong to user
- `422 Unprocessable Entity` - Validation failed

---

### Delete Task
Delete a task.

**Endpoint:** `DELETE /tasks/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** 200 OK
```json
{
  "message": "Task deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Task not found or doesn't belong to user

---

## Category Endpoints

### List Categories
Retrieve all categories for the authenticated user.

**Endpoint:** `GET /categories`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** 200 OK
```json
[
  {
    "id": 1,
    "name": "Work",
    "color": "#0b5fff",
    "user_id": 1,
    "tasks_count": 5,
    "created_at": "2026-05-08T12:00:00Z",
    "updated_at": "2026-05-08T12:00:00Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

### Create Category
Create a new category.

**Endpoint:** `POST /categories`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Personal",
  "color": "#ff6b6b"
}
```

**Response:** 201 Created
```json
{
  "id": 2,
  "name": "Personal",
  "color": "#ff6b6b",
  "user_id": 1,
  "tasks_count": 0,
  "created_at": "2026-05-08T12:00:00Z",
  "updated_at": "2026-05-08T12:00:00Z"
}
```

**Validation Rules:**
- `name` - Required, string, max 100 characters, unique per user
- `color` - Optional, string (hex color format recommended)

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `422 Unprocessable Entity` - Validation failed

---

### Get Category
Retrieve a specific category.

**Endpoint:** `GET /categories/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** 200 OK
```json
{
  "id": 1,
  "name": "Work",
  "color": "#0b5fff",
  "user_id": 1,
  "tasks_count": 5,
  "created_at": "2026-05-08T12:00:00Z",
  "updated_at": "2026-05-08T12:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Category not found or doesn't belong to user

---

### Update Category
Update an existing category.

**Endpoint:** `PUT /categories/{id}` or `PATCH /categories/{id}`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Work Updated",
  "color": "#00ff00"
}
```

**Response:** 200 OK
```json
{
  "id": 1,
  "name": "Work Updated",
  "color": "#00ff00",
  "user_id": 1,
  "tasks_count": 5,
  "created_at": "2026-05-08T12:00:00Z",
  "updated_at": "2026-05-08T12:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Category not found or doesn't belong to user
- `422 Unprocessable Entity` - Validation failed

---

### Delete Category
Delete a category. Tasks in this category will have their category_id set to null.

**Endpoint:** `DELETE /categories/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** 200 OK
```json
{
  "message": "Category deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Category not found or doesn't belong to user

---

### Seed Default Categories
Create default categories for the user (typically called after registration).

**Endpoint:** `POST /categories/seed-defaults`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** 200 OK
```json
[
  {
    "id": 1,
    "name": "Work",
    "color": "#0b5fff",
    "user_id": 1,
    "tasks_count": 0,
    "created_at": "2026-05-08T12:00:00Z",
    "updated_at": "2026-05-08T12:00:00Z"
  },
  {
    "id": 2,
    "name": "Personal",
    "color": "#51cf66",
    "user_id": 1,
    "tasks_count": 0,
    "created_at": "2026-05-08T12:00:00Z",
    "updated_at": "2026-05-08T12:00:00Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

## Dashboard Endpoints

### Get Dashboard Metrics
Retrieve aggregated metrics for the dashboard.

**Endpoint:** `GET /dashboard/metrics`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** 200 OK
```json
{
  "total_tasks": 25,
  "completed_tasks": 12,
  "pending_tasks": 13,
  "overdue_tasks": 2,
  "completion_percentage": 48,
  "tasks_by_priority": {
    "high": 5,
    "medium": 12,
    "low": 8
  },
  "progress_by_category": [
    {
      "category_id": 1,
      "category_name": "Work",
      "total": 15,
      "completed": 8,
      "percentage": 53
    },
    {
      "category_id": 2,
      "category_name": "Personal",
      "total": 10,
      "completed": 4,
      "percentage": 40
    }
  ],
  "upcoming_tasks": [
    {
      "id": 1,
      "title": "Complete project proposal",
      "due_date": "2026-05-15T00:00:00Z",
      "priority": "high",
      "category_name": "Work"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

## Error Handling

### Standard Error Responses

**401 Unauthorized**
```json
{
  "message": "Unauthenticated."
}
```

**404 Not Found**
```json
{
  "message": "Not found"
}
```

**422 Unprocessable Entity (Validation Error)**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email has already been taken."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

**500 Internal Server Error**
```json
{
  "message": "Internal Server Error"
}
```

### Error Codes
| Code | Meaning |
|------|---------|
| 200  | OK - Request succeeded |
| 201  | Created - Resource created successfully |
| 400  | Bad Request - Invalid request format |
| 401  | Unauthorized - Authentication required or failed |
| 404  | Not Found - Resource not found |
| 422  | Unprocessable Entity - Validation failed |
| 500  | Internal Server Error - Server error |

---

## Rate Limiting

Currently, there is no rate limiting configured. This is recommended for production environments.

---

## CORS Configuration

The API supports CORS requests from:
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:5173`
- `http://localhost:3000` (Alternative dev port)
- `http://127.0.0.1:3000`

Add your production domain to `config/cors.php` for production deployments.

---

## Authentication

All authenticated endpoints require the `Authorization` header with a Bearer token:

```
Authorization: Bearer {token}
```

Tokens are obtained from the `/auth/login` or `/auth/register` endpoints.

---

## Environment Setup

**Development:**
```
Base URL: http://localhost:8000/api
Frontend: http://localhost:5173
Backend: Laravel (php artisan serve)
```

**Start Backend:**
```bash
cd backend
php artisan serve
```

**Start Frontend:**
```bash
cd frontend
npm run dev
```

---

## Support

For issues or questions about the API, contact the development team or create an issue on the project repository.

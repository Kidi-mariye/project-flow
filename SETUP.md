# Task Manager - Setup Guide

## Overview
This is a full-stack application with a Laravel backend (API) and React frontend (SPA).

**Architecture:**
- **Backend:** Laravel 11+ with API routes using Sanctum authentication
- **Frontend:** React 19 with Vite, React Router, and Axios
- **Database:** SQLite (default) or MySQL
- **API:** RESTful endpoints documented in [API.md](./API.md)

---

## Prerequisites

- **Node.js:** v18+ ([Download](https://nodejs.org/))
- **PHP:** v8.2+ ([Download](https://www.php.net/))
- **Composer:** Latest version ([Download](https://getcomposer.org/))
- **npm:** v9+ (included with Node.js)

---

## Installation

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Copy environment file
cp .env.example .env

# Install PHP dependencies
composer install

# Generate application key
php artisan key:generate

# Run database migrations
php artisan migrate

# (Optional) Seed the database with test data
php artisan db:seed
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Copy environment file
cp .env.example .env.local

# Install Node dependencies
npm install
```

---

## Running the Application

### Start Backend

```bash
cd backend
php artisan serve
```

The backend API will be available at: **`http://localhost:8000/api`**

### Start Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will be available at: **`http://localhost:5173`**

---

## Development Workflow

### Available Frontend Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

### Available Backend Commands

```bash
# Run migrations
php artisan migrate

# Rollback migrations
php artisan migrate:rollback

# Seed the database
php artisan db:seed

# Create new migration
php artisan make:migration migration_name

# Create new controller
php artisan make:controller Api/ControllerName

# Run tests
php artisan test
```

---

## Environment Configuration

### Backend (.env)

Key environment variables for backend:

```
APP_URL=http://localhost:8000
APP_DEBUG=true
DB_CONNECTION=sqlite
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:3000
SESSION_DOMAIN=localhost
```

### Frontend (.env.local)

Key environment variables for frontend:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Project Structure

```
Task Manager/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/    # API Controllers
│   │   │   └── Requests/       # Form Requests & Validation
│   │   └── Models/             # Database Models
│   ├── config/                 # Configuration files
│   ├── database/
│   │   ├── migrations/         # Database migrations
│   │   └── seeders/            # Database seeders
│   ├── routes/
│   │   └── api.php             # API routes
│   └── bootstrap/app.php       # Application configuration
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable components
│   │   ├── contexts/           # React contexts (auth)
│   │   ├── hooks/              # Custom hooks
│   │   ├── utils/              # Utility functions
│   │   ├── api.js              # API client
│   │   └── main.jsx            # Application entry point
│   └── vite.config.js          # Vite configuration
│
├── API.md                      # API Documentation
└── SETUP.md                    # This file
```

---

## Authentication Flow

1. **Register:** User creates an account at `/register`
2. **Login:** User logs in at `/login`
3. **Token Storage:** Auth token is stored in localStorage
4. **Protected Routes:** All authenticated routes require valid token
5. **Logout:** User logs out, token is revoked and cleared

### Credentials for Testing

After running seeders, a test account is created:
- **Email:** `test@example.com`
- **Password:** `password`

---

## API Documentation

Complete API documentation is available in [API.md](./API.md)

### Quick API Overview

- **Auth:** `/auth/register`, `/auth/login`, `/auth/logout`
- **User:** `GET /user`
- **Tasks:** `GET|POST /tasks`, `GET|PUT|DELETE /tasks/{id}`
- **Categories:** `GET|POST /categories`, `GET|PUT|DELETE /categories/{id}`
- **Dashboard:** `GET /dashboard/metrics`

---

## CORS Configuration

CORS is configured to allow requests from:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

For production, update `backend/config/cors.php` to include your domain.

---

## Database

### SQLite (Default)

Database file: `backend/database/database.sqlite`

To reset the database:
```bash
php artisan migrate:fresh
php artisan db:seed
```

### MySQL/MariaDB

To use MySQL instead of SQLite:

1. Update `.env`:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=task_manager
DB_USERNAME=root
DB_PASSWORD=your_password
```

2. Create the database:
```bash
mysql -u root -p
CREATE DATABASE task_manager;
EXIT;
```

3. Run migrations:
```bash
php artisan migrate
php artisan db:seed
```

---

## Troubleshooting

### Backend Issues

**"Cannot reach API server"**
- Make sure backend is running: `php artisan serve`
- Check CORS configuration in `backend/config/cors.php`
- Verify `.env` has correct database connection

**"Database not found"**
- Ensure `database.sqlite` exists or is created after migrations
- Run: `php artisan migrate`

**"Validation errors"**
- Check request data matches Form Request rules
- Review error response for specific field validation errors

### Frontend Issues

**"Cannot connect to API"**
- Verify `VITE_API_BASE_URL` in `.env.local`
- Ensure backend is running and accessible
- Check CORS error in browser console

**"Blank page / Not loading"**
- Open browser console for errors
- Clear localStorage: `localStorage.clear()`
- Reload page

**"Token expired"**
- User needs to login again
- Clear localStorage or logout

---

## Production Deployment

### Backend Deployment

1. Set `.env` variables:
```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
```

2. Run optimization:
```bash
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
```

3. Deploy using your preferred hosting service

### Frontend Deployment

1. Build for production:
```bash
npm run build
```

2. Deploy the `dist/` directory to your hosting service

---

## Testing

### Running Backend Tests

```bash
php artisan test
```

### Creating Tests

```bash
# Create a feature test
php artisan make:test FeatureName --feature

# Create a unit test
php artisan make:test UnitName --unit
```

---

## Contributing

When contributing to this project:

1. Follow the existing code style
2. Create feature branches: `git checkout -b feature/feature-name`
3. Commit messages should be descriptive
4. Test your changes before submitting a PR

---

## Next Steps

After setup, review:
- [API.md](./API.md) - Complete API documentation
- [MVC_ANALYSIS.md](./MVC_ANALYSIS.md) - Architecture analysis and next improvements

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API documentation in [API.md](./API.md)
3. Create an issue on the project repository

---

**Last Updated:** May 8, 2026  
**Version:** 1.0

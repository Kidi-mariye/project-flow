# Task Manager - Architecture Documentation

**Last Updated:** May 8, 2026  
**Version:** 1.0

---

## Overview

The Task Manager follows a **Model-View-Controller (MVC)** architectural pattern with clear separation of concerns between backend API and frontend UI.

### Stack
- **Backend:** Laravel 11+ (RESTful API)
- **Frontend:** React 19 (Single Page Application)
- **Authentication:** Laravel Sanctum (token-based)
- **Database:** SQLite/MySQL with Eloquent ORM
- **Communication:** JSON over HTTP/HTTPS (CORS-enabled)

---

## Backend Architecture

### 1. Models (M)

Located: `backend/app/Models/`

**Key Models:**
- **User** - Represents authenticated users with API token support
- **Task** - Represents individual tasks/projects with metadata
- **Category** - Represents task categories for organization

**Relationships:**
```
User (1) ─── (M) Tasks
User (1) ─── (M) Categories
Category (1) ─── (M) Tasks
```

### 2. Controllers (C)

Located: `backend/app/Http/Controllers/Api/`

**Key Controllers:**
- **AuthController** - Handles registration, login, logout
- **TaskController** - CRUD operations for tasks with filtering
- **CategoryController** - CRUD operations for categories
- **DashboardController** - Aggregated metrics and analytics

**Design Pattern:** RESTful resource controllers with:
- User-scoped queries (all results filtered by authenticated user)
- Eager loading to prevent N+1 queries
- Consistent error handling and validation

### 3. Validation (Form Requests)

Located: `backend/app/Http/Requests/`

All user input is validated using Laravel Form Requests:
- **RegisterRequest** - User registration validation
- **LoginRequest** - Login validation
- **StoreTaskRequest** - Task creation validation
- **UpdateTaskRequest** - Task update validation
- **StoreCategoryRequest** - Category creation validation
- **UpdateCategoryRequest** - Category update validation

### 4. Database (Models + Migrations)

Located: `backend/database/`

**Schema:**
- **users** - User accounts with authentication
- **tasks** - Task records with priorities, dates, reminders
- **categories** - User-defined categories for tasks
- **personal_access_tokens** - Sanctum token storage

**Key Features:**
- Cascade delete for user deletion (deletes all user's data)
- Null on delete for category deletion (tasks keep but category_id = null)
- Unique constraints (user_id + category_name for categories)
- Proper indexes for query performance

### 5. Routes

Located: `backend/routes/api.php`

**Structure:**
```
Public Routes:
  POST /auth/register
  POST /auth/login

Protected Routes (auth:sanctum):
  POST /auth/logout
  GET /user
  GET|POST /tasks
  GET|PUT|PATCH|DELETE /tasks/{id}
  GET|POST /categories
  GET|PUT|PATCH|DELETE /categories/{id}
  GET /dashboard/metrics
  POST /categories/seed-defaults
```

### 6. Middleware & Configuration

**CORS Middleware:**
- Configured in `bootstrap/app.php`
- Settings in `config/cors.php`
- Allows frontend localhost origins

**Authentication:**
- Uses Laravel Sanctum for token-based auth
- Configured in `config/sanctum.php`
- Stateful domains for session support

---

## Frontend Architecture

### 1. Pages

Located: `frontend/src/pages/`

**Key Pages:**
- **LoginPage** - User login interface
- **RegisterPage** - User registration interface
- **DashboardPage** - Main dashboard with metrics
- **TasksPage** - Task list and management
- **SettingsPage** - User settings and preferences

**Design:** Each page is a self-contained component handling its own state and API calls.

### 2. Components

Located: `frontend/src/components/`

**Key Components:**
- **ProtectedRoute** - Route guard for authenticated pages
- Future: TaskList, TaskForm, CategorySelector, etc. (to be created from decomposed App.jsx)

**Design:** Reusable, focused components with props-based configuration.

### 3. Contexts (State Management)

Located: `frontend/src/contexts/`

**AuthContext:**
- Centralized authentication state
- Provides: `isAuthenticated`, `currentUser`, `isLoading`, `error`
- Methods: `login()`, `register()`, `logout()`
- Auto-checks authentication on app mount

**Usage Pattern:**
```jsx
import { useAuth } from '../hooks/useAuth'

function MyComponent() {
  const { currentUser, isAuthenticated, logout } = useAuth()
  // ...
}
```

### 4. Custom Hooks

Located: `frontend/src/hooks/`

**useAuth:**
- Provides easy access to AuthContext
- Throws error if used outside AuthProvider

**Future hooks to extract:**
- `useFetch()` - Generic fetch wrapper with loading/error states
- `useTasks()` - Task CRUD operations
- `useCategories()` - Category operations
- `useLocalStorage()` - localStorage wrapper

### 5. Utilities

Located: `frontend/src/utils/`

**helpers.js:**
- `formatDateTime()` - Format dates for display
- `normalizeDateTimeForInput()` - Format dates for input fields
- `deriveReminderAt()` - Calculate reminder date
- `getApiErrorMessage()` - Extract user-friendly error messages
- `fileToDataUrl()` - Convert files to data URLs
- Profile image management functions
- Task status helpers

### 6. API Client

Located: `frontend/src/api.js`

**Structure:**
```javascript
// Authentication
loginUser(email, password)
registerUser(name, email, password)
logoutUser()
fetchCurrentUser()

// Tasks
fetchTasks()
fetchFilteredTasks(filters)
createTask(payload)
updateTask(taskId, payload)
deleteTask(taskId)

// Categories
fetchCategories()
seedDefaultCategories()

// Dashboard
fetchDashboardMetrics()

// Token Management
getStoredToken()
setStoredToken(token)
clearStoredToken()
authHeaders()
```

**Design:** Centralized API calls with automatic auth header injection.

### 7. Routing

Located: `frontend/src/main.jsx`

**Router Setup:**
- BrowserRouter for client-side routing
- Protected routes using ProtectedRoute component
- AuthProvider wraps entire app
- Routes:
  - `/login` - Login page
  - `/register` - Register page
  - `/dashboard` - Protected dashboard
  - `/tasks` - Protected tasks
  - `/settings` - Protected settings
  - `/` → redirects to `/dashboard`

---

## Data Flow

### Authentication Flow

```
1. User submits login/register form
   ↓
2. Frontend calls api.js function
   ↓
3. API call sent to backend endpoint
   ↓
4. Backend validates, creates/checks user
   ↓
5. Backend generates token and returns
   ↓
6. Frontend stores token in localStorage
   ↓
7. AuthContext updates state
   ↓
8. User redirected to dashboard
```

### Task Management Flow

```
1. User navigates to /tasks
   ↓
2. ProtectedRoute checks authentication
   ↓
3. TasksPage mounts and fetches tasks
   ↓
4. API call includes auth token
   ↓
5. Backend fetches user's tasks
   ↓
6. Frontend renders task list
   ↓
7. User performs CRUD operation
   ↓
8. Frontend updates local state + API
```

---

## Security Considerations

### Backend
- **Authentication:** Token-based via Sanctum
- **Authorization:** All queries scoped to authenticated user
- **Validation:** All inputs validated via Form Requests
- **CORS:** Restricted to frontend origins

### Frontend
- **Token Storage:** localStorage (consider httpOnly cookies for production)
- **Protected Routes:** Unauthenticated access redirects to login
- **Error Handling:** API errors caught and displayed safely

### Production Recommendations
- Use HTTPS only
- Implement rate limiting
- Add CSRF protection
- Consider httpOnly cookies for tokens
- Implement refresh token rotation
- Add request signing/verification

---

## Scalability Considerations

### Current Limitations
- No pagination for large datasets
- No caching strategy
- Settings only stored locally
- No real-time updates

### Future Improvements
1. **Pagination** - Add limit/offset to API endpoints
2. **Caching** - Implement Redis caching for metrics
3. **Real-time** - Add WebSocket support via Laravel Echo
4. **Queue Jobs** - Background task processing
5. **File Storage** - User avatars, exports, attachments
6. **API Versioning** - Support multiple API versions

---

## Performance Optimization

### Current Implementation
- ✅ Eager loading (with() in queries)
- ✅ Selective field loading
- ✅ Proper indexes on foreign keys
- ✅ Token-based auth (no session overhead)

### Potential Improvements
1. **Database Indexes** - Add indexes on frequently filtered columns
2. **Query Optimization** - Use query scopes for common filters
3. **Frontend Caching** - Implement React Query or SWR
4. **API Response Compression** - Enable gzip compression
5. **Asset Optimization** - Minify/compress JS, CSS, images

---

## Testing Strategy

### Backend Tests
- Unit tests for models and business logic
- Feature tests for API endpoints
- Test runner: PHPUnit

### Frontend Tests
- Component tests using Vitest
- Integration tests for user flows
- E2E tests using Playwright/Cypress

### Coverage Goals
- Backend: ≥ 80% coverage
- Frontend: ≥ 70% coverage

---

## Deployment Architecture

### Backend Deployment
```
1. Push to repository
2. CI/CD pipeline runs tests
3. Build artifact (composer install, optimizations)
4. Deploy to server
5. Run migrations
6. Clear cache
```

### Frontend Deployment
```
1. Push to repository
2. CI/CD pipeline runs tests & builds
3. `npm run build` creates dist/ folder
4. Deploy dist/ to CDN or static server
5. Configure API_BASE_URL for environment
```

### Suggested Platforms
- **Backend:** Laravel Forge, Heroku, AWS EC2, DigitalOcean
- **Frontend:** Vercel, Netlify, GitHub Pages, AWS S3 + CloudFront

---

## Directory Structure Explanation

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/     → API controllers
│   │   ├── Middleware/          → Request middleware
│   │   └── Requests/            → Form request validation
│   └── Models/                  → Eloquent models
├── config/                      → Configuration files
├── database/
│   ├── migrations/              → Database schemas
│   └── seeders/                 → Data seeding
├── routes/
│   ├── api.php                  → API routes (v1)
│   └── web.php                  → Web routes (minimal)
└── bootstrap/app.php            → App configuration

frontend/
├── src/
│   ├── pages/                   → Page components
│   ├── components/              → Reusable components
│   ├── contexts/                → React contexts
│   ├── hooks/                   → Custom hooks
│   ├── utils/                   → Utilities & helpers
│   ├── api.js                   → API client
│   └── main.jsx                 → Entry point
├── vite.config.js               → Vite configuration
└── .env.example                 → Environment template
```

---

## Development Workflow

### Adding a New Feature

1. **Backend:**
   - Create migration for database changes
   - Create/update model with relationships
   - Create/update controller with CRUD methods
   - Add form request for validation
   - Add routes in api.php
   - Test with API client (Postman, Insomnia)

2. **Frontend:**
   - Create API functions in api.js
   - Create component(s) for UI
   - Create page if needed
   - Add route in main.jsx
   - Implement state management (context/hooks)
   - Test functionality

3. **Testing:**
   - Write unit tests for backend logic
   - Write component tests for frontend
   - Manual testing through UI
   - Test on multiple browsers

---

## Monitoring & Logging

### Backend Logging
- Stack trace logging in `storage/logs/`
- Configured in `config/logging.php`
- Different channels: single, daily, slack, syslog

### Frontend Error Tracking
- Browser console logs
- Future: Sentry or similar error tracking
- User feedback mechanism

---

## Related Documents

- [API.md](./API.md) - Complete API endpoint documentation
- [SETUP.md](./SETUP.md) - Development setup guide
- [MVC_ANALYSIS.md](./MVC_ANALYSIS.md) - MVC implementation analysis

---

## Contributing

Follow the patterns established in this document when:
- Adding new API endpoints
- Creating new React components
- Modifying database schema
- Implementing new features

---

**Version History:**
- v1.0 (May 8, 2026) - Initial architecture documentation

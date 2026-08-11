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
MAIL_MAILER=log
MAIL_FROM_ADDRESS=hello@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

For production, replace `MAIL_MAILER=log` with a real mailer (SMTP or a provider)
and set `MAIL_FROM_ADDRESS` to a verified address. See [MAIL_PROVIDERS.md](./MAIL_PROVIDERS.md)
for the provider checklist.

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

### Docker Deployment (recommended)

> **Follow [DEPLOY.md](./DEPLOY.md)** for the full step-by-step server runbook
> (DNS, VPS setup, TLS via Caddy, email verification, backups, launch
> checklist). This section summarizes the configuration.

The repo ships a containerized setup (`backend/Dockerfile`,
`docker-compose.yml`, `.dockerignore`) that runs Nginx + PHP-FPM, the Laravel
scheduler, and a queue worker. The SPA is built **inside** the image, so a
`git pull` is all you need on the server.

**Requirements on the host:** Docker + Docker Compose plugin (any VPS or cloud
VM, e.g. DigitalOcean, Hetzner, Lightsail).

1. Clone the repo and create the environment file:
```bash
git clone <repo-url> && cd Task\ Manager
cp backend/.env.example backend/.env
```
2. Fill in production values in `backend/.env` (see "Backend Deployment"
   below for the full list). At minimum:
```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
APP_KEY=<run: php artisan key:generate --show and paste the output>
MAIL_MAILER=smtp        # real provider, see MAIL_PROVIDERS.md
MAIL_HOST=smtp.yourprovider.com
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=no-reply@yourdomain.com
SESSION_SECURE_COOKIE=true
APP_FORCE_HTTPS=true
TRUST_PROXIES=*
CORS_ALLOWED_ORIGINS=https://yourdomain.com
LOG_LEVEL=warning
LOG_CHANNEL=daily
```
   `APP_KEY` is not in the compose file on purpose: if it is missing, the
   container generates one and persists it in the shared storage volume.

3. Start the stack:
```bash
docker compose up -d --build
```
   First boot runs `php artisan migrate --force` automatically and builds the
   Laravel caches. On subsequent starts nothing is re-migrated.

4. Terminate TLS: put Caddy / a load balancer / Cloudflare in front and point
   it at port 80, or bind port 443 and terminate in Nginx. Set `APP_URL` and
   `CORS_ALLOWED_ORIGINS` to the final `https://` origin.

5. Verify:
```bash
curl -i https://yourdomain.com/up          # expect 200
./deploy/smoke-test.sh https://yourdomain.com
```

**Update an existing deployment:**
```bash
git pull && docker compose up -d --build --pull always
```

**Use the pre-built image instead of building on the server:** set
`APP_IMAGE` in a `docker-compose.env` or exported shell variable to the
pushed GHCR image, e.g. `APP_IMAGE=ghcr.io/yourorg/task-manager:latest`.

### Backend Deployment

1. Set `.env` variables:
```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
APP_NAME="Task Manager"
```

2. Harden the production `.env`. Every item below is optional but strongly
   recommended:
```
# Secure cookies + HTTPS
SESSION_SECURE_COOKIE=true
APP_FORCE_HTTPS=true
TRUST_PROXIES=*            # or comma-separated proxy IPs/CIDRs (e.g. your load balancer / CDN)

# CORS: only the origin(s) your frontend is served from. Comma-separated.
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Logging: warning+ only. `debug` leaks internals in production.
LOG_LEVEL=warning
LOG_CHANNEL=daily
```
   - `APP_FORCE_HTTPS` redirects HTTP to HTTPS and adds an HSTS header.
   - `TRUST_PROXIES` tells Laravel to honor `X-Forwarded-Proto`/`X-Forwarded-For`
     from your proxy, so HTTPS detection and client IPs are correct behind a
     load balancer, reverse proxy, or CDN.
   - `SESSION_SECURE_COOKIE` only sends the session cookie over HTTPS.
   - Leave `CORS_ALLOWED_ORIGINS` unset in local development (the default
     localhost origins in `config/cors.php` are used).

3. Configure a real mail provider so 2FA codes and task reminders are actually
   delivered (see [MAIL_PROVIDERS.md](./MAIL_PROVIDERS.md)):
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.yourprovider.com
MAIL_PORT=587
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@yourdomain.com
```

4. Run optimization:
```bash
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
```

5. Deploy using your preferred hosting service

6. Add a cron entry so scheduled tasks (email/database reminders, nightly
   backups) run every minute. Without this, reminders are never sent:
```bash
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```
   On shared hosting, add this as a cron job in your host's control panel
   (point it at the backend directory). The scheduler runs the reminders
   every minute and a database backup daily at 02:00 (see `routes/console.php`).

7. Verify email delivery (see [MAIL_PROVIDERS.md](./MAIL_PROVIDERS.md)):
```bash
php artisan tinker --execute="Mail::raw('Mail provider check', function (\$m) { \$m->to('you@example.com'); });"
```

### Frontend Deployment

1. Build for production. The build output is written into `backend/public/`
   so Laravel serves the SPA directly (no separate static host needed):
```bash
cd frontend
npm run build
```

2. Serve the backend with your web server pointing its document root at
   `backend/public/`. The SPA routes and `/api/*` both work from that root;
   client-side routes (e.g. `/dashboard`) are handled by
   `backend/routes/web.php`.

3. If you deploy the frontend to a separate static host instead, set
   `VITE_API_BASE_URL` to the API URL before building.

### CI/CD (GitHub Actions)

`.github/workflows/deploy.yml` runs on pushes to `main`:

1. **test** — installs backend deps, runs `php artisan test` (in-memory SQLite),
   installs frontend deps, and verifies `npm run build`.
2. **docker** — builds the image and pushes it to GHCR as
   `ghcr.io/<owner>/<repo>:latest` (and `:<sha>`).
3. **deploy** *(optional)* — SSH deploys to your server, then runs the smoke
   test. Enable it by adding repository secrets:
   - `DEPLOY_HOST` — `user@server.example.com` (setting this enables the job)
   - `DEPLOY_SSH_KEY` — private SSH key the server trusts
   - `DEPLOY_DIR` — path to the checked-out repo on the server
   - `DEPLOY_BASE_URL` — public URL to smoke test (e.g. `https://yourdomain.com`)

The server uses `APP_IMAGE` to pull the pushed image instead of building:
```bash
export APP_IMAGE=ghcr.io/<owner>/<repo>:latest
docker compose up -d --pull always
```
> **Note:** GHCR images are private to your account by default. After the first
> push, either grant the server `read` access in the package settings or run
> `docker login ghcr.io` on the server with a token that can read packages.

### Backups

The scheduler creates a database + file backup every night at 02:00 and keeps
the last 30 (`app:backup --prune=30`). Backups are written to
`backend/storage/app/backups/<timestamp>/` and contain:
- `database.sqlite` (plus `-wal`/`-shm` sidecars for a crash-consistent copy)
- `.env`
- `storage/app/private` and `storage/app/public` (uploaded files)

Run a backup manually at any time:
```bash
php artisan app:backup
```

Copy the `backups` directory off the server periodically (off-site backup).
To restore: replace `database.sqlite` while the app is stopped, then
`php artisan migrate --force` and `php artisan config:clear`.

### Monitoring & Health

- **HTTP health check:** `GET /up` returns `200` when the app can serve
  requests. Point an uptime monitor (UptimeRobot, Better Stack, etc.) at it.
- **CLI health check:** `php artisan app:health` verifies the database is
  reachable and storage is writable; exits `0` on success, `1` on failure
  (usable from cron/monitoring scripts).
- **Logs:** check `backend/storage/logs/laravel.log` (rotate with
  `LOG_CHANNEL=daily`, which keeps 14 days by default).
- **Security notes:**
  - Rate limits are applied to all auth endpoints
    (`auth-login` 10/min, `auth-register` 5/hour, `auth-challenge` and
    `auth-reset` 5/min per IP) — see `AppServiceProvider::boot()`.
  - Password reset codes expire after 30 minutes; submitting a valid reset
    revokes all existing API tokens for that account.
  - Keep `APP_DEBUG=false` and a strong `APP_KEY` in production.

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
- [DEPLOY.md](./DEPLOY.md) - Production deployment runbook (DNS, VPS, TLS, backups)
- [API.md](./API.md) - Complete API documentation
- [MVC_ANALYSIS.md](./MVC_ANALYSIS.md) - Architecture analysis and next improvements
- [MAIL_PROVIDERS.md](./MAIL_PROVIDERS.md) - Mail provider checklist (required before production)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API documentation in [API.md](./API.md)
3. Create an issue on the project repository

---

**Last Updated:** August 11, 2026  
**Version:** 1.0

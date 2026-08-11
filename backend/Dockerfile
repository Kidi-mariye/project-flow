# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: build the React frontend. `vite build` writes into ../backend/public
# (see frontend/vite.config.js), which is then copied into the runtime image.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS frontend

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
RUN npm run build


# ---------------------------------------------------------------------------
# Stage 2: PHP-FPM runtime for the Laravel backend.
# ---------------------------------------------------------------------------
FROM php:8.3-fpm-alpine

# pdo_sqlite + sqlite3 are compiled into the official image; add opcache.
RUN docker-php-ext-install opcache

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# App
WORKDIR /var/www/backend
COPY backend/ .

# Built SPA from stage 1 (overlays index.html + hashed assets onto backend/public)
COPY --from=frontend /app/backend/public ./public

# Dependencies (no dev deps, optimized autoloader)
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Minimal opcache config tuned for Laravel
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.enable_cli=0'; \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.validate_timestamps=0'; \
    echo 'opcache.jit=tracing'; \
    echo 'opcache.jit_buffer_size=32M'; \
  } > /usr/local/etc/php/conf.d/opcache.ini

# PHP-FPM listens on this port; Nginx talks to it over the compose network.
EXPOSE 9000

COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD ["php-fpm"]

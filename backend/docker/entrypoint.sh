#!/bin/sh
set -e

# Prepare runtime directories (storage is a fresh named volume at first boot).
mkdir -p storage/logs \
         storage/framework/cache/data \
         storage/framework/sessions \
         storage/framework/views \
         storage/app/backups \
         bootstrap/cache

# Use a persisted APP_KEY so all containers share the same encryption key.
# Prefer the one from the environment (backend/.env via compose env_file);
# otherwise generate once and store it in the shared storage volume.
if [ -z "${APP_KEY:-}" ] || [ "$APP_KEY" = "base64:" ] || [ "$APP_KEY" = "None" ]; then
    KEY_FILE=/var/www/backend/storage/.docker-app-key
    if [ -f "$KEY_FILE" ]; then
        APP_KEY=$(cat "$KEY_FILE")
    else
        APP_KEY=$(php artisan key:generate --show --force)
        printf '%s' "$APP_KEY" > "$KEY_FILE"
    fi
    export APP_KEY
fi

# Apply migrations once (the lock file lives in the shared storage volume so
# concurrent containers don't double-run migrations).
MIGRATE_LOCK=/var/www/backend/storage/.migrated.lock
if [ ! -f "$MIGRATE_LOCK" ]; then
    php artisan migrate --force
    touch "$MIGRATE_LOCK"
fi

# Build the runtime caches (`optimize` caches config + routes + events + views).
if ! php artisan optimize --quiet; then
    php artisan config:cache --quiet
    php artisan route:cache --quiet
fi

# Run the process this container was started for (php-fpm, schedule:work,
# queue:work, or a one-off artisan command).
exec "$@"

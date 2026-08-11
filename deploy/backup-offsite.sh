#!/usr/bin/env bash
# Pull the app's nightly backups off the server to a local/off-site directory.
# The app writes backups to storage/app/backups inside the app_storage volume.
#
# Usage:
#   DEPLOY_HOST=user@server DEPLOY_DIR=/opt/task-manager \
#     DEST_DIR=~/task-manager-backups ./deploy/backup-offsite.sh
#
# You can run this from cron on any machine that has SSH access, e.g. every
# morning at 03:30 after the server's 02:00 backup:
#   30 3 * * * DEPLOY_HOST=... DEPLOY_DIR=... DEST_DIR=... /path/to/backup-offsite.sh
set -euo pipefail

HOST="${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. user@server.example.com}"
DIR="${DEPLOY_DIR:?Set DEPLOY_DIR, e.g. /opt/task-manager}"
DEST="${DEST_DIR:?Set DEST_DIR, e.g. ~/task-manager-backups}"
STAMP="$(date +%F-%H%M)"
OUT="$DEST/backups-$STAMP.tar.gz"

mkdir -p "$DEST"

echo ">> Pulling backups from ${HOST} to ${OUT}"
# Stream a tarball of storage/app/backups out of the running app container.
ssh -o StrictHostKeyChecking=accept-new "$HOST" \
  "cd '$DIR' && docker compose exec -T app tar -C storage/app/backups -czf - ." > "$OUT"

# Keep the last 30 off-site archives (portable across GNU and BSD coreutils).
ls -1t "$DEST"/backups-*.tar.gz 2>/dev/null | tail -n +31 | while read -r f; do rm -f "$f"; done

echo ">> Done. Latest archive: $OUT"

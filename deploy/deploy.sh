#!/usr/bin/env bash
# Deploy to a server over SSH (the manual alternative to the GitHub Actions
# deploy job). Requires the repo to be checked out at DEPLOY_DIR.
#
# Usage:
#   DEPLOY_HOST=user@server DEPLOY_DIR=/opt/task-manager ./deploy/deploy.sh
set -euo pipefail

HOST="${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. user@server.example.com}"
DIR="${DEPLOY_DIR:?Set DEPLOY_DIR, e.g. /opt/task-manager}"
URL="${DEPLOY_BASE_URL:-}"

echo ">> Deploying to ${HOST}:${DIR}"

ssh -o StrictHostKeyChecking=accept-new "$HOST" "cd '$DIR' && \
  git pull --ff-only && \
  docker compose up -d --build --pull always --remove-orphans && \
  docker image prune -f"

if [ -n "$URL" ]; then
  echo ">> Smoke testing $URL"
  "$(dirname "$0")/smoke-test.sh" "$URL"
fi

echo ">> Deploy complete."

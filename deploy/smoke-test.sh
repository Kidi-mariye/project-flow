#!/usr/bin/env bash
# Smoke test a deployed instance. Usage: ./deploy/smoke-test.sh [BASE_URL]
# Defaults to http://localhost.
set -uo pipefail

BASE_URL="${1:-http://localhost}"
FAILED=0

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    printf '  OK  %-28s (HTTP %s)\n' "$label" "$actual"
  else
    printf 'FAIL  %-28s (HTTP %s, expected %s)\n' "$label" "$actual" "$expected"
    FAILED=1
  fi
}

echo "Smoke testing ${BASE_URL}"

check "/up (health)" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/up")"
check "/ (SPA)" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/")"
check "/privacy" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/privacy")"
check "/terms" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/terms")"

# SPA index is served for client-side routes.
if curl -s "$BASE_URL/dashboard" | grep -q '<div id="root">'; then
  printf '  OK  %-28s\n' "/dashboard (SPA fallback)"
else
  printf 'FAIL  %-28s\n' "/dashboard (SPA fallback)"
  FAILED=1
fi

# Unknown API paths must return 404 JSON, not the SPA.
body="$(curl -s -H 'Accept: application/json' "$BASE_URL/api/nonexistent")"
if printf '%s' "$body" | grep -q '<div id="root">'; then
  printf 'FAIL  %-28s (SPA HTML leaked for unknown API path)\n' "/api/* 404"
  FAILED=1
else
  printf '  OK  %-28s (no SPA leak)\n' "/api/* 404"
fi

if [ "$FAILED" -eq 0 ]; then
  echo "All checks passed."
else
  echo "Some checks failed."
  exit 1
fi

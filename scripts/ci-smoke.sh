#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

: "${ADMIN_EMAIL:?ADMIN_EMAIL is required}"
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}"

PORT="${PORT:-3100}"
BASE="http://127.0.0.1:${PORT}/api/v1"
COOKIE_JAR="$(mktemp)"
LOG_FILE="$(mktemp)"
SERVER_PID=""

cleanup() {
  local status=$?
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  if [[ "$status" -ne 0 && -s "$LOG_FILE" ]]; then
    cat "$LOG_FILE" >&2
  fi
  rm -f "$COOKIE_JAR" "$LOG_FILE"
  return "$status"
}
trap cleanup EXIT

if ! curl -fsS "$BASE/health" >/dev/null 2>&1; then
  (
    cd apps/api
    node dist/server.js >"$LOG_FILE" 2>&1
  ) &
  SERVER_PID=$!
fi

for _ in $(seq 1 30); do
  if curl -fsS "$BASE/health" >/dev/null 2>&1; then break; fi
  sleep 0.5
done

curl -fsS "$BASE/health" >/dev/null
curl -fsS "$BASE/readiness" >/dev/null
curl -fsS -c "$COOKIE_JAR" -H 'Content-Type: application/json' \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
  "$BASE/auth/login" | grep -q '"user"'

curl -fsS -H 'Content-Type: application/json' \
  -d '{"submissionId":"00000000-0000-4000-8000-000000000001","name":"CI User","phone":"+375290000000","email":"ci@example.com","message":"Smoke test","consent":true}' \
  "$BASE/applications" | grep -q '"success":true'

curl -fsS -b "$COOKIE_JAR" "$BASE/admin/applications?page=1&pageSize=10" | grep -q 'CI User'
curl -fsS "http://127.0.0.1:${PORT}/" | grep -q '<title>Агромилк'

echo "Smoke test passed"

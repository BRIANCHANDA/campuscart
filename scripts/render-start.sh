#!/bin/sh
# Boots the single-service deployment: migrate, start the API on loopback,
# then hand the foreground to Caddy (which binds Render's $PORT).
set -e

echo "→ applying migrations"
bun run --filter @campuscart/api db:migrate

echo "→ starting API on 127.0.0.1:${API_PORT:-3000}"
PORT="${API_PORT:-3000}" bun run apps/api/src/index.ts &
API_PID=$!

# Caddy would happily keep serving a 502 if the API died, and the platform
# would see a healthy process. Take the whole container down instead so the
# health check fails and the platform restarts it.
trap 'kill -TERM "$API_PID" 2>/dev/null; exit 0' TERM INT
(
	wait "$API_PID"
	echo "✗ API exited — stopping container"
	kill -TERM 1 2>/dev/null
) &

echo "→ starting Caddy on :${PORT:-8080}"
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile

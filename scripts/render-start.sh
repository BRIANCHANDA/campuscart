#!/bin/sh
# Boots the single-service deployment: migrate, start the API on loopback,
# then hand the foreground to Caddy (which binds Render's $PORT).
set -e

# drizzle-kit's own failure for a missing URL is "[x] url: undefined", which
# gives no hint that the cause is an unset service variable. Say it plainly.
if [ -z "$DATABASE_URL" ]; then
	echo "✗ DATABASE_URL is not set."
	echo "  On Render this is wired automatically by render.yaml, but ONLY when the"
	echo "  service is created via New → Blueprint. A service created through"
	echo "  New → Web Service ignores render.yaml: no database is attached, and it"
	echo "  builds ./Dockerfile instead of ./Dockerfile.render."
	echo "  Fix: delete the service and re-create it from the Blueprint."
	exit 1
fi

# The API's own preflight exits on a weak secret, but its message doesn't say
# where the value came from. render.yaml uses generateValue, so if that ever
# yields something short this is the first place it shows up.
SECRET_LEN=$(printf %s "${JWT_SECRET:-}" | wc -c | tr -d ' ')
if [ -z "${JWT_SECRET:-}" ] || [ "$SECRET_LEN" -lt 32 ]; then
	echo "✗ JWT_SECRET is missing or too short (${SECRET_LEN} chars, need >= 32)."
	echo "  Set it on the service: Environment → JWT_SECRET → openssl rand -base64 48"
	exit 1
fi
case "$JWT_SECRET" in
*change-me*)
	echo "✗ JWT_SECRET is the repo placeholder — the API refuses to start on it."
	echo "  Set a real one: Environment → JWT_SECRET → openssl rand -base64 48"
	exit 1
	;;
esac

echo "→ config ok (secret ${SECRET_LEN} chars, port ${PORT:-8080})"
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

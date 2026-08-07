# CampusCart — Deploying for client testing

Backend on Railway, Android app via EAS. **Order matters:** the API URL is
compiled into the native binary, so the backend must be live and its URL known
before the app is built.

---

## 1. Backend → Railway

Railway builds straight from the GitHub repo — no CLI needed.

1. **New Project → Deploy from GitHub repo** → `BRIANCHANDA/campuscart`.
   `railway.json` selects the Dockerfile and health-checks `/health`.
2. **Add a Postgres database** to the project (`+ New → Database → Postgres`).
   Railway injects `DATABASE_URL` automatically.
3. **Set variables** on the API service:

   | Variable | Value |
   |---|---|
   | `JWT_SECRET` | `openssl rand -base64 48` — **not** the repo placeholder |
   | `NODE_ENV` | `production` |

   Leave every payment/delivery key unset. Empty ⇒ mock providers, so no real
   money can move during testing. `PORT` is injected by Railway and read
   automatically.
4. **Generate a domain** (Settings → Networking → Generate Domain) →
   `https://<name>.up.railway.app`.

Migrations run on every boot (idempotent), so there's no release step.

Verify:

```bash
curl https://<name>.up.railway.app/health
# {"ok":true,"payments":{"airtelMoney":"mock","mtnMomo":"mock"}}
```

`mock` for both wallets is the safety check — confirm it before sharing anything.

### Seeding demo data

Registration only self-serves shopper and courier roles, so the first platform
admin must be inserted directly. From the repo, against Railway's public
database URL:

```bash
DATABASE_URL='<railway postgres public url>' \
API_BASE_URL='https://<name>.up.railway.app' \
bun run apps/api/scripts/seed.ts
```

Idempotent — safe to re-run. Creates three shops, 13 products, a verified
courier, and four demo accounts (all password `preview-pass-1`).

⚠️ Those are known-password accounts on a public URL. Fine for a client demo,
not for anything beyond it.

---

## 2. Android app → EAS

Set the backend URL first — `apps/mobile/eas.json`, `preview.env`:

```json
"EXPO_PUBLIC_API_URL": "https://<name>.up.railway.app"
```

No trailing slash. Then:

```bash
cd apps/mobile
eas build --platform android --profile preview
```

`preview` produces an **APK** with `distribution: internal`, so EAS returns a
shareable install link — your client opens it on an Android phone, allows
"install from unknown sources", done. No Play Store, no account needed.

First run will prompt to create an EAS project and generate a keystore; accept
the defaults.

### Maps

`apps/mobile/app.json` → `android.config.googleMaps.apiKey` is **empty**. The
tracking screen's map renders as a blank grey tile until you paste a key from
Google Cloud Console (enable *Maps SDK for Android*). Everything else — live
status, the stepper, courier updates — works without it.

### If the build fails on the monorepo

This is a Bun workspace; EAS occasionally needs the workspace root uploaded.
If module resolution fails, build from the repo root instead:

```bash
eas build --platform android --profile preview --local
```

or add an `.easignore` excluding `node_modules`, `apps/admin`, and
`apps/mobile/dist`.

---

## 3. Rebuild triggers

The backend URL is **compiled in**. Rebuild the app whenever it changes —
Railway domain changes, a move to a custom domain, or switching environments.
Backend-only changes just redeploy on Railway; the app needs nothing.

---

## Alternative: single-host demo (no Railway, no EAS)

The web build in one container stack, useful for a quick look:

```bash
docker compose -f docker-compose.demo.yml up -d --build
cloudflared tunnel --url http://localhost:8080
```

Serves the app and API on one origin and prints a public URL. Your machine must
stay on, the URL dies with the tunnel, and **maps don't render on web**.

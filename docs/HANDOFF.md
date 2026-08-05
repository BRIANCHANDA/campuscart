# CampusCart — Handoff & Polishing Checklist

Everything in the delivery plan is built and tested. This document is the
honest ledger of what was **not verifiable in the build environment** and
what deserves polish. It is written for the next session (Claude Code or a
human) to work through top-to-bottom.

## 1. Things that could not be verified here (highest priority)

These are correct-by-construction against public documentation but were never
run against the real external system:

- [ ] **Yango endpoint paths + webhook field names.** The client
  (`services/delivery/yango.ts`) follows the B2B cargo-claims style, but Yango
  issues region/contract-specific docs with credentials. Verify
  check-price/create/info/cancel paths and the webhook status vocabulary
  (`YANGO_STATUS_MAP` in `routes/webhooks.ts`).
- [ ] **MoMo production specifics.** `MOMO_TARGET_ENVIRONMENT` (`mtnzambia`?),
  the production base URL, and the exact callback body shape (the code
  correlates on `externalId` — confirm it is echoed as implemented).
- [ ] **Airtel production host and callback signature header name.** The code
  reads `X-Auth-Signature` / `X-Signature` — confirm against the portal.
- [ ] **Expo build with react-native-maps.** The dependency is declared and
  the tracking-screen code typechecks, but no native build ran here. Expo Go
  should render it; an EAS build needs the usual Android `apiKey` config for
  Google Maps (`app.json → android.config.googleMaps.apiKey`).
- [ ] **The mobile app on a real device.** Still unverified natively, but the
  app has now been driven end-to-end on `expo start --web` (headless Chromium):
  guest feed → shops → sign-in → product detail → add to cart → cart →
  checkout surface → orders. Every screen rendered with **zero console
  errors**. Native-only concerns remain open: keyboard behavior on the forms,
  `react-native-maps` on the tracking screen, and safe-area insets.
  `bun run db:seed` loads a realistic 3-shop / 13-product campus catalog.

## 2. Known simplifications to revisit

- [x] ~~**Cart discovery.**~~ Done. `GET /cart/active` returns the shopper's
  pending cart (most recent when several shops are in play) or `null`; the app
  restores it whenever a shopper session begins. Confirmed live beforehand —
  a signed-in shopper with a K90 server-side cart saw "Your cart is empty" on
  a fresh launch. Covered in `integration.checkout-dispatch.test.ts` (restore
  + null-after-checkout).
- [x] ~~**Platform shop onboarding from mobile**~~ Obsolete. Platform admin
  moved to the web console; the mobile screen is now just a pointer to it.
  The console's shop form does the whole job: attach an existing owner by
  email (`adminEmail` → resolved and promoted server-side, failing whole on a
  typo), or provision a brand-new owner account inline.
- [x] ~~**Shop pickup coordinates**~~ Done. `location` is now required on
  shop creation and validated by `PlacedCoordinatesSchema`, which rejects
  (0,0) — a real lat/lng in the Gulf of Guinea, ~2,500km from Zambia, and
  exactly what the old `?? 0` default produced. Left unchecked it silently
  skewed delivery-fee quotes and proximity-based courier assignment rather
  than failing. Updates are held to the same rule; reads stay permissive so
  pre-existing shops still deserialize. The console marks the fields required
  and explains the rejection instead of surfacing a raw 400.
- [x] ~~**Refresh-token persistence on mobile.**~~ Done. `expo-secure-store`
  (Keychain/Keystore) holds the refresh token; `restoreSession()` re-mints an
  access token on launch and rehydrates the user behind a splash gate, so the
  guest UI never flashes. Rotation writes through, and a revoked token is
  cleared rather than retried (reuse revokes the family server-side). Web
  preview falls back to localStorage — `expo start --web` only.
  Verified in-browser: session survives reload, token rotates, a poisoned
  token degrades to guest without crashing.
- [x] ~~**WS reconnect**~~ Done. The tracking socket reconnects with
  exponential backoff and full jitter (1s base, 20s cap — under the 30s poll
  interval so both channels are never idle together). A successful open resets
  the backoff; the poll still carries the screen while the socket is down.
  Jitter matters here: a campus wifi drop hits many clients at once, and
  identical backoffs would reconnect in lockstep.
- [x] ~~**Idempotency-key storage**~~ Done. `startIdempotencySweeper` runs
  hourly in-process (and once at boot, to clear what accumulated during
  downtime), dropping records past `IDEMPOTENCY_RETENTION_HOURS` (default 48).
  The DELETE is idempotent, so every replica running it concurrently is safe.
  Covered by `idempotency-sweep.test.ts` (stale gone, fresh and just-inside-
  the-window kept, empty sweep is a no-op).
- [ ] **Rate limiter body read**: `keyFrom` parses the JSON body in
  middleware; Hono caches it, but confirm no route downstream needs the raw
  stream (webhooks are outside the limiter, so currently safe).

## 3. Nice-to-haves (post-pilot)

- [ ] Reconciliation cron: poll `fetchStatus` for payments stuck `pending`
  beyond N minutes (MoMo helper already exists).
- [ ] Automated payout schedules (weekly settle-all) on top of the manual
  settle endpoint.
- [ ] Shop analytics (order volume, top products) — the ledger and
  order_events tables already contain the data.
- [ ] Push notifications (Expo notifications) mirroring the realtime frames.
- [ ] Web storefront (the OpenAPI spec at `/docs` is the contract).

## 4. How to verify a change quickly

```bash
for d in packages/shared apps/api apps/mobile; do (cd $d && bunx tsc --noEmit); done
TEST_DATABASE_URL=postgres://campuscart:campuscart@localhost:5432/campuscart \
TEST_REDIS_URL=redis://localhost:6379 \
bun test
```

49+ tests should pass; the suite is deterministic on a dirty database and
safe to re-run. The full happy path (checkout → dispatch → deliver → settle)
is `test/integration.checkout-dispatch.test.ts` — if a refactor breaks
anything important, it breaks there first.

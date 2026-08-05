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
- [ ] **Platform shop onboarding from mobile** creates the shop without an
  admin (the API supports `adminUserId`, the screen doesn't collect it — needs
  a user search/picker). Promotion currently happens via API/console.
- [ ] **Shop pickup coordinates** default to 0,0 unless set; the platform
  create-shop flow should collect them (they feed delivery-fee estimates and
  proximity assignment).
- [ ] **Refresh-token persistence on mobile.** Tokens live in memory; add
  `expo-secure-store` so sessions survive app restarts.
- [ ] **WS reconnect** is "fall back to polling"; add exponential-backoff
  reconnection for long tracking sessions.
- [ ] **Idempotency-key storage** has no TTL cleanup job; add a nightly
  `DELETE … WHERE created_at < now() - interval '48 hours'`.
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

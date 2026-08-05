# CampusCart

Multi-tenant campus shopping & delivery platform: student shoppers ↔ campus shops ↔ student couriers, with delivery dispatch via the **Yango API**.

**Stack:** Bun · TypeScript (strict) · Hono · Zod → OpenAPI (`@hono/zod-openapi`) · Drizzle ORM · PostgreSQL · JWT + RBAC · React Native (Expo).

**Documentation:** [docs/PROJECT.md](docs/PROJECT.md) (the problem we're solving, stakeholders, success criteria) · [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (system design, data model, flows) · [docs/OPERATIONS.md](docs/OPERATIONS.md) (env reference, deployment, provider onboarding, runbooks) · [docs/HANDOFF.md](docs/HANDOFF.md) (verification caveats + polishing checklist).

## Monorepo layout

```
apps/
  api/        Hono backend (OpenAPI docs served at /docs)
  mobile/     React Native (Expo) app
packages/
  shared/     Zod schemas + order state machine — the single source of truth
              for types, imported by BOTH the API and the mobile app
```

End-to-end type safety: **Drizzle schema → Zod/Hono routes → shared types → RN client.** The mobile client parses every response with the same Zod schemas the server validated with, so contract drift fails loudly.

## Getting started

```bash
bun install
docker compose up -d               # Postgres 16
cp .env.example .env               # fill in JWT_SECRET (32+ chars)
bun run db:generate && bun run db:migrate
bun run dev:api                    # http://localhost:3000/docs
bun test                           # state machine + provider contract tests
bun run test:integration           # full HTTP happy path against the docker Postgres
```

Mobile: `cd apps/mobile && bun run start` (set `EXPO_PUBLIC_API_URL` to your machine's LAN IP for a real device).

## Architecture decisions

**Order pipeline as an explicit state machine** — `packages/shared/src/order-state-machine.ts` defines every legal transition, which roles may perform it, and which fulfillment type it applies to. `OrderPipeline.transition()` is the *only* code path that mutates `orders.status`, uses an optimistic lock (`WHERE status = <expected>`), and writes an append-only `order_events` audit row.

```
delivery: placed → preparing → out_for_delivery → delivered
pickup:   placed → preparing → ready_for_pickup → completed
cancel:   from placed (shopper/shop) or preparing (shop only)
```

**Auth hardening** — access JWTs are short-lived; opaque refresh tokens (SHA-256 hashed at rest) rotate on every `POST /auth/refresh`, and presenting an already-rotated token is treated as theft: the whole token family is revoked and the user must sign in again. `POST /auth/logout` revokes server-side. Login/register/refresh sit behind a rate limiter keyed by IP + target account, built on a store interface: in-memory sliding window by default, Redis fixed-window (one counter shared by every replica) when `REDIS_URL` is set.

**Realtime** — a WebSocket gateway at `GET /ws?token=<JWT>` lets clients subscribe per order (access-checked against the same rules as REST) and receive `order.status`, `delivery.update`, and `payment.update` frames. Publishers (the order pipeline, courier location pushes, the Yango and payment webhooks) emit onto the event bus (`lib/events.ts`) — in-process by default, mirrored across API replicas via Redis pub/sub (with an instance-id loopback guard for exactly-once local delivery) when `REDIS_URL` is set. The mobile tracking screen is WebSocket-first with a slow HTTP poll as fallback, and renders a live map (shop, dropoff, and moving courier pins).

**Courier assignment** — dispatch picks the nearest available verified courier to the shop's pickup point (haversine over each courier's last reported position, refreshed on every location push). Positions older than 15 minutes are treated as unknown, and unlocated couriers rank behind located ones — so the strategy degrades gracefully to first-available.

**Tenant isolation** — shop-admin routes sit behind `requireShopOwnership` (the `:shopId` in the path must appear in the admin's JWT `shopIds` claim), and every query still filters by `shop_id` at the query layer. Client-supplied shop IDs are never trusted.

**Yango integration** — all dispatch calls go through the `DeliveryProvider` interface (`services/delivery/provider.ts`). `YangoClient` implements it against Yango's B2B claims-style API (API key + Clid from env, server-side only); `MockDeliveryProvider` backs tests and local dev. On dispatch, the pipeline creates a Yango request and persists `deliveries.yango_request_id` + `deliveries.courier_id` — Yango handles dispatch/tracking, while courier identity, verification, and payouts stay in our DB. A push-based status webhook (`POST /webhooks/yango`, shared-secret protected via `YANGO_WEBHOOK_SECRET`) syncs claim status changes into the delivery lifecycle idempotently, so duplicate events or a courier who already tapped "complete" in-app can't double-apply a transition. ⚠️ Verify exact endpoint paths and webhook field names against the partner docs issued with your credentials; Yango revises them per region/contract.

**Payments — mobile money (Airtel & MTN).** Shoppers pick **Airtel Money** or **MTN MoMo** at checkout and enter their wallet number; the API's payment **gateway** (`services/payments/gateway.ts`) routes each order to that wallet's provider. A wallet goes **live the moment its keys are present** in `.env` — until then it transparently uses a mock that auto-approves, so demos and local dev work with zero config. **MTN MoMo** implements Collections request-to-pay: cached OAuth token, `X-Reference-Id` UUID as our providerRef, `externalId` round-tripping through the callback for correlation (defense: only pre-existing providerRefs can settle), a poll fallback for reconciliation, and refunds via the Disbursements product. **Airtel Money** implements the merchant push payment: client-credentials OAuth, national MSISDN, `transaction.id` as providerRef, `TS`/`TF` callback mapping, optional HMAC verification via `AIRTEL_CALLBACK_SECRET`. Both convert ngwee → kwacha at the provider boundary (their APIs take major units); everywhere else stays integer minor units. Each wallet posts to its own webhook path — `POST /webhooks/payments/mtn` and `/webhooks/payments/airtel` — which settle the payment and push a `payment.update` frame over the realtime gateway so the app learns the outcome of the out-of-band approval. (Stripe remains available for cards.)

**Going live with payments (this is the only remaining step):** fill the MTN and/or Airtel keys in `.env` (see `.env.example` for the exact variables + portal links), register each provider's callback URL in its developer portal pointing at the paths above, and confirm the production host + target environment (e.g. MTN `mtnzambia`). No code changes required — `GET /health` and the boot logs report each wallet as `live` or `mock`.

**Three-way money flow** — every order writes `payout_ledger` entries: `shop_sale` (subtotal minus 8% platform fee), `platform_fee`, and `courier_payout` (added at dispatch, settled separately from shop money).

**Idempotency** — `POST /checkout` requires an `Idempotency-Key` header; `(key, user, endpoint)` replays the stored response instead of re-charging (`lib/idempotency.ts`).

**Errors** — one shape everywhere: `{ error: { code, message, details? } }`, produced by `AppError` + the global error hook. Zod validation failures map to `VALIDATION_ERROR` in the same shape.

## API surface (browsable at /docs)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| Catalog (public) | `GET /shops`, `GET /products` (search/filter/pagination across all shops) |
| Cart (shopper) | `POST /cart/items`, `GET /cart/:id`, `PATCH /cart/:id/items/:itemId` |
| Checkout | `POST /checkout` (idempotent) |
| Orders (shopper) | `GET /orders`, `GET /orders/:id`, `GET /orders/:id/tracking` |
| Shop admin | `GET /admin/shops` (my shops), `GET/POST/PATCH /admin/shops/:shopId/products`, `GET /admin/shops/:shopId/orders`, `PATCH …/orders/:orderId/status`, `POST …/orders/:orderId/dispatch` |
| Courier | `POST /courier/profile`, `PATCH /courier/availability`, `GET /courier/jobs`, `GET /courier/deliveries`, `POST /courier/deliveries/:id/{location,pickup,complete}`, `GET /courier/payouts` |
| Platform admin | `POST /platform/shops`, `GET /platform/couriers`, `PATCH /platform/couriers/:id/verification`, `GET /platform/payouts/pending`, `POST /platform/payouts/settle` |
| Webhooks | `POST /webhooks/payments/mtn`, `POST /webhooks/payments/airtel`, `POST /webhooks/yango` |
| Realtime | `GET /ws?token=<JWT>` — subscribe per order for status + courier location frames |

## Delivery plan status

1. ✅ DB schema (Drizzle) — shops, products, users/roles, carts, orders (+ events), deliveries, couriers, payments, ledger, idempotency keys
2. ✅ Auth (JWT + RBAC + tenant-ownership middleware)
3. ✅ Shop admin API (catalog, inventory, incoming orders, status, dispatch)
4. ✅ Shopper API (feed/search, cart, checkout) + payment abstraction
5. ✅ Order pipeline state machine (+ unit tests)
6. ✅ Yango integration behind `DeliveryProvider` (+ mock, + contract tests, + status webhook receiver)
7. ✅ Real-time tracking — Yango→server via webhook; server→app via the WebSocket gateway (mobile falls back to a slow poll when the socket is down)
8. ✅ RN app — auth (login/register with role, refresh-token rotation with auto-retry on 401, server-side logout), feed, cart with quantity stepper + inline checkout (delivery/pickup), order history, WebSocket-live tracking, a courier home (availability, pickup/complete actions, payout summary), and a shop-admin home (incoming orders with actions derived from the shared state machine — the app can never offer a transition the server would reject — plus dispatch, catalog form, and stock steppers); role-based navigation without external deps

## Testing

- **Unit** (`bun test`, no DB needed): every legal/illegal state-machine transition, role restrictions, terminal states; delivery + payment provider contract tests against the mocks.
- **Unit — mobile money**: MoMo and Airtel providers against a scripted `fetch` stub — token flow + caching (one token call across initiates), ngwee→kwacha conversion at the boundary, MSISDN normalization (international for MoMo, national for Airtel), correlation-id round-tripping, callback status mapping (SUCCESSFUL/FAILED, TS/TF), garbage rejection, and MoMo refunds failing loudly.
- **Unit — security & assignment**: Stripe signature verification (valid/tampered/wrong-secret/stale/malformed, multi-candidate rotation), haversine sanity, and proximity ranking (nearest fresh position wins, stale positions demoted, graceful degradation when nobody has reported).
- **Integration** (`bun run test:integration`, needs Postgres): the full happy path over real HTTP handlers — onboarding all four actors, tenant-isolation rejection, product feed, courier verification gate, idempotent checkout (replay returns the same order, stock decremented exactly once, 8% ledger split asserted to the ngwee), illegal transition → 409, dispatch linking `yango_request_id` + `courier_id` and ledgering the courier payout, pickup → location push → complete, terminal-state protection, and Yango webhook idempotency (duplicate `delivered` events, unknown claims, garbage payloads).
- **Integration — auth & realtime**: refresh rotation (old token single-use, reuse revokes the family, rotated access token works), logout revocation, login rate limiting (429 + `Retry-After`, per-account isolation), and a live `Bun.serve` WebSocket session — subscribe, drive a transition, assert the pushed frame — plus rejection of bad tokens (close 4401) and foreign-order subscriptions.
- **Integration — payouts**: pending payouts grouped by courier, settlement marking ledger rows settled with an audit ref, the courier's balance flipping pending→settled, and double-settlement rejected (`NOTHING_PENDING`).
- **Scaling** (`TEST_REDIS_URL` set): the Redis rate-limit store counting across two store instances (the multi-replica property) and window expiry; the Redis event bridge delivering a foreign instance's frame locally while suppressing loopback (exactly-once local delivery); MoMo Disbursements transfer semantics against a scripted fetch.
- Test files run in parallel within one Bun process, so suites share a memoized migrate-once bootstrap (`test/db-setup.ts`) and use run-unique identities instead of truncation — the suite is deterministic on a dirty database.

## Local preview

```bash
docker compose up -d
bun run db:migrate && bun run db:seed   # 3 shops, 13 products, 4 actor logins
bun run dev:api                         # :3000  (mock payments unless keys are set)
cd apps/mobile && bunx expo start       # --web works for a quick look
```

`db:seed` is idempotent. It prints the four logins; all use `preview-pass-1`.

## Next steps

Everything in the original delivery plan is built, and every known
simplification in [docs/HANDOFF.md](docs/HANDOFF.md) §2 is now closed.

What remains is verification that needs credentials or hardware we don't
have: the Yango endpoint/webhook vocabulary, MoMo and Airtel production
specifics, and a native build (`react-native-maps`, keyboard behaviour,
safe-area insets). The shopper journey — browse → sign in → cart →
checkout → order → track — has been driven end-to-end against a real
database, but on `expo start --web`, not a device.

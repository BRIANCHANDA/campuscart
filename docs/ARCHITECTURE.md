# CampusCart — Architecture

## 1. System diagram

```
                ┌─────────────────────────────────────────────┐
                │              React Native app                │
                │  shopper │ courier │ shop admin │ platform   │
                └───────┬──────────────────────────┬──────────┘
                        │ HTTPS (REST, OpenAPI)    │ WSS (realtime)
                        ▼                          ▼
┌────────────────────────────────────────────────────────────────────┐
│                        Hono API (Bun runtime)                       │
│                                                                     │
│  routes ──► middleware (JWT, RBAC, tenant ownership, rate limit)    │
│     │                                                               │
│     ▼                                                               │
│  OrderPipeline ──► shared state machine (packages/shared)           │
│     │        │                                                      │
│     │        └──► event bus ──► WebSocket gateway ──► clients       │
│     │                  │                                            │
│     │                  └──(REDIS_URL set)──► Redis pub/sub ◄──other │
│     ▼                                                     replicas  │
│  DeliveryProvider          PaymentProvider                          │
│   ├─ YangoClient            ├─ MtnMomoProvider (+ Disbursements)    │
│   └─ MockProvider           ├─ AirtelMoneyProvider                  │
│                             ├─ StripeProvider                       │
│                             └─ MockProvider                         │
└───────────────┬────────────────────────────────────────────────────┘
                ▼
         PostgreSQL 16 (Drizzle ORM, SQL migrations in apps/api/drizzle)
```

External callers: Yango claim-status webhooks → `/webhooks/yango`; payment
provider callbacks → `/webhooks/payments`.

## 2. The monorepo contract

`packages/shared` is the single source of truth for every type that crosses
the wire. Zod schemas defined once are consumed by:

1. **The API** — request validation + OpenAPI generation via `@hono/zod-openapi`
2. **The mobile app** — every response is *parsed* (not cast) with the same
   schemas, so server/client contract drift throws at the boundary instead of
   corrupting state silently

The **order state machine** also lives in shared, and this is load-bearing:
the server enforces transitions in `OrderPipeline.transition()` (the only code
path that mutates `orders.status`), and the mobile shop-admin screen derives
its action buttons from `nextStatuses(status, fulfillment, actor)` — the app
is structurally incapable of offering a transition the server would reject.

```
delivery: placed → preparing → out_for_delivery → delivered
pickup:   placed → preparing → ready_for_pickup → completed
cancel:   placed (shopper|shop) · preparing (shop only)
actors:   each edge lists who may perform it; platform_admin passes all;
          "system" is the pipeline itself (dispatch, webhook settlement)
```

Every transition takes an optimistic lock (`WHERE status = <expected>`) and
appends to `order_events` — a complete, immutable audit trail.

## 3. Data model

```
users ─┬─< shop_admins >─ shops ─< products
       │                    │
       ├─< carts ─< cart_items
       │      │
       │      ▼ (checkout, transactional)
       ├─< orders ─< order_items (name/price snapshots)
       │      ├──── order_events (append-only audit)
       │      ├──── payments (provider, provider_ref, status)
       │      ├──── deliveries (1:1; yango_request_id + courier_id)
       │      └──── payout_ledger (shop_sale | platform_fee |
       │                           courier_payout | refund;
       │                           status pending→settled,
       │                           settlement_ref audit)
       ├─── couriers (verification, availability, last known position)
       ├─── refresh_tokens (hashed, rotation chain, revocation)
       └─── idempotency_keys (checkout replay)
```

Key invariants:

- **Money**: integer ngwee everywhere; major-unit conversion only inside
  MoMo/Airtel providers whose APIs require it.
- **Three-way split**: every order writes `shop_sale` (subtotal − 8% fee),
  `platform_fee`, and — at dispatch — `courier_payout`. The integration suite
  asserts the split to the ngwee.
- **Tenant isolation**: shop-admin routes require the `:shopId` path param to
  appear in the JWT's `shopIds` claim, AND every query filters by `shop_id`.
  Two independent layers; a bug in one cannot leak data.
- **Snapshots**: `order_items` copies product name and price at purchase time,
  so later catalog edits never rewrite history.

## 4. Order lifecycle (happy path, delivery)

1. `POST /cart/items` — one active cart per (user, shop), enforced by a
   partial unique index.
2. `POST /checkout` with an `Idempotency-Key` — inside one transaction:
   stock re-check + atomic decrement, delivery-fee estimate from the
   `DeliveryProvider`, order + items + audit event + delivery row inserted,
   payment initiated, ledger split written, cart marked checked out. A
   replayed key returns the stored response — no double charge, no double
   stock decrement.
3. Shop accepts: `PATCH …/status {preparing}` (state machine + role checked).
4. Shop dispatches: `POST …/dispatch` — proximity assignment picks the
   nearest available verified courier (haversine on last reported position,
   15-minute freshness window, graceful fallback to first-available), a Yango
   claim is created, `yango_request_id` + `courier_id` persist together, the
   courier's fee is ledgered, and the pipeline transitions to
   `out_for_delivery` as the `system` actor.
5. Courier picks up (`/pickup`), streams location (`/location` → courier's
   last-known position + a realtime frame), completes (`/complete` →
   `delivered`). Yango's own status webhook can drive the same transitions
   idempotently — whichever side reports first wins, the duplicate is
   swallowed by the state machine.

## 5. Payments

`PaymentProvider` interface: `initiate → parseWebhook → refund`, selected by
`PAYMENT_PROVIDER`.

| Provider | Initiate | Settlement | Verification | Refund |
|---|---|---|---|---|
| mock | instant success | — | — | no-op |
| stripe | PaymentIntent (client secret to app) | webhook | v1 HMAC signature, constant-time, 5-min replay window, fails closed | refund API |
| mtn_momo | request-to-pay (handset approval) | callback (`externalId` correlation) | portal-registered URL + pre-existing-ref guard | Disbursements transfer back to payer |
| airtel_money | merchant push (USSD approval) | callback (TS/TF) | optional HMAC via `AIRTEL_CALLBACK_SECRET` + ref guard | standard refund endpoint |

Mobile-money settlements are inherently out-of-band (the customer approves on
their phone), so `/webhooks/payments` publishes a `payment.update` realtime
frame — the order screen learns the outcome by push, not by polling.

**Courier payouts** reuse MoMo Disbursements: `POST /platform/payouts/settle`
sums a courier's pending ledger entries, pushes the total to their MSISDN
(when Disbursements is configured; recorded as `manual` otherwise), and marks
the rows settled with the transfer reference. `status = pending` in the WHERE
clause makes double-settlement impossible.

## 6. Realtime

- Gateway: `GET /ws?token=<JWT>` — authenticated before frames are accepted;
  per-order subscriptions access-checked against the same rules as REST.
- Frames: `order.status`, `delivery.update` (status and/or courier
  coordinates), `payment.update`.
- Publishers: the order pipeline, courier location/pickup routes, Yango
  webhook, payments webhook.
- Transport between replicas: with `REDIS_URL` set, every event mirrors to a
  Redis pub/sub channel with an instance-id loopback guard — a client on
  replica A receives events produced on replica B, with exactly-once local
  delivery. Without Redis, the in-process bus alone serves the
  single-instance deployment.
- Client behavior: WebSocket-first, silent downgrade to a 30-second poll.

## 7. Security model

- Short-lived access JWTs (HS256), claims validated with Zod on every request.
- Opaque refresh tokens, SHA-256 hashed at rest, rotated on every use;
  presenting a rotated token revokes the whole family (theft detection).
- Rate limiting on register/login/refresh keyed by IP + target account;
  in-memory sliding window by default, Redis fixed-window (shared across
  replicas) when `REDIS_URL` is set.
- Tenant isolation: two independent layers (claims middleware + query filter).
- Webhook verification per provider (see table above); Yango webhook guarded
  by a shared secret.
- All provider credentials are server-side env only; the app never sees them.

## 8. Scaling model

| Concern | 1 instance (default) | N instances |
|---|---|---|
| Rate limiting | in-memory sliding window | Redis `INCR`+`PEXPIRE`, one counter for all replicas |
| Realtime fan-out | in-process bus | Redis pub/sub bridge, loopback-guarded |
| Database | Postgres (docker-compose) | same Postgres; pipeline uses optimistic locks, not advisory locks |
| Sessions | stateless JWTs | unchanged |

Both Redis adapters activate with the single `REDIS_URL` env var and are
covered by tests that assert the actual multi-replica property (two store
instances sharing a counter; a foreign instance's event arriving locally).

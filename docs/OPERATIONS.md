# CampusCart — Operations

## 1. Environment variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Postgres connection string |
| `JWT_SECRET` | ✅ | — | ≥ 32 chars; rotating it invalidates all access tokens |
| `JWT_EXPIRES_IN_SECONDS` | | `86400` | Access-token lifetime |
| `PORT` | | `3000` | |
| `PAYMENT_PROVIDER` | | `mock` | `mock` \| `stripe` \| `mtn_momo` \| `airtel_money` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | with stripe | `""` | Webhooks **fail closed** without the secret |
| `MOMO_API_BASE_URL` | | sandbox | Production is per-market |
| `MOMO_SUBSCRIPTION_KEY` / `MOMO_API_USER` / `MOMO_API_KEY` | with mtn_momo | `""` | Collections product |
| `MOMO_TARGET_ENVIRONMENT` | | `sandbox` | e.g. `mtnzambia` in production — confirm in portal |
| `MOMO_CALLBACK_URL` | recommended | `""` | Must match the URL registered in the portal |
| `MOMO_DISBURSEMENT_SUBSCRIPTION_KEY` | for refunds/payouts | `""` | Separate product key; unset ⇒ settlements recorded as `manual` |
| `AIRTEL_API_BASE_URL` | | UAT | Confirm production host in portal |
| `AIRTEL_CLIENT_ID` / `AIRTEL_CLIENT_SECRET` | with airtel_money | `""` | |
| `AIRTEL_COUNTRY` | | `ZM` | |
| `AIRTEL_CALLBACK_SECRET` | recommended | `""` | Enables HMAC verification of callbacks |
| `YANGO_API_BASE_URL` / `YANGO_API_KEY` / `YANGO_CLIENT_ID` | for real dispatch | `""` | No key ⇒ mock delivery provider |
| `YANGO_WEBHOOK_SECRET` | recommended | `""` | Shared secret on `/webhooks/yango` |
| `REDIS_URL` | for multi-instance | `""` | Activates shared rate limiting + realtime bridge |

## 2. Deployment (single campus)

```bash
docker compose up -d          # Postgres 16
cp .env.example .env          # fill in secrets
bun install
bun run db:migrate            # applies apps/api/drizzle/*.sql
bun run dev:api               # production: run under a supervisor / systemd
```

Reverse proxy (Caddy/nginx) terminates TLS in front of port 3000 and must
forward WebSocket upgrades on `/ws` and pass `X-Forwarded-For` (the rate
limiter keys on it). The OpenAPI console lives at `/docs`.

**Seeding the first platform admin** (registration only self-serves shopper
and courier roles — this is deliberate):

```sql
INSERT INTO users (email, password_hash, full_name, phone, role)
VALUES ('ops@example.com', '<bcrypt hash>', 'Ops Admin', '+260…', 'platform_admin');
```

Generate the hash with `bun -e "console.log(await Bun.password.hash('…'))"`.

## 3. Provider onboarding checklists

**MTN MoMo**
1. Create the app in the MTN developer portal; subscribe to **Collections**
   (and **Disbursements** if doing refunds/automated payouts).
2. Register the callback URL — must equal `MOMO_CALLBACK_URL`.
3. Production: set `MOMO_API_BASE_URL` to the market host and
   `MOMO_TARGET_ENVIRONMENT` (e.g. `mtnzambia`) — both differ from sandbox.
4. Verify: place an order with `PAYMENT_PROVIDER=mtn_momo`, approve on the
   handset, confirm the payment row flips to `succeeded` and the app receives
   the `payment.update` frame.

**Airtel Money**
1. Create credentials in the Airtel developers portal; enable ZM/ZMW.
2. Register the callback URL; set `AIRTEL_CALLBACK_SECRET` if using the
   signature option.
3. Swap `AIRTEL_API_BASE_URL` from UAT to the production host.

**Yango**
1. Obtain API key + Clid from the partner manager.
2. **Verify endpoint paths and webhook field names against the partner docs
   issued with the credentials** — Yango revises them per region/contract.
   Everything routes through `services/delivery/yango.ts` and the webhook
   mapping table in `routes/webhooks.ts`; a mismatch is a two-file fix.
3. Register the status webhook URL with `YANGO_WEBHOOK_SECRET`.

## 4. Runbooks

**A courier says they weren't paid.** `payout_ledger` is the truth: filter by
`courier_id`. `status = 'settled'` rows carry `settlement_ref` (a MoMo
transfer UUID, or `manual`) and `settled_at`. Cross-check the ref in the MoMo
portal.

**A payment is stuck `pending` (mobile money).** Callbacks can be lost. MoMo:
call the provider's `fetchStatus(providerRef)` (poll fallback) or check the
portal, then replay the callback body against `/webhooks/payments`. The
pre-existing-ref guard makes replays safe.

**A shopper reports double-charging.** Impossible via `/checkout` if the app
sent the same `Idempotency-Key` (replay returns the original order). Check
`idempotency_keys` for the key; if two DIFFERENT keys exist for one intended
purchase, the client generated a new key on retry — refund one payment via
the provider's refund path.

**Order stuck in a status.** Read `order_events` for the order — every
transition and its actor is there. A platform admin can force any legal
transition; the state machine still refuses illegal ones (409).

**Suspected token theft.** The refresh-token family is revoked automatically
on reuse detection (`auth.refresh_token_reuse` in logs). To force-logout a
user manually: `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = …`.

**Rate limiter blocking a legitimate user.** In-memory: restart clears it.
Redis: `DEL rl:<path>:<ip>:<email>`.

## 5. Observability

Structured JSON logs on stdout, one event per line. Notable events:
`order.transition`, `payment.initiated`, `payment.webhook`,
`courier.assigned`, `payout.settled`, `rate_limit.hit`,
`auth.refresh_token_reuse`, `yango.webhook`, `events.bridge`,
`ws.open`. Ship them to Loki/CloudWatch as-is.

## 6. Testing

```bash
bun test                    # unit: state machine, providers, security, assignment
bun run test:integration    # + full HTTP flows against Postgres
TEST_REDIS_URL=redis://localhost:6379 bun test scaling   # + Redis adapters
```

Integration suites self-skip without `TEST_DATABASE_URL`; Redis tests
self-skip without `TEST_REDIS_URL`. Test files run in parallel inside one Bun
process — see `test/db-setup.ts` for the shared migrate-once bootstrap and
the conventions (run-unique identities, no truncation) that keep the suite
deterministic on a dirty database.

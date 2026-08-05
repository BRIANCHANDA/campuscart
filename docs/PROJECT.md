# CampusCart — Project Overview

## 1. The problem we are solving

Zambian university campuses — Copperbelt University in Kitwe being the reference case — run on a dense informal economy. Tuck shops, food vendors, stationery sellers, phone-accessory stalls, and salon services cluster around hostels and lecture blocks, and students buy from them daily. That economy works, but it works inefficiently, and the friction lands on all three sides of every transaction:

**For students (shoppers):** finding out what is available means physically walking shop to shop. There is no way to check whether the tuck shop near Hostel 5 still has airtime vouchers or whether the food vendor has run out of chicken before making the trip. During exam weeks, late evenings, or heavy rains, a fifteen-minute walk for a K10 purchase is a real cost. Students with disabilities, students in far-flung hostels, and students juggling work and study feel it most.

**For campus shops:** discovery is limited to foot traffic past the door. A shop with better prices or fresher stock two blocks away is invisible. There is no order pipeline — a vendor cannot prepare orders in advance, cannot see demand patterns, and manages stock in an exercise book, if at all. Digital payments happen ad hoc over personal mobile-money numbers with no reconciliation against sales.

**For students who could earn (couriers):** campuses are full of people with free hours and a bicycle who would happily run deliveries for a fee, but there is no structured way to match them with demand, no trust mechanism (who is this person collecting my order?), and no clean way to track and pay out what they have earned.

The general-purpose delivery platforms that solved this problem elsewhere do not fit here: they are built around city-scale logistics, card payments, and take rates that make no sense for K15 tuck-shop orders. What the campus needs is a **purpose-built, low-overhead marketplace** that speaks the local payment languages (MTN MoMo and Airtel Money, with cards as the secondary path), keeps money in integer ngwee, verifies couriers against their NRC, and can hand off deliveries to an established fulfilment network (Yango) where its coverage exists.

## 2. The solution

CampusCart is a **multi-tenant campus shopping and delivery platform** connecting three user populations plus a platform operator:

| Actor | What CampusCart gives them |
|---|---|
| **Shopper** (student/staff) | One searchable feed across every campus shop; a cart; checkout with delivery or pickup; live order tracking with the courier's position on a map; mobile-money or card payment |
| **Shop admin** (vendor) | A digital storefront; catalog and stock management; an incoming-order queue with a guided workflow (accept → prepare → dispatch/ready); automatic courier assignment |
| **Courier** (verified student) | An availability toggle; job assignment based on proximity; a pickup → deliver workflow; a transparent earnings ledger with pending/settled balances paid to their MoMo wallet |
| **Platform admin** (operator) | Shop onboarding; courier verification (NRC-anchored); payout settlement (one tap → MoMo transfer); the 8% platform fee ledgered automatically on every order |

Delivery fulfilment is delegated to the **Yango API** — the platform creates delivery requests programmatically and stores the returned `yango_request_id` alongside the internal `courier_id`, so Yango handles logistics while courier identity, verification, and payouts remain platform concerns.

## 3. What makes this solution appropriate for its context

- **Mobile-money first.** MTN MoMo (Collections + Disbursements) and Airtel Money are first-class `PaymentProvider` implementations, not afterthoughts. Customers approve payments on their handsets; couriers are paid out to their wallets. Stripe exists for card payments; the mock provider backs development.
- **Kwacha-native money handling.** Every amount in the system is an integer in ngwee (minor units). Conversion to major units happens exactly once, at the boundary of providers whose APIs demand it — never in business logic.
- **Trust built in, not bolted on.** Couriers register with an NRC number and are manually verified by the platform before they can go online. Every order-status change is written to an append-only audit table with the actor who made it.
- **Works on campus networks.** The mobile app is WebSocket-first for live tracking but degrades to polling automatically when the socket cannot connect — designed for flaky campus wifi and captive portals.
- **Cheap to run.** A single docker-compose deployment (API + Postgres + Caddy) serves a campus. The Redis-backed adapters for rate limiting and event fan-out activate with one env var when a deployment outgrows one instance.

## 4. Success criteria

1. A shopper can discover, order, pay (MoMo/Airtel/card/mock), and track a delivery end-to-end without leaving the app.
2. A shop can manage its catalog and process orders through an explicit, role-enforced state machine that makes illegal workflow states unrepresentable.
3. A courier can earn, see exactly what they are owed, and be paid to their mobile wallet.
4. The platform's 8% fee, the shop's share, and the courier's fee are provably reconciled on every order (asserted to the ngwee in the test suite).
5. No tenant can ever read or mutate another tenant's data (enforced twice: JWT claims middleware + query-level filtering; covered by tests).

## 5. Scope boundaries

**In scope:** the Bun/Hono API, the shared type system, the Expo mobile app for all four roles, Yango integration, four payment providers, realtime tracking, payout settlement, and the operational documentation in this folder.

**Out of scope (deliberately):** web storefront, promotions/coupons, ratings and reviews, chat between parties, multi-campus federation, and automated tax reporting. Each has an obvious seam in the architecture (see ARCHITECTURE.md) but none is required for the pilot.

## 6. Document map

| Document | Contents |
|---|---|
| [README.md](../README.md) | Quick start, architecture decisions, API surface, delivery-plan status |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System diagram, data model, order/payment/realtime flows, scaling model |
| [OPERATIONS.md](./OPERATIONS.md) | Environment variables, deployment, provider onboarding checklists, runbooks |
| [HANDOFF.md](./HANDOFF.md) | Known gaps, verification caveats, and the polishing checklist |

import type { FulfillmentType, OrderStatus } from "./schemas/order";
import type { Role } from "./schemas/auth";

/**
 * The single source of truth for order lifecycle transitions.
 * Nothing in the codebase mutates an order status without going through `assertTransition`.
 *
 * delivery: placed → preparing → out_for_delivery → delivered
 * pickup:   placed → preparing → ready_for_pickup → completed
 * cancel:   allowed from placed/preparing only
 */
export type Actor = Role | "system";

interface TransitionRule {
  to: OrderStatus;
  allowedActors: Actor[];
  fulfillment?: FulfillmentType; // if set, transition only valid for this fulfillment type
}

const TRANSITIONS: Record<OrderStatus, TransitionRule[]> = {
  placed: [
    { to: "preparing", allowedActors: ["shop_admin", "platform_admin"] },
    { to: "cancelled", allowedActors: ["shopper", "shop_admin", "platform_admin"] },
  ],
  preparing: [
    { to: "out_for_delivery", allowedActors: ["system", "platform_admin"], fulfillment: "delivery" },
    { to: "ready_for_pickup", allowedActors: ["shop_admin", "platform_admin"], fulfillment: "pickup" },
    { to: "cancelled", allowedActors: ["shop_admin", "platform_admin"] },
  ],
  out_for_delivery: [
    { to: "delivered", allowedActors: ["courier", "system", "platform_admin"] },
  ],
  ready_for_pickup: [
    { to: "completed", allowedActors: ["shop_admin", "platform_admin"] },
  ],
  delivered: [],
  completed: [],
  cancelled: [],
};

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
    public readonly actor: Actor,
  ) {
    super(`Invalid order transition ${from} → ${to} by ${actor}`);
    this.name = "InvalidTransitionError";
  }
}

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: Actor,
  fulfillment: FulfillmentType,
): boolean {
  const rule = TRANSITIONS[from].find((r) => r.to === to);
  if (!rule) return false;
  if (rule.fulfillment && rule.fulfillment !== fulfillment) return false;
  return rule.allowedActors.includes(actor);
}

export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: Actor,
  fulfillment: FulfillmentType,
): void {
  if (!canTransition(from, to, actor, fulfillment)) {
    throw new InvalidTransitionError(from, to, actor);
  }
}

export function nextStatuses(
  from: OrderStatus,
  fulfillment: FulfillmentType,
  actor?: Actor,
): OrderStatus[] {
  return TRANSITIONS[from]
    .filter((r) => !r.fulfillment || r.fulfillment === fulfillment)
    .filter((r) => !actor || actor === "platform_admin" || r.allowedActors.includes(actor))
    .map((r) => r.to);
}

export function isTerminal(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

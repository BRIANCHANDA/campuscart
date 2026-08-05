import { describe, expect, test } from "bun:test";
import {
  assertTransition,
  canTransition,
  InvalidTransitionError,
  isTerminal,
  nextStatuses,
} from "@campuscart/shared";

describe("order state machine — delivery flow", () => {
  test("happy path: placed → preparing → out_for_delivery → delivered", () => {
    expect(canTransition("placed", "preparing", "shop_admin", "delivery")).toBe(true);
    expect(canTransition("preparing", "out_for_delivery", "system", "delivery")).toBe(true);
    expect(canTransition("out_for_delivery", "delivered", "courier", "delivery")).toBe(true);
  });

  test("shopper cannot advance fulfillment", () => {
    expect(canTransition("placed", "preparing", "shopper", "delivery")).toBe(false);
    expect(canTransition("preparing", "out_for_delivery", "shopper", "delivery")).toBe(false);
    expect(canTransition("out_for_delivery", "delivered", "shopper", "delivery")).toBe(false);
  });

  test("shop_admin cannot mark delivered", () => {
    expect(canTransition("out_for_delivery", "delivered", "shop_admin", "delivery")).toBe(false);
  });

  test("no skipping stages", () => {
    expect(canTransition("placed", "out_for_delivery", "system", "delivery")).toBe(false);
    expect(canTransition("placed", "delivered", "courier", "delivery")).toBe(false);
    expect(canTransition("preparing", "delivered", "courier", "delivery")).toBe(false);
  });

  test("delivery orders can't take the pickup branch", () => {
    expect(canTransition("preparing", "ready_for_pickup", "shop_admin", "delivery")).toBe(false);
  });
});

describe("order state machine — pickup flow", () => {
  test("happy path: placed → preparing → ready_for_pickup → completed", () => {
    expect(canTransition("placed", "preparing", "shop_admin", "pickup")).toBe(true);
    expect(canTransition("preparing", "ready_for_pickup", "shop_admin", "pickup")).toBe(true);
    expect(canTransition("ready_for_pickup", "completed", "shop_admin", "pickup")).toBe(true);
  });

  test("pickup orders never go out_for_delivery", () => {
    expect(canTransition("preparing", "out_for_delivery", "system", "pickup")).toBe(false);
  });
});

describe("cancellation", () => {
  test("shopper can cancel while placed, not after prep starts", () => {
    expect(canTransition("placed", "cancelled", "shopper", "delivery")).toBe(true);
    expect(canTransition("preparing", "cancelled", "shopper", "delivery")).toBe(false);
  });

  test("shop can cancel through preparing", () => {
    expect(canTransition("preparing", "cancelled", "shop_admin", "delivery")).toBe(true);
  });

  test("nothing cancels after handover to courier", () => {
    expect(canTransition("out_for_delivery", "cancelled", "shopper", "delivery")).toBe(false);
    expect(canTransition("out_for_delivery", "cancelled", "shop_admin", "delivery")).toBe(false);
    expect(canTransition("out_for_delivery", "cancelled", "platform_admin", "delivery")).toBe(false);
  });
});

describe("platform_admin override + terminal states", () => {
  test("platform_admin can drive any defined transition", () => {
    expect(canTransition("placed", "preparing", "platform_admin", "delivery")).toBe(true);
    expect(canTransition("preparing", "out_for_delivery", "platform_admin", "delivery")).toBe(true);
  });

  test("terminal states have no exits", () => {
    for (const s of ["delivered", "completed", "cancelled"] as const) {
      expect(isTerminal(s)).toBe(true);
      expect(nextStatuses(s, "delivery")).toEqual([]);
    }
  });

  test("assertTransition throws a typed error", () => {
    expect(() => assertTransition("delivered", "placed", "platform_admin", "delivery"))
      .toThrow(InvalidTransitionError);
  });
});

describe("nextStatuses respects fulfillment type", () => {
  test("preparing branches differ by fulfillment", () => {
    expect(nextStatuses("preparing", "delivery")).toEqual(["out_for_delivery", "cancelled"]);
    expect(nextStatuses("preparing", "pickup")).toEqual(["ready_for_pickup", "cancelled"]);
  });
});

describe("nextStatuses actor filter", () => {
  test("shop admin is only offered shop-legal actions", () => {
    expect(nextStatuses("placed", "delivery", "shop_admin").sort())
      .toEqual(["cancelled", "preparing"]);
    // Dispatch (out_for_delivery) belongs to system/platform, not the shop directly
    expect(nextStatuses("preparing", "delivery", "shop_admin")).toEqual(["cancelled"]);
    expect(nextStatuses("preparing", "pickup", "shop_admin").sort())
      .toEqual(["cancelled", "ready_for_pickup"]);
  });

  test("courier sees only the delivered handover", () => {
    expect(nextStatuses("out_for_delivery", "delivery", "courier")).toEqual(["delivered"]);
    expect(nextStatuses("placed", "delivery", "courier")).toEqual([]);
  });

  test("platform admin passes every gate; omitting actor keeps old behavior", () => {
    expect(nextStatuses("placed", "delivery", "platform_admin").length)
      .toBe(nextStatuses("placed", "delivery").length);
  });
});

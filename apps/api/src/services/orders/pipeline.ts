import { and, eq } from "drizzle-orm";
import {
  assertTransition,
  type FulfillmentType,
  type OrderStatus,
  type PaymentMethod,
  type Role,
} from "@campuscart/shared";
import type { Db } from "../../db";
import {
  carts, cartItems, deliveries, orderEvents, orderItems, orders, payments, payoutLedger,
  products, shops,
} from "../../db/schema";
import { badRequest, conflict, notFound } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { realtime } from "../../lib/events";
import type { DeliveryProvider } from "../delivery/provider";
import type { PaymentProvider } from "../payments/provider";

const PLATFORM_FEE_BPS = 800; // 8% platform commission on the goods subtotal

/**
 * Unified order pipeline:
 *   placed → routed to shop → shop fulfillment → dispatched via Yango → delivered
 * Every status change funnels through transition(), which enforces the shared
 * state machine and writes an append-only order_events audit row.
 */
export class OrderPipeline {
  constructor(
    private readonly db: Db,
    private readonly deliveryProvider: DeliveryProvider,
    /** Default/fallback provider (used by tests and single-provider setups). */
    private readonly paymentProvider: PaymentProvider,
    /** Optional per-method resolver — lets checkout charge the wallet the
     *  customer chose (Airtel vs MTN). Falls back to `paymentProvider`. */
    private readonly resolvePaymentProvider?: (method: PaymentMethod) => PaymentProvider,
  ) {}

  // -------------------------------------------------------------------------
  // Checkout: cart → order + payment initiation (called under an idempotency key)
  // -------------------------------------------------------------------------
  async checkout(input: {
    userId: string;
    userEmail: string;
    userPhone: string;
    cartId: string;
    fulfillmentType: FulfillmentType;
    dropoff?: { lat: number; lng: number };
    dropoffAddress?: string;
    paymentMethod?: PaymentMethod;
    payerPhone?: string;
  }) {
    const { userId, cartId, fulfillmentType } = input;

    return this.db.transaction(async (tx) => {
      const [cart] = await tx
        .select()
        .from(carts)
        .where(and(eq(carts.id, cartId), eq(carts.userId, userId)))
        .limit(1);
      if (!cart) throw notFound("Cart");
      if (cart.checkedOut) throw conflict("CART_ALREADY_CHECKED_OUT", "This cart was already checked out");

      const items = await tx.select().from(cartItems).where(eq(cartItems.cartId, cart.id));
      if (items.length === 0) throw badRequest("EMPTY_CART", "Cart has no items");

      const [shop] = await tx.select().from(shops).where(eq(shops.id, cart.shopId)).limit(1);
      if (!shop || !shop.isActive) throw notFound("Shop");

      // Re-validate stock and decrement atomically inside the transaction
      let subtotal = 0;
      for (const item of items) {
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
        if (!product || !product.isActive) throw notFound(`Product ${item.productId}`);
        if (product.stockQty < item.qty) {
          throw conflict("OUT_OF_STOCK", `Insufficient stock for ${product.name}`);
        }
        await tx
          .update(products)
          .set({ stockQty: product.stockQty - item.qty })
          .where(eq(products.id, product.id));
        subtotal += item.unitPriceMinor * item.qty;
      }

      // Delivery fee via provider estimate (0 for pickup)
      let deliveryFee = 0;
      if (fulfillmentType === "delivery") {
        if (!input.dropoff || !input.dropoffAddress) {
          throw badRequest("DROPOFF_REQUIRED", "Delivery orders need a dropoff location");
        }
        const est = await this.deliveryProvider.estimate({
          externalOrderId: cart.id,
          pickup: { lat: shop.pickupLat, lng: shop.pickupLng },
          pickupAddress: shop.name,
          dropoff: input.dropoff,
          dropoffAddress: input.dropoffAddress,
        });
        deliveryFee = est.feeMinor;
      }

      const total = subtotal + deliveryFee;

      const [order] = await tx
        .insert(orders)
        .values({
          shopperId: userId,
          shopId: cart.shopId,
          status: "placed",
          fulfillmentType,
          subtotalMinor: subtotal,
          deliveryFeeMinor: deliveryFee,
          totalMinor: total,
          dropoffLat: input.dropoff?.lat,
          dropoffLng: input.dropoff?.lng,
          dropoffAddress: input.dropoffAddress,
        })
        .returning();
      if (!order) throw new Error("order insert failed");

      const orderProducts = await tx.select().from(products).where(eq(products.shopId, cart.shopId));
      const nameOf = new Map(orderProducts.map((p) => [p.id, p.name]));
      await tx.insert(orderItems).values(
        items.map((i) => ({
          orderId: order.id,
          productId: i.productId,
          productName: nameOf.get(i.productId) ?? "Unknown product",
          unitPriceMinor: i.unitPriceMinor,
          qty: i.qty,
        })),
      );

      await tx.insert(orderEvents).values({
        orderId: order.id,
        fromStatus: null,
        toStatus: "placed",
        actorUserId: userId,
        actorKind: "shopper",
      });

      // Pre-create the delivery row so the pipeline owns it from minute one
      if (fulfillmentType === "delivery" && input.dropoff) {
        await tx.insert(deliveries).values({
          orderId: order.id,
          status: "pending_dispatch",
          pickupLat: shop.pickupLat,
          pickupLng: shop.pickupLng,
          dropoffLat: input.dropoff.lat,
          dropoffLng: input.dropoff.lng,
          feeMinor: deliveryFee,
        });
      }

      // Initiate payment on the wallet the customer chose (Airtel / MTN).
      const method = input.paymentMethod;
      const provider = method && this.resolvePaymentProvider
        ? this.resolvePaymentProvider(method)
        : this.paymentProvider;
      const initiated = await provider.initiate({
        orderId: order.id,
        amountMinor: total,
        currency: "ZMW",
        customerEmail: input.userEmail,
        customerPhone: input.payerPhone ?? input.userPhone,
      });
      const [payment] = await tx
        .insert(payments)
        .values({
          orderId: order.id,
          provider: provider.name,
          providerRef: initiated.providerRef,
          status: initiated.status === "succeeded" ? "succeeded" : "pending",
          amountMinor: total,
        })
        .returning();

      // Three-way ledger split: shop share + platform fee (courier payout added at dispatch)
      const platformFee = Math.floor((subtotal * PLATFORM_FEE_BPS) / 10_000);
      await tx.insert(payoutLedger).values([
        { orderId: order.id, entryType: "shop_sale", shopId: cart.shopId, amountMinor: subtotal - platformFee },
        { orderId: order.id, entryType: "platform_fee", amountMinor: platformFee },
      ]);

      await tx.update(carts).set({ checkedOut: true }).where(eq(carts.id, cart.id));

      logger.info("order.placed", {
        orderId: order.id, shopId: cart.shopId, totalMinor: total, fulfillmentType,
      });

      return { order, payment, clientSecret: initiated.clientSecret };
    });
  }

  // -------------------------------------------------------------------------
  // Status transitions — the only mutation path for order.status
  // -------------------------------------------------------------------------
  async transition(input: {
    orderId: string;
    to: OrderStatus;
    actor: Role | "system";
    actorUserId?: string;
  }) {
    return this.db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!order) throw notFound("Order");

      assertTransition(order.status, input.to, input.actor, order.fulfillmentType);

      const [updated] = await tx
        .update(orders)
        .set({ status: input.to })
        .where(and(eq(orders.id, order.id), eq(orders.status, order.status))) // optimistic lock
        .returning();
      if (!updated) throw conflict("STALE_ORDER", "Order status changed concurrently; retry");

      await tx.insert(orderEvents).values({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: input.to,
        actorUserId: input.actorUserId,
        actorKind: input.actor,
      });

      logger.info("order.transition", { orderId: order.id, from: order.status, to: input.to, actor: input.actor });
      realtime.publish({ kind: "order.status", orderId: order.id, status: input.to });
      return updated;
    });
  }

  // -------------------------------------------------------------------------
  // Dispatch: shop confirmed fulfillment → create Yango request + link courier
  // -------------------------------------------------------------------------
  async dispatch(input: { orderId: string; courierId: string; actorUserId?: string }) {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
    if (!order) throw notFound("Order");
    if (order.fulfillmentType !== "delivery") {
      throw badRequest("NOT_A_DELIVERY_ORDER", "Pickup orders are not dispatched");
    }

    const [delivery] = await this.db
      .select()
      .from(deliveries)
      .where(eq(deliveries.orderId, order.id))
      .limit(1);
    if (!delivery) throw notFound("Delivery");
    if (delivery.status !== "pending_dispatch") {
      throw conflict("ALREADY_DISPATCHED", "This delivery has already been dispatched");
    }

    // Create the Yango request, then persist the link:
    // deliveries.yango_request_id ↔ deliveries.courier_id
    const { requestId } = await this.deliveryProvider.createRequest({
      externalOrderId: order.id,
      pickup: { lat: delivery.pickupLat, lng: delivery.pickupLng },
      pickupAddress: "Shop pickup point",
      dropoff: { lat: delivery.dropoffLat, lng: delivery.dropoffLng },
      dropoffAddress: order.dropoffAddress ?? "Campus dropoff",
    });

    await this.db.transaction(async (tx) => {
      await tx
        .update(deliveries)
        .set({
          yangoRequestId: requestId,
          courierId: input.courierId,
          status: "dispatched",
          updatedAt: new Date(),
        })
        .where(eq(deliveries.id, delivery.id));

      // Courier payout entry — Yango or our ledger settles it, separate from shop money
      await tx.insert(payoutLedger).values({
        orderId: order.id,
        entryType: "courier_payout",
        courierId: input.courierId,
        amountMinor: delivery.feeMinor,
      });
    });

    await this.transition({
      orderId: order.id,
      to: "out_for_delivery",
      actor: "system",
      actorUserId: input.actorUserId,
    });

    logger.info("delivery.dispatched", {
      orderId: order.id, courierId: input.courierId, yangoRequestId: requestId,
    });
    return { yangoRequestId: requestId };
  }

  // -------------------------------------------------------------------------
  // Courier confirms handover to the shopper
  // -------------------------------------------------------------------------
  async completeDelivery(input: { orderId: string; courierUserId: string }) {
    await this.db
      .update(deliveries)
      .set({ status: "delivered", updatedAt: new Date() })
      .where(eq(deliveries.orderId, input.orderId));
    return this.transition({
      orderId: input.orderId,
      to: "delivered",
      actor: "courier",
      actorUserId: input.courierUserId,
    });
  }
}

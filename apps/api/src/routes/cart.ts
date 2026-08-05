import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, desc, eq, sql } from "drizzle-orm";
import { AddToCartSchema, CartSchema, IdSchema, UpdateCartItemSchema } from "@campuscart/shared";
import { db } from "../db";
import { cartItems, carts, products } from "../db/schema";
import { conflict, notFound } from "../lib/errors";
import { requireAuth, requireRole } from "../middleware/auth";
import { bearerSecurity, errorResponses, jsonContent } from "../lib/openapi";

export const cartRoutes = new OpenAPIHono();
cartRoutes.use("*", requireAuth, requireRole("shopper"));

async function loadCart(cartId: string, userId: string) {
  const [cart] = await db
    .select()
    .from(carts)
    .where(and(eq(carts.id, cartId), eq(carts.userId, userId), eq(carts.checkedOut, false)))
    .limit(1);
  if (!cart) throw notFound("Cart");
  return cart;
}

async function serializeCart(cartId: string, shopId: string) {
  const rows = await db
    .select({ item: cartItems, productName: products.name })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cartId));
  const items = rows.map(({ item, productName }) => ({
    id: item.id,
    productId: item.productId,
    productName,
    unitPriceMinor: item.unitPriceMinor,
    qty: item.qty,
  }));
  return {
    id: cartId,
    shopId,
    items,
    subtotalMinor: items.reduce((s, i) => s + i.unitPriceMinor * i.qty, 0),
  };
}

/** Add a product; creates (or reuses) the active cart for that product's shop. */
cartRoutes.openapi(
  createRoute({
    method: "post",
    path: "/items",
    tags: ["cart"],
    security: bearerSecurity,
    request: { body: jsonContent(AddToCartSchema, "Product to add") },
    responses: { 200: jsonContent(CartSchema, "Updated cart"), ...errorResponses },
  }),
  async (c) => {
    const { productId, qty } = c.req.valid("json");
    const userId = c.get("claims").sub;

    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product || !product.isActive) throw notFound("Product");
    if (product.stockQty < qty) throw conflict("OUT_OF_STOCK", "Not enough stock");

    // one active cart per (user, shop)
    let [cart] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.userId, userId), eq(carts.shopId, product.shopId), eq(carts.checkedOut, false)))
      .limit(1);
    if (!cart) {
      [cart] = await db.insert(carts).values({ userId, shopId: product.shopId }).returning();
    }
    if (!cart) throw new Error("cart create failed");

    await db
      .insert(cartItems)
      .values({ cartId: cart.id, productId, qty, unitPriceMinor: product.priceMinor })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.productId],
        set: { qty: sql`${cartItems.qty} + ${qty}` },
      });

    return c.json(await serializeCart(cart.id, cart.shopId), 200);
  },
);

/**
 * The caller's current active cart, so a fresh app launch can restore it
 * instead of losing it to in-memory state. Declared before `/{cartId}` so
 * "active" is never parsed as an id. Returns null when there is nothing
 * pending — an empty cart is a normal state, not an error.
 *
 * Carts are unique per (user, shop); a shopper with carts at several shops
 * gets the most recent one, matching the single-cart model the app presents.
 */
cartRoutes.openapi(
  createRoute({
    method: "get",
    path: "/active",
    tags: ["cart"],
    security: bearerSecurity,
    responses: { 200: jsonContent(CartSchema.nullable(), "Active cart, or null"), ...errorResponses },
  }),
  async (c) => {
    const [cart] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.userId, c.get("claims").sub), eq(carts.checkedOut, false)))
      .orderBy(desc(carts.createdAt))
      .limit(1);
    if (!cart) return c.json(null, 200);
    return c.json(await serializeCart(cart.id, cart.shopId), 200);
  },
);

cartRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{cartId}",
    tags: ["cart"],
    security: bearerSecurity,
    request: { params: z.object({ cartId: IdSchema }) },
    responses: { 200: jsonContent(CartSchema, "Cart"), ...errorResponses },
  }),
  async (c) => {
    const { cartId } = c.req.valid("param");
    const cart = await loadCart(cartId, c.get("claims").sub);
    return c.json(await serializeCart(cart.id, cart.shopId), 200);
  },
);

cartRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/{cartId}/items/{itemId}",
    tags: ["cart"],
    security: bearerSecurity,
    request: {
      params: z.object({ cartId: IdSchema, itemId: IdSchema }),
      body: jsonContent(UpdateCartItemSchema, "New quantity (0 removes)"),
    },
    responses: { 200: jsonContent(CartSchema, "Updated cart"), ...errorResponses },
  }),
  async (c) => {
    const { cartId, itemId } = c.req.valid("param");
    const { qty } = c.req.valid("json");
    const cart = await loadCart(cartId, c.get("claims").sub);

    if (qty === 0) {
      await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
    } else {
      await db
        .update(cartItems)
        .set({ qty })
        .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
    }
    return c.json(await serializeCart(cart.id, cart.shopId), 200);
  },
);

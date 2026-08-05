import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums (kept in sync with the Zod enums in @campuscart/shared)
// ---------------------------------------------------------------------------
export const roleEnum = pgEnum("role", ["shopper", "shop_admin", "courier", "platform_admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "placed", "preparing", "out_for_delivery", "ready_for_pickup", "delivered", "completed", "cancelled",
]);
export const fulfillmentEnum = pgEnum("fulfillment_type", ["delivery", "pickup"]);
export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending_dispatch", "dispatched", "picked_up", "delivered", "failed", "cancelled",
]);
export const courierVerificationEnum = pgEnum("courier_verification", [
  "pending", "verified", "rejected", "suspended",
]);
export const vehicleTypeEnum = pgEnum("vehicle_type", ["foot", "bicycle", "motorbike", "car"]);
export const paymentProviderEnum = pgEnum("payment_provider", [
  "mock", "stripe", "paypal", "mtn_momo", "airtel_money",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "succeeded", "failed", "refunded"]);
export const productCategoryEnum = pgEnum("product_category", [
  "food", "drinks", "stationery", "books", "electronics", "clothing", "services", "other",
]);
export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "shop_sale", "platform_fee", "courier_payout", "refund",
]);
export const ledgerStatusEnum = pgEnum("ledger_status", ["pending", "settled", "reversed"]);

// ---------------------------------------------------------------------------
// Users & auth
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  role: roleEnum("role").notNull().default("shopper"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Shops (tenants) — isolation is enforced in the query layer via shopAdmins
// ---------------------------------------------------------------------------
export const shops = pgTable("shops", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  address: text("address"),
  imageUrl: text("image_url"),
  pickupLat: doublePrecision("pickup_lat").notNull().default(0),
  pickupLng: doublePrecision("pickup_lng").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Join table: a shop can have several admins; an admin can run several shops. */
export const shopAdmins = pgTable(
  "shop_admins",
  {
    shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.shopId, t.userId] }) }),
);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    category: productCategoryEnum("category").notNull().default("other"),
    priceMinor: integer("price_minor").notNull(), // ngwee/cents — never floats for money
    currency: text("currency").notNull().default("ZMW"),
    stockQty: integer("stock_qty").notNull().default(0),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    shopIdx: index("products_shop_idx").on(t.shopId),
    categoryIdx: index("products_category_idx").on(t.category),
  }),
);

// ---------------------------------------------------------------------------
// Carts — one active cart per (user, shop); a checkout consumes exactly one cart
// ---------------------------------------------------------------------------
export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
    checkedOut: boolean("checked_out").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    activePerShop: uniqueIndex("carts_user_shop_active_idx")
      .on(t.userId, t.shopId)
      .where(sql`${t.checkedOut} = false`),
  }),
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id),
    qty: integer("qty").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(), // snapshot at add time
  },
  (t) => ({
    cartProduct: uniqueIndex("cart_items_cart_product_idx").on(t.cartId, t.productId),
  }),
);

// ---------------------------------------------------------------------------
// Orders — one shop per order; status changes only via the state machine
// ---------------------------------------------------------------------------
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopperId: uuid("shopper_id").notNull().references(() => users.id),
    shopId: uuid("shop_id").notNull().references(() => shops.id),
    status: orderStatusEnum("status").notNull().default("placed"),
    fulfillmentType: fulfillmentEnum("fulfillment_type").notNull(),
    subtotalMinor: integer("subtotal_minor").notNull(),
    deliveryFeeMinor: integer("delivery_fee_minor").notNull().default(0),
    totalMinor: integer("total_minor").notNull(),
    dropoffLat: doublePrecision("dropoff_lat"),
    dropoffLng: doublePrecision("dropoff_lng"),
    dropoffAddress: text("dropoff_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    shopStatusIdx: index("orders_shop_status_idx").on(t.shopId, t.status),
    shopperIdx: index("orders_shopper_idx").on(t.shopperId),
  }),
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(), // snapshot — survives product edits
  unitPriceMinor: integer("unit_price_minor").notNull(),
  qty: integer("qty").notNull(),
});

/** Append-only audit trail of every status change, with the acting user. */
export const orderEvents = pgTable("order_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: orderStatusEnum("from_status"),
  toStatus: orderStatusEnum("to_status").notNull(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  actorKind: text("actor_kind").notNull(), // role name or "system"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Couriers & deliveries — Yango is dispatch/tracking; identity + payouts are ours
// ---------------------------------------------------------------------------
export const couriers = pgTable("couriers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  verificationStatus: courierVerificationEnum("verification_status").notNull().default("pending"),
  vehicleType: vehicleTypeEnum("vehicle_type").notNull().default("foot"),
  nrcNumber: text("nrc_number"),
  isAvailable: boolean("is_available").notNull().default(false),
  // Last known position — updated on every en-route location push; feeds
  // proximity-based assignment. Null until the courier first reports.
  lastLat: doublePrecision("last_lat"),
  lastLng: doublePrecision("last_lng"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").notNull().unique().references(() => orders.id, { onDelete: "cascade" }),
    courierId: uuid("courier_id").references(() => couriers.id),
    yangoRequestId: text("yango_request_id"), // link into Yango's claim/request
    status: deliveryStatusEnum("status").notNull().default("pending_dispatch"),
    pickupLat: doublePrecision("pickup_lat").notNull(),
    pickupLng: doublePrecision("pickup_lng").notNull(),
    dropoffLat: doublePrecision("dropoff_lat").notNull(),
    dropoffLng: doublePrecision("dropoff_lng").notNull(),
    feeMinor: integer("fee_minor").notNull().default(0),
    courierLat: doublePrecision("courier_lat"),
    courierLng: doublePrecision("courier_lng"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("deliveries_status_idx").on(t.status),
    courierIdx: index("deliveries_courier_idx").on(t.courierId),
    yangoIdx: index("deliveries_yango_idx").on(t.yangoRequestId),
  }),
);

// ---------------------------------------------------------------------------
// Payments & payouts
// ---------------------------------------------------------------------------
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  provider: paymentProviderEnum("provider").notNull(),
  providerRef: text("provider_ref"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  amountMinor: integer("amount_minor").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Three-way money split per order: shop_sale (shop's share), platform_fee (ours),
 * courier_payout (tracked separately — Yango or our own ledger settles it).
 */
export const payoutLedger = pgTable(
  "payout_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").notNull().references(() => orders.id),
    entryType: ledgerEntryTypeEnum("entry_type").notNull(),
    // exactly one of these is set depending on entryType
    shopId: uuid("shop_id").references(() => shops.id),
    courierId: uuid("courier_id").references(() => couriers.id),
    amountMinor: integer("amount_minor").notNull(),
    status: ledgerStatusEnum("status").notNull().default("pending"),
    // Set when a settlement run pays this entry out (e.g. MoMo transfer ref)
    settlementRef: text("settlement_ref"),
    settledAt: timestamp("settled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ orderIdx: index("ledger_order_idx").on(t.orderId) }),
);

// ---------------------------------------------------------------------------
// Idempotency — checkout/payment endpoints replay the stored response
// ---------------------------------------------------------------------------
export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    key: text("key").notNull(),
    userId: uuid("user_id").notNull().references(() => users.id),
    endpoint: text("endpoint").notNull(),
    responseStatus: integer("response_status").notNull(),
    responseBody: jsonb("response_body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.key, t.userId, t.endpoint] }) }),
);

// ---------------------------------------------------------------------------
// Refresh tokens — opaque, hashed at rest, rotated on every use
// ---------------------------------------------------------------------------
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    // SHA-256 of the opaque token; the raw value never touches the database
    tokenHash: text("token_hash").notNull().unique(),
    // Rotation chain: set when this token is exchanged for a new one.
    // A rotated token being presented again = likely theft → revoke the family.
    replacedById: uuid("replaced_by_id"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userIdx: index("refresh_tokens_user_idx").on(t.userId) }),
);

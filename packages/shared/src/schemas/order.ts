import { z } from "zod";
import { CoordinatesSchema, IdSchema, MoneySchema, PaginationQuerySchema } from "./common";

export const OrderStatusSchema = z.enum([
  "placed",
  "preparing",
  "out_for_delivery",
  "ready_for_pickup",
  "delivered",
  "completed",   // pickup orders collected
  "cancelled",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const FulfillmentTypeSchema = z.enum(["delivery", "pickup"]);
export type FulfillmentType = z.infer<typeof FulfillmentTypeSchema>;

export const OrderItemSchema = z.object({
  productId: IdSchema,
  productName: z.string(),
  unitPriceMinor: MoneySchema,
  qty: z.number().int().min(1),
});

export const OrderSchema = z.object({
  id: IdSchema,
  shopperId: IdSchema,
  shopId: IdSchema,
  status: OrderStatusSchema,
  fulfillmentType: FulfillmentTypeSchema,
  items: z.array(OrderItemSchema),
  subtotalMinor: MoneySchema,
  deliveryFeeMinor: MoneySchema,
  totalMinor: MoneySchema,
  dropoff: CoordinatesSchema.nullable(),
  dropoffAddress: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type Order = z.infer<typeof OrderSchema>;

/** Mobile-money methods a shopper can pay with (Zambia). */
export const PaymentMethodSchema = z.enum(["airtel_money", "mtn_momo"]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  airtel_money: "Airtel Money",
  mtn_momo: "MTN MoMo",
};

export const CheckoutRequestSchema = z.object({
  cartId: IdSchema,
  fulfillmentType: FulfillmentTypeSchema,
  dropoff: CoordinatesSchema.optional(),
  dropoffAddress: z.string().optional(),
  /** Which mobile-money wallet to charge. */
  paymentMethod: PaymentMethodSchema,
  /** The wallet's phone number (may differ from the account phone). */
  payerPhone: z.string().min(9, "Enter the mobile money number"),
}).refine(
  (v) => v.fulfillmentType === "pickup" || (v.dropoff && v.dropoffAddress),
  { message: "dropoff and dropoffAddress are required for delivery orders" },
);

export const OrderListQuerySchema = PaginationQuerySchema.extend({
  status: OrderStatusSchema.optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
});

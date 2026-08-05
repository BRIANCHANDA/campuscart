import { z } from "zod";
import { IdSchema, MoneySchema } from "./common";

export const CartItemSchema = z.object({
  id: IdSchema,
  productId: IdSchema,
  productName: z.string(),
  unitPriceMinor: MoneySchema, // snapshot at add-to-cart time
  qty: z.number().int().min(1),
});

export const CartSchema = z.object({
  id: IdSchema,
  shopId: IdSchema, // one shop per cart/checkout by design
  items: z.array(CartItemSchema),
  subtotalMinor: MoneySchema,
});
export type Cart = z.infer<typeof CartSchema>;

export const AddToCartSchema = z.object({
  productId: IdSchema,
  qty: z.number().int().min(1).default(1),
});
export const UpdateCartItemSchema = z.object({
  qty: z.number().int().min(0), // 0 removes the line
});

import { z } from "zod";
import { CurrencySchema, IdSchema, MoneySchema, PaginationQuerySchema } from "./common";

export const ProductCategorySchema = z.enum([
  "food", "drinks", "stationery", "books", "electronics", "clothing", "services", "other",
]);

export const ProductSchema = z.object({
  id: IdSchema,
  shopId: IdSchema,
  shopName: z.string().optional(), // denormalised for the unified feed
  name: z.string().min(1),
  description: z.string().nullable(),
  category: ProductCategorySchema,
  priceMinor: MoneySchema,
  currency: CurrencySchema,
  stockQty: z.number().int().nonnegative(),
  imageUrl: z.string().url().nullable(),
  isActive: z.boolean(),
});
export type Product = z.infer<typeof ProductSchema>;

export const CreateProductSchema = ProductSchema.pick({
  name: true, description: true, category: true,
  priceMinor: true, currency: true, stockQty: true, imageUrl: true,
});
export const UpdateProductSchema = CreateProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

/** Unified cross-shop feed query. */
export const ProductFeedQuerySchema = PaginationQuerySchema.extend({
  q: z.string().optional(),
  category: ProductCategorySchema.optional(),
  shopId: IdSchema.optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
});
export type ProductFeedQuery = z.infer<typeof ProductFeedQuerySchema>;

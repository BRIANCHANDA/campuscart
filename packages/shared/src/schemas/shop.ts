import { z } from "zod";
import { CoordinatesSchema, IdSchema } from "./common";

export const ShopSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  address: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  /** Pickup point — where couriers collect and shoppers find the shop. */
  location: CoordinatesSchema,
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});
export type Shop = z.infer<typeof ShopSchema>;

export const CreateShopSchema = ShopSchema.pick({ name: true, description: true }).extend({
  address: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  location: CoordinatesSchema.optional(),
});
export const UpdateShopSchema = CreateShopSchema.partial().extend({
  isActive: z.boolean().optional(),
});

import { z } from "zod";
import { CoordinatesSchema, IdSchema, MoneySchema, PaginationQuerySchema } from "./common";

export const CourierVerificationSchema = z.enum(["pending", "verified", "rejected", "suspended"]);

export const CourierSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  verificationStatus: CourierVerificationSchema,
  isAvailable: z.boolean(),
  vehicleType: z.enum(["foot", "bicycle", "motorbike", "car"]),
  nrcNumber: z.string().nullable(), // national ID captured during verification
});
export type Courier = z.infer<typeof CourierSchema>;

export const DeliveryStatusSchema = z.enum([
  "pending_dispatch", // order confirmed, no courier yet
  "dispatched",       // Yango request created + courier linked
  "picked_up",
  "delivered",
  "failed",
  "cancelled",
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

export const DeliverySchema = z.object({
  id: IdSchema,
  orderId: IdSchema,
  courierId: IdSchema.nullable(),
  yangoRequestId: z.string().nullable(),
  status: DeliveryStatusSchema,
  pickup: CoordinatesSchema,
  dropoff: CoordinatesSchema,
  feeMinor: MoneySchema,
  courierLocation: CoordinatesSchema.nullable(), // last known, for live map
  updatedAt: z.string().datetime(),
});
export type Delivery = z.infer<typeof DeliverySchema>;

export const DeliveryListQuerySchema = PaginationQuerySchema.extend({
  status: DeliveryStatusSchema.optional(),
});

export const RegisterCourierSchema = z.object({
  vehicleType: CourierSchema.shape.vehicleType,
  nrcNumber: z.string().min(5),
});

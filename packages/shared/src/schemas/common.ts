import { z } from "zod";

/** Every list endpoint accepts these query params. */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/** Every list endpoint returns this envelope. */
export const paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });

/** The single error shape used across the whole API. */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),          // machine-readable, e.g. "NOT_FOUND", "FORBIDDEN"
    message: z.string(),       // human-readable
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const IdSchema = z.string().uuid();
export const MoneySchema = z.number().int().nonnegative(); // minor units (ngwee/cents)
export const CurrencySchema = z.enum(["ZMW", "USD"]).default("ZMW");
export const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

/**
 * Coordinates for somewhere that actually exists.
 *
 * (0, 0) is a valid lat/lng in the Gulf of Guinea and is exactly what an
 * unset/zeroed field looks like — but it is ~2,500km from Zambia, so a shop
 * or delivery landing there silently wrecks distance-based courier
 * assignment and delivery-fee estimates. Reject it at the write boundary
 * rather than debugging the arithmetic later.
 */
export const PlacedCoordinatesSchema = CoordinatesSchema.refine(
  (c) => c.lat !== 0 || c.lng !== 0,
  { message: "Coordinates (0, 0) are almost certainly unset — provide the real location" },
);

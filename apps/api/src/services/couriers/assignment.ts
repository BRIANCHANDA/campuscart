import { and, eq } from "drizzle-orm";
import type { Coordinates } from "@campuscart/shared";
import type { db as Db } from "../../db";
import { couriers } from "../../db/schema";
import { badRequest } from "../../lib/errors";
import { logger } from "../../lib/logger";

/** Location reports older than this are treated as unknown position. */
const LOCATION_FRESHNESS_MS = 15 * 60 * 1000;

/** Great-circle distance in metres (haversine). Exported for unit tests. */
export function haversineMeters(a: Coordinates, b: Coordinates): number {
  const R = 6_371_000;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type CourierRow = typeof couriers.$inferSelect;

/**
 * Pure ranking: nearest courier with a fresh location wins; couriers without
 * a usable position rank behind all located ones (registration order among
 * themselves), so the strategy degrades gracefully to first-available.
 * Exported for unit tests.
 */
export function rankCouriers(
  candidates: CourierRow[],
  pickup: Coordinates,
  now: number = Date.now(),
): CourierRow[] {
  const distance = (c: CourierRow): number => {
    const fresh =
      c.lastLat !== null && c.lastLng !== null && c.lastSeenAt !== null &&
      now - c.lastSeenAt.getTime() <= LOCATION_FRESHNESS_MS;
    return fresh ? haversineMeters({ lat: c.lastLat!, lng: c.lastLng! }, pickup) : Infinity;
  };
  return [...candidates].sort((a, b) => distance(a) - distance(b));
}

/**
 * Pick the courier for a dispatch: nearest available verified courier to the
 * shop's pickup point. Swappable strategy — the pipeline only ever receives a
 * courierId, so replacing this with round-robin/zones touches one function.
 */
export async function assignCourier(db: typeof Db, pickup: Coordinates): Promise<CourierRow> {
  const candidates = await db
    .select()
    .from(couriers)
    .where(and(eq(couriers.verificationStatus, "verified"), eq(couriers.isAvailable, true)));

  const [best] = rankCouriers(candidates, pickup);
  if (!best) throw badRequest("NO_COURIER_AVAILABLE", "No verified courier is currently available");

  logger.info("courier.assigned", {
    courierId: best.id,
    located: best.lastLat !== null,
    candidates: candidates.length,
  });
  return best;
}

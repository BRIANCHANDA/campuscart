import type { Coordinates } from "@campuscart/shared";

/**
 * All delivery-dispatch calls go through this interface.
 * Yango is the production implementation; MockDeliveryProvider is used in tests/dev.
 * Swapping providers later means writing one new class, nothing else changes.
 */
export interface DeliveryRequestInput {
  externalOrderId: string;   // our order id, sent as the provider's external reference
  pickup: Coordinates;
  pickupAddress: string;
  dropoff: Coordinates;
  dropoffAddress: string;
  comment?: string;
}

export interface DeliveryEstimate {
  feeMinor: number;
  currency: string;
  etaMinutes: number | null;
}

export type ProviderDeliveryStatus =
  | "created" | "courier_assigned" | "picked_up" | "delivered" | "cancelled" | "failed";

export interface DeliveryTracking {
  requestId: string;
  status: ProviderDeliveryStatus;
  courierLocation: Coordinates | null;
}

export interface DeliveryProvider {
  readonly name: string;
  estimate(input: DeliveryRequestInput): Promise<DeliveryEstimate>;
  createRequest(input: DeliveryRequestInput): Promise<{ requestId: string }>;
  track(requestId: string): Promise<DeliveryTracking>;
  cancel(requestId: string): Promise<void>;
}

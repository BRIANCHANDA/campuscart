import { env } from "../../env";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import type {
  DeliveryEstimate,
  DeliveryProvider,
  DeliveryRequestInput,
  DeliveryTracking,
  ProviderDeliveryStatus,
} from "./provider";

/**
 * Yango Delivery client — API-based integration (not the widget) for full
 * programmatic control: fare estimates, request creation, driver tracking.
 *
 * Credentials (API key + Client ID / "Clid") live server-side only, injected
 * from env. They are never serialised into any response or client bundle.
 *
 * NOTE: endpoint paths follow Yango's B2B cargo-claims style API. Verify the
 * exact paths/payloads against the partner documentation issued with your
 * credentials before going live — Yango revises these per region/contract.
 */
export class YangoClient implements DeliveryProvider {
  readonly name = "yango";

  constructor(
    private readonly cfg = {
      baseUrl: env.YANGO_API_BASE_URL,
      apiKey: env.YANGO_API_KEY,
      clientId: env.YANGO_CLIENT_ID,
    },
  ) {}

  private async call<T>(path: string, body: unknown): Promise<T> {
    const started = Date.now();
    const res = await fetch(`${this.cfg.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.cfg.apiKey}`,
        "X-Client-Id": this.cfg.clientId,
      },
      body: JSON.stringify(body),
    });
    logger.info("yango.call", { path, status: res.status, ms: Date.now() - started });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.error("yango.error", { path, status: res.status, body: text.slice(0, 500) });
      throw new AppError(502, "YANGO_ERROR", `Yango request failed (${res.status})`);
    }
    return (await res.json()) as T;
  }

  private routePoints(input: DeliveryRequestInput) {
    return [
      {
        type: "source",
        coordinates: [input.pickup.lng, input.pickup.lat],
        fullname: input.pickupAddress,
      },
      {
        type: "destination",
        coordinates: [input.dropoff.lng, input.dropoff.lat],
        fullname: input.dropoffAddress,
      },
    ];
  }

  async estimate(input: DeliveryRequestInput): Promise<DeliveryEstimate> {
    const data = await this.call<{ price: string; currency: string; eta?: number }>(
      "/b2b/cargo/integration/v2/check-price",
      { route_points: this.routePoints(input) },
    );
    return {
      feeMinor: Math.round(parseFloat(data.price) * 100),
      currency: data.currency,
      etaMinutes: data.eta ?? null,
    };
  }

  async createRequest(input: DeliveryRequestInput): Promise<{ requestId: string }> {
    const data = await this.call<{ id: string }>(
      "/b2b/cargo/integration/v2/claims/create",
      {
        external_order_id: input.externalOrderId,
        route_points: this.routePoints(input),
        comment: input.comment ?? "",
      },
    );
    logger.info("yango.claim_created", { orderId: input.externalOrderId, requestId: data.id });
    return { requestId: data.id };
  }

  async track(requestId: string): Promise<DeliveryTracking> {
    const data = await this.call<{
      status: string;
      performer_position?: { lat: number; lon: number };
    }>("/b2b/cargo/integration/v2/claims/info", { claim_id: requestId });

    const map: Record<string, ProviderDeliveryStatus> = {
      new: "created",
      performer_found: "courier_assigned",
      pickuped: "picked_up",
      delivered: "delivered",
      delivered_finish: "delivered",
      cancelled: "cancelled",
      failed: "failed",
    };
    return {
      requestId,
      status: map[data.status] ?? "created",
      courierLocation: data.performer_position
        ? { lat: data.performer_position.lat, lng: data.performer_position.lon }
        : null,
    };
  }

  async cancel(requestId: string): Promise<void> {
    await this.call("/b2b/cargo/integration/v2/claims/cancel", {
      claim_id: requestId,
      cancel_state: "free",
    });
  }
}

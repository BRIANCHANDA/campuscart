import type { Coordinates, DeliveryStatus, OrderStatus } from "@campuscart/shared";

/**
 * Pub/sub for realtime fan-out. The order pipeline and courier routes
 * publish; the WebSocket gateway subscribes and forwards to clients.
 *
 * In-process by default. When REDIS_URL is set, a Redis pub/sub bridge
 * mirrors every event across API replicas (see below), so horizontal scaling
 * needs zero publisher or gateway changes — just point the replicas at the
 * same Redis.
 */
export interface OrderEvent {
  kind: "order.status";
  orderId: string;
  status: OrderStatus;
}

export interface DeliveryEvent {
  kind: "delivery.update";
  orderId: string;
  status?: DeliveryStatus;
  courierLocation?: Coordinates;
}

export interface PaymentEvent {
  kind: "payment.update";
  orderId: string;
  status: "succeeded" | "failed" | "refunded";
}

export type RealtimeEvent = OrderEvent | DeliveryEvent | PaymentEvent;

type Listener = (event: RealtimeEvent) => void;

const listeners = new Set<Listener>();

function deliverLocally(event: RealtimeEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // A broken subscriber must never take down a request path
    }
  }
}

/**
 * Redis pub/sub bridge, active when REDIS_URL is configured: every publish
 * also goes to the `campuscart:events` channel, and events from OTHER API
 * replicas are delivered to local subscribers. A WebSocket client connected
 * to replica A therefore still receives events produced on replica B.
 *
 * Loopback guard: published frames carry this instance's id and are ignored
 * when they come back around, so local listeners fire exactly once.
 */
const INSTANCE_ID = crypto.randomUUID();
const CHANNEL = "campuscart:events";
type RedisPubLike = { publish(channel: string, message: string): Promise<unknown> };
let redisPub: RedisPubLike | null = null;

let bridgeEnabled: Promise<void> | null = null;

/**
 * Idempotent explicit initializer — the env-driven path calls this with
 * env.REDIS_URL; tests and ops tooling may call it directly (module init
 * order makes env snapshots unreliable inside a shared test process).
 */
export function enableRedisBridge(url: string): Promise<void> {
  bridgeEnabled ??= connectBridge(url);
  return bridgeEnabled;
}

async function connectBridge(url: string): Promise<void> {
  try {
    const { RedisClient } = await import("bun");
    const sub = new RedisClient(url);
    const pub = new RedisClient(url);
    await sub.subscribe(CHANNEL, (message: string) => {
      try {
        const frame = JSON.parse(message) as { from: string; event: RealtimeEvent };
        if (frame.from !== INSTANCE_ID) deliverLocally(frame.event);
      } catch {
        // ignore malformed frames from the channel
      }
    });
    redisPub = pub;
    const { logger } = await import("./logger");
    logger.info("events.bridge", { kind: "redis", channel: CHANNEL });
  } catch (err) {
    const { logger } = await import("./logger");
    logger.error("events.redis_unavailable", { message: String(err) });
  }
}

async function initFromEnv(): Promise<void> {
  const { env } = await import("../env");
  if (env.REDIS_URL) await enableRedisBridge(env.REDIS_URL);
}
const bridgeReady = initFromEnv();

export const realtime = {
  publish(event: RealtimeEvent): void {
    deliverLocally(event);
    // Fan out to other replicas; fire-and-forget so request paths never block
    if (redisPub) {
      void redisPub
        .publish(CHANNEL, JSON.stringify({ from: INSTANCE_ID, event }))
        .catch(() => {});
    }
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Await in tests to guarantee the Redis bridge finished initializing. */
  ready: (): Promise<void> => bridgeReady,
};

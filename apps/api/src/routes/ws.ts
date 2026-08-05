import { createBunWebSocket } from "hono/bun";
import type { WSContext } from "hono/ws";
import { and, eq } from "drizzle-orm";
import { verify } from "hono/jwt";
import { JwtClaimsSchema, type JwtClaims } from "@campuscart/shared";
import { db } from "../db";
import { couriers, deliveries, orders } from "../db/schema";
import { env } from "../env";
import { realtime, type RealtimeEvent } from "../lib/events";
import { logger } from "../lib/logger";

/**
 * Realtime gateway: clients subscribe per order and receive status + courier
 * location pushes, replacing the mobile app's 10s poll.
 *
 * Protocol (JSON frames):
 *   client → { type: "subscribe",   orderId }   (access-checked)
 *   client → { type: "unsubscribe", orderId }
 *   server → { type: "subscribed",  orderId }
 *   server → { type: "order.status",    orderId, status }
 *   server → { type: "delivery.update", orderId, status?, courierLocation? }
 *   server → { type: "error", code, message }
 *
 * Auth: `GET /ws?token=<JWT>` — React Native's WebSocket can't set headers
 * on the browser-compatible constructor, so the access token rides the query
 * string. Tokens are short-lived JWTs, and the connection is rejected before
 * upgrade completes if verification fails.
 */
const { upgradeWebSocket, websocket } = createBunWebSocket();
export { websocket }; // index.ts hands this to Bun.serve

// orderId → sockets watching it; WeakMap-free because we clean up on close
const rooms = new Map<string, Set<WSContext>>();
const socketRooms = new Map<WSContext, Set<string>>();

function join(ws: WSContext, orderId: string): void {
  if (!rooms.has(orderId)) rooms.set(orderId, new Set());
  rooms.get(orderId)!.add(ws);
  if (!socketRooms.has(ws)) socketRooms.set(ws, new Set());
  socketRooms.get(ws)!.add(orderId);
}

function leave(ws: WSContext, orderId?: string): void {
  const joined = socketRooms.get(ws);
  if (!joined) return;
  for (const id of orderId ? [orderId] : [...joined]) {
    rooms.get(id)?.delete(ws);
    if (rooms.get(id)?.size === 0) rooms.delete(id);
    joined.delete(id);
  }
  if (joined.size === 0) socketRooms.delete(ws);
}

// Single bus subscription fans out to whoever is in the room
realtime.subscribe((event: RealtimeEvent) => {
  const room = rooms.get(event.orderId);
  if (!room) return;
  const frame = JSON.stringify({ type: event.kind, ...event, kind: undefined });
  for (const ws of room) {
    try {
      ws.send(frame);
    } catch {
      leave(ws);
    }
  }
});

/** May this user watch this order? Mirrors the REST access rules. */
async function canWatch(claims: JwtClaims, orderId: string): Promise<boolean> {
  if (claims.role === "platform_admin") return true;

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return false;

  if (order.shopperId === claims.sub) return true;
  if (claims.role === "shop_admin" && claims.shopIds?.includes(order.shopId)) return true;

  if (claims.role === "courier") {
    const [row] = await db
      .select({ id: deliveries.id })
      .from(deliveries)
      .innerJoin(couriers, eq(deliveries.courierId, couriers.id))
      .where(and(eq(deliveries.orderId, orderId), eq(couriers.userId, claims.sub)))
      .limit(1);
    return Boolean(row);
  }
  return false;
}

const send = (ws: WSContext, payload: unknown): void => ws.send(JSON.stringify(payload));

export const wsHandler = upgradeWebSocket(async (c) => {
  // Authenticate BEFORE accepting frames
  let claims: JwtClaims | null = null;
  try {
    const token = c.req.query("token") ?? "";
    claims = JwtClaimsSchema.parse(await verify(token, env.JWT_SECRET, "HS256"));
  } catch {
    claims = null;
  }

  return {
    onOpen(_evt, ws) {
      if (!claims) {
        send(ws, { type: "error", code: "UNAUTHORIZED", message: "Invalid or missing token" });
        ws.close(4401, "unauthorized");
        return;
      }
      logger.info("ws.open", { userId: claims.sub, role: claims.role });
    },

    async onMessage(evt, ws) {
      if (!claims) return;
      let msg: { type?: string; orderId?: string };
      try {
        msg = JSON.parse(String(evt.data)) as typeof msg;
      } catch {
        send(ws, { type: "error", code: "BAD_FRAME", message: "Frames must be JSON" });
        return;
      }

      if (msg.type === "subscribe" && msg.orderId) {
        if (await canWatch(claims, msg.orderId)) {
          join(ws, msg.orderId);
          send(ws, { type: "subscribed", orderId: msg.orderId });
        } else {
          send(ws, { type: "error", code: "FORBIDDEN", message: "No access to this order" });
        }
      } else if (msg.type === "unsubscribe" && msg.orderId) {
        leave(ws, msg.orderId);
      } else {
        send(ws, { type: "error", code: "BAD_FRAME", message: "Unknown message type" });
      }
    },

    onClose(_evt, ws) {
      leave(ws);
    },
  };
});

import { useEffect, useRef, useState, type JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import type { Coordinates, Order, OrderStatus } from "@campuscart/shared";
import { api, wsUrl } from "../api/client";
import { Badge } from "../components/Badge";
import { theme, elevation, radii, spacing, fontSize, weights } from "../theme";

const STEPS: OrderStatus[] = ["placed", "preparing", "out_for_delivery", "delivered"];
const LABELS: Record<string, string> = {
  placed: "Placed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};
const STATUS_MESSAGE: Record<string, string> = {
  placed: "Your order has been placed",
  preparing: "The shop is preparing your order",
  out_for_delivery: "Your courier is on the way",
  delivered: "Delivered",
};

/** Slow fallback poll — only load-bearing when the socket is down. */
const FALLBACK_POLL_MS = 30_000;

/**
 * Live tracking: WebSocket-first (order status + courier location frames
 * pushed by the gateway), with a slow HTTP poll as the fallback so the screen
 * still works if the socket can't connect (captive portals, flaky campus
 * wifi). Delivery orders render a live map: shop + dropoff pins, and the
 * courier pin moving as location frames arrive.
 */
export function OrderTrackingScreen({ orderId }: { orderId: string }): JSX.Element {
  const [order, setOrder] = useState<Order | null>(null);
  const [courierPos, setCourierPos] = useState<Coordinates | null>(null);
  const [route, setRoute] = useState<{ pickup: Coordinates; dropoff: Coordinates } | null>(null);
  const [live, setLive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Initial snapshot + fallback poll
  useEffect(() => {
    let active = true;
    const load = (): void => {
      void api.tracking(orderId)
        .then((t) => {
          if (!active) return;
          setOrder(t.order);
          if (t.delivery) setRoute({ pickup: t.delivery.pickup, dropoff: t.delivery.dropoff });
          if (t.delivery?.courierLocation) setCourierPos(t.delivery.courierLocation);
        })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, FALLBACK_POLL_MS);
    return () => { active = false; clearInterval(timer); };
  }, [orderId]);

  // Realtime channel
  useEffect(() => {
    let closedByUs = false;
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setLive(true);
      ws.send(JSON.stringify({ type: "subscribe", orderId }));
    };
    ws.onmessage = (evt) => {
      try {
        const frame = JSON.parse(String(evt.data)) as {
          type: string; status?: string; courierLocation?: Coordinates;
        };
        if (frame.type === "order.status" && frame.status) {
          setOrder((prev) => (prev ? { ...prev, status: frame.status as OrderStatus } : prev));
        }
        if (frame.type === "delivery.update" && frame.courierLocation) {
          setCourierPos(frame.courierLocation);
        }
      } catch {
        // ignore malformed frames
      }
    };
    ws.onclose = () => { if (!closedByUs) setLive(false); }; // poll carries on
    ws.onerror = () => {};

    return () => {
      closedByUs = true;
      ws.close();
      wsRef.current = null;
    };
  }, [orderId]);

  if (!order) {
    return <View style={styles.loadingWrap}><Text style={styles.loadingText}>Loading order…</Text></View>;
  }

  const currentIdx = STEPS.indexOf(order.status);
  const showMap = route && order.fulfillmentType === "delivery" && order.status !== "cancelled";

  return (
    <View style={styles.container}>
      {showMap && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: (route.pickup.lat + route.dropoff.lat) / 2,
            longitude: (route.pickup.lng + route.dropoff.lng) / 2,
            latitudeDelta: Math.max(Math.abs(route.pickup.lat - route.dropoff.lat) * 2.5, 0.01),
            longitudeDelta: Math.max(Math.abs(route.pickup.lng - route.dropoff.lng) * 2.5, 0.01),
          }}
        >
          <Marker
            coordinate={{ latitude: route.pickup.lat, longitude: route.pickup.lng }}
            title="Shop" pinColor={theme.brand}
          />
          <Marker
            coordinate={{ latitude: route.dropoff.lat, longitude: route.dropoff.lng }}
            title="Dropoff" pinColor={theme.urgent}
          />
          {courierPos && order.status === "out_for_delivery" && (
            <Marker
              coordinate={{ latitude: courierPos.lat, longitude: courierPos.lng }}
              title="Courier" pinColor={theme.accent}
            />
          )}
          <Polyline
            coordinates={[
              { latitude: route.pickup.lat, longitude: route.pickup.lng },
              ...(courierPos && order.status === "out_for_delivery"
                ? [{ latitude: courierPos.lat, longitude: courierPos.lng }]
                : []),
              { latitude: route.dropoff.lat, longitude: route.dropoff.lng },
            ]}
            strokeColor={theme.brand}
            strokeWidth={3}
            lineDashPattern={[2, 9]}
          />
        </MapView>
      )}

      <View style={[styles.sheet, !showMap && styles.sheetNoMap]}>
        <View style={styles.grabber} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{STATUS_MESSAGE[order.status] ?? "Tracking your order"}</Text>
          <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
        </View>
        <Badge label={live ? "LIVE" : "Polling"} tone={live ? "success" : "locked"} />

        {order.status === "cancelled" ? (
          <Text style={styles.cancelled}>This order was cancelled.</Text>
        ) : (
          <View style={styles.steps}>
            {STEPS.map((step, i) => {
              const done = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <View key={step} style={styles.stepItem}>
                  <View style={styles.stepRow}>
                    <View
                      style={[
                        styles.dot,
                        (done || isCurrent) && styles.dotFilled,
                        isCurrent && styles.dotCurrent,
                      ]}
                    >
                      {done || isCurrent ? (
                        <Ionicons name="checkmark" size={13} color={theme.onBrand} />
                      ) : null}
                    </View>
                    {i < STEPS.length - 1 && (
                      <View style={[styles.connector, done && styles.connectorFilled]} />
                    )}
                  </View>
                  <Text style={[styles.stepLabel, (done || isCurrent) && styles.stepLabelActive]}>
                    {LABELS[step]}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const MAP_HEIGHT = 300;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surfaceBg },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: theme.textSecondary, fontSize: fontSize.body },
  map: { height: MAP_HEIGHT, width: "100%" },
  sheet: {
    marginTop: -radii.xl, backgroundColor: theme.surfaceCard,
    borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl,
    padding: spacing.s5, flex: 1, ...elevation[3],
  },
  sheetNoMap: { marginTop: 0, borderRadius: 0 },
  grabber: { width: 40, height: 4, borderRadius: 999, backgroundColor: theme.border, alignSelf: "center", marginBottom: spacing.s4 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.s2 },
  sheetTitle: { fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: theme.textPrimary, flexShrink: 1 },
  orderId: { fontSize: fontSize.xs, color: theme.textMuted },
  steps: { flexDirection: "row", marginTop: spacing.s6 },
  stepItem: { flex: 1, alignItems: "center" },
  stepRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  dot: {
    width: 26, height: 26, borderRadius: 999, backgroundColor: theme.surfaceInset,
    borderWidth: 2, borderColor: theme.border, alignItems: "center", justifyContent: "center",
    marginLeft: "auto", marginRight: "auto",
  },
  dotFilled: { backgroundColor: theme.brand, borderColor: theme.brand },
  dotCurrent: { shadowColor: theme.brand, shadowOpacity: 0, borderColor: theme.brand },
  connector: { position: "absolute", left: "50%", right: "-50%", height: 2, backgroundColor: theme.border, top: 12 },
  connectorFilled: { backgroundColor: theme.brand },
  stepLabel: { fontSize: 10, fontWeight: weights.medium as "500", color: theme.textMuted, marginTop: spacing.s2, textAlign: "center" },
  stepLabelActive: { color: theme.textPrimary, fontWeight: weights.semibold as "600" },
  cancelled: { color: theme.criticalInk, marginTop: spacing.s4, fontWeight: weights.semibold as "600" },
});

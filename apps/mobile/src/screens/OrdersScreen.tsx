import { useCallback, useEffect, useState, type JSX } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Order, OrderStatus } from "@campuscart/shared";
import { api } from "../api/client";
import { Badge, type BadgeTone } from "../components/Badge";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { theme, spacing, fontSize, weights } from "../theme";

const formatKwacha = (minor: number): string => `K${(minor / 100).toFixed(2)}`;

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  ready_for_pickup: "Ready for pickup",
  delivered: "Delivered",
  completed: "Collected",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  placed: "info",
  preparing: "urgent",
  out_for_delivery: "success",
  ready_for_pickup: "accent",
  delivered: "success",
  completed: "success",
  cancelled: "critical",
};

const ACTIVE: OrderStatus[] = ["placed", "preparing", "out_for_delivery", "ready_for_pickup"];

const formatWhen = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const dayMs = 86_400_000;
  const dayDiff = Math.floor((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / dayMs);
  if (dayDiff === 0) return `today, ${time}`;
  if (dayDiff === 1) return `yesterday, ${time}`;
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${time}`;
};

/** Shopper order history; tapping an active order opens live tracking. */
export function OrdersScreen({
  onOpenOrder, onReordered,
}: {
  onOpenOrder: (orderId: string) => void;
  onReordered: (cartId: string) => void;
}): JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reordering, setReordering] = useState<string | null>(null);

  const load = useCallback((): void => {
    setRefreshing(true);
    void api.myOrders()
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(load, [load]);

  const reorder = async (order: Order): Promise<void> => {
    setReordering(order.id);
    try {
      let cartId: string | null = null;
      for (const item of order.items) {
        const cart = await api.addToCart(item.productId, item.qty);
        cartId = cart.id;
      }
      if (cartId) onReordered(cartId);
    } catch {
      // best-effort — a sold-out item just won't be re-added
    } finally {
      setReordering(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.brand} />}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders yet" subtitle="When you order from a campus shop, it'll show up here." />}
        renderItem={({ item }) => {
          const isActive = ACTIVE.includes(item.status);
          const firstItem = item.items[0];
          const summary = item.items.length > 1
            ? `${firstItem?.productName ?? ""} +${item.items.length - 1} items`
            : firstItem?.productName ?? "";
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
                <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
              </View>
              <Text style={styles.summary}>{summary}</Text>
              <Text style={styles.meta}>{formatWhen(item.createdAt)}</Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.price, item.status === "cancelled" && styles.priceStruck]}>
                  {formatKwacha(item.totalMinor)}
                </Text>
                {isActive ? (
                  <TouchableOpacity style={styles.trackBtn} onPress={() => onOpenOrder(item.id)}>
                    <Text style={styles.trackText}>Track</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.reorderBtn}
                    onPress={() => void reorder(item)}
                    disabled={reordering === item.id}
                  >
                    <Ionicons name="refresh-outline" size={14} color={theme.textPrimary} />
                    <Text style={styles.reorderText}>{reordering === item.id ? "Adding…" : "Reorder"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.s2 },
  title: { fontSize: fontSize.h1, fontWeight: weights.bold as "700", color: theme.textPrimary, paddingHorizontal: spacing.screenPad, marginBottom: spacing.s3 },
  list: { paddingHorizontal: spacing.screenPad, gap: spacing.s3 },
  card: { marginBottom: spacing.s3 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.s2 },
  orderId: { fontSize: fontSize.xs, color: theme.textMuted, fontWeight: weights.medium as "500" },
  summary: { fontSize: fontSize.bodyLg, fontWeight: weights.semibold as "600", color: theme.textPrimary },
  meta: { fontSize: fontSize.sm, color: theme.textMuted, marginTop: 3, marginBottom: spacing.s3 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price: { fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: theme.textPrimary },
  priceStruck: { color: theme.textMuted, textDecorationLine: "line-through" },
  trackBtn: { height: 38, paddingHorizontal: spacing.s4, borderRadius: 999, backgroundColor: theme.brand, alignItems: "center", justifyContent: "center" },
  trackText: { color: theme.onBrand, fontSize: fontSize.sm, fontWeight: weights.semibold as "600" },
  reorderBtn: {
    height: 38, paddingHorizontal: spacing.s4, borderRadius: 999, borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.surfaceCard, flexDirection: "row", alignItems: "center", gap: 6,
  },
  reorderText: { color: theme.textPrimary, fontSize: fontSize.sm, fontWeight: weights.semibold as "600" },
});

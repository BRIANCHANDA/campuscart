import { useCallback, useEffect, useState, type JSX } from "react";
import {
  FlatList, Linking, RefreshControl, StyleSheet, Switch, Text, TouchableOpacity, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import type { Delivery, DeliveryStatus, User } from "@campuscart/shared";
import { api, ApiClientError } from "../api/client";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ProfileScreen } from "./ProfileScreen";
import { TabBar, type TabItem } from "../components/TabBar";
import { colors, theme, elevation, radii, spacing, fontSize, weights } from "../theme";

const formatKwacha = (minor: number): string => `K${(minor / 100).toFixed(2)}`;

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  pending_dispatch: "Waiting",
  dispatched: "Head to the shop",
  picked_up: "Deliver to shopper",
  delivered: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
};

const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

type CourierTab = "jobs" | "active" | "earnings" | "profile";
const TABS: TabItem<CourierTab>[] = [
  { key: "jobs", label: "Jobs", icon: "bicycle-outline" },
  { key: "active", label: "Active", icon: "navigate-outline" },
  { key: "earnings", label: "Earnings", icon: "wallet-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
];

/**
 * Courier home: go online, work active deliveries, watch earnings.
 * Location pushes piggyback on pickup/complete for now; continuous GPS
 * streaming lands with the realtime milestone.
 */
export function CourierScreen({ user, onSignOut, onUserUpdated }: { user: User; onSignOut: () => void; onUserUpdated?: (u: User) => void }): JSX.Element {
  const [tab, setTab] = useState<CourierTab>("jobs");
  const [online, setOnline] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [payouts, setPayouts] = useState({ pendingMinor: 0, settledMinor: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback((): void => {
    setRefreshing(true);
    void Promise.allSettled([api.courier.myDeliveries(), api.courier.payouts()])
      .then(([d, p]) => {
        if (d.status === "fulfilled") setDeliveries(d.value.data);
        if (p.status === "fulfilled") setPayouts(p.value);
      })
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(load, [load]);

  const toggleOnline = async (next: boolean): Promise<void> => {
    setNotice(null);
    try {
      const res = await api.courier.setAvailability(next);
      setOnline(res.isAvailable);
    } catch (e) {
      // Most common cause: verification still pending with the platform team
      setNotice(e instanceof ApiClientError ? e.message : "Could not update availability");
    }
  };

  const act = async (d: Delivery): Promise<void> => {
    setNotice(null);
    try {
      if (d.status === "dispatched") await api.courier.pickup(d.id);
      else if (d.status === "picked_up") await api.courier.complete(d.id);
      load();
    } catch (e) {
      setNotice(e instanceof ApiClientError ? e.message : "Action failed — refresh and retry");
    }
  };

  const navigateTo = (coord: { lat: number; lng: number }): void => {
    void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${coord.lat},${coord.lng}`);
  };

  const active = deliveries.filter((d) => d.status === "dispatched" || d.status === "picked_up");
  const past = deliveries.filter((d) => d.status !== "dispatched" && d.status !== "picked_up");
  const featuredActive = active[0] ?? null;

  if (tab === "profile") {
    return (
      <View style={styles.screen}>
        <View style={styles.body}><ProfileScreen user={user} onSignOut={onSignOut} onUserUpdated={onUserUpdated} /></View>
        <TabBar items={TABS} active={tab} onChange={setTab} />
      </View>
    );
  }

  if (tab === "active") {
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          {!featuredActive ? (
            <EmptyState icon="navigate-outline" title="No active delivery" subtitle="Accepted jobs will show up here once you're dispatched." />
          ) : (
            <>
              <MapView
                style={styles.activeMap}
                initialRegion={{
                  latitude: (featuredActive.pickup.lat + featuredActive.dropoff.lat) / 2,
                  longitude: (featuredActive.pickup.lng + featuredActive.dropoff.lng) / 2,
                  latitudeDelta: Math.max(Math.abs(featuredActive.pickup.lat - featuredActive.dropoff.lat) * 2.5, 0.01),
                  longitudeDelta: Math.max(Math.abs(featuredActive.pickup.lng - featuredActive.dropoff.lng) * 2.5, 0.01),
                }}
              >
                <Marker coordinate={{ latitude: featuredActive.pickup.lat, longitude: featuredActive.pickup.lng }} title="Pickup" pinColor={theme.brand} />
                <Marker coordinate={{ latitude: featuredActive.dropoff.lat, longitude: featuredActive.dropoff.lng }} title="Dropoff" pinColor={theme.urgent} />
              </MapView>
              <View style={styles.activeSheet}>
                <View style={styles.activeHeader}>
                  <Badge
                    label={featuredActive.status === "dispatched" ? "Heading to pickup" : "Delivering"}
                    tone={featuredActive.status === "dispatched" ? "urgent" : "success"}
                  />
                  <Text style={styles.orderId}>#{featuredActive.orderId.slice(0, 8)}</Text>
                </View>
                <Text style={styles.feeText}>Fee {formatKwacha(featuredActive.feeMinor)}</Text>
                {notice && <Text style={styles.notice}>{notice}</Text>}
                <View style={styles.activeActions}>
                  <TouchableOpacity
                    style={styles.navigateBtn}
                    onPress={() => navigateTo(featuredActive.status === "dispatched" ? featuredActive.pickup : featuredActive.dropoff)}
                  >
                    <Ionicons name="navigate-outline" size={16} color={theme.textPrimary} />
                    <Text style={styles.navigateText}>Navigate</Text>
                  </TouchableOpacity>
                  <Button
                    title={featuredActive.status === "dispatched" ? "Picked up — start delivery" : "Delivered"}
                    onPress={() => void act(featuredActive)}
                    style={styles.completeBtn}
                  />
                </View>
              </View>
            </>
          )}
        </View>
        <TabBar items={TABS} active={tab} onChange={setTab} />
      </View>
    );
  }

  if (tab === "earnings") {
    const recent = [...deliveries]
      .filter((d) => d.status === "delivered")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 8);
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          <Text style={styles.title}>Earnings</Text>
          <View style={styles.earnScroll}>
            <View style={styles.earnHero}>
              <Text style={styles.earnHeroLabel}>Pending payout</Text>
              <Text style={styles.earnHeroValue}>{formatKwacha(payouts.pendingMinor)}</Text>
            </View>
            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={[styles.statValue, { color: theme.urgentInk }]}>{formatKwacha(payouts.pendingMinor)}</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statLabel}>Settled</Text>
                <Text style={[styles.statValue, { color: theme.successInk }]}>{formatKwacha(payouts.settledMinor)}</Text>
              </Card>
            </View>
            <Text style={styles.sectionLabel}>Recent deliveries</Text>
            {recent.length === 0 ? (
              <Text style={styles.emptyHint}>No completed deliveries yet.</Text>
            ) : recent.map((d) => (
              <View key={d.id} style={styles.paymentRow}>
                <View style={styles.paymentIcon}>
                  <Ionicons name="checkmark" size={17} color={theme.successInk} />
                </View>
                <View style={styles.paymentBody}>
                  <Text style={styles.paymentId}>#{d.orderId.slice(0, 8)}</Text>
                  <Text style={styles.paymentMeta}>Delivered</Text>
                </View>
                <Text style={styles.paymentAmount}>+{formatKwacha(d.feeMinor)}</Text>
              </View>
            ))}
          </View>
        </View>
        <TabBar items={TABS} active={tab} onChange={setTab} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials(user.fullName)}</Text></View>
            <Text style={styles.name}>{user.fullName}</Text>
          </View>
          <View style={styles.onlineRow}>
            <Text style={styles.onlineLabel}>{online ? "Online" : "Offline"}</Text>
            <Switch value={online} onValueChange={(v) => void toggleOnline(v)} trackColor={{ true: theme.brand }} />
          </View>
        </View>

        {notice && (
          <View style={styles.noticeBanner}>
            <Ionicons name="time-outline" size={20} color={theme.urgentInk} />
            <Text style={styles.noticeBannerText}>{notice}</Text>
          </View>
        )}

        <View style={styles.payoutCard}>
          <View style={styles.payoutCol}>
            <Text style={styles.payoutLabel}>Pending</Text>
            <Text style={styles.payoutValue}>{formatKwacha(payouts.pendingMinor)}</Text>
          </View>
          <View style={styles.payoutCol}>
            <Text style={styles.payoutLabel}>Settled</Text>
            <Text style={styles.payoutValue}>{formatKwacha(payouts.settledMinor)}</Text>
          </View>
        </View>

        <FlatList
          data={[...active, ...past]}
          keyExtractor={(d) => d.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.brand} />}
          ListEmptyComponent={<EmptyState icon="bicycle-outline" title="No deliveries yet" subtitle="Go online to get assigned." />}
          renderItem={({ item }) => {
            const actionable = item.status === "dispatched" || item.status === "picked_up";
            return (
              <Card style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <Text style={styles.deliveryId}>#{item.id.slice(0, 8)}</Text>
                  <Text style={styles.jobFee}>{formatKwacha(item.feeMinor)}</Text>
                </View>
                <Text style={styles.meta}>{STATUS_LABEL[item.status]}</Text>
                {actionable && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => void act(item)}>
                    <Text style={styles.actionText}>
                      {item.status === "dispatched" ? "Picked up" : "Delivered"}
                    </Text>
                  </TouchableOpacity>
                )}
              </Card>
            );
          }}
        />
      </View>
      <TabBar items={TABS} active={tab} onChange={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, padding: spacing.screenPad },
  title: { fontSize: fontSize.h1, fontWeight: weights.bold as "700", color: theme.textPrimary, marginBottom: spacing.s4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.s4 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.s3 },
  avatar: { width: 46, height: 46, borderRadius: 999, backgroundColor: theme.successTint, alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: weights.bold as "700", color: theme.successInk, fontSize: fontSize.body },
  name: { fontSize: fontSize.bodyLg, fontWeight: weights.bold as "700", color: theme.textPrimary },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: spacing.s2 },
  onlineLabel: { color: theme.textSecondary, fontWeight: weights.semibold as "600", fontSize: fontSize.sm },
  noticeBanner: {
    flexDirection: "row", gap: spacing.s3, padding: spacing.s4, backgroundColor: theme.urgentTint,
    borderRadius: radii.md, marginBottom: spacing.s4, alignItems: "flex-start",
  },
  noticeBannerText: { flex: 1, color: theme.urgentInk, fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.4 },
  payoutCard: {
    flexDirection: "row", backgroundColor: theme.brandDeep, borderRadius: radii.lg, padding: spacing.s4, marginBottom: spacing.s4,
  },
  payoutCol: { flex: 1 },
  payoutLabel: { color: colors.green200, fontSize: fontSize.xs },
  payoutValue: { color: theme.onBrand, fontSize: fontSize.h2, fontWeight: weights.bold as "700", marginTop: 2 },
  jobCard: { marginBottom: spacing.s3 },
  jobHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  deliveryId: { fontSize: fontSize.sm, color: theme.textMuted },
  jobFee: { fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: theme.textPrimary },
  meta: { color: theme.textSecondary, marginBottom: spacing.s3, fontSize: fontSize.sm },
  actionBtn: { backgroundColor: theme.brand, borderRadius: radii.sm, paddingVertical: spacing.s2, alignItems: "center" },
  actionText: { color: theme.onBrand, fontWeight: weights.bold as "700" },
  activeMap: { height: 250, width: "100%" },
  activeSheet: { flex: 1, marginTop: -radii.xl, backgroundColor: theme.surfaceCard, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.s5, ...elevation[3] },
  activeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.s2 },
  orderId: { fontSize: fontSize.xs, color: theme.textMuted },
  feeText: { fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: theme.textPrimary, marginBottom: spacing.s4 },
  notice: { color: theme.criticalInk, marginBottom: spacing.s3 },
  activeActions: { flexDirection: "row", gap: spacing.s3, marginTop: "auto" },
  navigateBtn: {
    flex: 1, flexDirection: "row", gap: spacing.s2, alignItems: "center", justifyContent: "center",
    height: 52, borderRadius: radii.md, borderWidth: 1, borderColor: theme.border,
  },
  navigateText: { color: theme.textPrimary, fontWeight: weights.semibold as "600" },
  completeBtn: { flex: 2 },
  earnScroll: { flex: 1 },
  earnHero: { backgroundColor: theme.brandDeep, borderRadius: radii.xl, padding: spacing.s5, marginBottom: spacing.s4, ...elevation.brand },
  earnHeroLabel: { color: colors.green200, fontSize: fontSize.sm, marginBottom: spacing.s2 },
  earnHeroValue: { color: theme.onBrand, fontSize: fontSize.display, fontWeight: weights.bold as "700" },
  statsRow: { flexDirection: "row", gap: spacing.s3, marginBottom: spacing.s5 },
  statCard: { flex: 1 },
  statLabel: { fontSize: fontSize.xs, color: theme.textMuted, marginBottom: spacing.s1 },
  statValue: { fontSize: fontSize.h3, fontWeight: weights.bold as "700" },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: weights.semibold as "600", color: theme.textSecondary, marginBottom: spacing.s3 },
  emptyHint: { color: theme.textMuted, fontSize: fontSize.sm },
  paymentRow: { flexDirection: "row", alignItems: "center", gap: spacing.s3, paddingVertical: spacing.s2, borderBottomWidth: 1, borderBottomColor: theme.borderFaint },
  paymentIcon: { width: 38, height: 38, borderRadius: radii.sm, backgroundColor: theme.successTint, alignItems: "center", justifyContent: "center" },
  paymentBody: { flex: 1 },
  paymentId: { fontSize: fontSize.sm, fontWeight: weights.semibold as "600", color: theme.textPrimary },
  paymentMeta: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 2 },
  paymentAmount: { fontSize: fontSize.body, fontWeight: weights.bold as "700", color: theme.successInk },
});

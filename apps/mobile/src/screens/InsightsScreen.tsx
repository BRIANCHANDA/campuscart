import { useCallback, useEffect, useState, type JSX } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { colors, theme, elevation, radii, spacing, fontSize, weights } from "../theme";

const formatKwacha = (minor: number): string => `K${(minor / 100).toFixed(2)}`;
const formatK = (minor: number): string => {
  const k = minor / 100;
  return k >= 1000 ? `K${(k / 1000).toFixed(1)}k` : `K${Math.round(k)}`;
};

type Analytics = {
  rangeDays: number;
  totalOrders: number; totalRevenueMinor: number; avgOrderValueMinor: number;
  series: { date: string; orders: number; revenueMinor: number }[];
  topProducts: { productId: string; name: string; units: number; revenueMinor: number }[];
};

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

/** Shop analytics: revenue trend over time + best-selling products. */
export function InsightsScreen({ shopId }: { shopId: string }): JSX.Element {
  const [days, setDays] = useState<number>(7);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((): void => {
    setRefreshing(true);
    void api.shopAdmin.analytics(shopId, days)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [shopId, days]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.brand} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Insights</Text>

      {/* Range selector */}
      <View style={styles.rangeRow}>
        {RANGES.map((r) => {
          const active = days === r.days;
          return (
            <TouchableOpacity
              key={r.days}
              style={[styles.rangeChip, active && styles.rangeChipActive]}
              onPress={() => setDays(r.days)}
            >
              <Text style={[styles.rangeText, active && styles.rangeTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.s10 }} color={theme.brand} />
      ) : !data ? (
        <EmptyState icon="bar-chart-outline" title="No data yet" subtitle="Insights appear once you have orders." />
      ) : (
        <>
          {/* Summary tiles */}
          <View style={styles.summaryRow}>
            <Summary label={`Revenue · ${data.rangeDays}d`} value={formatKwacha(data.totalRevenueMinor)} accent />
            <Summary label="Orders" value={String(data.totalOrders)} />
          </View>
          <View style={styles.summaryRow}>
            <Summary label="Avg order" value={formatKwacha(data.avgOrderValueMinor)} />
            <Summary label="Per day" value={formatKwacha(Math.round(data.totalRevenueMinor / Math.max(data.rangeDays, 1)))} />
          </View>

          {/* Revenue trend chart */}
          <Card style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Revenue trend</Text>
            <RevenueChart series={data.series} />
          </Card>

          {/* Top products */}
          <Text style={styles.sectionHeading}>Best sellers</Text>
          {data.topProducts.length === 0 ? (
            <Text style={styles.emptyHint}>No product sales in this period.</Text>
          ) : (
            <Card style={styles.productsCard}>
              {data.topProducts.map((p, i) => {
                const max = data.topProducts[0]!.revenueMinor || 1;
                return (
                  <View key={p.productId} style={[styles.prodRow, i > 0 && styles.prodRowBorder]}>
                    <View style={styles.rank}><Text style={styles.rankText}>{i + 1}</Text></View>
                    <View style={styles.prodBody}>
                      <View style={styles.prodTop}>
                        <Text style={styles.prodName} numberOfLines={1}>{p.name}</Text>
                        <Text style={styles.prodRev}>{formatKwacha(p.revenueMinor)}</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${Math.max((p.revenueMinor / max) * 100, 4)}%` }]} />
                      </View>
                      <Text style={styles.prodUnits}>{p.units} sold</Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Summary({ label, value, accent }: { label: string; value: string; accent?: boolean }): JSX.Element {
  return (
    <View style={[styles.summaryTile, accent && styles.summaryTileAccent]}>
      <Text style={[styles.summaryLabel, accent && styles.summaryLabelAccent]}>{label}</Text>
      <Text style={[styles.summaryValue, accent && styles.summaryValueAccent]}>{value}</Text>
    </View>
  );
}

/** Dependency-free daily bar chart. Bars scale to the peak-revenue day. */
function RevenueChart({ series }: { series: Analytics["series"] }): JSX.Element {
  const max = Math.max(...series.map((s) => s.revenueMinor), 1);
  // Label every Nth bar so a 30/90-day axis stays readable.
  const labelEvery = series.length <= 10 ? 1 : Math.ceil(series.length / 6);
  return (
    <View>
      <View style={styles.chart}>
        {series.map((s, i) => {
          const h = Math.max((s.revenueMinor / max) * 100, s.revenueMinor > 0 ? 6 : 2);
          const isPeak = s.revenueMinor === max && max > 0;
          return (
            <View key={s.date} style={styles.barCol}>
              <View style={styles.barArea}>
                <View style={[styles.bar, { height: `${h}%` }, isPeak && styles.barPeak]} />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>
                {i % labelEvery === 0 ? s.date.slice(5) : ""}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.chartFoot}>
        <Text style={styles.chartFootText}>Peak: {formatK(max)}</Text>
        <Text style={styles.chartFootText}>{series[0]?.date.slice(5)} – {series[series.length - 1]?.date.slice(5)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.screenPad, paddingBottom: spacing.s10 },
  title: { fontSize: fontSize.h1, fontWeight: weights.bold as "700", color: theme.textPrimary, marginBottom: spacing.s4 },
  rangeRow: { flexDirection: "row", gap: spacing.s2, marginBottom: spacing.s5 },
  rangeChip: { flex: 1, paddingVertical: spacing.s2, borderRadius: radii.pill, borderWidth: 1, borderColor: theme.border, alignItems: "center", backgroundColor: theme.surfaceCard },
  rangeChipActive: { backgroundColor: theme.brand, borderColor: theme.brand },
  rangeText: { fontSize: fontSize.sm, fontWeight: weights.semibold as "600", color: theme.textSecondary },
  rangeTextActive: { color: theme.onBrand },
  summaryRow: { flexDirection: "row", gap: spacing.s3, marginBottom: spacing.s3 },
  summaryTile: { flex: 1, backgroundColor: theme.surfaceCard, borderRadius: radii.lg, padding: spacing.s4, borderWidth: 1, borderColor: theme.borderFaint, ...elevation[1] },
  summaryTileAccent: { backgroundColor: theme.brandDeep, borderColor: theme.brandDeep },
  summaryLabel: { fontSize: fontSize.xs, color: theme.textMuted },
  summaryLabelAccent: { color: colors.green200 },
  summaryValue: { fontSize: fontSize.h2, fontWeight: weights.bold as "700", color: theme.textPrimary, marginTop: spacing.s1 },
  summaryValueAccent: { color: theme.onBrand },
  chartCard: { marginTop: spacing.s2, marginBottom: spacing.s5 },
  sectionTitle: { fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: theme.textPrimary, marginBottom: spacing.s4 },
  chart: { flexDirection: "row", alignItems: "flex-end", height: 150, gap: 3 },
  barCol: { flex: 1, alignItems: "center" },
  barArea: { flex: 1, width: "100%", justifyContent: "flex-end", alignItems: "center" },
  bar: { width: "72%", minWidth: 4, backgroundColor: colors.green300, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barPeak: { backgroundColor: theme.brand },
  barLabel: { fontSize: 8, color: theme.textMuted, marginTop: 4, height: 10 },
  chartFoot: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.s3, paddingTop: spacing.s3, borderTopWidth: 1, borderTopColor: theme.borderFaint },
  chartFootText: { fontSize: fontSize.xs, color: theme.textMuted },
  sectionHeading: { fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: theme.textPrimary, marginBottom: spacing.s3 },
  emptyHint: { color: theme.textMuted, fontSize: fontSize.sm },
  productsCard: { padding: spacing.s2 },
  prodRow: { flexDirection: "row", gap: spacing.s3, padding: spacing.s3 },
  prodRowBorder: { borderTopWidth: 1, borderTopColor: theme.borderFaint },
  rank: { width: 26, height: 26, borderRadius: radii.sm, backgroundColor: theme.brandTint, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: fontSize.sm, fontWeight: weights.bold as "700", color: theme.brandDeep },
  prodBody: { flex: 1 },
  prodTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  prodName: { flex: 1, fontSize: fontSize.body, fontWeight: weights.semibold as "600", color: theme.textPrimary },
  prodRev: { fontSize: fontSize.body, fontWeight: weights.bold as "700", color: theme.textPrimary, marginLeft: spacing.s2 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: theme.surfaceInset, marginTop: spacing.s2, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3, backgroundColor: theme.brand },
  prodUnits: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 4 },
});

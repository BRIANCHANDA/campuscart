import { useEffect, useState, type JSX } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Shop } from "@campuscart/shared";
import { api } from "../api/client";
import { Bouncy } from "../components/Bouncy";
import { FadeInUp } from "../components/FadeInUp";
import { EmptyState } from "../components/EmptyState";
import { RowListSkeleton } from "../components/Skeleton";
import { colors, theme, elevation, radii, spacing, fontSize, weights } from "../theme";

const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

/** Deterministic tint per shop so cover-less shops still read colourful. */
const TINTS = [
  { bg: colors.amber100, fg: colors.amber600 },
  { bg: colors.blue100, fg: colors.blue600 },
  { bg: colors.green100, fg: colors.green800 },
  { bg: colors.violet100, fg: colors.violet600 },
] as const;
const tintFor = (id: string) => TINTS[(id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % TINTS.length]!;

/** Public shop directory — browsable with or without an account. */
export function ShopsScreen({ onOpenShop }: { onOpenShop: (shop: Shop) => void }): JSX.Element {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.shops()
      .then((res) => { if (!cancelled) setShops(res.data); })
      .catch(() => { if (!cancelled) setShops([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const Header = (
    <View style={styles.headerBlock}>
      <Text style={styles.title}>Campus shops</Text>
      <Text style={styles.subtitle}>Tap a shop to browse its catalog</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {Header}
        <RowListSkeleton count={5} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={shops}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={Header}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="storefront-outline" title="No shops yet" subtitle="Check back soon." />}
        renderItem={({ item, index }) => {
          const tint = tintFor(item.id);
          return (
            <FadeInUp index={index}>
              <Bouncy onPress={() => onOpenShop(item)} style={styles.cardWrap}>
                <View style={styles.card}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.cover} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cover, styles.coverFallback, { backgroundColor: tint.bg }]}>
                      <Text style={[styles.coverInitials, { color: tint.fg }]}>{initials(item.name)}</Text>
                    </View>
                  )}
                  <View style={styles.body}>
                    <View style={styles.bodyLeft}>
                      <Text style={styles.name}>{item.name}</Text>
                      {item.description ? (
                        <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
                      ) : null}
                      {item.address ? (
                        <View style={styles.addrRow}>
                          <Ionicons name="location-outline" size={13} color={theme.brand} />
                          <Text style={styles.addr} numberOfLines={1}>{item.address}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.openChip}>
                      <Text style={styles.openChipText}>Open</Text>
                      <Ionicons name="chevron-forward" size={14} color={theme.brandDeep} />
                    </View>
                  </View>
                </View>
              </Bouncy>
            </FadeInUp>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.s3 },
  headerBlock: { paddingHorizontal: spacing.screenPad, marginBottom: spacing.s4 },
  title: { fontSize: fontSize.h1, fontWeight: weights.bold as "700", color: theme.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: spacing.screenPad, paddingBottom: spacing.s6 },
  cardWrap: { marginBottom: spacing.s4 },
  card: {
    backgroundColor: theme.surfaceCard, borderRadius: radii.lg, overflow: "hidden",
    borderWidth: 1, borderColor: theme.borderFaint, ...elevation[1],
  },
  cover: { width: "100%", height: 120, backgroundColor: theme.surfaceInset },
  coverFallback: { alignItems: "center", justifyContent: "center" },
  coverInitials: { fontSize: 40, fontWeight: weights.bold as "700" },
  body: { flexDirection: "row", alignItems: "center", padding: spacing.s4, gap: spacing.s3 },
  bodyLeft: { flex: 1, minWidth: 0 },
  name: { fontSize: fontSize.bodyLg, fontWeight: weights.bold as "700", color: theme.textPrimary },
  desc: { fontSize: fontSize.sm, color: theme.textMuted, marginTop: 1 },
  addrRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  addr: { fontSize: fontSize.xs, color: theme.textSecondary, flexShrink: 1 },
  openChip: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: theme.brandFill, borderRadius: radii.pill,
    paddingVertical: 5, paddingHorizontal: spacing.s3,
  },
  openChipText: { fontSize: fontSize.xs, fontWeight: weights.bold as "700", color: theme.brandDeep },
});

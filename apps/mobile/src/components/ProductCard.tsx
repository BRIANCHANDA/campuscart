import type { JSX } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Product } from "@campuscart/shared";
import { Bouncy } from "./Bouncy";
import { theme, elevation, radii, spacing, fontSize, weights } from "../theme";

const formatKwacha = (minor: number): string => `K${(minor / 100).toFixed(2)}`;

type Tint = { bg: string; fg: string };
const CATEGORY_TINT: Record<Product["category"], Tint> = {
  food: { bg: theme.urgentTint, fg: theme.urgentInk },
  drinks: { bg: theme.infoTint, fg: theme.infoInk },
  stationery: { bg: theme.successTint, fg: theme.successInk },
  books: { bg: theme.accentTint, fg: theme.accentInk },
  electronics: { bg: theme.lockedTint, fg: theme.locked },
  clothing: { bg: theme.criticalTint, fg: theme.criticalInk },
  services: { bg: theme.infoTint, fg: theme.infoInk },
  other: { bg: theme.surfaceInset, fg: theme.textSecondary },
};

const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

/** Low-stock threshold that triggers the honest urgency badge. */
const LOW_STOCK = 5;

/**
 * Product tile: photo when the shop uploaded one, tinted initials otherwise.
 * Tap the card to open detail; tap the + for a one-touch quick-add.
 */
export function ProductCard({
  product, onAdd, onOpen, showShopName = true,
}: {
  product: Product;
  onAdd: () => void;
  onOpen?: () => void;
  showShopName?: boolean;
}): JSX.Element {
  const tint = CATEGORY_TINT[product.category];
  const out = product.stockQty === 0;
  const low = !out && product.stockQty <= LOW_STOCK;
  return (
    <Bouncy style={styles.flex} onPress={onOpen ?? (out ? undefined : onAdd)}>
      <View style={styles.card}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, { backgroundColor: tint.bg }]}>
            <Text style={[styles.heroText, { color: tint.fg }]}>{initials(product.name)}</Text>
          </View>
        )}
        {out ? (
          <View style={[styles.badge, styles.badgeOut]}>
            <Text style={styles.badgeOutText}>Sold out</Text>
          </View>
        ) : low ? (
          <View style={[styles.badge, styles.badgeLow]}>
            <Text style={styles.badgeLowText}>Only {product.stockQty} left</Text>
          </View>
        ) : null}
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          {showShopName && (
            <Text style={styles.shop} numberOfLines={1}>{product.shopName ?? ""}</Text>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatKwacha(product.priceMinor)}</Text>
            <Bouncy onPress={out ? undefined : onAdd}>
              <View style={[styles.addBtn, out && styles.addBtnDisabled]}>
                <Ionicons name="add" size={18} color={theme.onBrand} />
              </View>
            </Bouncy>
          </View>
        </View>
      </View>
    </Bouncy>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    backgroundColor: theme.surfaceCard, borderRadius: radii.lg, overflow: "hidden",
    borderWidth: 1, borderColor: theme.borderFaint, ...elevation[1],
  },
  photo: { height: 118, width: "100%", backgroundColor: theme.surfaceInset },
  hero: { height: 118, alignItems: "center", justifyContent: "center" },
  heroText: { fontSize: 30, fontWeight: weights.bold as "700" },
  badge: {
    position: "absolute", top: spacing.s2, left: spacing.s2,
    borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: spacing.s2 + 1,
  },
  badgeOut: { backgroundColor: theme.criticalTint },
  badgeOutText: { fontSize: 10, fontWeight: weights.bold as "700", color: theme.criticalInk },
  badgeLow: { backgroundColor: theme.urgent },
  badgeLowText: { fontSize: 10, fontWeight: weights.bold as "700", color: theme.textPrimary },
  body: { padding: spacing.s3 },
  name: { fontSize: fontSize.sm, fontWeight: weights.semibold as "600", color: theme.textPrimary },
  shop: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.s2 },
  price: { fontSize: fontSize.body, fontWeight: weights.bold as "700", color: theme.textPrimary },
  addBtn: {
    width: 34, height: 34, borderRadius: radii.sm, backgroundColor: theme.brand,
    alignItems: "center", justifyContent: "center", ...elevation.brand,
  },
  addBtnDisabled: { backgroundColor: theme.textDisabled, shadowOpacity: 0 },
});

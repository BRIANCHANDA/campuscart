import { useState, type JSX } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { Product } from "@campuscart/shared";
import { Button } from "../components/Button";
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

const CATEGORY_LABEL: Record<Product["category"], string> = {
  food: "Food", drinks: "Drinks", stationery: "Stationery", books: "Books",
  electronics: "Electronics", clothing: "Clothing", services: "Services", other: "Other",
};

const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

/**
 * Product detail — the standard e-commerce tap-through: big image, description,
 * quantity selector and a sticky add-to-cart bar with the running total.
 */
export function ProductDetailScreen({
  product, onBack, onAdd,
}: {
  product: Product;
  onBack: () => void;
  onAdd: (product: Product, qty: number) => void;
}): JSX.Element {
  const [qty, setQty] = useState(1);
  const insets = useSafeAreaInsets();
  const tint = CATEGORY_TINT[product.category];
  const out = product.stockQty === 0;
  const max = Math.max(product.stockQty, 1);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.heroWrap}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.hero} resizeMode="cover" />
          ) : (
            <View style={[styles.hero, styles.heroFallback, { backgroundColor: tint.bg }]}>
              <Text style={[styles.heroInitials, { color: tint.fg }]}>{initials(product.name)}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>{formatKwacha(product.priceMinor)}</Text>
          </View>

          <View style={styles.chips}>
            <View style={[styles.chip, { backgroundColor: tint.bg }]}>
              <Text style={[styles.chipText, { color: tint.fg }]}>{CATEGORY_LABEL[product.category]}</Text>
            </View>
            {product.shopName ? (
              <View style={styles.chipShop}>
                <Ionicons name="storefront-outline" size={12} color={theme.textSecondary} />
                <Text style={styles.chipShopText}>{product.shopName}</Text>
              </View>
            ) : null}
            {out ? (
              <View style={styles.chipOut}><Text style={styles.chipOutText}>Sold out</Text></View>
            ) : (
              <View style={styles.chipStock}>
                <View style={styles.stockDot} />
                <Text style={styles.chipStockText}>
                  {product.stockQty <= 5 ? `Only ${product.stockQty} left` : "In stock"}
                </Text>
              </View>
            )}
          </View>

          {product.description ? (
            <>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </>
          ) : null}

          {/* Delivery reassurance — standard e-commerce trust row */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="bicycle-outline" size={18} color={theme.brand} />
              <Text style={styles.trustText}>Campus delivery in 15–25 min</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.brand} />
              <Text style={styles.trustText}>Pay on delivery or pickup</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.s4) }]}>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
          >
            <Ionicons name="remove" size={18} color={qty <= 1 ? theme.textDisabled : theme.brandDeep} />
          </TouchableOpacity>
          <Text style={styles.qty}>{qty}</Text>
          <TouchableOpacity
            style={[styles.stepBtn, styles.stepBtnFilled]}
            onPress={() => setQty((q) => Math.min(max, q + 1))}
            disabled={qty >= max}
          >
            <Ionicons name="add" size={18} color={theme.onBrand} />
          </TouchableOpacity>
        </View>
        <Button
          title={out ? "Sold out" : `Add to cart · ${formatKwacha(product.priceMinor * qty)}`}
          onPress={() => onAdd(product, qty)}
          disabled={out}
          style={styles.addBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surfaceBg },
  scroll: { paddingBottom: spacing.s10 },
  heroWrap: { position: "relative" },
  hero: { width: "100%", height: 280, backgroundColor: theme.surfaceInset },
  heroFallback: { alignItems: "center", justifyContent: "center" },
  heroInitials: { fontSize: 72, fontWeight: weights.bold as "700" },
  backBtn: {
    position: "absolute", top: spacing.s3, left: spacing.s4,
    width: 40, height: 40, borderRadius: radii.md, backgroundColor: theme.surfaceCard,
    alignItems: "center", justifyContent: "center", ...elevation[2],
  },
  body: { padding: spacing.screenPad },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.s3 },
  name: { flex: 1, fontSize: fontSize.h1, fontWeight: weights.bold as "700", color: theme.textPrimary, letterSpacing: -0.3 },
  price: { fontSize: fontSize.h1, fontWeight: weights.bold as "700", color: theme.brand },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2, marginTop: spacing.s3 },
  chip: { borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: spacing.s3 },
  chipText: { fontSize: fontSize.xs, fontWeight: weights.semibold as "600" },
  chipShop: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.surfaceInset, borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: spacing.s3 },
  chipShopText: { fontSize: fontSize.xs, color: theme.textSecondary, fontWeight: weights.medium as "500" },
  chipStock: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: theme.successTint, borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: spacing.s3 },
  stockDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.success },
  chipStockText: { fontSize: fontSize.xs, color: theme.successInk, fontWeight: weights.semibold as "600" },
  chipOut: { backgroundColor: theme.criticalTint, borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: spacing.s3 },
  chipOutText: { fontSize: fontSize.xs, color: theme.criticalInk, fontWeight: weights.bold as "700" },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: weights.bold as "700", color: theme.textPrimary, marginTop: spacing.s5, marginBottom: spacing.s2 },
  description: { fontSize: fontSize.body, color: theme.textSecondary, lineHeight: fontSize.body * 1.5 },
  trustRow: {
    marginTop: spacing.s5, backgroundColor: theme.brandTint, borderRadius: radii.lg,
    padding: spacing.s4, gap: spacing.s3,
  },
  trustItem: { flexDirection: "row", alignItems: "center", gap: spacing.s2 },
  trustText: { fontSize: fontSize.sm, color: theme.brandDeep, fontWeight: weights.medium as "500" },
  bottomBar: {
    flexDirection: "row", alignItems: "center", gap: spacing.s3,
    paddingHorizontal: spacing.screenPad, paddingTop: spacing.s3,
    backgroundColor: theme.surfaceCard, borderTopWidth: 1, borderTopColor: theme.border, ...elevation[2],
  },
  stepper: {
    flexDirection: "row", alignItems: "center", gap: spacing.s2,
    borderWidth: 1, borderColor: theme.border, borderRadius: radii.pill, padding: 3,
  },
  stepBtn: { width: 36, height: 36, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: theme.surfaceCard },
  stepBtnFilled: { backgroundColor: theme.brand },
  qty: { fontSize: fontSize.body, fontWeight: weights.bold as "700", minWidth: 22, textAlign: "center", color: theme.textPrimary },
  addBtn: { flex: 1 },
});

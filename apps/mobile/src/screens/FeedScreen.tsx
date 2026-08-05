import { useEffect, useState, type JSX } from "react";
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Product, ProductFeedQuery } from "@campuscart/shared";
import { api } from "../api/client";
import { Input } from "../components/Input";
import { EmptyState } from "../components/EmptyState";
import { ProductCard } from "../components/ProductCard";
import { HeroBanner } from "../components/HeroBanner";
import { FadeInUp } from "../components/FadeInUp";
import { ProductGridSkeleton } from "../components/Skeleton";
import { theme, elevation, radii, spacing, fontSize, weights } from "../theme";

type Category = NonNullable<ProductFeedQuery["category"]>;
const CATEGORIES: { key: Category; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "food", label: "Food", icon: "fast-food-outline" },
  { key: "drinks", label: "Drinks", icon: "cafe-outline" },
  { key: "stationery", label: "Stationery", icon: "pencil-outline" },
  { key: "books", label: "Books", icon: "book-outline" },
  { key: "electronics", label: "Electronics", icon: "hardware-chip-outline" },
  { key: "clothing", label: "Clothing", icon: "shirt-outline" },
  { key: "services", label: "Services", icon: "construct-outline" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal" },
];

/** Unified cross-shop product feed with hero, search + category filter. Guest-friendly. */
export function FeedScreen({
  onAddToCart,
  onOpenProduct,
  greetingName,
}: {
  onAddToCart: (product: Product) => void;
  onOpenProduct: (product: Product) => void;
  greetingName?: string;
}): JSX.Element {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.productFeed({ ...(q ? { q } : {}), ...(category ? { category } : {}) })
      .then((res) => { if (!cancelled) setItems(res.data); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q, category]);

  const Header = (
    <>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>
            {greetingName ? `Hi, ${greetingName.split(" ")[0]} 👋` : "CampusCart"}
          </Text>
          <Text style={styles.tagline}>
            {greetingName ? "What are you craving today?" : "Browse now — sign up when you're ready to buy"}
          </Text>
        </View>
        <View style={styles.logoBadge}>
          <Ionicons name="cart" size={20} color={theme.onBrand} />
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Input value={q} onChangeText={setQ} placeholder="Search shops & products" icon="search-outline" />
      </View>

      {!q && !category && <HeroBanner />}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
        <CategoryChip label="All" icon="grid-outline" active={category === null} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <CategoryChip
            key={c.key}
            label={c.label}
            icon={c.icon}
            active={category === c.key}
            onPress={() => setCategory(c.key)}
          />
        ))}
      </ScrollView>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>
          {category ? CATEGORIES.find((c) => c.key === category)?.label : q ? "Results" : "Popular near you"}
        </Text>
        {!loading && <Text style={styles.sectionCount}>{items.length} items</Text>}
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {Header}
        <ProductGridSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={Header}
        ListEmptyComponent={<EmptyState icon="basket-outline" title="No products found" subtitle="Try a different search or category." />}
        renderItem={({ item, index }) => (
          <FadeInUp index={index} style={styles.cell}>
            <ProductCard product={item} onAdd={() => onAddToCart(item)} onOpen={() => onOpenProduct(item)} />
          </FadeInUp>
        )}
      />
    </View>
  );
}

function CategoryChip({
  label, icon, active, onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}): JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.catChip, active && styles.catChipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={15} color={active ? theme.onBrand : theme.textSecondary} />
      <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.s3 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.screenPad, marginBottom: spacing.s4,
  },
  headerText: { flex: 1 },
  greeting: { fontSize: fontSize.h2, fontWeight: weights.bold as "700", color: theme.textPrimary },
  tagline: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 2 },
  logoBadge: {
    width: 44, height: 44, borderRadius: radii.md, backgroundColor: theme.brand,
    alignItems: "center", justifyContent: "center", ...elevation.brand,
  },
  searchWrap: { paddingHorizontal: spacing.screenPad, marginBottom: spacing.s4 },
  chipRow: { flexGrow: 0, marginBottom: spacing.s4 },
  chipRowContent: { paddingHorizontal: spacing.screenPad, gap: spacing.s2 },
  catChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: spacing.s2, paddingHorizontal: spacing.s3 + 1,
    borderRadius: radii.pill, borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.surfaceCard,
  },
  catChipActive: { backgroundColor: theme.brand, borderColor: theme.brand },
  catChipText: { fontSize: fontSize.sm, fontWeight: weights.semibold as "600", color: theme.textSecondary },
  catChipTextActive: { color: theme.onBrand },
  sectionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.screenPad, marginBottom: spacing.s3,
  },
  sectionTitle: { fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: theme.textPrimary },
  sectionCount: { fontSize: fontSize.sm, color: theme.textMuted },
  grid: { paddingHorizontal: spacing.screenPad, paddingBottom: spacing.s6 },
  column: { gap: spacing.s3 },
  cell: { flex: 1, marginBottom: spacing.s3 },
});

import { useEffect, useState, type JSX } from "react";
import { FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Product, Shop } from "@campuscart/shared";
import { api } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { ProductCard } from "../components/ProductCard";
import { FadeInUp } from "../components/FadeInUp";
import { ProductGridSkeleton } from "../components/Skeleton";
import { colors, theme, elevation, radii, spacing, fontSize, weights } from "../theme";

const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

/**
 * One shop's storefront: cover image, name/address/directions, then its
 * catalog. Browsable as a guest — adding to cart goes through the auth gate
 * handled by the caller.
 */
export function ShopDetailScreen({
  shop, onBack, onAddToCart, onOpenProduct,
}: {
  shop: Shop;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onOpenProduct: (product: Product) => void;
}): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.productFeed({ shopId: shop.id })
      .then((res) => { if (!cancelled) setProducts(res.data); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [shop.id]);

  const hasLocation = shop.location.lat !== 0 || shop.location.lng !== 0;
  const openDirections = (): void => {
    const { lat, lng } = shop.location;
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  };

  const Header = (
    <>
      {/* Cover */}
      <View style={styles.coverWrap}>
        {shop.imageUrl ? (
          <Image source={{ uri: shop.imageUrl }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Text style={styles.coverInitials}>{initials(shop.name)}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.shopName}>{shop.name}</Text>
        {shop.description ? <Text style={styles.shopDesc}>{shop.description}</Text> : null}
        {(shop.address || hasLocation) && (
          <View style={styles.locationRow}>
            {shop.address ? (
              <View style={styles.addrChip}>
                <Ionicons name="location" size={13} color={theme.brand} />
                <Text style={styles.addrText} numberOfLines={1}>{shop.address}</Text>
              </View>
            ) : null}
            {hasLocation && (
              <TouchableOpacity style={styles.directionsBtn} onPress={openDirections}>
                <Ionicons name="navigate" size={13} color={theme.onBrand} />
                <Text style={styles.directionsText}>Directions</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <Text style={styles.sectionLabel}>
          {loading ? "Menu" : `${products.length} item${products.length === 1 ? "" : "s"}`}
        </Text>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {Header}
        <ProductGridSkeleton count={4} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={Header}
        ListEmptyComponent={<EmptyState icon="basket-outline" title="Nothing on the shelves yet" subtitle="This shop hasn't listed products." />}
        renderItem={({ item, index }) => (
          <FadeInUp index={index} style={styles.cell}>
            <ProductCard product={item} showShopName={false} onAdd={() => onAddToCart(item)} onOpen={() => onOpenProduct(item)} />
          </FadeInUp>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  coverWrap: { position: "relative" },
  cover: { width: "100%", height: 150, backgroundColor: theme.surfaceInset },
  coverFallback: { backgroundColor: colors.amber100, alignItems: "center", justifyContent: "center" },
  coverInitials: { fontSize: 48, fontWeight: weights.bold as "700", color: colors.amber600 },
  backBtn: {
    position: "absolute", top: spacing.s3, left: spacing.s4,
    width: 40, height: 40, borderRadius: radii.md, backgroundColor: theme.surfaceCard,
    alignItems: "center", justifyContent: "center", ...elevation[2],
  },
  info: {
    backgroundColor: theme.surfaceCard, paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.s4, paddingBottom: spacing.s4,
    borderBottomWidth: 1, borderBottomColor: theme.borderFaint,
  },
  shopName: { fontSize: fontSize.h1, fontWeight: weights.bold as "700", color: theme.textPrimary },
  shopDesc: { fontSize: fontSize.sm, color: theme.textSecondary, marginTop: 2 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: spacing.s2, marginTop: spacing.s3 },
  addrChip: {
    flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1,
    backgroundColor: theme.brandTint, borderRadius: radii.pill,
    paddingVertical: 5, paddingHorizontal: spacing.s3,
  },
  addrText: { fontSize: fontSize.xs, color: theme.brandDeep, fontWeight: weights.medium as "500", flexShrink: 1 },
  directionsBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: theme.brand, borderRadius: radii.pill,
    paddingVertical: 5, paddingHorizontal: spacing.s3,
  },
  directionsText: { fontSize: fontSize.xs, color: theme.onBrand, fontWeight: weights.semibold as "600" },
  sectionLabel: {
    fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: theme.textPrimary,
    marginTop: spacing.s4,
  },
  grid: { padding: spacing.screenPad, paddingBottom: spacing.s6 },
  column: { gap: spacing.s3 },
  cell: { flex: 1, marginBottom: spacing.s3 },
});

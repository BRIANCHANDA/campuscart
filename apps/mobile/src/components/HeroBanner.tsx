import type { JSX } from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, theme, radii, spacing, fontSize, weights } from "../theme";

const HERO_IMG = "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=80";

/**
 * Home promo banner — the "hero" that makes the feed feel like a store rather
 * than a list. Image + dark gradient for legibility + a couple of honest
 * trust badges (fast campus delivery, cash on delivery).
 */
export function HeroBanner(): JSX.Element {
  return (
    <View style={styles.wrap}>
      <ImageBackground source={{ uri: HERO_IMG }} style={styles.bg} imageStyle={styles.bgImg}>
        <LinearGradient
          colors={["rgba(6,78,59,0.15)", "rgba(6,78,59,0.92)"]}
          style={styles.overlay}
        >
          <Text style={styles.kicker}>CAMPUS SHOPPING, DELIVERED</Text>
          <Text style={styles.title}>Everything you need,{"\n"}right to your block</Text>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Ionicons name="flash" size={13} color={theme.onBrand} />
              <Text style={styles.badgeText}>15–25 min</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="cash-outline" size={13} color={theme.onBrand} />
              <Text style={styles.badgeText}>Cash on delivery</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.screenPad, marginBottom: spacing.s5,
    borderRadius: radii.xl, overflow: "hidden",
  },
  bg: { height: 168, justifyContent: "flex-end" },
  bgImg: { borderRadius: radii.xl },
  overlay: { flex: 1, justifyContent: "flex-end", padding: spacing.s5 },
  kicker: { color: colors.green200, fontSize: fontSize.xs, fontWeight: weights.bold as "700", letterSpacing: 1 },
  title: { color: theme.onBrand, fontSize: fontSize.h2, fontWeight: weights.bold as "700", marginTop: spacing.s1, lineHeight: fontSize.h2 * 1.1 },
  badges: { flexDirection: "row", gap: spacing.s2, marginTop: spacing.s3 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)", borderRadius: radii.pill,
    paddingVertical: 5, paddingHorizontal: spacing.s3,
  },
  badgeText: { color: theme.onBrand, fontSize: fontSize.xs, fontWeight: weights.semibold as "600" },
});

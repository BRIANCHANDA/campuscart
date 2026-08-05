import { useEffect, useRef, type JSX } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";
import { theme, radii, spacing } from "../theme";

/** A single shimmering placeholder block. */
export function Skeleton({ style }: { style?: ViewStyle }): JSX.Element {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

/** A grid of product-card skeletons, matching the real feed layout. */
export function ProductGridSkeleton({ count = 6 }: { count?: number }): JSX.Element {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.cell}>
          <View style={styles.card}>
            <Skeleton style={styles.photo} />
            <View style={styles.body}>
              <Skeleton style={styles.line} />
              <Skeleton style={styles.lineShort} />
              <Skeleton style={styles.price} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/** A stack of row skeletons, matching the shops directory. */
export function RowListSkeleton({ count = 5 }: { count?: number }): JSX.Element {
  return (
    <View style={{ paddingHorizontal: spacing.screenPad }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton style={styles.avatar} />
          <View style={styles.rowBody}>
            <Skeleton style={styles.line} />
            <Skeleton style={styles.lineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: theme.surfaceInset, borderRadius: radii.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: spacing.screenPad, gap: spacing.s3 },
  cell: { width: "47%", flexGrow: 1 },
  card: { backgroundColor: theme.surfaceCard, borderRadius: radii.lg, overflow: "hidden", borderWidth: 1, borderColor: theme.borderFaint },
  photo: { height: 110, borderRadius: 0 },
  body: { padding: spacing.s3, gap: spacing.s2 },
  line: { height: 12, width: "85%" },
  lineShort: { height: 10, width: "55%" },
  price: { height: 14, width: "40%", marginTop: spacing.s1 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.s3, paddingVertical: spacing.s3 },
  avatar: { width: 52, height: 52, borderRadius: radii.md },
  rowBody: { flex: 1, gap: spacing.s2 },
});

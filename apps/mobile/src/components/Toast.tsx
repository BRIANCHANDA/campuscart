import { useEffect, useRef, type JSX } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, elevation, radii, spacing, fontSize, weights } from "../theme";

/**
 * Bottom toast — slides up, holds, slides away. Drive it by changing `message`
 * (null hides). Used for "Added to cart" feedback.
 */
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }): JSX.Element | null {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    slide.setValue(0);
    Animated.sequence([
      Animated.spring(slide, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 8 }),
      Animated.delay(1400),
      Animated.timing(slide, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => onDone());
  }, [message, slide, onDone]);

  if (!message) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          opacity: slide,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        },
      ]}
    >
      <View style={styles.toast}>
        <Ionicons name="checkmark-circle" size={18} color={theme.onBrand} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 92, alignItems: "center", zIndex: 10 },
  toast: {
    flexDirection: "row", alignItems: "center", gap: spacing.s2,
    backgroundColor: theme.brandDeep, borderRadius: radii.pill,
    paddingVertical: spacing.s2 + 2, paddingHorizontal: spacing.s4, ...elevation[3],
  },
  text: { color: theme.onBrand, fontSize: fontSize.sm, fontWeight: weights.semibold as "600" },
});

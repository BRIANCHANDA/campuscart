import type { JSX } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";
import { theme, elevation, radii, spacing, fontSize, weights } from "../theme";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";

export function Button({
  title, onPress, variant = "primary", disabled = false, loading = false, style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}): JSX.Element {
  const isBusy = disabled || loading;
  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        variant === "danger" && styles.danger,
        variant === "accent" && styles.accent,
        isBusy && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isBusy}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? theme.brand : theme.onBrand} />
      ) : (
        <Text
          style={[
            styles.text,
            (variant === "secondary" || variant === "ghost") && styles.textDark,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: spacing.touchMin,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.s5,
    flexDirection: "row",
  },
  primary: { backgroundColor: theme.brand, ...elevation.brand },
  secondary: { backgroundColor: theme.surfaceCard, borderWidth: 1, borderColor: theme.border },
  ghost: { backgroundColor: "transparent" },
  danger: { backgroundColor: theme.critical },
  accent: { backgroundColor: theme.urgent },
  disabled: { opacity: 0.5, shadowOpacity: 0 },
  text: { color: theme.onBrand, fontSize: fontSize.body, fontWeight: weights.bold as "700" },
  textDark: { color: theme.textPrimary },
});

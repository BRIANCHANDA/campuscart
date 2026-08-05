import type { JSX } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { theme, radii, spacing, fontSize, weights } from "../theme";

/** Selectable pill — category filters, segmented toggles, tab strips. */
export function Chip({
  label, active, onPress, flex,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  flex?: boolean;
}): JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.chip, flex && styles.flex, active && styles.active]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.s2, paddingHorizontal: spacing.s4,
    borderRadius: radii.pill, borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.surfaceCard, alignItems: "center", justifyContent: "center",
  },
  flex: { flex: 1 },
  active: { backgroundColor: theme.brand, borderColor: theme.brand },
  label: { color: theme.textSecondary, fontSize: fontSize.sm, fontWeight: weights.semibold as "600" },
  labelActive: { color: theme.onBrand },
});

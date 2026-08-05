import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, spacing, fontSize } from "../theme";

export function EmptyState({
  icon = "cart-outline", title, subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}): JSX.Element {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={theme.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.s16, paddingHorizontal: spacing.s6 },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: theme.surfaceInset,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.s4,
  },
  title: { fontSize: fontSize.body, fontWeight: "600", color: theme.textSecondary, textAlign: "center" },
  subtitle: { fontSize: fontSize.sm, color: theme.textMuted, textAlign: "center", marginTop: spacing.s1 },
});

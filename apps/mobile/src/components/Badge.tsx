import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme, radii, spacing, fontSize, weights } from "../theme";

export type BadgeTone = "success" | "critical" | "urgent" | "info" | "accent" | "locked" | "brand";

const TONE_STYLES: Record<BadgeTone, { bg: string; fg: string }> = {
  success: { bg: theme.successTint, fg: theme.successInk },
  critical: { bg: theme.criticalTint, fg: theme.criticalInk },
  urgent: { bg: theme.urgentTint, fg: theme.urgentInk },
  info: { bg: theme.infoTint, fg: theme.infoInk },
  accent: { bg: theme.accentTint, fg: theme.accentInk },
  locked: { bg: theme.lockedTint, fg: theme.locked },
  brand: { bg: theme.brandFill, fg: theme.brandDeep },
};

export function Badge({ label, tone = "locked" }: { label: string; tone?: BadgeTone }): JSX.Element {
  const t = TONE_STYLES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.label, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: spacing.s1, paddingHorizontal: spacing.s2 + 2,
    borderRadius: radii.pill, alignSelf: "flex-start",
  },
  label: { fontSize: fontSize.xs, fontWeight: weights.bold as "700", letterSpacing: 0.2 },
});

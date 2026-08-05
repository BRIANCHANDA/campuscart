import type { JSX, ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { theme, elevation, radii, spacing } from "../theme";

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }): JSX.Element {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surfaceCard, borderRadius: radii.lg, padding: spacing.s4,
    borderWidth: 1, borderColor: theme.borderFaint, ...elevation[1],
  },
});

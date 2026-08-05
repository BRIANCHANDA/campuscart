import type { JSX } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, elevation, radii, spacing, fontSize, weights } from "../theme";

export type TabItem<T extends string> = {
  key: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Center raised FAB — used for the shopper cart shortcut. */
  raised?: boolean;
  badge?: number;
};

export function TabBar<T extends string>({
  items, active, onChange,
}: {
  items: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
}): JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.s2) }]}>
      {items.map((item) => {
        const isActive = item.key === active;
        if (item.raised) {
          return (
            <View key={item.key} style={styles.raisedSlot}>
              <TouchableOpacity style={styles.raisedBtn} onPress={() => onChange(item.key)} activeOpacity={0.85}>
                <Ionicons name={item.icon} size={22} color={theme.onBrand} />
                {!!item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <TouchableOpacity key={item.key} style={styles.tab} onPress={() => onChange(item.key)} activeOpacity={0.7}>
            <Ionicons name={item.icon} size={22} color={isActive ? theme.brand : theme.textMuted} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-around",
    backgroundColor: theme.surfaceCard, borderTopWidth: 1, borderTopColor: theme.border,
    paddingHorizontal: spacing.s2, paddingTop: spacing.s2, ...elevation[2],
  },
  tab: { flex: 1, alignItems: "center", gap: 3, paddingTop: spacing.s1 },
  label: { fontSize: 10, fontWeight: weights.medium as "500", color: theme.textMuted },
  labelActive: { color: theme.brand, fontWeight: weights.semibold as "600" },
  raisedSlot: { flex: 1, alignItems: "center", height: 34 },
  raisedBtn: {
    width: 54, height: 54, borderRadius: radii.lg, backgroundColor: theme.brand,
    alignItems: "center", justifyContent: "center", marginTop: -26,
    borderWidth: 4, borderColor: theme.surfaceCard, ...elevation.brand,
  },
  badge: {
    position: "absolute", top: -5, right: -5, minWidth: 19, height: 19, paddingHorizontal: 5,
    borderRadius: radii.pill, backgroundColor: theme.urgent, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: theme.surfaceCard,
  },
  badgeText: { fontSize: 11, fontWeight: weights.bold as "700", color: theme.textPrimary },
});

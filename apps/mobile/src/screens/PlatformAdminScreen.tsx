import type { JSX } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { User } from "@campuscart/shared";
import { Button } from "../components/Button";
import { theme, radii, spacing, fontSize, weights } from "../theme";

/** Where the admin console is served (vite dev server / deployed host). */
const CONSOLE_URL = process.env.EXPO_PUBLIC_ADMIN_URL ?? "http://192.168.0.126:5173";

/**
 * Platform administration moved to the web console — the mobile app stays
 * focused on shoppers, shop owners and couriers. This screen just points
 * an admin who signed in on their phone to the right place.
 */
export function PlatformAdminScreen({ user, onSignOut }: { user: User; onSignOut: () => void }): JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="desktop-outline" size={34} color={theme.brand} />
      </View>
      <Text style={styles.title}>Admin lives on the web now</Text>
      <Text style={styles.subtitle}>
        Hi {user.fullName.split(" ")[0]} — shop management, courier verification and payouts
        all moved to the CampusCart admin console for the full-size view they deserve.
      </Text>
      <View style={styles.urlChip}>
        <Ionicons name="link-outline" size={15} color={theme.brandDeep} />
        <Text style={styles.urlText}>{CONSOLE_URL}</Text>
      </View>
      <Button
        title="Open admin console"
        onPress={() => void Linking.openURL(CONSOLE_URL)}
        style={styles.openBtn}
      />
      <Button title="Sign out" variant="secondary" onPress={onSignOut} style={styles.signOutBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.s8 },
  iconWrap: {
    width: 76, height: 76, borderRadius: radii.xl, backgroundColor: theme.brandTint,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.s5,
  },
  title: { fontSize: fontSize.h2, fontWeight: weights.bold as "700", color: theme.textPrimary, textAlign: "center" },
  subtitle: {
    fontSize: fontSize.body, color: theme.textSecondary, textAlign: "center",
    marginTop: spacing.s2, lineHeight: fontSize.body * 1.5,
  },
  urlChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: theme.brandFill, borderRadius: radii.pill,
    paddingVertical: spacing.s2, paddingHorizontal: spacing.s4, marginVertical: spacing.s5,
  },
  urlText: { fontSize: fontSize.sm, fontWeight: weights.semibold as "600", color: theme.brandDeep },
  openBtn: { alignSelf: "stretch" },
  signOutBtn: { alignSelf: "stretch", marginTop: spacing.s3 },
});

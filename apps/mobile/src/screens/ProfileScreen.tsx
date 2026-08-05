import { useState, type JSX } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { User } from "@campuscart/shared";
import { api, ApiClientError } from "../api/client";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { colors, theme, elevation, radii, spacing, fontSize, weights } from "../theme";

const ROLE_LABEL: Record<User["role"], string> = {
  shopper: "Shopper",
  courier: "Courier",
  shop_admin: "Shop owner",
  platform_admin: "Platform admin",
};

const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");

const formatJoined = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });

type Mode = "view" | "edit" | "password";

export function ProfileScreen({
  user, onSignOut, onUserUpdated,
}: {
  user: User;
  onSignOut: () => void;
  onUserUpdated?: (u: User) => void;
}): JSX.Element {
  // Local copy so the screen shows fresh values after an edit even when the
  // parent doesn't thread the update back down.
  const [me, setMe] = useState<User>(user);
  const [mode, setMode] = useState<Mode>("view");
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const resetEdit = (): void => {
    setFullName(me.fullName);
    setPhone(me.phone);
    setError(null);
    setMode("view");
  };

  const saveProfile = async (): Promise<void> => {
    if (!fullName.trim() || phone.trim().length < 6) {
      setError("Enter a valid name and phone number.");
      return;
    }
    setBusy(true); setError(null);
    try {
      const updated = await api.updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      setMe(updated);
      onUserUpdated?.(updated);
      setNotice("Profile updated");
      setMode("view");
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (): Promise<void> => {
    if (newPw.length < 8) { setError("New password must be at least 8 characters."); return; }
    setBusy(true); setError(null);
    try {
      await api.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(""); setNewPw("");
      setNotice("Password changed");
      setMode("view");
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Couldn't change password.");
    } finally {
      setBusy(false);
    }
  };

  const confirmSignOut = (): void => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: onSignOut },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Profile</Text>

      {/* Identity header */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(me.fullName)}</Text>
        </View>
        <Text style={styles.name}>{me.fullName}</Text>
        <View style={styles.roleChip}>
          <Ionicons name="shield-checkmark-outline" size={13} color={theme.brandDeep} />
          <Text style={styles.roleText}>{ROLE_LABEL[me.role]}</Text>
        </View>
        <Text style={styles.joined}>Member since {formatJoined(me.createdAt)}</Text>
      </View>

      {notice && (
        <View style={styles.noticeBar}>
          <Ionicons name="checkmark-circle" size={16} color={theme.successInk} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      )}

      {mode === "view" && (
        <>
          <Card style={styles.infoCard}>
            <InfoRow icon="person-outline" label="Full name" value={me.fullName} />
            <View style={styles.divider} />
            <InfoRow icon="mail-outline" label="Email" value={me.email} />
            <View style={styles.divider} />
            <InfoRow icon="call-outline" label="Phone" value={me.phone} />
          </Card>

          <TouchableOpacity style={styles.actionRow} onPress={() => { setNotice(null); setMode("edit"); }}>
            <Ionicons name="create-outline" size={20} color={theme.brand} />
            <Text style={styles.actionText}>Edit profile</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => { setNotice(null); setError(null); setMode("password"); }}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.brand} />
            <Text style={styles.actionText}>Change password</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <Button title="Sign out" variant="secondary" onPress={confirmSignOut} style={styles.signOutBtn} />
        </>
      )}

      {mode === "edit" && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Edit profile</Text>
          <Text style={styles.label}>Full name</Text>
          <Input value={fullName} onChangeText={setFullName} placeholder="Your name" icon="person-outline" style={styles.field} />
          <Text style={styles.label}>Phone</Text>
          <Input value={phone} onChangeText={setPhone} placeholder="+260…" icon="call-outline" keyboardType="phone-pad" style={styles.field} />
          <Text style={styles.hint}>Email ({me.email}) can't be changed here.</Text>
          {error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.formActions}>
            <Button title="Cancel" variant="secondary" onPress={resetEdit} style={styles.half} />
            <Button title="Save" onPress={() => void saveProfile()} loading={busy} style={styles.half} />
          </View>
        </Card>
      )}

      {mode === "password" && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Change password</Text>
          <Text style={styles.label}>Current password</Text>
          <Input value={currentPw} onChangeText={setCurrentPw} placeholder="••••••••" icon="lock-closed-outline" secureTextEntry style={styles.field} />
          <Text style={styles.label}>New password</Text>
          <Input value={newPw} onChangeText={setNewPw} placeholder="At least 8 characters" icon="key-outline" secureTextEntry style={styles.field} />
          {error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.formActions}>
            <Button title="Cancel" variant="secondary" onPress={() => { setError(null); setCurrentPw(""); setNewPw(""); setMode("view"); }} style={styles.half} />
            <Button title="Update" onPress={() => void savePassword()} loading={busy} style={styles.half} />
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }): JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}><Ionicons name={icon} size={17} color={theme.brand} /></View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.screenPad, paddingBottom: spacing.s10 },
  title: { fontSize: fontSize.h1, fontWeight: weights.bold as "700", color: theme.textPrimary, marginBottom: spacing.s5 },
  headerCard: {
    alignItems: "center", backgroundColor: theme.surfaceCard, borderRadius: radii.xl,
    paddingVertical: spacing.s6, paddingHorizontal: spacing.s4, marginBottom: spacing.s4,
    borderWidth: 1, borderColor: theme.borderFaint, ...elevation[1],
  },
  avatar: {
    width: 72, height: 72, borderRadius: radii.pill, backgroundColor: colors.green200,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.s3,
  },
  avatarText: { fontSize: fontSize.h1, fontWeight: weights.bold as "700", color: theme.successInk },
  name: { fontSize: fontSize.h2, fontWeight: weights.bold as "700", color: theme.textPrimary },
  roleChip: {
    flexDirection: "row", alignItems: "center", gap: 5, marginTop: spacing.s2,
    backgroundColor: theme.brandTint, borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: spacing.s3,
  },
  roleText: { fontSize: fontSize.xs, fontWeight: weights.bold as "700", color: theme.brandDeep },
  joined: { fontSize: fontSize.sm, color: theme.textMuted, marginTop: spacing.s3 },
  noticeBar: {
    flexDirection: "row", alignItems: "center", gap: spacing.s2,
    backgroundColor: theme.successTint, borderRadius: radii.md, padding: spacing.s3, marginBottom: spacing.s4,
  },
  noticeText: { color: theme.successInk, fontSize: fontSize.sm, fontWeight: weights.semibold as "600" },
  infoCard: { padding: spacing.s2, marginBottom: spacing.s4 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.s3, padding: spacing.s3 },
  rowIcon: { width: 36, height: 36, borderRadius: radii.sm, backgroundColor: theme.brandTint, alignItems: "center", justifyContent: "center" },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: fontSize.xs, color: theme.textMuted },
  rowValue: { fontSize: fontSize.body, color: theme.textPrimary, fontWeight: weights.medium as "500", marginTop: 1 },
  divider: { height: 1, backgroundColor: theme.borderFaint, marginLeft: spacing.s3 + 36 + spacing.s3 },
  actionRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.s3,
    backgroundColor: theme.surfaceCard, borderRadius: radii.md, padding: spacing.s4, marginBottom: spacing.s3,
    borderWidth: 1, borderColor: theme.borderFaint,
  },
  actionText: { flex: 1, fontSize: fontSize.body, fontWeight: weights.semibold as "600", color: theme.textPrimary },
  signOutBtn: { marginTop: spacing.s3 },
  formCard: { marginBottom: spacing.s4 },
  formTitle: { fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: theme.textPrimary, marginBottom: spacing.s4 },
  label: { fontSize: fontSize.sm, fontWeight: weights.semibold as "600", color: theme.textSecondary, marginBottom: spacing.s2 },
  field: { marginBottom: spacing.s3 },
  hint: { fontSize: fontSize.xs, color: theme.textMuted, marginBottom: spacing.s2 },
  error: { color: theme.criticalInk, fontSize: fontSize.sm, marginBottom: spacing.s2 },
  formActions: { flexDirection: "row", gap: spacing.s3, marginTop: spacing.s2 },
  half: { flex: 1 },
});

import { useState, type JSX } from "react";
import {
  KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { User } from "@campuscart/shared";
import { api, ApiClientError, setRefreshToken, setToken } from "../api/client";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { theme, elevation, radii, spacing, fontSize, weights } from "../theme";

type Mode = "login" | "register";
type SelfServeRole = "shopper" | "courier";

/** Login / register. On success, stores the JWT and lifts the user up to App. */
export function AuthScreen({
  onAuthed, notice, onCancel, initialMode = "login",
}: {
  onAuthed: (user: User) => void;
  /** Contextual line shown when this screen is acting as a purchase gate. */
  notice?: string;
  /** Guest escape hatch — "keep browsing" without an account. */
  onCancel?: () => void;
  initialMode?: Mode;
}): JSX.Element {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [role, setRole] = useState<SelfServeRole>("shopper");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const res = mode === "login"
        ? await api.login(email.trim(), password)
        : await api.register({ email: email.trim(), password, fullName, phone, role });
      setToken(res.token);
      setRefreshToken(res.refreshToken);
      onAuthed(res.user);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Something went wrong — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.logo}>
        <Ionicons name="cart" size={32} color={theme.onBrand} />
      </View>
      <Text style={styles.title}>{mode === "login" ? "Welcome back" : "Create your account"}</Text>
      <Text style={styles.subtitle}>
        {notice ?? (mode === "login"
          ? "Sign in to order from campus shops and track deliveries."
          : "Join CampusCart to shop or start earning as a courier.")}
      </Text>

      {mode === "register" && (
        <View style={styles.segment}>
          {(["shopper", "courier"] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.segmentItem, role === r && styles.segmentItemActive]}
              onPress={() => setRole(r)}
            >
              <Ionicons
                name={r === "shopper" ? "cart-outline" : "bicycle-outline"}
                size={15}
                color={role === r ? theme.brandDeep : theme.textSecondary}
              />
              <Text style={[styles.segmentText, role === r && styles.segmentTextActive]}>
                {r === "shopper" ? "Shopper" : "Courier"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {mode === "register" && (
        <>
          <Text style={styles.label}>Full name</Text>
          <Input
            value={fullName} onChangeText={setFullName} placeholder="Your full name"
            icon="person-outline" style={styles.input}
          />
          <Text style={styles.label}>Phone</Text>
          <Input
            value={phone} onChangeText={setPhone} placeholder="+260 977 234 190"
            icon="call-outline" keyboardType="phone-pad" style={styles.input}
          />
        </>
      )}

      <Text style={styles.label}>Email</Text>
      <Input
        value={email} onChangeText={setEmail} placeholder="you@example.com"
        icon="mail-outline" autoCapitalize="none" keyboardType="email-address" style={styles.input}
      />
      <Text style={styles.label}>Password</Text>
      <Input
        value={password} onChangeText={setPassword} placeholder="••••••••"
        icon="lock-closed-outline" secureTextEntry style={styles.input}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        title={mode === "login" ? "Sign in" : "Create account"}
        onPress={() => void submit()}
        loading={busy}
        style={styles.submitBtn}
      />

      <TouchableOpacity onPress={() => setMode(mode === "login" ? "register" : "login")}>
        <Text style={styles.switch}>
          {mode === "login" ? "New here? " : "Already registered? "}
          <Text style={styles.switchLink}>{mode === "login" ? "Create account" : "Sign in"}</Text>
        </Text>
      </TouchableOpacity>

      {onCancel && (
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.browseLink}>← Keep browsing without an account</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: spacing.screenPad },
  logo: {
    width: 64, height: 64, borderRadius: radii.xl, backgroundColor: theme.brand,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.s5, ...elevation.brand,
  },
  title: { fontSize: fontSize.display, fontWeight: weights.semibold as "600", color: theme.textPrimary, marginBottom: spacing.s2 },
  subtitle: { fontSize: fontSize.bodyLg, color: theme.textSecondary, marginBottom: spacing.s6, lineHeight: fontSize.bodyLg * 1.4 },
  segment: {
    flexDirection: "row", backgroundColor: theme.surfaceInset, borderRadius: radii.md,
    padding: 4, marginBottom: spacing.s5,
  },
  segmentItem: {
    flex: 1, flexDirection: "row", gap: 6, height: 38, borderRadius: radii.sm - 1,
    alignItems: "center", justifyContent: "center",
  },
  segmentItemActive: { backgroundColor: theme.surfaceCard, ...elevation[1] },
  segmentText: { fontSize: fontSize.sm, fontWeight: weights.semibold as "600", color: theme.textSecondary },
  segmentTextActive: { color: theme.brandDeep },
  label: { fontSize: fontSize.sm, fontWeight: weights.semibold as "600", color: theme.textSecondary, marginBottom: spacing.s2 },
  input: { marginBottom: spacing.s4 },
  error: { color: theme.criticalInk, marginBottom: spacing.s3, textAlign: "center" },
  submitBtn: { marginTop: spacing.s2, marginBottom: spacing.s4 },
  switch: { textAlign: "center", color: theme.textSecondary, fontSize: fontSize.body },
  switchLink: { color: theme.brand, fontWeight: weights.semibold as "600" },
  browseLink: {
    textAlign: "center", color: theme.textMuted, fontSize: fontSize.sm,
    marginTop: spacing.s5, textDecorationLine: "underline",
  },
});

import type { JSX } from "react";
import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, radii, spacing, fontSize } from "../theme";

export function Input({
  value, onChangeText, placeholder, icon, secureTextEntry, autoCapitalize, keyboardType, style,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: KeyboardTypeOptions;
  style?: object;
}): JSX.Element {
  return (
    <View style={[styles.wrap, style]}>
      {icon && <Ionicons name={icon} size={18} color={theme.textMuted} style={styles.icon} />}
      <TextInput
        style={[styles.input, icon ? styles.inputWithIcon : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: theme.border, borderRadius: radii.md,
    backgroundColor: theme.surfaceCard, paddingHorizontal: spacing.s4,
    minHeight: spacing.touchMin,
  },
  icon: { marginRight: spacing.s2 },
  input: { flex: 1, fontSize: fontSize.body, color: theme.textPrimary, paddingVertical: spacing.s3 },
  inputWithIcon: { paddingLeft: 0 },
});

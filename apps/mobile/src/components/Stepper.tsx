import type { JSX } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme, radii, spacing, fontSize, weights } from "../theme";

export function Stepper({
  value, onChange, min = 0,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
}): JSX.Element {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => onChange(value - 1)}
        disabled={value <= min}
      >
        <Text style={[styles.sign, value <= min && styles.signDisabled]}>−</Text>
      </TouchableOpacity>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity style={[styles.btn, styles.btnFilled]} onPress={() => onChange(value + 1)}>
        <Text style={styles.signFilled}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.s3 },
  btn: {
    width: 30, height: 30, borderRadius: radii.pill, borderWidth: 1, borderColor: theme.border,
    alignItems: "center", justifyContent: "center", backgroundColor: theme.surfaceCard,
  },
  btnFilled: { backgroundColor: theme.brand, borderColor: theme.brand },
  sign: { fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: theme.textPrimary },
  signDisabled: { color: theme.textDisabled },
  signFilled: { fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: theme.onBrand },
  value: { fontSize: fontSize.body, fontWeight: weights.semibold as "600", minWidth: 20, textAlign: "center" },
});

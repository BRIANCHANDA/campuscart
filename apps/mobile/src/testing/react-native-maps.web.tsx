// Dev-only stub: react-native-maps has no web implementation. This file is
// only wired up for local web preview via metro.config.js's resolver alias —
// it never ships in the real iOS/Android bundle.
import type { JSX, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function MapView({ children }: { children?: ReactNode }): JSX.Element {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>Map preview (native only)</Text>
      {children}
    </View>
  );
}

export function Marker(): null { return null; }
export function Polyline(): null { return null; }

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#E4EAE4", alignItems: "center", justifyContent: "center" },
  text: { color: "#4B5563" },
});

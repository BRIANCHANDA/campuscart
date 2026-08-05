import { useCallback, useEffect, useState, type JSX } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  PAYMENT_METHOD_LABELS, type Cart, type FulfillmentType, type PaymentMethod,
} from "@campuscart/shared";
import { api, ApiClientError } from "../api/client";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { Input } from "../components/Input";
import { Stepper } from "../components/Stepper";
import { EmptyState } from "../components/EmptyState";
import { colors, theme, radii, spacing, fontSize, weights } from "../theme";

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: "airtel_money", label: PAYMENT_METHOD_LABELS.airtel_money, icon: "phone-portrait-outline", color: colors.coral500 },
  { key: "mtn_momo", label: PAYMENT_METHOD_LABELS.mtn_momo, icon: "phone-portrait-outline", color: colors.amber500 },
];

/** Normalize a Zambian mobile number to +260XXXXXXXXX for the payment API. */
const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("260")) return `+${digits}`;
  if (digits.startsWith("0")) return `+260${digits.slice(1)}`;
  if (digits.length === 9) return `+260${digits}`;
  return raw.trim();
};

const formatKwacha = (minor: number): string => `K${(minor / 100).toFixed(2)}`;

// Default dropoff pin: CBU main campus, Kitwe. A location picker replaces this
// in the maps milestone — the API already accepts arbitrary coordinates.
const CAMPUS_DEFAULT = { lat: -12.808, lng: 28.238 };

/**
 * Active cart + inline checkout. The cartId is lifted from the last
 * addToCart response in App state.
 */
export function CartScreen({
  cartId,
  onOrderPlaced,
}: {
  cartId: string;
  onOrderPlaced: (orderId: string, paymentStatus: string) => void;
}): JSX.Element {
  const [cart, setCart] = useState<Cart | null>(null);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("delivery");
  const [address, setAddress] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("airtel_money");
  const [payPhone, setPayPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((): void => {
    void api.cart(cartId).then(setCart).catch(() => setCart(null));
  }, [cartId]);

  useEffect(load, [load]);

  const changeQty = async (itemId: string, qty: number): Promise<void> => {
    if (!cart) return;
    try {
      setCart(await api.updateCartItem(cart.id, itemId, qty)); // qty 0 removes the line
    } catch {
      load();
    }
  };

  const placeOrder = async (): Promise<void> => {
    if (!cart) return;
    const phone = normalizePhone(payPhone);
    if (phone.replace(/\D/g, "").length < 11) {
      setError(`Enter your ${PAYMENT_METHOD_LABELS[payMethod]} number to pay.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.checkout({
        cartId: cart.id,
        fulfillmentType: fulfillment,
        paymentMethod: payMethod,
        payerPhone: phone,
        ...(fulfillment === "delivery"
          ? { dropoff: CAMPUS_DEFAULT, dropoffAddress: address || "Campus main gate" }
          : {}),
      });
      // Live wallets return "pending" — the shopper approves the prompt on their
      // handset; the tracking screen then settles via the payment.update push.
      onOrderPlaced(res.order.id, res.payment.status);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Checkout failed — try again");
    } finally {
      setBusy(false);
    }
  };

  if (!cart) return <View style={styles.container}><ActivityIndicator style={styles.loader} color={theme.brand} /></View>;

  const empty = cart.items.length === 0;
  const deliveryFeeMinor = 0; // quoted at checkout by the server; shown once the order is placed

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your cart</Text>

      <FlatList
        data={cart.items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="cart-outline" title="Your cart is empty" subtitle="Add something from the feed to get started." />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="bag-handle-outline" size={22} color={theme.brand} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.name}>{item.productName}</Text>
              <Text style={styles.unit}>{formatKwacha(item.unitPriceMinor)} each</Text>
              <View style={styles.rowFooter}>
                <Stepper value={item.qty} min={0} onChange={(next) => void changeQty(item.id, next)} />
                <Text style={styles.lineTotal}>{formatKwacha(item.unitPriceMinor * item.qty)}</Text>
              </View>
            </View>
          </View>
        )}
      />

      {!empty && (
        <View style={styles.footer}>
          <View style={styles.fulfillRow}>
            <Chip
              label="Delivery" flex
              active={fulfillment === "delivery"}
              onPress={() => setFulfillment("delivery")}
            />
            <Chip
              label="Pickup" flex
              active={fulfillment === "pickup"}
              onPress={() => setFulfillment("pickup")}
            />
          </View>

          {fulfillment === "delivery" && (
            <Input
              value={address} onChangeText={setAddress} placeholder="Dropoff details (hostel, room…)"
              icon="location-outline" style={styles.addressInput}
            />
          )}

          {/* Mobile money payment */}
          <Text style={styles.payLabel}>Pay with mobile money</Text>
          <View style={styles.payRow}>
            {PAYMENT_METHODS.map((m) => {
              const active = payMethod === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.payChip, active && styles.payChipActive]}
                  onPress={() => setPayMethod(m.key)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.payDot, { backgroundColor: m.color }]} />
                  <Text style={[styles.payChipText, active && styles.payChipTextActive]}>{m.label}</Text>
                  {active && <Ionicons name="checkmark-circle" size={16} color={theme.brand} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <Input
            value={payPhone} onChangeText={setPayPhone}
            placeholder={`${PAYMENT_METHOD_LABELS[payMethod]} number (e.g. 097…)`}
            icon="call-outline" keyboardType="phone-pad" style={styles.addressInput}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatKwacha(cart.subtotalMinor)}</Text>
            </View>
            {fulfillment === "delivery" && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery fee</Text>
                <Text style={styles.summaryValue}>{deliveryFeeMinor === 0 ? "Quoted at checkout" : formatKwacha(deliveryFeeMinor)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatKwacha(cart.subtotalMinor)}</Text>
            </View>
          </View>

          <Button
            title={`Pay ${formatKwacha(cart.subtotalMinor)} with ${PAYMENT_METHOD_LABELS[payMethod]}`}
            onPress={() => void placeOrder()}
            loading={busy}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.s2 },
  loader: { marginTop: spacing.s8 },
  title: { fontSize: fontSize.h1, fontWeight: weights.bold as "700", color: theme.textPrimary, paddingHorizontal: spacing.screenPad, marginBottom: spacing.s3 },
  list: { paddingHorizontal: spacing.screenPad },
  row: { flexDirection: "row", gap: spacing.s3, paddingVertical: spacing.s3, borderBottomWidth: 1, borderBottomColor: theme.borderFaint },
  rowIcon: {
    width: 56, height: 56, borderRadius: radii.md, backgroundColor: theme.brandTint,
    alignItems: "center", justifyContent: "center",
  },
  rowBody: { flex: 1 },
  name: { fontSize: fontSize.body, fontWeight: weights.semibold as "600", color: theme.textPrimary },
  unit: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 2, marginBottom: spacing.s2 },
  rowFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lineTotal: { fontSize: fontSize.body, fontWeight: weights.bold as "700", color: theme.textPrimary },
  // Extra bottom padding clears the tab bar's raised cart FAB so it never
  // overlaps the Place order button.
  footer: { paddingHorizontal: spacing.screenPad, paddingTop: spacing.s3, paddingBottom: spacing.s8 },
  fulfillRow: { flexDirection: "row", gap: spacing.s2, marginBottom: spacing.s3 },
  addressInput: { marginBottom: spacing.s3 },
  payLabel: { fontSize: fontSize.sm, fontWeight: weights.semibold as "600", color: theme.textSecondary, marginBottom: spacing.s2 },
  payRow: { flexDirection: "row", gap: spacing.s2, marginBottom: spacing.s3 },
  payChip: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.s2,
    paddingVertical: spacing.s3, paddingHorizontal: spacing.s3,
    borderRadius: radii.md, borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.surfaceCard,
  },
  payChipActive: { borderColor: theme.brand, backgroundColor: theme.brandTint },
  payDot: { width: 10, height: 10, borderRadius: 5 },
  payChipText: { flex: 1, fontSize: fontSize.sm, fontWeight: weights.semibold as "600", color: theme.textSecondary },
  payChipTextActive: { color: theme.textPrimary },
  error: { color: theme.criticalInk, marginBottom: spacing.s3 },
  summary: { marginBottom: spacing.s4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.s1 },
  summaryLabel: { fontSize: fontSize.sm, color: theme.textSecondary },
  summaryValue: { fontSize: fontSize.sm, fontWeight: weights.semibold as "600", color: theme.textPrimary },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: spacing.s2, paddingTop: spacing.s3, borderTopWidth: 1, borderTopColor: theme.border, borderStyle: "dashed",
  },
  totalLabel: { fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: theme.textPrimary },
  totalValue: { fontSize: fontSize.h2, fontWeight: weights.bold as "700", color: theme.textPrimary },
});

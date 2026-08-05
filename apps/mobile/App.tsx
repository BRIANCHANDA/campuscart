import { useCallback, useEffect, useState, type JSX } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import type { Product, Shop, User } from "@campuscart/shared";
import { api, restoreSession } from "./src/api/client";
import { AuthScreen } from "./src/screens/AuthScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { CourierScreen } from "./src/screens/CourierScreen";
import { FeedScreen } from "./src/screens/FeedScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { OrderTrackingScreen } from "./src/screens/OrderTrackingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ShopsScreen } from "./src/screens/ShopsScreen";
import { ShopDetailScreen } from "./src/screens/ShopDetailScreen";
import { ProductDetailScreen } from "./src/screens/ProductDetailScreen";
import { EmptyState } from "./src/components/EmptyState";
import { ShopAdminScreen } from "./src/screens/ShopAdminScreen";
import { PlatformAdminScreen } from "./src/screens/PlatformAdminScreen";
import { TabBar, type TabItem } from "./src/components/TabBar";
import { Toast } from "./src/components/Toast";
import { Button } from "./src/components/Button";
import { theme, spacing, fontSize, weights, radii } from "./src/theme";

/**
 * Dependency-free navigation: role-based tabs + overlays (tracking, shop
 * detail, auth gate). Guests browse Home and Shops freely; anything that
 * commits money or identity routes through the auth gate first.
 */
type ShopperTab = "home" | "shops" | "cart" | "orders" | "profile";

const SHOPPER_TABS: TabItem<ShopperTab>[] = [
  { key: "home", label: "Home", icon: "home-outline" },
  { key: "shops", label: "Shops", icon: "storefront-outline" },
  { key: "cart", label: "Cart", icon: "cart", raised: true },
  { key: "orders", label: "Orders", icon: "reorder-three-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
];

function AppContent(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [tab, setTab] = useState<ShopperTab>("home");
  const [cartId, setCartId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  // Overlays
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [openShop, setOpenShop] = useState<Shop | null>(null);
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [authGate, setAuthGate] = useState<{ notice: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refreshCartCount = useCallback((id: string | null) => {
    if (!id) { setCartCount(0); return; }
    void api.cart(id).then((c) => setCartCount(c.items.reduce((s, i) => s + i.qty, 0))).catch(() => {});
  }, []);

  /**
   * Restore the pending cart whenever a shopper session begins. Without this
   * the cart id only exists in memory, so a shopper who adds items and
   * relaunches sees an empty cart while the server still holds it.
   */
  useEffect(() => {
    if (user?.role !== "shopper") return;
    let cancelled = false;
    void api.activeCart()
      .then((cart) => {
        if (cancelled || !cart) return;
        setCartId(cart.id);
        setCartCount(cart.items.reduce((s, i) => s + i.qty, 0));
      })
      .catch(() => { /* no cart to restore — leave the empty state alone */ });
    return () => { cancelled = true; };
  }, [user?.id, user?.role]);

  /** Add to cart if signed in as a shopper; otherwise raise the auth gate. */
  const addToCart = useCallback((product: Product, qty = 1): void => {
    if (!user) {
      setAuthGate({ notice: `Create a free account to buy ${product.name} — browsing stays open to everyone.` });
      return;
    }
    void api.addToCart(product.id, qty)
      .then((cart) => {
        setCartId(cart.id);
        setCartCount(cart.items.reduce((s, i) => s + i.qty, 0));
        setOpenProduct(null); // close detail if it was open
        setToast(`${product.name} added to cart`);
      })
      .catch(() => setToast("Couldn't add — try again"));
  }, [user]);

  const signOut = (): void => {
    void api.logout(); // revokes the refresh token server-side, clears local creds
    setUser(null);
    setTab("home");
    setCartId(null);
    setCartCount(0);
    setTrackingOrderId(null);
    setOpenShop(null);
  };

  // ---- session restore ----------------------------------------------------
  // Held behind `restoring` so a returning user never sees the guest UI flash
  // before their session comes back.
  useEffect(() => {
    let cancelled = false;
    void restoreSession()
      .then((u) => { if (!cancelled && u) setUser(u); })
      .finally(() => { if (!cancelled) setRestoring(false); });
    return () => { cancelled = true; };
  }, []);

  if (restoring) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <StatusBar style="dark" />
        <View style={styles.splash}>
          <ActivityIndicator size="large" color={theme.brand} />
        </View>
      </SafeAreaView>
    );
  }

  // ---- role dashboards (must be signed in) --------------------------------
  if (user?.role === "courier") {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <StatusBar style="dark" />
        <CourierScreen user={user} onSignOut={signOut} onUserUpdated={setUser} />
      </SafeAreaView>
    );
  }
  if (user?.role === "shop_admin") {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <StatusBar style="dark" />
        <ShopAdminScreen user={user} onSignOut={signOut} onUserUpdated={setUser} />
      </SafeAreaView>
    );
  }
  if (user?.role === "platform_admin") {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <StatusBar style="dark" />
        <PlatformAdminScreen user={user} onSignOut={signOut} />
      </SafeAreaView>
    );
  }

  // ---- overlays -----------------------------------------------------------
  if (authGate) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <AuthScreen
          notice={authGate.notice}
          initialMode="register"
          onCancel={() => setAuthGate(null)}
          onAuthed={(u) => { setAuthGate(null); setUser(u); }}
        />
      </SafeAreaView>
    );
  }

  if (openProduct) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <StatusBar style="dark" />
        <ProductDetailScreen
          product={openProduct}
          onBack={() => setOpenProduct(null)}
          onAdd={(p, qty) => addToCart(p, qty)}
        />
        <Toast message={toast} onDone={() => setToast(null)} />
      </SafeAreaView>
    );
  }

  if (openShop) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <StatusBar style="dark" />
        <ShopDetailScreen
          shop={openShop}
          onBack={() => setOpenShop(null)}
          onAddToCart={addToCart}
          onOpenProduct={setOpenProduct}
        />
        <Toast message={toast} onDone={() => setToast(null)} />
      </SafeAreaView>
    );
  }

  if (trackingOrderId) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <StatusBar style="dark" />
        <TouchableOpacity style={styles.overlayBack} onPress={() => setTrackingOrderId(null)}>
          <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
          <Text style={styles.overlayBackText}>Orders</Text>
        </TouchableOpacity>
        <OrderTrackingScreen orderId={trackingOrderId} />
      </SafeAreaView>
    );
  }

  // ---- main shopper/guest shell --------------------------------------------
  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        {tab === "home" && (
          <FeedScreen greetingName={user?.fullName} onAddToCart={addToCart} onOpenProduct={setOpenProduct} />
        )}
        {tab === "shops" && <ShopsScreen onOpenShop={setOpenShop} />}
        {tab === "cart" && (
          !user ? (
            <GuestPrompt
              icon="cart-outline"
              title="Your cart lives here"
              subtitle="Create a free account to start filling it."
              onPress={() => setAuthGate({ notice: "Create a free account to start shopping." })}
            />
          ) : cartId ? (
            <CartScreen
              cartId={cartId}
              onOrderPlaced={(orderId, paymentStatus) => {
                setCartId(null);
                setCartCount(0);
                setTrackingOrderId(orderId);
                setTab("orders");
                setToast(
                  paymentStatus === "succeeded"
                    ? "Payment received — order placed!"
                    : "Approve the payment prompt on your phone to confirm",
                );
              }}
            />
          ) : (
            <EmptyState icon="cart-outline" title="Your cart is empty" subtitle="Add something from the feed to get started." />
          )
        )}
        {tab === "orders" && (
          !user ? (
            <GuestPrompt
              icon="receipt-outline"
              title="Track your orders"
              subtitle="Sign in to see orders and live delivery tracking."
              onPress={() => setAuthGate({ notice: "Sign in to see your orders and live tracking." })}
            />
          ) : (
            <OrdersScreen
              onOpenOrder={setTrackingOrderId}
              onReordered={(id) => { setCartId(id); refreshCartCount(id); setTab("cart"); }}
            />
          )
        )}
        {tab === "profile" && (
          !user ? (
            <GuestPrompt
              icon="person-outline"
              title="You're browsing as a guest"
              subtitle="Sign in or create an account to shop, track orders and more."
              onPress={() => setAuthGate({ notice: "Welcome! Sign in or create your free account." })}
            />
          ) : (
            <ProfileScreen user={user} onSignOut={signOut} onUserUpdated={setUser} />
          )
        )}
      </View>

      <Toast message={toast} onDone={() => setToast(null)} />

      <TabBar
        items={SHOPPER_TABS.map((t) => (t.key === "cart" ? { ...t, badge: cartCount || undefined } : t))}
        active={tab}
        onChange={setTab}
      />
    </SafeAreaView>
  );
}

/** Friendly sign-in prompt shown on gated tabs while browsing as a guest. */
function GuestPrompt({
  icon, title, subtitle, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}): JSX.Element {
  return (
    <View style={styles.guestWrap}>
      <View style={styles.guestIcon}>
        <Ionicons name={icon} size={30} color={theme.brand} />
      </View>
      <Text style={styles.guestTitle}>{title}</Text>
      <Text style={styles.guestSubtitle}>{subtitle}</Text>
      <Button title="Sign in / create account" onPress={onPress} style={styles.guestBtn} />
    </View>
  );
}

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.surfaceBg },
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
  body: { flex: 1 },
  overlayBack: {
    flexDirection: "row", alignItems: "center", gap: 2,
    paddingHorizontal: spacing.s4, paddingVertical: spacing.s2,
  },
  overlayBackText: { fontSize: fontSize.body, fontWeight: weights.semibold as "600", color: theme.textPrimary },
  guestWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.s8 },
  guestIcon: {
    width: 72, height: 72, borderRadius: radii.xl, backgroundColor: theme.brandTint,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.s5,
  },
  guestTitle: { fontSize: fontSize.h2, fontWeight: weights.bold as "700", color: theme.textPrimary, textAlign: "center" },
  guestSubtitle: {
    fontSize: fontSize.body, color: theme.textSecondary, textAlign: "center",
    marginTop: spacing.s2, marginBottom: spacing.s6, lineHeight: fontSize.body * 1.45,
  },
  guestBtn: { alignSelf: "stretch" },
});

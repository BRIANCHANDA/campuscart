import { useCallback, useEffect, useState, type JSX } from "react";
import {
  ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  nextStatuses, type Order, type OrderStatus, type Product, type ProductFeedQuery,
  type Shop, type User,
} from "@campuscart/shared";
import { api, ApiClientError } from "../api/client";
import { Badge, type BadgeTone } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { Input } from "../components/Input";
import { Stepper } from "../components/Stepper";
import { ProfileScreen } from "./ProfileScreen";
import { InsightsScreen } from "./InsightsScreen";
import { TabBar, type TabItem } from "../components/TabBar";
import { colors, theme, elevation, radii, spacing, fontSize, weights } from "../theme";

const formatKwacha = (minor: number): string => `K${(minor / 100).toFixed(2)}`;

const STATUS_BADGE: Partial<Record<OrderStatus, { label: string; tone: BadgeTone }>> = {
  placed: { label: "New", tone: "info" },
  preparing: { label: "Preparing", tone: "urgent" },
  ready_for_pickup: { label: "Ready", tone: "accent" },
  out_for_delivery: { label: "Out for delivery", tone: "success" },
  delivered: { label: "Delivered", tone: "success" },
  completed: { label: "Collected", tone: "success" },
  cancelled: { label: "Cancelled", tone: "critical" },
};

const BORDER_COLOR: Partial<Record<OrderStatus, string>> = {
  placed: theme.info,
  preparing: theme.urgent,
  ready_for_pickup: theme.accent,
};

type ShopStats = {
  todayOrders: number; todayRevenueMinor: number;
  activeOrders: number; lifetimeOrders: number; lifetimeRevenueMinor: number;
  totalProducts: number; lowStock: number; outOfStock: number;
};

type Category = NonNullable<ProductFeedQuery["category"]>;
const CATEGORIES: { key: Category; label: string }[] = [
  { key: "food", label: "Food" },
  { key: "drinks", label: "Drinks" },
  { key: "stationery", label: "Stationery" },
  { key: "books", label: "Books" },
  { key: "electronics", label: "Electronics" },
  { key: "clothing", label: "Clothing" },
  { key: "services", label: "Services" },
  { key: "other", label: "Other" },
];

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  preparing: "Accept & prepare",
  ready_for_pickup: "Ready for pickup",
  completed: "Mark collected",
  cancelled: "Cancel",
};

const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

type AdminTab = "orders" | "catalog" | "insights" | "shops" | "profile";
const TABS: TabItem<AdminTab>[] = [
  { key: "orders", label: "Orders", icon: "reorder-three-outline" },
  { key: "catalog", label: "Catalog", icon: "storefront-outline" },
  { key: "insights", label: "Insights", icon: "bar-chart-outline" },
  { key: "shops", label: "Shops", icon: "business-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
];

/**
 * Shop admin home: incoming orders (with actions driven by the SHARED state
 * machine — the app can never offer a transition the server would reject)
 * and inventory management. Multi-shop admins get a switcher; the first
 * shop is selected by default.
 */
export function ShopAdminScreen({ user, onSignOut, onUserUpdated }: { user: User; onSignOut: () => void; onUserUpdated?: (u: User) => void }): JSX.Element {
  const [tab, setTab] = useState<AdminTab>("orders");
  const [myShops, setMyShops] = useState<Shop[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New product form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState<Category>("food");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Shop info editor (Shops tab)
  const [editingShop, setEditingShop] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopDesc, setShopDesc] = useState("");
  const [shopAddr, setShopAddr] = useState("");

  useEffect(() => {
    void api.shopAdmin.myShops()
      .then((shops) => { setMyShops(shops); setShop(shops[0] ?? null); })
      .catch(() => {});
  }, []);

  const load = useCallback((): void => {
    if (!shop) return;
    setRefreshing(true);
    void Promise.allSettled([
      api.shopAdmin.orders(shop.id),
      api.shopAdmin.products(shop.id),
      api.shopAdmin.stats(shop.id),
    ])
      .then(([o, p, s]) => {
        if (o.status === "fulfilled") setOrders(o.value.data);
        if (p.status === "fulfilled") setProducts(p.value.data);
        if (s.status === "fulfilled") setStats(s.value);
      })
      .finally(() => setRefreshing(false));
  }, [shop]);

  useEffect(load, [load]);

  const act = async (order: Order, to: OrderStatus): Promise<void> => {
    if (!shop) return;
    setNotice(null);
    try {
      if (to === "out_for_delivery") {
        await api.shopAdmin.dispatch(shop.id, order.id);
      } else {
        await api.shopAdmin.setOrderStatus(shop.id, order.id, to);
      }
      load();
    } catch (e) {
      setNotice(e instanceof ApiClientError ? e.message : "Action failed — refresh and retry");
    }
  };

  const pickPhoto = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset) setPhotoUri(asset.uri);
  };

  const addProduct = async (): Promise<void> => {
    if (!shop) return;
    const priceMinor = Math.round(parseFloat(price) * 100);
    const stockQty = parseInt(stock, 10);
    if (!name || !Number.isFinite(priceMinor) || !Number.isInteger(stockQty)) {
      setNotice("Product needs a name, a price, and a whole-number stock quantity");
      return;
    }
    setNotice(null);
    setSaving(true);
    try {
      // Photo first — a product without its picture is worse than a slow save.
      const imageUrl = photoUri ? await api.uploadImage(photoUri) : null;
      await api.shopAdmin.createProduct(shop.id, {
        name, description: null, category, priceMinor, currency: "ZMW",
        stockQty, imageUrl,
      });
      setName(""); setPrice(""); setStock(""); setPhotoUri(null);
      load();
    } catch (e) {
      setNotice(e instanceof ApiClientError ? e.message : "Could not add product");
    } finally {
      setSaving(false);
    }
  };

  const startEditShop = (): void => {
    if (!shop) return;
    setShopName(shop.name);
    setShopDesc(shop.description ?? "");
    setShopAddr(shop.address ?? "");
    setEditingShop(true);
  };

  const saveShop = async (): Promise<void> => {
    if (!shop || !shopName.trim()) return;
    setNotice(null);
    try {
      const updated = await api.shopAdmin.updateShop(shop.id, {
        name: shopName.trim(),
        description: shopDesc.trim() || null,
        address: shopAddr.trim() || null,
      });
      setShop(updated);
      setMyShops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditingShop(false);
    } catch (e) {
      setNotice(e instanceof ApiClientError ? e.message : "Could not save shop details");
    }
  };

  const adjustStock = async (product: Product, delta: number): Promise<void> => {
    if (!shop) return;
    try {
      await api.shopAdmin.updateProduct(shop.id, product.id, {
        stockQty: Math.max(0, product.stockQty + delta),
      });
      load();
    } catch {
      load();
    }
  };

  if (tab === "insights" && shop) {
    return (
      <View style={styles.screen}>
        <View style={styles.body}><InsightsScreen shopId={shop.id} /></View>
        <TabBar items={TABS} active={tab} onChange={setTab} />
      </View>
    );
  }

  if (tab === "profile") {
    return (
      <View style={styles.screen}>
        <View style={styles.body}><ProfileScreen user={user} onSignOut={onSignOut} onUserUpdated={onUserUpdated} /></View>
        <TabBar items={TABS} active={tab} onChange={setTab} />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.brand} />
          <Text style={styles.hint}>Looking up your shop…</Text>
        </View>
        <TabBar items={TABS} active={tab} onChange={setTab} />
      </View>
    );
  }

  if (tab === "shops") {
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          <Text style={styles.title}>Your shops</Text>
          <FlatList
            data={myShops}
            keyExtractor={(s) => s.id}
            ListFooterComponent={
              editingShop ? (
                <Card style={styles.editForm}>
                  <Text style={styles.formTitle}>Edit {shop.name}</Text>
                  <Input value={shopName} onChangeText={setShopName} placeholder="Shop name" style={styles.formInput} />
                  <Input value={shopDesc} onChangeText={setShopDesc} placeholder="Description" style={styles.formInput} />
                  <Input value={shopAddr} onChangeText={setShopAddr} placeholder="Address (e.g. Food Court, CBU)" icon="location-outline" style={styles.formInput} />
                  {notice && <Text style={styles.notice}>{notice}</Text>}
                  <View style={styles.editActions}>
                    <Button title="Cancel" variant="secondary" onPress={() => setEditingShop(false)} style={styles.editBtn} />
                    <Button title="Save changes" onPress={() => void saveShop()} style={styles.editBtn} />
                  </View>
                </Card>
              ) : (
                <Button title={`Edit ${shop.name} details`} variant="secondary" onPress={startEditShop} />
              )
            }
            renderItem={({ item }) => {
              const isSelected = item.id === shop.id;
              return (
                <TouchableOpacity onPress={() => { setShop(item); setEditingShop(false); }}>
                  <Card style={[styles.shopCard, isSelected && styles.shopCardActive]}>
                    <View style={styles.shopRow}>
                      <View style={styles.shopAvatar}><Text style={styles.shopAvatarText}>{initials(item.name)}</Text></View>
                      <View style={styles.shopBody}>
                        <Text style={styles.shopName}>{item.name}</Text>
                        <Text style={styles.shopMeta}>
                          {item.isActive ? "open" : "blocked"}{item.address ? ` · ${item.address}` : ""}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={14} color={theme.onBrand} />
                        </View>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            }}
          />
        </View>
        <TabBar items={TABS} active={tab} onChange={setTab} />
      </View>
    );
  }

  const activeOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "completed" && o.status !== "cancelled");

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.shopBadgeSmall}><Text style={styles.shopBadgeSmallText}>{initials(shop.name)}</Text></View>
          <Text style={styles.title}>{shop.name}</Text>
        </View>

        {tab === "orders" ? (
          <>
            {notice && <Text style={styles.notice}>{notice}</Text>}
            <FlatList
              data={orders}
              keyExtractor={(o) => o.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.brand} />}
              ListHeaderComponent={
                <>
                  <Dashboard stats={stats} />
                  <Text style={styles.queueLabel}>
                    Order queue{activeOrders.length > 0 ? ` · ${activeOrders.length} active` : ""}
                  </Text>
                </>
              }
              ListEmptyComponent={<EmptyState icon="reorder-three-outline" title="No orders yet" />}
              renderItem={({ item }) => {
                const actions = nextStatuses(item.status, item.fulfillmentType, "shop_admin");
                const badge = STATUS_BADGE[item.status];
                const borderColor = BORDER_COLOR[item.status];
                return (
                  <Card style={[styles.orderCard, borderColor ? { borderLeftWidth: 4, borderLeftColor: borderColor } : null]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
                      {badge && <Badge label={badge.label} tone={badge.tone} />}
                    </View>
                    <Text style={styles.itemsLine}>
                      {item.items.map((i) => `${i.qty}× ${i.productName}`).join(", ")}
                    </Text>
                    <Text style={styles.meta}>
                      {formatKwacha(item.totalMinor)} · {item.fulfillmentType}
                    </Text>
                    {actions.length > 0 && (
                      <View style={styles.actionsRow}>
                        {actions.map((to) => (
                          <Button
                            key={to}
                            title={to === "out_for_delivery" ? "Dispatch courier" : ACTION_LABEL[to] ?? to}
                            variant={to === "cancelled" ? "danger" : to === "ready_for_pickup" ? "accent" : to === "completed" ? "secondary" : "primary"}
                            onPress={() => void act(item, to)}
                            style={styles.actionBtn}
                          />
                        ))}
                      </View>
                    )}
                  </Card>
                );
              }}
            />
          </>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(p) => p.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.brand} />}
            ListHeaderComponent={
              <Card style={styles.form}>
                <Text style={styles.formTitle}>New product</Text>
                <View style={styles.photoRow}>
                  <TouchableOpacity style={styles.photoPick} onPress={() => void pickPhoto()}>
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    ) : (
                      <>
                        <Ionicons name="image-outline" size={22} color={theme.textMuted} />
                        <Text style={styles.photoHint}>Photo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <View style={styles.photoFields}>
                    <Input value={name} onChangeText={setName} placeholder="Name" style={styles.formInput} />
                    <View style={styles.formRow}>
                      <Input value={price} onChangeText={setPrice} placeholder="Price (K)" keyboardType="decimal-pad" style={styles.formInputHalf} />
                      <Input value={stock} onChangeText={setStock} placeholder="Stock" keyboardType="number-pad" style={styles.formInputHalf} />
                    </View>
                  </View>
                </View>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.catWrap}>
                  {CATEGORIES.map((c) => {
                    const active = category === c.key;
                    return (
                      <TouchableOpacity
                        key={c.key}
                        style={[styles.catChip, active && styles.catChipActive]}
                        onPress={() => setCategory(c.key)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{c.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {notice && <Text style={styles.notice}>{notice}</Text>}
                <Button title={saving ? "Saving…" : "Save product"} loading={saving} onPress={() => void addProduct()} />
              </Card>
            }
            ListEmptyComponent={<EmptyState icon="cube-outline" title="No products yet" subtitle="Add your first one above." />}
            renderItem={({ item }) => (
              <Card style={styles.productCard}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.productThumb} />
                ) : (
                  <View style={styles.productIcon}>
                    <Ionicons name="bag-handle-outline" size={20} color={theme.textSecondary} />
                  </View>
                )}
                <View style={styles.productBody}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <View style={styles.productMetaRow}>
                    <View style={[styles.stockDot, item.stockQty === 0 && styles.stockDotEmpty]} />
                    <Text style={[styles.productMeta, item.stockQty === 0 && styles.outOfStock]}>
                      {item.stockQty === 0 ? "Out of stock" : `${item.stockQty} in stock`}
                    </Text>
                    <Text style={styles.productMeta}>· {formatKwacha(item.priceMinor)}</Text>
                  </View>
                </View>
                <Stepper value={item.stockQty} onChange={(next) => void adjustStock(item, next - item.stockQty)} />
              </Card>
            )}
          />
        )}
      </View>

      <TabBar items={TABS} active={tab} onChange={setTab} />
    </View>
  );
}

/** Shop monitoring dashboard — today's takings + at-a-glance health. */
function Dashboard({ stats }: { stats: ShopStats | null }): JSX.Element {
  const s = stats ?? {
    todayOrders: 0, todayRevenueMinor: 0, activeOrders: 0,
    lifetimeOrders: 0, lifetimeRevenueMinor: 0, totalProducts: 0, lowStock: 0, outOfStock: 0,
  };
  return (
    <View style={styles.dash}>
      {/* Hero: today's revenue */}
      <View style={styles.dashHero}>
        <Text style={styles.dashHeroLabel}>Today's revenue</Text>
        <Text style={styles.dashHeroValue}>{formatKwacha(s.todayRevenueMinor)}</Text>
        <View style={styles.dashHeroFoot}>
          <Ionicons name="receipt-outline" size={14} color={colors.green200} />
          <Text style={styles.dashHeroFootText}>
            {s.todayOrders} order{s.todayOrders === 1 ? "" : "s"} today · {formatKwacha(s.lifetimeRevenueMinor)} all-time
          </Text>
        </View>
      </View>
      {/* Stat tiles */}
      <View style={styles.dashRow}>
        <StatTile icon="time-outline" tone="info" value={String(s.activeOrders)} label="Active orders" />
        <StatTile icon="cube-outline" tone="brand" value={String(s.totalProducts)} label="Products" />
      </View>
      <View style={styles.dashRow}>
        <StatTile icon="alert-circle-outline" tone={s.lowStock > 0 ? "urgent" : "muted"} value={String(s.lowStock)} label="Low stock" />
        <StatTile icon="close-circle-outline" tone={s.outOfStock > 0 ? "critical" : "muted"} value={String(s.outOfStock)} label="Out of stock" />
      </View>
    </View>
  );
}

type Tone = "brand" | "info" | "urgent" | "critical" | "muted";
const TONE_MAP: Record<Tone, { bg: string; fg: string }> = {
  brand: { bg: theme.brandTint, fg: theme.brandDeep },
  info: { bg: theme.infoTint, fg: theme.infoInk },
  urgent: { bg: theme.urgentTint, fg: theme.urgentInk },
  critical: { bg: theme.criticalTint, fg: theme.criticalInk },
  muted: { bg: theme.surfaceInset, fg: theme.textMuted },
};

function StatTile({
  icon, value, label, tone,
}: {
  icon: keyof typeof Ionicons.glyphMap; value: string; label: string; tone: Tone;
}): JSX.Element {
  const t = TONE_MAP[tone];
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={18} color={t.fg} />
      </View>
      <View>
        <Text style={styles.tileValue}>{value}</Text>
        <Text style={styles.tileLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, padding: spacing.screenPad },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hint: { color: theme.textSecondary, marginTop: spacing.s2 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.s2, marginBottom: 2 },
  shopBadgeSmall: { width: 26, height: 26, borderRadius: radii.xs, backgroundColor: theme.urgentTint, alignItems: "center", justifyContent: "center" },
  shopBadgeSmallText: { fontSize: 11, fontWeight: weights.bold as "700", color: theme.urgentInk },
  title: { fontSize: fontSize.h1, fontWeight: weights.bold as "700", color: theme.textPrimary },
  subtitle: { fontSize: fontSize.xs, color: theme.textMuted, marginBottom: spacing.s4, marginLeft: 34 },
  notice: { color: theme.criticalInk, marginBottom: spacing.s3 },
  // Dashboard
  dash: { marginTop: spacing.s3, marginBottom: spacing.s2 },
  dashHero: { backgroundColor: theme.brandDeep, borderRadius: radii.xl, padding: spacing.s5, marginBottom: spacing.s3, ...elevation.brand },
  dashHeroLabel: { color: colors.green200, fontSize: fontSize.sm, fontWeight: weights.medium as "500" },
  dashHeroValue: { color: theme.onBrand, fontSize: fontSize.display, fontWeight: weights.bold as "700", marginTop: spacing.s1 },
  dashHeroFoot: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.s2 },
  dashHeroFootText: { color: colors.green200, fontSize: fontSize.xs },
  dashRow: { flexDirection: "row", gap: spacing.s3, marginBottom: spacing.s3 },
  tile: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.s3,
    backgroundColor: theme.surfaceCard, borderRadius: radii.lg, padding: spacing.s4,
    borderWidth: 1, borderColor: theme.borderFaint, ...elevation[1],
  },
  tileIcon: { width: 38, height: 38, borderRadius: radii.sm, alignItems: "center", justifyContent: "center" },
  tileValue: { fontSize: fontSize.h2, fontWeight: weights.bold as "700", color: theme.textPrimary },
  tileLabel: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 1 },
  queueLabel: { fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: theme.textPrimary, marginBottom: spacing.s3 },
  orderCard: { marginBottom: spacing.s3 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.s2 },
  orderId: { fontSize: fontSize.xs, color: theme.textMuted },
  itemsLine: { fontSize: fontSize.bodyLg, fontWeight: weights.semibold as "600", color: theme.textPrimary },
  meta: { color: theme.textMuted, marginTop: 3, marginBottom: spacing.s3, fontSize: fontSize.sm },
  actionsRow: { flexDirection: "row", gap: spacing.s2, flexWrap: "wrap" },
  actionBtn: { flexGrow: 1 },
  form: { marginBottom: spacing.s4 },
  formTitle: { fontWeight: weights.bold as "700", marginBottom: spacing.s3, color: theme.textPrimary },
  formRow: { flexDirection: "row", gap: spacing.s2 },
  formInput: { marginBottom: spacing.s3 },
  formInputHalf: { flex: 1, marginBottom: spacing.s3 },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: weights.semibold as "600", color: theme.textSecondary, marginBottom: spacing.s2 },
  catWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2, marginBottom: spacing.s3 },
  catChip: {
    paddingVertical: spacing.s2, paddingHorizontal: spacing.s3,
    borderRadius: radii.pill, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surfaceCard,
  },
  catChipActive: { backgroundColor: theme.brand, borderColor: theme.brand },
  catChipText: { fontSize: fontSize.sm, fontWeight: weights.medium as "500", color: theme.textSecondary },
  catChipTextActive: { color: theme.onBrand, fontWeight: weights.semibold as "600" },
  productCard: { flexDirection: "row", alignItems: "center", gap: spacing.s3, marginBottom: spacing.s3 },
  productIcon: { width: 44, height: 44, borderRadius: radii.sm, backgroundColor: theme.surfaceInset, alignItems: "center", justifyContent: "center" },
  productThumb: { width: 44, height: 44, borderRadius: radii.sm, backgroundColor: theme.surfaceInset },
  photoRow: { flexDirection: "row", gap: spacing.s3 },
  photoPick: {
    width: 96, height: 96, borderRadius: radii.md, borderWidth: 1.5, borderColor: theme.border,
    borderStyle: "dashed", backgroundColor: theme.surfaceInset,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  photoPreview: { width: "100%", height: "100%" },
  photoHint: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 2 },
  photoFields: { flex: 1 },
  editForm: { marginTop: spacing.s2 },
  editActions: { flexDirection: "row", gap: spacing.s2 },
  editBtn: { flex: 1 },
  productBody: { flex: 1 },
  productName: { fontSize: fontSize.body, fontWeight: weights.semibold as "600", color: theme.textPrimary },
  productMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  stockDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.success },
  stockDotEmpty: { backgroundColor: theme.critical },
  productMeta: { fontSize: fontSize.xs, color: theme.textMuted },
  outOfStock: { color: theme.criticalInk, fontWeight: weights.semibold as "600" },
  shopCard: { marginBottom: spacing.s3 },
  shopCardActive: { borderWidth: 2, borderColor: theme.brand },
  shopRow: { flexDirection: "row", alignItems: "center", gap: spacing.s3 },
  shopAvatar: { width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.blue100, alignItems: "center", justifyContent: "center" },
  shopAvatarText: { fontSize: fontSize.h3, fontWeight: weights.bold as "700", color: colors.blue600 },
  shopBody: { flex: 1 },
  shopName: { fontSize: fontSize.bodyLg, fontWeight: weights.semibold as "600", color: theme.textPrimary },
  shopMeta: { fontSize: fontSize.sm, color: theme.textMuted, marginTop: 2 },
  checkBadge: { width: 24, height: 24, borderRadius: 999, backgroundColor: theme.brand, alignItems: "center", justifyContent: "center" },
});

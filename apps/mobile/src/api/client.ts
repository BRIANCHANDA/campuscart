import {
  ApiErrorSchema,
  AuthResponseSchema,
  CartSchema,
  DeliverySchema,
  OrderSchema,
  paginated,
  ProductSchema,
  ShopSchema,
  UserSchema,
  type OrderStatus,
  type PaymentMethod,
  type ProductFeedQuery,
} from "@campuscart/shared";
import { z } from "zod";

/**
 * Typed API client. Every response is parsed with the SAME Zod schemas the
 * backend uses (from @campuscart/shared) — no duplicated DTOs, and a server
 * contract drift fails loudly at the client boundary instead of silently.
 */
function resolveBaseUrl(): string {
  // Explicit override always wins (real devices set this to the LAN IP).
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  // On web the app is served from the API's host — reuse it so we never chase
  // a changing LAN IP. (Expo web serves on :8081; the API listens on :3000.)
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  // Native fallback for local dev without an env override.
  return "http://10.120.44.37:3000";
}
const BASE_URL = resolveBaseUrl();

let authToken: string | null = null;
let refreshTokenValue: string | null = null;

export const setToken = (t: string | null): void => { authToken = t; };
export const setRefreshToken = (t: string | null): void => { refreshTokenValue = t; };
export const getToken = (): string | null => authToken;

/** ws(s):// endpoint for the realtime gateway, carrying the access JWT. */
export const wsUrl = (): string =>
  `${BASE_URL.replace(/^http/, "ws")}/ws?token=${encodeURIComponent(authToken ?? "")}`;

/**
 * Error surfaced to screens. `message` is ALWAYS safe to show a user — the
 * raw server/programmer text is humanized here so nothing technical leaks into
 * the UI. The original code/text stay on the object for logging only.
 */
export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    userMessage: string,
    public readonly serverMessage?: string,
  ) {
    super(userMessage);
    this.name = "ApiClientError";
  }
}

const GENERIC_ERROR = "Something went wrong. Please try again.";

/** Codes whose server message is written for end users — safe to show verbatim. */
const USER_SAFE_CODES = new Set([
  "NOT_FOUND", "FORBIDDEN", "UNAUTHORIZED",
  "OUT_OF_STOCK", "NOT_VERIFIED", "EMPTY_CART", "DROPOFF_REQUIRED",
  "ADMIN_NOT_FOUND", "ADMIN_INVALID", "EMAIL_TAKEN", "NO_COURIER_AVAILABLE",
  "NOTHING_PENDING", "ALREADY_DISPATCHED", "NOT_A_DELIVERY_ORDER",
  "TOO_LARGE", "BAD_TYPE", "CART_ALREADY_CHECKED_OUT",
]);

/** Curated replacements for codes whose server text is too technical to show. */
const FRIENDLY_BY_CODE: Record<string, string> = {
  INTERNAL: "Something went wrong on our end. Please try again in a moment.",
  VALIDATION_ERROR: "Please check the details you entered and try again.",
  INVALID_PICKUP: "This order can't be updated right now — refresh and try again.",
  INVALID_TRANSITION: "That action isn't available for this order right now.",
  STALE_ORDER: "This order was just updated — pull to refresh and try again.",
  IDEMPOTENCY_KEY_REQUIRED: "Something interrupted your order. Please try again.",
  NO_FILE: "Please choose an image first.",
  UPLOAD_FAILED: "That image couldn't be uploaded. Try a different one.",
  NETWORK: "Can't reach CampusCart. Check your connection and try again.",
};

/** Map a server error code + message to something safe and helpful for a user. */
function humanize(code: string, serverMessage: string): string {
  if (FRIENDLY_BY_CODE[code]) return FRIENDLY_BY_CODE[code]!;
  if (USER_SAFE_CODES.has(code)) return serverMessage;
  return GENERIC_ERROR;
}

/** Safe extractor for use in screens/handlers that catch `unknown`. */
export const errorMessage = (err: unknown): string =>
  err instanceof ApiClientError ? err.message : GENERIC_ERROR;

async function rawRequest(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    // fetch only rejects on network/connectivity failures — never leak the raw error.
    throw new ApiClientError("NETWORK", FRIENDLY_BY_CODE.NETWORK!);
  }
}

/** One-shot token refresh; concurrent 401s share the same in-flight attempt. */
let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  if (!refreshTokenValue) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { token: string; refreshToken: string };
      authToken = data.token;
      refreshTokenValue = data.refreshToken; // rotated — old one is now dead
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function request<T extends z.ZodTypeAny>(
  schema: T,
  path: string,
  init: RequestInit = {},
): Promise<z.infer<T>> {
  let res = await rawRequest(path, init);

  // Expired access token → refresh once and replay the request
  if (res.status === 401 && !path.startsWith("/auth/") && (await tryRefresh())) {
    res = await rawRequest(path, init);
  }

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const parsed = ApiErrorSchema.safeParse(body);
    if (parsed.success) {
      const { code, message } = parsed.data.error;
      throw new ApiClientError(code, humanize(code, message), message);
    }
    // Non-standard error body (proxy error, HTML, empty) — stay generic.
    throw new ApiClientError("UNKNOWN", GENERIC_ERROR, `HTTP ${res.status}`);
  }

  // Contract drift (server shape the client doesn't expect) must not surface a
  // raw ZodError to the user — log it, show generic.
  const result = schema.safeParse(body);
  if (!result.success) {
    if (__DEV__) console.warn(`[api] response parse failed for ${path}`, result.error);
    throw new ApiClientError("PARSE_ERROR", GENERIC_ERROR, "response schema mismatch");
  }
  return result.data;
}

export const api = {
  login: (email: string, password: string) =>
    request(AuthResponseSchema, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // ---- profile (self-service) -------------------------------------------
  me: () => request(UserSchema, "/auth/me"),
  updateProfile: (patch: { fullName?: string; phone?: string }) =>
    request(UserSchema, "/auth/me", { method: "PATCH", body: JSON.stringify(patch) }),
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    request(z.object({ ok: z.boolean() }), "/auth/change-password", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  // ---- public catalog (works without a token — guest browsing) ----------
  shops: () => request(paginated(ShopSchema), "/shops?pageSize=50"),
  shop: (shopId: string) => request(ShopSchema, `/shops/${shopId}`),

  /**
   * Upload a product photo. Takes the local file URI from the image picker;
   * on web the picker hands back a data/blob URI which fetch() can read too.
   */
  uploadImage: async (uri: string, mime = "image/jpeg"): Promise<string> => {
    const form = new FormData();
    if (uri.startsWith("data:") || uri.startsWith("blob:")) {
      const blob = await (await fetch(uri)).blob();
      form.append("file", new File([blob], "photo.jpg", { type: blob.type || mime }));
    } else {
      // React Native's FormData file descriptor
      form.append("file", { uri, name: "photo.jpg", type: mime } as unknown as Blob);
    }
    const res = await fetch(`${BASE_URL}/uploads`, {
      method: "POST",
      headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      body: form,
    });
    if (!res.ok) throw new ApiClientError("UPLOAD_FAILED", `Upload failed (${res.status})`);
    const data = (await res.json()) as { url: string };
    return data.url;
  },

  productFeed: (query: Partial<ProductFeedQuery> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]),
    );
    return request(paginated(ProductSchema), `/products?${qs}`);
  },

  addToCart: (productId: string, qty = 1) =>
    request(CartSchema, "/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, qty }),
    }),

  checkout: (input: {
    cartId: string;
    fulfillmentType: "delivery" | "pickup";
    dropoff?: { lat: number; lng: number };
    dropoffAddress?: string;
    paymentMethod: PaymentMethod;
    payerPhone: string;
  }) =>
    request(
      z.object({
        order: OrderSchema,
        payment: z.object({
          id: z.string(),
          provider: z.string(),
          status: z.string(),
          clientSecret: z.string().nullable(),
        }),
        replayed: z.boolean(),
      }).passthrough(),
      "/checkout",
      {
        method: "POST",
        headers: { "Idempotency-Key": `chk-${Date.now()}-${Math.random().toString(36).slice(2)}` },
        body: JSON.stringify(input),
      },
    ),

  myOrders: () => request(paginated(OrderSchema), "/orders"),
  order: (orderId: string) => request(OrderSchema, `/orders/${orderId}`),

  register: (input: {
    email: string; password: string; fullName: string; phone: string;
    role: "shopper" | "courier";
  }) =>
    request(AuthResponseSchema, "/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  cart: (cartId: string) => request(CartSchema, `/cart/${cartId}`),

  /** The signed-in shopper's pending cart, or null. Used to restore the cart
   *  on a fresh launch, when no cart id is held in memory yet. */
  activeCart: () => request(CartSchema.nullable(), "/cart/active"),

  /** Best-effort server-side revocation; local state is cleared regardless. */
  logout: async (): Promise<void> => {
    const rt = refreshTokenValue;
    setToken(null);
    setRefreshToken(null);
    if (rt) {
      await rawRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: rt }),
      }).catch(() => { });
    }
  },

  updateCartItem: (cartId: string, itemId: string, qty: number) =>
    request(CartSchema, `/cart/${cartId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ qty }),
    }),

  tracking: (orderId: string) =>
    request(
      z.object({ order: OrderSchema, delivery: DeliverySchema.nullable() }),
      `/orders/${orderId}/tracking`,
    ),

  // ---- courier surface --------------------------------------------------
  courier: {
    setAvailability: (isAvailable: boolean) =>
      request(z.object({ isAvailable: z.boolean() }), "/courier/availability", {
        method: "PATCH",
        body: JSON.stringify({ isAvailable }),
      }),

    jobs: () => request(z.array(DeliverySchema), "/courier/jobs"),

    myDeliveries: () => request(paginated(DeliverySchema), "/courier/deliveries"),

    pushLocation: (deliveryId: string, lat: number, lng: number) =>
      request(DeliverySchema, `/courier/deliveries/${deliveryId}/location`, {
        method: "POST",
        body: JSON.stringify({ lat, lng }),
      }),

    pickup: (deliveryId: string) =>
      request(DeliverySchema, `/courier/deliveries/${deliveryId}/pickup`, { method: "POST" }),

    complete: (deliveryId: string) =>
      request(DeliverySchema, `/courier/deliveries/${deliveryId}/complete`, { method: "POST" }),

    payouts: () =>
      request(
        z.object({ pendingMinor: z.number().int(), settledMinor: z.number().int() }),
        "/courier/payouts",
      ),
  },

  // ---- shop admin surface -------------------------------------------------
  shopAdmin: {
    myShops: () => request(z.array(ShopSchema), "/admin/shops"),

    stats: (shopId: string) =>
      request(
        z.object({
          todayOrders: z.number(), todayRevenueMinor: z.number(),
          activeOrders: z.number(), lifetimeOrders: z.number(), lifetimeRevenueMinor: z.number(),
          totalProducts: z.number(), lowStock: z.number(), outOfStock: z.number(),
        }),
        `/admin/shops/${shopId}/stats`,
      ),

    analytics: (shopId: string, days: number) =>
      request(
        z.object({
          rangeDays: z.number(),
          totalOrders: z.number(), totalRevenueMinor: z.number(), avgOrderValueMinor: z.number(),
          series: z.array(z.object({ date: z.string(), orders: z.number(), revenueMinor: z.number() })),
          topProducts: z.array(z.object({
            productId: z.string(), name: z.string(), units: z.number(), revenueMinor: z.number(),
          })),
        }),
        `/admin/shops/${shopId}/analytics?days=${days}`,
      ),

    updateShop: (shopId: string, patch: Partial<{
      name: string; description: string | null; address: string | null;
      location: { lat: number; lng: number };
    }>) =>
      request(ShopSchema, `/admin/shops/${shopId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),

    products: (shopId: string) =>
      request(paginated(ProductSchema), `/admin/shops/${shopId}/products`),

    createProduct: (shopId: string, input: {
      name: string; description: string | null; category: string;
      priceMinor: number; currency: "ZMW" | "USD"; stockQty: number; imageUrl: string | null;
    }) =>
      request(ProductSchema, `/admin/shops/${shopId}/products`, {
        method: "POST",
        body: JSON.stringify(input),
      }),

    updateProduct: (shopId: string, productId: string, patch: Partial<{
      name: string; description: string | null; priceMinor: number;
      stockQty: number; isActive: boolean;
    }>) =>
      request(ProductSchema, `/admin/shops/${shopId}/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),

    orders: (shopId: string) =>
      request(paginated(OrderSchema), `/admin/shops/${shopId}/orders`),

    setOrderStatus: (shopId: string, orderId: string, status: OrderStatus) =>
      request(OrderSchema, `/admin/shops/${shopId}/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),

    dispatch: (shopId: string, orderId: string) =>
      request(
        z.object({ yangoRequestId: z.string(), courierId: z.string() }),
        `/admin/shops/${shopId}/orders/${orderId}/dispatch`,
        { method: "POST" },
      ),
  },

  // ---- platform admin surface ----------------------------------------------
  platform: {
    couriers: (status?: "pending" | "verified" | "rejected" | "suspended") =>
      request(
        z.array(z.object({
          id: z.string(), userId: z.string(), verificationStatus: z.string(),
          isAvailable: z.boolean(), vehicleType: z.string(),
          nrcNumber: z.string().nullable(), fullName: z.string(), phone: z.string(),
        })),
        `/platform/couriers${status ? `?status=${status}` : ""}`,
      ),

    setCourierVerification: (courierId: string, status: "verified" | "rejected" | "suspended") =>
      request(z.unknown(), `/platform/couriers/${courierId}/verification`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),

    createShop: (input: { name: string; description: string | null; adminUserId?: string }) =>
      request(ShopSchema, "/platform/shops", {
        method: "POST",
        body: JSON.stringify(input),
      }),

    pendingPayouts: () =>
      request(
        z.array(z.object({
          courierId: z.string(), fullName: z.string(), phone: z.string(),
          pendingMinor: z.number().int(), entries: z.number().int(),
        })),
        "/platform/payouts/pending",
      ),

    settlePayouts: (courierId: string) =>
      request(
        z.object({
          courierId: z.string(), settledMinor: z.number().int(), entries: z.number().int(),
          settlementRef: z.string(), transferred: z.boolean(),
        }),
        "/platform/payouts/settle",
        { method: "POST", body: JSON.stringify({ courierId }) },
      ),
  },
};

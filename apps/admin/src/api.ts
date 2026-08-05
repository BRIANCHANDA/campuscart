/** Thin typed client for the platform-admin surface of the CampusCart API. */

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type AdminUser = { id: string; email: string; fullName: string; phone: string; role: string };
export type ShopRow = {
  id: string; name: string; slug: string; description: string | null;
  address: string | null; imageUrl: string | null; location: { lat: number; lng: number };
  isActive: boolean; createdAt: string;
  admins: { userId: string; fullName: string; email: string }[];
  productCount: number;
};
export type CourierRow = {
  id: string; userId: string; verificationStatus: string; isAvailable: boolean;
  vehicleType: string; nrcNumber: string | null; fullName: string; phone: string;
};
export type PayoutRow = {
  courierId: string; fullName: string; phone: string; pendingMinor: number; entries: number;
};

let token: string | null = sessionStorage.getItem("cc_admin_token");

export const setToken = (t: string | null): void => {
  token = t;
  if (t) sessionStorage.setItem("cc_admin_token", t);
  else sessionStorage.removeItem("cc_admin_token");
};
export const hasToken = (): boolean => token !== null;

export class ApiError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string } })?.error;
    if (res.status === 401) setToken(null);
    throw new ApiError(err?.code ?? "UNKNOWN", err?.message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export const adminApi = {
  login: async (email: string, password: string): Promise<AdminUser> => {
    const res = await request<{ token: string; user: AdminUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.user.role !== "platform_admin") {
      throw new ApiError("NOT_ADMIN", "This console is for platform administrators only");
    }
    setToken(res.token);
    return res.user;
  },
  logout: (): void => setToken(null),

  shops: () => request<ShopRow[]>("/platform/shops"),
  createShop: (input: {
    name: string; description: string | null; address?: string | null; imageUrl?: string | null;
    location?: { lat: number; lng: number }; adminEmail?: string;
  }) => request<ShopRow>("/platform/shops", { method: "POST", body: JSON.stringify(input) }),
  updateShop: (shopId: string, patch: Partial<{
    name: string; description: string | null; address: string | null; imageUrl: string | null;
    location: { lat: number; lng: number }; isActive: boolean; adminEmail: string;
  }>) => request<ShopRow>(`/platform/shops/${shopId}`, { method: "PATCH", body: JSON.stringify(patch) }),

  /** Provision a shop-owner account (owner then logs in themselves). */
  createShopAdmin: (input: {
    email: string; password: string; fullName: string; phone: string; shopId?: string;
  }) => request<{ id: string; email: string; fullName: string; phone: string; role: string }>(
    "/platform/shop-admins",
    { method: "POST", body: JSON.stringify(input) },
  ),

  couriers: (status?: string) =>
    request<CourierRow[]>(`/platform/couriers${status ? `?status=${status}` : ""}`),
  setCourierVerification: (courierId: string, status: "verified" | "rejected" | "suspended") =>
    request(`/platform/couriers/${courierId}/verification`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  pendingPayouts: () => request<PayoutRow[]>("/platform/payouts/pending"),
  settlePayouts: (courierId: string) =>
    request<{ settledMinor: number; entries: number; settlementRef: string; transferred: boolean }>(
      "/platform/payouts/settle",
      { method: "POST", body: JSON.stringify({ courierId }) },
    ),
};

export const formatKwacha = (minor: number): string => `K${(minor / 100).toFixed(2)}`;

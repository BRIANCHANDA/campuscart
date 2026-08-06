/**
 * Seeds the local preview database with a realistic campus catalog so the
 * mobile screens have something to render. Mirrors the onboarding sequence in
 * test/integration.checkout-dispatch.test.ts.
 */
const API = process.env.API_BASE_URL ?? "http://localhost:3000";
const PW = "preview-pass-1";

type Json = Record<string, unknown>;

async function call(method: string, path: string, opts: { token?: string; body?: Json } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
  });
  const text = await res.text();
  let body: unknown;
  try { body = JSON.parse(text); } catch { body = text; }
  if (res.status >= 400) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return body as any;
}

async function register(email: string, fullName: string, phone: string, role: string) {
  return call("POST", "/auth/register", { body: { email, password: PW, fullName, phone, role } });
}

// --- platform admin: inserted directly, never self-registered -------------
const { drizzle } = await import("drizzle-orm/postgres-js");
const postgres = (await import("postgres")).default;
const schema = await import("../src/db/schema");

const sql = postgres(process.env.DATABASE_URL ?? "postgres://campuscart:campuscart@localhost:5432/campuscart");
const db = drizzle(sql, { schema });

const adminEmail = "admin@campuscart.test";
const existing = await sql`select id from users where email = ${adminEmail}`;
if (existing.length === 0) {
  await db.insert(schema.users).values({
    email: adminEmail,
    passwordHash: await Bun.password.hash(PW),
    fullName: "Platform Admin",
    phone: "+260970000000",
    role: "platform_admin",
  });
  console.log("✓ platform admin created");
} else {
  console.log("• platform admin already exists");
}

const adminToken = (await call("POST", "/auth/login", { body: { email: adminEmail, password: PW } })).token;

// --- shops + their admins -------------------------------------------------
const SHOPS = [
  {
    name: "Monk Square Mini Mart",
    description: "Snacks, airtime and daily essentials next to Hostel 5.",
    owner: { email: "monk@campuscart.test", name: "Mwansa Banda", phone: "+260973333331" },
    location: { lat: -12.8024, lng: 28.2132 },
    products: [
      { name: "Airtime Voucher K10", description: "MTN / Airtel scratch card", category: "services", priceMinor: 1000, stockQty: 120 },
      { name: "Coca-Cola 500ml", description: "Chilled", category: "drinks", priceMinor: 1200, stockQty: 48 },
      { name: "Simba Maize Snacks", description: "Tomato flavour, 50g", category: "food", priceMinor: 800, stockQty: 60 },
      { name: "Bic Ballpoint Pen", description: "Blue ink", category: "stationery", priceMinor: 500, stockQty: 200 },
      { name: "Exercise Book A4", description: "80 pages, squared", category: "stationery", priceMinor: 1500, stockQty: 75 },
    ],
  },
  {
    name: "Hostel 3 Food Corner",
    description: "Hot meals cooked to order. Ready in 15 minutes.",
    owner: { email: "food@campuscart.test", name: "Chipo Phiri", phone: "+260973333332" },
    location: { lat: -12.8041, lng: 28.2158 },
    products: [
      { name: "Nshima with Chicken", description: "Half chicken, relish and nshima", category: "food", priceMinor: 4500, stockQty: 25 },
      { name: "Nshima with Beef Stew", description: "Served with rape or cabbage", category: "food", priceMinor: 4000, stockQty: 20 },
      { name: "Chips and Sausage", description: "Large portion", category: "food", priceMinor: 3000, stockQty: 30 },
      { name: "Mango Juice 400ml", description: "Freshly squeezed", category: "drinks", priceMinor: 1000, stockQty: 40 },
    ],
  },
  {
    name: "CBU Tech & Accessories",
    description: "Phone accessories, chargers and repairs near the library.",
    owner: { email: "tech@campuscart.test", name: "Joseph Zulu", phone: "+260973333333" },
    location: { lat: -12.8009, lng: 28.2185 },
    products: [
      { name: "USB-C Fast Charger", description: "20W, 1m braided cable", category: "electronics", priceMinor: 12000, stockQty: 15 },
      { name: "Earphones (wired)", description: "3.5mm with mic", category: "electronics", priceMinor: 6500, stockQty: 22 },
      { name: "Power Bank 10000mAh", description: "Dual output", category: "electronics", priceMinor: 28000, stockQty: 8 },
      { name: "Screen Protector", description: "Tempered glass, fitted free", category: "services", priceMinor: 3500, stockQty: 40 },
    ],
  },
];

for (const shop of SHOPS) {
  let ownerId: string;
  try {
    ownerId = (await register(shop.owner.email, shop.owner.name, shop.owner.phone, "shopper")).user.id;
  } catch {
    const rows = await sql`select id from users where email = ${shop.owner.email}`;
    if (rows.length === 0) throw new Error(`cannot resolve owner ${shop.owner.email}`);
    ownerId = rows[0].id as string;
  }

  const already = await sql`select id from shops where name = ${shop.name}`;
  if (already.length > 0) { console.log(`• ${shop.name} already exists`); continue; }

  const created = await call("POST", "/platform/shops", {
    token: adminToken,
    body: {
      name: shop.name,
      description: shop.description,
      adminUserId: ownerId,
      location: shop.location,
    },
  });

  const ownerToken = (await call("POST", "/auth/login", { body: { email: shop.owner.email, password: PW } })).token;

  for (const p of shop.products) {
    await call("POST", `/admin/shops/${created.id}/products`, {
      token: ownerToken,
      body: { ...p, currency: "ZMW", imageUrl: null },
    });
  }
  console.log(`✓ ${shop.name} — ${shop.products.length} products`);
}

// --- shopper + courier ----------------------------------------------------
for (const [email, name, phone, role] of [
  ["shopper@campuscart.test", "Bwalya Mulenga", "+260971111111", "shopper"],
  ["courier@campuscart.test", "Temwani Sakala", "+260972222222", "courier"],
] as const) {
  try { await register(email, name, phone, role); console.log(`✓ ${role} ${email}`); }
  catch { console.log(`• ${role} ${email} already exists`); }
}

// verify the courier so they can actually take jobs
const couriers = await call("GET", "/platform/couriers", { token: adminToken });
const list = Array.isArray(couriers) ? couriers : couriers.items ?? [];
for (const c of list) {
  if (c.verificationStatus !== "verified") {
    await call("PATCH", `/platform/couriers/${c.id}/verification`, {
      token: adminToken,
      body: { status: "verified" },
    });
    console.log(`✓ courier ${c.id} verified`);
  }
}

await sql.end();
console.log("\nSeed complete. Log in as:");
console.log("  shopper@campuscart.test / preview-pass-1");
console.log("  monk@campuscart.test    / preview-pass-1  (shop admin)");
console.log("  courier@campuscart.test / preview-pass-1");
console.log("  admin@campuscart.test   / preview-pass-1  (platform)");

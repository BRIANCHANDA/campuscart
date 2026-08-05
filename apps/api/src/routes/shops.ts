import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { count, eq } from "drizzle-orm";
import { IdSchema, paginated, PaginationQuerySchema, ShopSchema } from "@campuscart/shared";
import { db } from "../db";
import { shops } from "../db/schema";
import { notFound } from "../lib/errors";
import { errorResponses, jsonContent } from "../lib/openapi";

export const shopRoutes = new OpenAPIHono();

export const serializeShop = (s: typeof shops.$inferSelect) => ({
  id: s.id,
  name: s.name,
  slug: s.slug,
  description: s.description,
  address: s.address,
  imageUrl: s.imageUrl,
  location: { lat: s.pickupLat, lng: s.pickupLng },
  isActive: s.isActive,
  createdAt: s.createdAt.toISOString(),
});

/** Public shop directory. */
shopRoutes.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["catalog"],
    request: { query: PaginationQuerySchema },
    responses: { 200: jsonContent(paginated(ShopSchema), "Shops") },
  }),
  async (c) => {
    const q = c.req.valid("query");
    const where = eq(shops.isActive, true);
    const [rows, countRows] = await Promise.all([
      db.select().from(shops).where(where).limit(q.pageSize).offset((q.page - 1) * q.pageSize),
      db.select({ total: count() }).from(shops).where(where),
    ]);
    const total = countRows[0]?.total ?? 0;
    return c.json({
      data: rows.map(serializeShop),
      page: q.page, pageSize: q.pageSize, total,
      totalPages: Math.ceil(total / q.pageSize),
    }, 200);
  },
);

/** Public shop detail — drives the mobile "open a shop" view. */
shopRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{shopId}",
    tags: ["catalog"],
    request: { params: z.object({ shopId: IdSchema }) },
    responses: { 200: jsonContent(ShopSchema, "Shop"), ...errorResponses },
  }),
  async (c) => {
    const { shopId } = c.req.valid("param");
    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.id, shopId))
      .limit(1);
    if (!shop || !shop.isActive) throw notFound("Shop");
    return c.json(serializeShop(shop), 200);
  },
);

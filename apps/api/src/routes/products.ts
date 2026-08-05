import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { and, count, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { paginated, ProductFeedQuerySchema, ProductSchema } from "@campuscart/shared";
import { db } from "../db";
import { products, shops } from "../db/schema";
import { jsonContent } from "../lib/openapi";

export const productRoutes = new OpenAPIHono();

/** Unified cross-shop product feed with search + filters + pagination. Public. */
productRoutes.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["catalog"],
    request: { query: ProductFeedQuerySchema },
    responses: { 200: jsonContent(paginated(ProductSchema), "Product feed") },
  }),
  async (c) => {
    const q = c.req.valid("query");
    const filters: SQL[] = [eq(products.isActive, true), eq(shops.isActive, true)];
    if (q.q) {
      const term = or(ilike(products.name, `%${q.q}%`), ilike(products.description, `%${q.q}%`));
      if (term) filters.push(term);
    }
    if (q.category) filters.push(eq(products.category, q.category));
    if (q.shopId) filters.push(eq(products.shopId, q.shopId));
    if (q.minPrice !== undefined) filters.push(gte(products.priceMinor, q.minPrice));
    if (q.maxPrice !== undefined) filters.push(lte(products.priceMinor, q.maxPrice));
    const where = and(...filters);

    const [rows, countRows] = await Promise.all([
      db
        .select({ product: products, shopName: shops.name })
        .from(products)
        .innerJoin(shops, eq(products.shopId, shops.id))
        .where(where)
        .limit(q.pageSize)
        .offset((q.page - 1) * q.pageSize),
      db
        .select({ total: count() })
        .from(products)
        .innerJoin(shops, eq(products.shopId, shops.id))
        .where(where),
    ]);
    const total = countRows[0]?.total ?? 0;

    return c.json({
      data: rows.map(({ product: p, shopName }) => ({
        id: p.id,
        shopId: p.shopId,
        shopName,
        name: p.name,
        description: p.description,
        category: p.category,
        priceMinor: p.priceMinor,
        currency: p.currency as "ZMW" | "USD",
        stockQty: p.stockQty,
        imageUrl: p.imageUrl,
        isActive: p.isActive,
      })),
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.ceil(total / q.pageSize),
    }, 200);
  },
);

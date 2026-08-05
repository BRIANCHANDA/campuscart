import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { badRequest, notFound } from "../lib/errors";
import { requireAuth, requireRole } from "../middleware/auth";
import { bearerSecurity, errorResponses, jsonContent } from "../lib/openapi";

/**
 * Product image uploads. Files land on local disk (uploads/) and are served
 * back at GET /uploads/:name. Swap the storage layer for S3/GCS when the
 * deployment story needs it — the URL contract stays the same.
 */
export const uploadRoutes = new OpenAPIHono();

const UPLOAD_DIR = path.resolve(import.meta.dir, "../../uploads");
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

uploadRoutes.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["uploads"],
    security: bearerSecurity,
    middleware: [requireAuth, requireRole("shop_admin")] as const,
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({ file: z.any().openapi({ type: "string", format: "binary" }) }),
          },
        },
        description: "Image file (jpeg/png/webp/gif, max 5 MB)",
      },
    },
    responses: {
      201: jsonContent(z.object({ url: z.string().url() }), "Public URL of the stored image"),
      ...errorResponses,
    },
  }),
  async (c) => {
    const body = await c.req.parseBody().catch(() => ({} as Record<string, unknown>));
    const file = body["file"];
    if (!(file instanceof File)) throw badRequest("NO_FILE", "Attach the image as a 'file' form field");
    const ext = EXT_BY_MIME[file.type];
    if (!ext) throw badRequest("BAD_TYPE", "Only jpeg, png, webp or gif images are accepted");
    if (file.size > MAX_BYTES) throw badRequest("TOO_LARGE", "Image must be 5 MB or smaller");

    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${crypto.randomUUID()}.${ext}`;
    await Bun.write(path.join(UPLOAD_DIR, name), file);

    // Absolute URL built from the request origin, so whichever host the
    // client used (localhost, LAN IP) also works for fetching the image back.
    const origin = new URL(c.req.url).origin;
    return c.json({ url: `${origin}/uploads/${name}` }, 201);
  },
);

/** Serve a stored image. Names are server-generated UUIDs — no traversal surface. */
uploadRoutes.get("/:name", async (c) => {
  const name = c.req.param("name");
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(name)) throw notFound("File");
  const file = Bun.file(path.join(UPLOAD_DIR, name));
  if (!(await file.exists())) throw notFound("File");
  return new Response(file, {
    headers: {
      "Content-Type": file.type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

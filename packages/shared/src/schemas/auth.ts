import { z } from "zod";
import { IdSchema } from "./common";

export const RoleSchema = z.enum(["shopper", "shop_admin", "courier", "platform_admin"]);
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: IdSchema,
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().min(6),
  role: RoleSchema,
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  phone: z.string().min(6),
  role: z.enum(["shopper", "courier"]).default("shopper"), // admins are onboarded, never self-registered
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Self-service profile edits (any signed-in user). Email/role are immutable here. */
export const UpdateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(6).optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const AuthResponseSchema = z.object({
  token: z.string(),          // short-lived access JWT
  refreshToken: z.string(),   // opaque, single-use, rotated on refresh
  user: UserSchema,
});

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(20),
});

export const RefreshResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
});

/** Claims carried inside the JWT. */
export const JwtClaimsSchema = z.object({
  sub: IdSchema,          // user id
  role: RoleSchema,
  shopIds: z.array(IdSchema).optional(), // shops this user administers
  exp: z.number(),
  iat: z.number(),
});
export type JwtClaims = z.infer<typeof JwtClaimsSchema>;

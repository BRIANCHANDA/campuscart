import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().default(86400),
  YANGO_API_BASE_URL: z.string().url().default("https://b2b.taxi.yango.com"),
  YANGO_API_KEY: z.string().default(""),
  YANGO_CLIENT_ID: z.string().default(""),
  YANGO_WEBHOOK_SECRET: z.string().default(""),
  PAYMENT_PROVIDER: z.enum(["mock", "stripe", "mtn_momo", "airtel_money"]).default("mock"),
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  // MTN MoMo (Collections)
  MOMO_API_BASE_URL: z.string().url().default("https://sandbox.momodeveloper.mtn.com"),
  MOMO_SUBSCRIPTION_KEY: z.string().default(""),
  MOMO_API_USER: z.string().default(""),
  MOMO_API_KEY: z.string().default(""),
  MOMO_TARGET_ENVIRONMENT: z.string().default("sandbox"),
  MOMO_CALLBACK_URL: z.string().default(""),
  MOMO_DISBURSEMENT_SUBSCRIPTION_KEY: z.string().default(""),
  REDIS_URL: z.string().default(""),
  // Airtel Money
  AIRTEL_API_BASE_URL: z.string().url().default("https://openapiuat.airtel.africa"),
  AIRTEL_CLIENT_ID: z.string().default(""),
  AIRTEL_CLIENT_SECRET: z.string().default(""),
  AIRTEL_COUNTRY: z.string().default("ZM"),
  AIRTEL_CALLBACK_SECRET: z.string().default(""),
});

export const env = EnvSchema.parse(process.env);
export type Env = typeof env;

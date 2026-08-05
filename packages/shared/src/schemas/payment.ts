import { z } from "zod";
import { IdSchema, MoneySchema } from "./common";

/** MTN MoMo / Airtel Money are planned future providers for the Zambian campus context. */
export const PaymentProviderNameSchema = z.enum(["mock", "stripe", "paypal", "mtn_momo", "airtel_money"]);
export type PaymentProviderName = z.infer<typeof PaymentProviderNameSchema>;

export const PaymentStatusSchema = z.enum(["pending", "succeeded", "failed", "refunded"]);

export const PaymentSchema = z.object({
  id: IdSchema,
  orderId: IdSchema,
  provider: PaymentProviderNameSchema,
  providerRef: z.string().nullable(),
  status: PaymentStatusSchema,
  amountMinor: MoneySchema,
});
export type Payment = z.infer<typeof PaymentSchema>;

import { db } from "../db";
import { env } from "../env";
import { MockDeliveryProvider } from "./delivery/mock";
import { YangoClient } from "./delivery/yango";
import { MockPaymentProvider } from "./payments/mock";
import { providerFor } from "./payments/gateway";
import { OrderPipeline } from "./orders/pipeline";

/** Composition root — providers are chosen from env and injected everywhere. */
export const deliveryProvider = env.YANGO_API_KEY ? new YangoClient() : new MockDeliveryProvider();

// Payments are chosen per-order by the customer (Airtel / MTN); the gateway
// routes to the live provider when its keys are set, else a mock. The mock
// here is only the default for code paths that don't specify a method.
const fallbackPayment = new MockPaymentProvider();
export const pipeline = new OrderPipeline(db, deliveryProvider, fallbackPayment, providerFor);

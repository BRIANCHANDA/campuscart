import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema";

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema });
export type Db = typeof db;
export { schema };

/** Drain the pool — used by test teardown so ephemeral DBs can be dropped. */
export const closeDb = (): Promise<void> => client.end({ timeout: 5 });

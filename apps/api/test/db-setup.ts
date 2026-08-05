/**
 * Shared test-database bootstrap.
 *
 * Bun executes all test files in ONE process with a shared module registry,
 * shared process.env, and (because src/db is a singleton) ONE connection
 * pool. So suites must cooperate: this module memoizes a single "set env +
 * migrate once" promise that every suite awaits, eliminating migration races
 * without per-suite databases (which a shared pool can't support anyway).
 *
 * Nobody truncates: suites use run-unique emails/slugs and reset only the
 * state they're sensitive to (e.g. courier availability).
 */
let bootstrapped: Promise<void> | null = null;

export function ensureTestDb(adminUrl: string): Promise<void> {
  bootstrapped ??= (async () => {
    process.env.DATABASE_URL = adminUrl;
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");

    const client = postgres(adminUrl, { max: 1 });
    try {
      // Advisory lock guards against a second test PROCESS migrating concurrently
      await client`SELECT pg_advisory_lock(421337)`;
      await migrate(drizzle(client), { migrationsFolder: `${import.meta.dir}/../drizzle` });
      await client`SELECT pg_advisory_unlock(421337)`;
    } finally {
      await client.end();
    }
  })();
  return bootstrapped;
}

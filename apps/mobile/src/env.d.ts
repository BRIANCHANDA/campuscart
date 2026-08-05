/**
 * Expo injects EXPO_PUBLIC_* env vars at build time via `process.env`.
 * This shim keeps the typecheck clean without pulling in full Node types.
 */
declare const process: {
  env: Record<string, string | undefined>;
};

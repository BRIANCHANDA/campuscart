import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Persistence for the refresh token, so a session survives an app restart.
 *
 * Only the refresh token is stored. The access token is short-lived and is
 * re-minted from it on launch, so there is no value in keeping a stale copy
 * on disk.
 *
 * SecureStore is Keychain/Keystore-backed and has no web implementation, so
 * `expo start --web` falls back to localStorage. That fallback is for local
 * preview only — web is not a shipping target for this app (see
 * metro.config.js).
 */
const KEY = "campuscart.refreshToken";
const isWeb = Platform.OS === "web";

export async function loadRefreshToken(): Promise<string | null> {
  try {
    if (isWeb) return globalThis.localStorage?.getItem(KEY) ?? null;
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null; // a corrupt/locked store must never block app launch
  }
}

export async function saveRefreshToken(token: string): Promise<void> {
  try {
    if (isWeb) globalThis.localStorage?.setItem(KEY, token);
    else await SecureStore.setItemAsync(KEY, token);
  } catch {
    // Persistence is best-effort: the session still works for this run.
  }
}

export async function clearRefreshToken(): Promise<void> {
  try {
    if (isWeb) globalThis.localStorage?.removeItem(KEY);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ignore
  }
}

export type AppTheme = "light" | "dark";
const THEME_STORAGE_KEY = "afterspend-theme";
type ThemeStorage = Pick<Storage, "getItem" | "setItem">;

/** Read theme preference defensively; the app remains usable when storage is blocked. */
export function readThemePreference(storage?: ThemeStorage | null): AppTheme {
  try {
    const target = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
    return target?.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/** Persist theme preference defensively; in-memory theme changes still work if storage fails. */
export function writeThemePreference(theme: AppTheme, storage?: ThemeStorage | null): void {
  try {
    const target = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
    target?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be disabled by browser privacy settings; keep the current session functional.
  }
}

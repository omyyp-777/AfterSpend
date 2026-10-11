import test from "node:test";
import assert from "node:assert/strict";
import { readThemePreference, writeThemePreference } from "./themePreference";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

test("theme preference reads dark and light values", () => {
  assert.equal(readThemePreference(memoryStorage({ "afterspend-theme": "dark" })), "dark");
  assert.equal(readThemePreference(memoryStorage({ "afterspend-theme": "light" })), "light");
});

test("theme preference defaults safely for missing or unknown values", () => {
  assert.equal(readThemePreference(memoryStorage()), "light");
  assert.equal(readThemePreference(memoryStorage({ "afterspend-theme": "invalid" })), "light");
});

test("theme preference can be saved and restored", () => {
  const storage = memoryStorage();
  writeThemePreference("dark", storage);
  assert.equal(readThemePreference(storage), "dark");
  writeThemePreference("light", storage);
  assert.equal(readThemePreference(storage), "light");
});

test("blocked storage is handled without throwing", () => {
  const blockedStorage = {
    getItem: () => { throw new Error("Storage blocked"); },
    setItem: () => { throw new Error("Storage blocked"); },
  };
  assert.equal(readThemePreference(blockedStorage), "light");
  assert.doesNotThrow(() => writeThemePreference("dark", blockedStorage));
});

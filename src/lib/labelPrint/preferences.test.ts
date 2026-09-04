import { describe, expect, it } from "vitest";
import { DEFAULT_LABEL_PREFS } from "./templates";
import { LABEL_PREFS_KEY, loadLabelPrefs, saveLabelPrefs } from "./preferences";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.has(key) ? this.data.get(key)! : null; }
  key(index: number) { return Array.from(this.data.keys())[index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
}

describe("label preferences", () => {
  it("returns defaults when storage is empty", () => {
    const storage = new MemoryStorage();
    expect(loadLabelPrefs(storage)).toEqual(DEFAULT_LABEL_PREFS);
  });

  it("round-trips saved template settings", () => {
    const storage = new MemoryStorage();
    const prefs = {
      ...DEFAULT_LABEL_PREFS,
      sizeId: "38x25" as const,
      columns: 3 as const,
      barcodeFormat: "EAN13" as const,
      fields: { ...DEFAULT_LABEL_PREFS.fields, weight: true, shopName: false },
    };
    saveLabelPrefs(prefs, storage);
    expect(storage.getItem(LABEL_PREFS_KEY)).toBeTruthy();
    expect(loadLabelPrefs(storage)).toEqual(prefs);
  });

  it("falls back to defaults when stored JSON is invalid", () => {
    const storage = new MemoryStorage();
    storage.setItem(LABEL_PREFS_KEY, "{not-json");
    expect(loadLabelPrefs(storage)).toEqual(DEFAULT_LABEL_PREFS);
  });

  it("ignores unknown size/column values from storage", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LABEL_PREFS_KEY,
      JSON.stringify({ sizeId: "99x99", columns: 8, barcodeFormat: "QR", fields: { shopName: "yes" } }),
    );
    const loaded = loadLabelPrefs(storage);
    expect(loaded.sizeId).toBe("50x25");
    expect(loaded.columns).toBe(1);
    expect(loaded.barcodeFormat).toBe("CODE128");
    expect(loaded.fields.shopName).toBe(true);
  });
});

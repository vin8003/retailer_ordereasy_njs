import { DEFAULT_LABEL_FIELDS, DEFAULT_LABEL_PREFS } from "./templates";
import type { BarcodeFormat, ColumnCount, LabelFieldFlags, LabelSizeId, LabelTemplatePrefs } from "./types";

export const LABEL_PREFS_KEY = "oe_label_print_prefs";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function parseFields(raw: unknown): LabelFieldFlags {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    shopName: asBoolean(source.shopName, DEFAULT_LABEL_FIELDS.shopName),
    productName: asBoolean(source.productName, DEFAULT_LABEL_FIELDS.productName),
    mrp: asBoolean(source.mrp, DEFAULT_LABEL_FIELDS.mrp),
    sellingPrice: asBoolean(source.sellingPrice, DEFAULT_LABEL_FIELDS.sellingPrice),
    weight: asBoolean(source.weight, DEFAULT_LABEL_FIELDS.weight),
    packingDate: asBoolean(source.packingDate, DEFAULT_LABEL_FIELDS.packingDate),
    expiryDate: asBoolean(source.expiryDate, DEFAULT_LABEL_FIELDS.expiryDate),
    barcode: asBoolean(source.barcode, DEFAULT_LABEL_FIELDS.barcode),
  };
}

export function loadLabelPrefs(storage: StorageLike | null = defaultStorage()): LabelTemplatePrefs {
  if (!storage) return { ...DEFAULT_LABEL_PREFS, fields: { ...DEFAULT_LABEL_FIELDS } };
  try {
    const raw = storage.getItem(LABEL_PREFS_KEY);
    if (!raw) return { ...DEFAULT_LABEL_PREFS, fields: { ...DEFAULT_LABEL_FIELDS } };
    const parsed = JSON.parse(raw) as Partial<LabelTemplatePrefs>;
    const sizeId: LabelSizeId = parsed.sizeId === "38x25" ? "38x25" : "50x25";
    const columns: ColumnCount = parsed.columns === 2 || parsed.columns === 3 ? parsed.columns : 1;
    const barcodeFormat: BarcodeFormat = parsed.barcodeFormat === "EAN13" ? "EAN13" : "CODE128";
    return {
      sizeId,
      columns,
      barcodeFormat,
      fields: parseFields(parsed.fields),
    };
  } catch {
    return { ...DEFAULT_LABEL_PREFS, fields: { ...DEFAULT_LABEL_FIELDS } };
  }
}

export function saveLabelPrefs(prefs: LabelTemplatePrefs, storage: StorageLike | null = defaultStorage()): void {
  if (!storage) return;
  storage.setItem(LABEL_PREFS_KEY, JSON.stringify(prefs));
}

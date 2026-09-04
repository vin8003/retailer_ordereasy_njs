import { DEFAULT_LABEL_FIELDS } from "./templates";
import type { LabelFieldFlags, PrintLabelItem } from "./types";

export interface CatalogProduct {
  id: number;
  name: string;
  barcode?: string | null;
  original_price?: number | string | null;
  price?: number | string | null;
  unit?: string | null;
}

export function productToPrintItem(
  product: CatalogProduct,
  fields: LabelFieldFlags = DEFAULT_LABEL_FIELDS,
): PrintLabelItem {
  return {
    id: product.id,
    name: product.name || "",
    barcode: product.barcode ? String(product.barcode) : "",
    mrp: product.original_price ?? null,
    price: product.price ?? "",
    unit: product.unit || "",
    weightLabel: "",
    packingDate: "",
    expiryDate: "",
    quantity: 1,
    fields: { ...fields },
  };
}

export function addProductToPrintList(
  list: PrintLabelItem[],
  product: CatalogProduct,
  fields: LabelFieldFlags = DEFAULT_LABEL_FIELDS,
): PrintLabelItem[] {
  const existing = list.find((item) => item.id === product.id);
  if (existing) {
    return list.map((item) =>
      item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
    );
  }
  return [...list, productToPrintItem(product, fields)];
}

export function updatePrintListItem(
  list: PrintLabelItem[],
  id: number,
  patch: Partial<PrintLabelItem>,
): PrintLabelItem[] {
  return list.map((item) => {
    if (item.id !== id) return item;
    const next = { ...item, ...patch, fields: patch.fields ? { ...item.fields, ...patch.fields } : item.fields };
    if (patch.quantity !== undefined) {
      const qty = Math.floor(Number(patch.quantity));
      if (!Number.isFinite(qty) || qty < 1) return item;
      next.quantity = qty;
    }
    return next;
  });
}

export function removePrintListItem(list: PrintLabelItem[], id: number): PrintLabelItem[] {
  return list.filter((item) => item.id !== id);
}

export function totalLabelCount(list: PrintLabelItem[]): number {
  return list.reduce((sum, item) => sum + Math.max(0, Math.floor(Number(item.quantity) || 0)), 0);
}

export const PRINT_QUEUE_KEY = "oe_label_print_queue";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function enqueuePrintProductIds(ids: number[], storage?: StorageLike | null): void {
  const store = storage ?? (typeof window !== "undefined" ? window.sessionStorage : null);
  if (!store) return;
  const unique = Array.from(new Set(ids.filter((id) => Number.isFinite(id))));
  store.setItem(PRINT_QUEUE_KEY, JSON.stringify(unique));
}

export function consumePrintProductIds(storage?: StorageLike | null): number[] {
  const store = storage ?? (typeof window !== "undefined" ? window.sessionStorage : null);
  if (!store) return [];
  try {
    const raw = store.getItem(PRINT_QUEUE_KEY);
    store.removeItem(PRINT_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(Number).filter((id) => Number.isFinite(id) && id > 0);
  } catch {
    return [];
  }
}

export function parsePrintProductIds(productId?: string | null, ids?: string | null): number[] {
  const fromCsv = String(ids || "")
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isFinite(id) && id > 0);
  const single = Number(productId);
  if (Number.isFinite(single) && single > 0) fromCsv.unshift(single);
  return Array.from(new Set(fromCsv));
}

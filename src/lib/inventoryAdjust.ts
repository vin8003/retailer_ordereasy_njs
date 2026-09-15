/** OE-127 / OE-103 — inventory.adjust 403 copy + pack-link guard (BE RCP #90/#91). */

import { hasPermission } from "@/lib/org";

export const PERM_INVENTORY_ADJUST = "inventory.adjust";
export const ERR_INVENTORY_ADJUST = "Inventory adjust permission required";
export const ERR_CONVERSION_FACTOR = "conversion_factor must be greater than 0";
export const QTY_ADJUST_MESSAGE =
  "inventory.adjust is required to change on-hand quantity.";
export const PACK_ADJUST_MESSAGE =
  "inventory.adjust is required to change pack conversion or parent link.";

export function canAdjustInventory(
  permissions: ReadonlySet<string> | string[]
): boolean {
  return hasPermission(permissions, PERM_INVENTORY_ADJUST);
}

export function isPositiveConversionFactor(value: string | number | null | undefined): boolean {
  if (value == null || value === "") return false;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0;
}

export interface PackLinkFields {
  is_parent_bulk: boolean;
  isLinkedToParent: boolean;
  parent_bulk_product_id: string;
  conversion_factor: string;
}

export function packLinkIsSet(fields: PackLinkFields): boolean {
  if (fields.is_parent_bulk) return true;
  if (!fields.isLinkedToParent) return false;
  return Boolean(fields.parent_bulk_product_id || fields.conversion_factor);
}

export function packLinkDiffers(
  current: PackLinkFields,
  next: PackLinkFields
): boolean {
  return (
    current.is_parent_bulk !== next.is_parent_bulk ||
    current.isLinkedToParent !== next.isLinkedToParent ||
    current.parent_bulk_product_id !== next.parent_bulk_product_id ||
    String(current.conversion_factor ?? "") !== String(next.conversion_factor ?? "")
  );
}

export function quantityDiffers(
  current: string | number | null | undefined,
  next: string | number | null | undefined
): boolean {
  const a = current == null || current === "" ? "0" : String(current);
  const b = next == null || next === "" ? "0" : String(next);
  if (Number.isFinite(Number(a)) && Number.isFinite(Number(b))) {
    return Number(a) !== Number(b);
  }
  return a !== b;
}

/**
 * Linked child on-hand is derived from parent/factor (not 0).
 * Forcing quantity=0 after the quantityDiffers gate 403s users without inventory.adjust.
 * Omit quantity when !canAdjust. When canAdjust, leave the form value so an
 * intentional on-hand edit still goes through.
 */
export function applyLinkedChildQuantity(
  formData: FormData,
  opts: { isLinkedChild: boolean; canAdjust: boolean }
): void {
  if (!opts.isLinkedChild) return;
  if (!opts.canAdjust) {
    formData.delete("quantity");
  }
}

export type AdjustDeniedKind = "quantity" | "pack" | "generic";

export function classifyAdjustError(
  status?: number,
  error?: string
): "forbidden" | "bad_factor" | "other" {
  const msg = error ?? "";
  if (status === 403 || /inventory adjust/i.test(msg)) return "forbidden";
  if (/conversion_factor/i.test(msg) && /greater than 0|must be/i.test(msg)) {
    return "bad_factor";
  }
  return "other";
}

export function inventoryAdjustErrorMessage(
  status?: number,
  error?: string,
  kind: AdjustDeniedKind = "generic"
): string | null {
  const cls = classifyAdjustError(status, error);
  if (cls === "bad_factor") return ERR_CONVERSION_FACTOR;
  if (cls !== "forbidden") return null;
  if (kind === "quantity") return QTY_ADJUST_MESSAGE;
  if (kind === "pack") return PACK_ADJUST_MESSAGE;
  return QTY_ADJUST_MESSAGE;
}

export function axiosInventoryAdjustError(
  err: { response?: { status?: number; data?: { error?: string; conversion_factor?: unknown } } },
  kind: AdjustDeniedKind = "generic"
): string | null {
  const status = err.response?.status;
  const data = err.response?.data;
  const factor = data?.conversion_factor;
  const factorMsg = Array.isArray(factor) ? String(factor[0]) : typeof factor === "string" ? factor : "";
  const error = typeof data?.error === "string" ? data.error : factorMsg;
  return inventoryAdjustErrorMessage(status, error, kind);
}

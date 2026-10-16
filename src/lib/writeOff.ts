/** OE-141 / F-0032 — damage/expiry/spoilage write-off (BE POST products/:id/write-off/). */

import { canAdjustInventory } from "@/lib/inventoryAdjust";

export const WRITE_OFF_REASONS = ["damage", "expiry", "spoilage"] as const;
export type WriteOffReason = (typeof WRITE_OFF_REASONS)[number];

export const ERR_INVALID_REASON = "reason must be damage, expiry, or spoilage";
export const ERR_INVALID_QUANTITY = "quantity must be greater than 0";
export const ERR_BATCH_REQUIRED = "batch_id is required for batched products";
export const ERR_EXPIRY_NEEDS_BATCH = "expiry write-off requires a batch";
export const ERR_NON_EXPIRED = "Expiry write-off cannot target a non-expired batch";
export const ERR_INSUFFICIENT = "quantity exceeds on-hand";

export interface WriteOffResult {
  id: number;
  productId: number;
  batchId: number | null;
  reason: string;
  logType: string;
  quantityChange: string;
  previousQuantity: string;
  newQuantity: string;
}

export type WriteOffErrorKind =
  | "forbidden"
  | "not_found"
  | "invalid_reason"
  | "invalid_quantity"
  | "batch_required"
  | "expiry_needs_batch"
  | "non_expired"
  | "insufficient"
  | "bad_request"
  | "unknown";

export function canWriteOffStock(
  permissions: ReadonlySet<string> | string[]
): boolean {
  return canAdjustInventory(permissions);
}

export function isWriteOffReason(value: string): value is WriteOffReason {
  return (WRITE_OFF_REASONS as readonly string[]).includes(value);
}

export function buildWriteOffPayload(input: {
  quantity: string | number;
  reason: string;
  batchId?: string | number | null;
}): { quantity: string; reason: WriteOffReason; batch_id?: number } | null {
  const qty = String(input.quantity ?? "").trim();
  if (!qty || Number(qty) <= 0) return null;
  if (!isWriteOffReason(input.reason)) return null;
  const body: { quantity: string; reason: WriteOffReason; batch_id?: number } = {
    quantity: qty,
    reason: input.reason,
  };
  if (input.batchId != null && input.batchId !== "") {
    const batchId = Number(input.batchId);
    if (!Number.isFinite(batchId) || batchId <= 0) return null;
    body.batch_id = batchId;
  }
  return body;
}

export function parseWriteOffResult(data: unknown): WriteOffResult | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.id !== "number" || typeof d.product_id !== "number") return null;
  return {
    id: d.id,
    productId: d.product_id,
    batchId: typeof d.batch_id === "number" ? d.batch_id : null,
    reason: String(d.reason ?? ""),
    logType: String(d.log_type ?? ""),
    quantityChange: String(d.quantity_change ?? ""),
    previousQuantity: String(d.previous_quantity ?? ""),
    newQuantity: String(d.new_quantity ?? ""),
  };
}

export function classifyWriteOffError(
  status?: number,
  error?: string
): WriteOffErrorKind {
  if (status === 404) return "not_found";
  if (status === 403) return "forbidden";
  const msg = error ?? "";
  if (msg === ERR_INVALID_REASON) return "invalid_reason";
  if (msg === ERR_INVALID_QUANTITY) return "invalid_quantity";
  if (msg === ERR_BATCH_REQUIRED) return "batch_required";
  if (msg === ERR_EXPIRY_NEEDS_BATCH) return "expiry_needs_batch";
  if (msg === ERR_NON_EXPIRED) return "non_expired";
  if (msg === ERR_INSUFFICIENT) return "insufficient";
  if (status === 400) return "bad_request";
  return "unknown";
}

export function writeOffErrorMessage(kind: WriteOffErrorKind, fallback?: string): string {
  switch (kind) {
    case "forbidden":
      return "inventory.adjust is required to write off stock.";
    case "not_found":
      return "Product or batch not found in this shop.";
    case "invalid_reason":
      return ERR_INVALID_REASON;
    case "invalid_quantity":
      return ERR_INVALID_QUANTITY;
    case "batch_required":
      return ERR_BATCH_REQUIRED;
    case "expiry_needs_batch":
      return ERR_EXPIRY_NEEDS_BATCH;
    case "non_expired":
      return ERR_NON_EXPIRED;
    case "insufficient":
      return ERR_INSUFFICIENT;
    case "bad_request":
      return fallback || "Write-off request was rejected.";
    default:
      return fallback || "Write-off failed.";
  }
}

export function axiosWriteOffError(err: {
  response?: { status?: number; data?: { error?: string } };
}): { kind: WriteOffErrorKind; message: string } {
  const status = err.response?.status;
  const error = err.response?.data?.error;
  const kind = classifyWriteOffError(status, error);
  return { kind, message: writeOffErrorMessage(kind, error) };
}

export function ledgerReasonQuery(reason?: string | null): string | undefined {
  if (!reason || reason === "all") return undefined;
  return reason;
}

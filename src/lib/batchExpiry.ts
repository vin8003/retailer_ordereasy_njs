/** OE-136 / F-0030 — ProductBatch expiry display/edit (BE RCP #92+). No second FIFO engine. */

export const EXPIRED_BATCH_SALE_MESSAGE = "Expired batches cannot be sold.";
export const FIFO_PICK_HINT =
  "Sales pick the earliest expiry first (undated last). Expired lots cannot be sold.";

export interface ExpiryBatch {
  id?: number;
  expiry_date?: string | null;
  quantity?: number | string;
  is_active?: boolean;
}

export function todayIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Normalize API date to YYYY-MM-DD or empty. */
export function normalizeExpiryDate(value: string | null | undefined): string {
  if (value == null || value === "") return "";
  const text = String(value).trim();
  if (!text) return "";
  return text.slice(0, 10);
}

export function isBatchExpired(
  expiryDate: string | null | undefined,
  today: string = todayIsoDate()
): boolean {
  const day = normalizeExpiryDate(expiryDate);
  if (!day) return false;
  return day < today;
}

/** Active lots that are not past expiry_date. Undated lots stay eligible. */
export function unexpiredBatches<T extends ExpiryBatch>(
  batches: T[],
  today: string = todayIsoDate()
): T[] {
  return batches.filter(
    (b) => b.is_active !== false && !isBatchExpired(b.expiry_date, today)
  );
}

/** Display order matching BE FIFO: earliest dated expiry, nulls last. Not a second engine. */
export function sortBatchesFifo<T extends ExpiryBatch>(batches: T[]): T[] {
  return [...batches].sort((a, b) => {
    const ae = normalizeExpiryDate(a.expiry_date);
    const be = normalizeExpiryDate(b.expiry_date);
    if (!ae && !be) return 0;
    if (!ae) return 1;
    if (!be) return -1;
    return ae.localeCompare(be);
  });
}

export function expiryHint(expiryDate: string | null | undefined): string {
  const day = normalizeExpiryDate(expiryDate);
  if (!day) return "No expiry";
  if (isBatchExpired(day)) return `Expired ${day}`;
  return `Exp ${day}`;
}

export function expiryDateForWrite(value: string | null | undefined): string | null {
  const day = normalizeExpiryDate(value);
  return day || null;
}

export function prepareBatchesForSave<T extends Record<string, unknown>>(
  batches: T[],
  options: { canAdjust: boolean; originalById?: Record<number, string | null> }
): T[] {
  return batches.map((batch) => {
    const copy = { ...batch } as T & { expiry_date?: string | null };
    const id = typeof copy.id === "number" ? copy.id : undefined;
    if (!options.canAdjust) {
      if (id != null && options.originalById && id in options.originalById) {
        copy.expiry_date = options.originalById[id];
      } else {
        delete copy.expiry_date;
      }
      return copy;
    }
    copy.expiry_date = expiryDateForWrite(copy.expiry_date);
    return copy;
  });
}

export function classifyInventoryAdjustError(
  status?: number,
  error?: string
): "forbidden" | "other" {
  if (status === 403) return "forbidden";
  if (/inventory adjust/i.test(error ?? "")) return "forbidden";
  return "other";
}

export function batchExpiryErrorMessage(
  status?: number,
  error?: string
): string | null {
  if (classifyInventoryAdjustError(status, error) === "forbidden") {
    return "inventory.adjust is required to change batch expiry.";
  }
  if (/invalid expiry/i.test(error ?? "")) {
    return "Invalid expiry_date";
  }
  return null;
}

export function axiosBatchExpiryError(err: {
  response?: { status?: number; data?: { error?: string; batches?: unknown } };
}): string | null {
  const status = err.response?.status;
  const data = err.response?.data;
  const error =
    typeof data?.error === "string"
      ? data.error
      : Array.isArray(data?.batches)
        ? String(data?.batches[0])
        : typeof data?.batches === "string"
          ? data.batches
          : undefined;
  return batchExpiryErrorMessage(status, error);
}

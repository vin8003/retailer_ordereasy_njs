/** Optional BE purchase-return list field. */
export type PurchaseReturnLrDisplay = {
    lr_number?: number | string | null;
    /** Allowed on payloads / tests; never used to invent lr_number. */
    id?: number | string | null;
    return_number?: string | null;
    invoice_number?: string | null;
    supplier_name?: string | null;
    notes?: string | null;
    tracking_number?: string | null;
};

/**
 * Compact LR from top-level `lr_number` only.
 * Absent / undefined / null / blank → do not show. Never invent from other fields.
 */
export function getPurchaseReturnLrNumber(row: PurchaseReturnLrDisplay): string | null {
    const raw = row.lr_number;
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "number") {
        return Number.isFinite(raw) ? String(raw) : null;
    }
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        return trimmed === "" ? null : trimmed;
    }
    return null;
}

/** Optional BE purchase-invoice detail field. Display only when API sends `eway_valid_upto`. */
export type PurchaseDetailEwayValidUptoDisplay = {
    eway_valid_upto?: number | string | null;
    /** Allowed on payloads / tests; never used to invent eway_valid_upto. */
    invoice_number?: string | null;
    notes?: string | null;
    bill_image?: string | null;
    payment_status?: string | null;
    supplier_name?: string | null;
    invoice_date?: string | null;
    eway_bill?: number | string | null;
    eway_bill_number?: number | string | null;
    valid_upto?: number | string | null;
    ewb_valid_upto?: number | string | null;
    eway?: { valid_upto?: number | string | null } | null;
};

/**
 * Compact e-way validity from top-level `eway_valid_upto` only.
 * Absent / undefined / null / blank → do not show. Never invent from other fields.
 */
export function getPurchaseDetailEwayValidUpto(
    invoice: PurchaseDetailEwayValidUptoDisplay
): string | null {
    const raw = invoice.eway_valid_upto;
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

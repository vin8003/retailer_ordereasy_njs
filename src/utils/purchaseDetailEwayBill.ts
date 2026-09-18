/** Optional BE purchase-invoice detail field. Display only when API sends `eway_bill`. */
export type PurchaseDetailEwayBillDisplay = {
    eway_bill?: number | string | null;
    /** Allowed on payloads / tests; never used to invent eway_bill. */
    invoice_number?: string | null;
    notes?: string | null;
    bill_image?: string | null;
    payment_status?: string | null;
    supplier_name?: string | null;
    ewb_no?: number | string | null;
    eway_bill_number?: number | string | null;
    eway?: { bill?: number | string | null } | null;
};

/**
 * Compact e-way bill from top-level `eway_bill` only.
 * Absent / undefined / null / blank → do not show. Never invent from other fields.
 */
export function getPurchaseDetailEwayBill(
    invoice: PurchaseDetailEwayBillDisplay
): string | null {
    const raw = invoice.eway_bill;
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

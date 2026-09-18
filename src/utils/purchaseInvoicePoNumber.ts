/** Optional BE purchase-invoice list field (OE-348). */
export type PurchaseInvoicePoNumberDisplay = {
    po_number?: number | string | null;
    /** Allowed on payloads / tests; never used to invent po_number. */
    invoice_number?: string | null;
    notes?: string | null;
    payment_status?: string | null;
    supplier_name?: string | null;
};

/**
 * Compact PO number from top-level `po_number` only.
 * Absent / undefined / null / blank → do not show. Never invent from other fields.
 */
export function getPurchaseInvoicePoNumber(
    invoice: PurchaseInvoicePoNumberDisplay
): string | null {
    const raw = invoice.po_number;
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

/** Optional BE purchase-list `supplier_name` (display probe). Notes remain OE-309. */
export type PurchaseListSupplierNameDisplay = {
    supplier_name?: string | null;
    /** Allowed on payloads / tests; never used to invent supplier_name. */
    invoice_number?: string | null;
    payment_status?: string | null;
    notes?: string | null;
    distributor_name?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact supplier line from top-level `supplier_name` only.
 * Absent / undefined / null / blank → do not show. Never derived from notes or other fields.
 */
export function getPurchaseListSupplierName(
    item: PurchaseListSupplierNameDisplay
): string | null {
    return optionalTrimmedText(item.supplier_name);
}

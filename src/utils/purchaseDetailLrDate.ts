/** Optional BE purchase-invoice detail field. Display only when API sends `lr_date`. */
export type PurchaseDetailLrDateDisplay = {
    lr_date?: string | null;
    /** Allowed on payloads / tests; never used to invent lr_date. */
    invoice_date?: string | null;
    created_at?: string | null;
    dispatch_date?: string | null;
    invoice_number?: string | null;
    notes?: string | null;
    bill_image?: string | null;
    payment_status?: string | null;
    supplier_name?: string | null;
    lr_number?: string | null;
    lr_no?: string | null;
    lr?: { date?: string | null } | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * LR date from top-level `lr_date` only (purchase detail GET).
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getPurchaseDetailLrDate(
    invoice: PurchaseDetailLrDateDisplay
): string | null {
    return optionalTrimmedText(invoice.lr_date);
}

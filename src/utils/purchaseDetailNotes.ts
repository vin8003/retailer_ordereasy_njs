/** Optional BE purchase-invoice detail field (OE-323). */
export type PurchaseDetailNotesDisplay = {
    notes?: string | null;
    /** Allowed on payloads / tests; never used to invent notes. */
    invoice_number?: string | null;
    payment_status?: string | null;
    supplier_name?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Notes text from top-level `notes` only (purchase detail GET).
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getPurchaseDetailNotes(invoice: PurchaseDetailNotesDisplay): string | null {
    return optionalTrimmedText(invoice.notes);
}

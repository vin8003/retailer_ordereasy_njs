/** Optional BE purchase-invoice list field (OE-309). */
export type PurchaseInvoiceNotesDisplay = {
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
 * Compact notes line from top-level `notes` only.
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getPurchaseInvoiceNotes(invoice: PurchaseInvoiceNotesDisplay): string | null {
    return optionalTrimmedText(invoice.notes);
}

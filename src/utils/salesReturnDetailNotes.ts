/** Optional BE sales-return detail field (OE-327). */
export type SalesReturnDetailNotesDisplay = {
    notes?: string | null;
    /** Allowed on payloads / tests; never used to invent notes. */
    reason?: string | null;
    order_number?: string | null;
    customer_name?: string | null;
    return_number?: string | null;
    refund_payment_mode?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Notes text from top-level `notes` only (sales-return detail GET).
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getSalesReturnDetailNotes(
    salesReturn: SalesReturnDetailNotesDisplay
): string | null {
    return optionalTrimmedText(salesReturn.notes);
}

/** Optional BE sales-return list field (OE-336). Detail notes are OE-327. */
export const SALES_RETURN_NOTES_SNIPPET_MAX = 80;

export type SalesReturnListNotesDisplay = {
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
 * Compact list preview from top-level `notes` only.
 * Absent / undefined / null / blank → do not show. Never derived from reason
 * or other fields. Long notes are clipped so the list stays a snippet.
 */
export function getSalesReturnNotesSnippet(
    salesReturn: SalesReturnListNotesDisplay
): string | null {
    const notes = optionalTrimmedText(salesReturn.notes);
    if (!notes) return null;
    if (notes.length <= SALES_RETURN_NOTES_SNIPPET_MAX) return notes;
    return `${notes.slice(0, SALES_RETURN_NOTES_SNIPPET_MAX).trimEnd()}…`;
}

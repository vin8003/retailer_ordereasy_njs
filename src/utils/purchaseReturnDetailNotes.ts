/** Optional BE purchase-return detail field (OE-331). */
export type PurchaseReturnDetailNotesDisplay = {
    notes?: string | null;
    /** Allowed on payloads / tests; never used to invent notes. */
    return_number?: string | null;
    invoice_number?: string | null;
    supplier_name?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Notes text from top-level `notes` only (purchase-return detail GET).
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getPurchaseReturnDetailNotes(
    purchaseReturn: PurchaseReturnDetailNotesDisplay
): string | null {
    return optionalTrimmedText(purchaseReturn.notes);
}

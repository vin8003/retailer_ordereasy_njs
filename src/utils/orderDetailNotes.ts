/** Optional BE retailer order-detail field (OE-325). */
export type OrderDetailNotesDisplay = {
    notes?: string | null;
    /** Allowed on payloads / tests; never used to invent notes. */
    special_instructions?: string | null;
    remark?: string | null;
    feedback?: { comment?: string | null } | null;
    order_number?: string | null;
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
export function getOrderDetailNotes(order: OrderDetailNotesDisplay): string | null {
    return optionalTrimmedText(order.notes);
}

/** Optional BE sales-return list field. List notes stay on OE-336. */
export type SalesReturnCnNumberDisplay = {
    cn_number?: number | string | null;
    /** Allowed on payloads / tests; never used to invent cn_number. */
    id?: number | string | null;
    return_number?: string | null;
    order_number?: string | null;
    customer_name?: string | null;
    reason?: string | null;
    notes?: string | null;
    credit_note_id?: number | string | null;
    credit_note?: { id?: number | string | null; cn_number?: number | string | null } | null;
};

/**
 * Compact credit-note id from top-level `cn_number` only.
 * Absent / undefined / null / blank → do not show. Never invent from other fields.
 */
export function getSalesReturnCnNumberLabel(
    salesReturn: SalesReturnCnNumberDisplay
): string | null {
    const raw = salesReturn.cn_number;
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

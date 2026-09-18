/** Optional BE khata-detail ledger field. Isolated from list notes (OE-333). */
export type KhataDetailReferenceDisplay = {
    reference_no?: number | string | null;
    /** Allowed on payloads / tests; never used to invent reference_no. */
    id?: number | string | null;
    notes?: string | null;
    order_number?: string | null;
    payment_mode?: string | null;
    payment_reference_id?: string | null;
    description?: string | null;
    transaction_type?: string | null;
    amount?: number | string | null;
};

/**
 * Compact reference from top-level `reference_no` only.
 * Absent / undefined / null / blank → do not show. Never invent from other fields.
 */
export function getKhataDetailReferenceNo(
    entry: KhataDetailReferenceDisplay
): string | null {
    const raw = entry.reference_no;
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

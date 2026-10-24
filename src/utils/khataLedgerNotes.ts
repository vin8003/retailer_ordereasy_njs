/** Optional BE khata / credit-ledger list field (OE-333). */
export type KhataLedgerListRow = {
    notes?: string | null;
    /** Allowed on payloads / tests; never used to invent notes. */
    id?: number | string | null;
    order?: number | string | null;
    order_number?: string | null;
    transaction_type?: string | null;
    payment_mode?: string | null;
    amount?: number | string | null;
    balance_after?: number | string | null;
    description?: string | null;
    created_at?: string | null;
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
export function getKhataLedgerNotes(entry: KhataLedgerListRow): string | null {
    return optionalTrimmedText(entry.notes);
}

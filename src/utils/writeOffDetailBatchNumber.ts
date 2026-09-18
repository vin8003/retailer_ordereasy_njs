/** Optional BE write-off / ledger-row scalar. Never invent from other fields. */
export type WriteOffDetailBatchNumberDisplay = {
    batch_number?: string | number | null;
    /** Allowed on payloads / tests; never used to invent batch_number. */
    batch_id?: number | string | null;
    batch?: { batch_number?: string | number | null } | null;
    reason?: string | null;
    product_name?: string | null;
    created_by?: string | null;
    created_by_name?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Batch number from top-level `batch_number` only.
 * Absent / undefined / null / blank / non-finite → do not show.
 * Never derived from `batch_id`, nested `batch`, `reason`, or created-by fields.
 */
export function getWriteOffDetailBatchNumber(
    writeOff: WriteOffDetailBatchNumberDisplay
): string | null {
    const raw = writeOff.batch_number;
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "number") {
        return Number.isFinite(raw) ? String(raw) : null;
    }
    return optionalTrimmedText(raw);
}

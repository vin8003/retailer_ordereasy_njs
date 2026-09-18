/** Optional BE write-off detail scalar (ceiling above OE-326 list reason). */
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
 * Batch number from top-level `batch_number` only (write-off detail GET).
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

function ledgerRowsFromPayload(payload: unknown): unknown[] {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object" && Array.isArray((payload as { results?: unknown }).results)) {
        return (payload as { results: unknown[] }).results;
    }
    return [];
}

/**
 * Find a write-off / ledger row by `id` in the existing inventory-ledger GET payload.
 * Missing id, empty payload, or no matching row → null. Never invents a row or batch_number.
 */
export function pickWriteOffDetailFromLedgerPayload(
    payload: unknown,
    id: string | number | null | undefined
): WriteOffDetailBatchNumberDisplay | null {
    if (id === undefined || id === null) return null;
    const wanted = String(id).trim();
    if (wanted === "") return null;
    const match = ledgerRowsFromPayload(payload).find((row) => {
        if (!row || typeof row !== "object") return false;
        const rowId = (row as { id?: unknown }).id;
        return rowId !== undefined && rowId !== null && String(rowId) === wanted;
    });
    return match && typeof match === "object"
        ? (match as WriteOffDetailBatchNumberDisplay)
        : null;
}

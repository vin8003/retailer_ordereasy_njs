/** Optional BE write-off detail scalar (inspector_name, isolated from list reason / batch_number). */
export type WriteOffDetailInspectorNameDisplay = {
    inspector_name?: string | null;
    /** Allowed on payloads / tests; never used to invent inspector_name. */
    inspector?: { name?: string | null } | null;
    inspector_id?: number | string | null;
    created_by?: string | null;
    created_by_name?: string | null;
    batch_number?: string | number | null;
    reason?: string | null;
    product_name?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Inspector name from top-level `inspector_name` only (write-off detail GET).
 * Absent / undefined / null / blank → do not show.
 * Never derived from nested `inspector`, `inspector_id`, created-by, batch, or reason.
 */
export function getWriteOffDetailInspectorName(
    writeOff: WriteOffDetailInspectorNameDisplay
): string | null {
    return optionalTrimmedText(writeOff.inspector_name);
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
 * Missing id, empty payload, or no matching row → null. Never invents a row or inspector_name.
 */
export function pickWriteOffDetailFromLedgerPayload(
    payload: unknown,
    id: string | number | null | undefined
): WriteOffDetailInspectorNameDisplay | null {
    if (id === undefined || id === null) return null;
    const wanted = String(id).trim();
    if (wanted === "") return null;
    const match = ledgerRowsFromPayload(payload).find((row) => {
        if (!row || typeof row !== "object") return false;
        const rowId = (row as { id?: unknown }).id;
        return rowId !== undefined && rowId !== null && String(rowId) === wanted;
    });
    return match && typeof match === "object"
        ? (match as WriteOffDetailInspectorNameDisplay)
        : null;
}

/** Optional BE write-off detail scalar (`cost_center` if present). */
export type WriteOffDetailCostCenterDisplay = {
    cost_center?: string | number | null;
    /** Allowed on payloads / tests; never used to invent cost_center. */
    id?: number | string | null;
    product_id?: number | string | null;
    reason?: string | null;
    department?: string | null;
    cost_centre?: string | number | null;
    costCenter?: string | number | null;
    cost_center_name?: string | null;
    cost_center_id?: number | string | null;
    gl_code?: string | null;
    cost_center_obj?: { id?: number | string | null; name?: string | null } | null;
    created_by?: string | null;
    created_by_name?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Cost center from top-level `cost_center` only (write-off detail GET).
 * Absent / undefined / null / blank / non-finite → do not show.
 * Never derived from aliases, nested objects, reason, or ids.
 */
export function getWriteOffDetailCostCenter(
    writeOff: WriteOffDetailCostCenterDisplay
): string | null {
    const raw = writeOff.cost_center;
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "number") {
        return Number.isFinite(raw) ? String(raw) : null;
    }
    if (typeof raw === "string") {
        return optionalTrimmedText(raw);
    }
    return null;
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
 * Missing id, empty payload, or no matching row → null. Never invents a row or cost_center.
 */
export function pickWriteOffDetailFromLedgerPayload(
    payload: unknown,
    id: string | number | null | undefined
): WriteOffDetailCostCenterDisplay | null {
    if (id === undefined || id === null) return null;
    const wanted = String(id).trim();
    if (wanted === "") return null;
    const match = ledgerRowsFromPayload(payload).find((row) => {
        if (!row || typeof row !== "object") return false;
        const rowId = (row as { id?: unknown }).id;
        return rowId !== undefined && rowId !== null && String(rowId) === wanted;
    });
    return match && typeof match === "object"
        ? (match as WriteOffDetailCostCenterDisplay)
        : null;
}

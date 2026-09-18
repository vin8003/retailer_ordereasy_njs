/** Optional BE write-off / ledger-row scalar. Isolated from list reason / batch_number. */
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
 * Inspector name from top-level `inspector_name` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from nested `inspector`, `inspector_id`, created-by, batch, or reason.
 */
export function getWriteOffDetailInspectorName(
    writeOff: WriteOffDetailInspectorNameDisplay
): string | null {
    return optionalTrimmedText(writeOff.inspector_name);
}

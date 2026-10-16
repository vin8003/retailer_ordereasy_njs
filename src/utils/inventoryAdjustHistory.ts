/** Optional BE inventory adjust/history row fields. Write-off list is OE-326. */
export type InventoryAdjustHistoryDisplay = {
    reason?: string | null;
    /** Allowed on payloads / tests; never used to invent reason. ProductInventoryLog has no note field. */
    note?: string | null;
    notes?: string | null;
    log_type?: string | null;
    created_by?: string | null;
    quantity_change?: number | string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact reason from top-level `reason` only.
 * Absent / undefined / null / blank → do not show. Never derived from note or other fields.
 */
export function getInventoryAdjustReasonLabel(
    row: InventoryAdjustHistoryDisplay
): string | null {
    return optionalTrimmedText(row.reason);
}

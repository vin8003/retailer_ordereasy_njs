/** Optional BE inventory-ledger row field. Never invent from created_by. */
export type InventoryLedgerCreatedByDisplay = {
    created_by_name?: string | null;
    /** Allowed on payloads / tests; never used to invent created_by_name. */
    created_by?: string | null;
    reason?: string | null;
    log_type?: string | null;
    product_name?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Created-by label from top-level `created_by_name` only (inventory ledger GET).
 * Absent / undefined / null / blank → do not show. Never derived from created_by or other fields.
 */
export function getInventoryLedgerCreatedByName(
    row: InventoryLedgerCreatedByDisplay
): string | null {
    return optionalTrimmedText(row.created_by_name);
}

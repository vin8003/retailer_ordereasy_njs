/** Optional BE inventory-ledger row field (OE-345 / OE-318 batch). */
export type InventoryLedgerWarehouseDisplay = {
    warehouse_name?: string | null;
    /** Allowed on payloads / tests; never used to invent warehouse_name. */
    warehouse_id?: number | string | null;
    warehouse?: { name?: string | null } | null;
    location?: string | null;
    reason?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact warehouse line from top-level `warehouse_name` only.
 * Absent / undefined / null / blank → do not show.
 * Never invent from warehouse_id, nested warehouse, location, or reason.
 */
export function getInventoryLedgerWarehouseNameLabel(
    row: InventoryLedgerWarehouseDisplay
): string | null {
    return optionalTrimmedText(row.warehouse_name);
}

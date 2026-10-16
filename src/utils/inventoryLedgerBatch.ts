/** Optional BE inventory-ledger row field (OE-318). */
export type InventoryLedgerBatchDisplay = {
    batch_id?: number | string | null;
    /** Allowed on payloads / tests; never used to invent batch_id. */
    id?: number | string | null;
    product_id?: number | string | null;
    batch_number?: string | null;
    batch?: { id?: number | string | null } | null;
};

/**
 * Compact batch id from top-level `batch_id` only.
 * Absent / undefined / null / blank → do not show. Never invent from other fields.
 */
export function getInventoryLedgerBatchIdLabel(
    row: InventoryLedgerBatchDisplay
): string | null {
    const raw = row.batch_id;
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

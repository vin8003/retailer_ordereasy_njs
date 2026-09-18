/** Optional BE inventory-ledger row field (OE-318 sibling: bin_code). */
export type InventoryLedgerBinDisplay = {
    bin_code?: number | string | null;
    /** Allowed on payloads / tests; never used to invent bin_code. */
    id?: number | string | null;
    product_id?: number | string | null;
    batch_id?: number | string | null;
    bin?: string | { code?: string | null; id?: number | string | null } | null;
    location?: string | null;
};

/**
 * Compact bin code from top-level `bin_code` only.
 * Absent / undefined / null / blank → do not show. Never invent from other fields.
 */
export function getInventoryLedgerBinCodeLabel(
    row: InventoryLedgerBinDisplay
): string | null {
    const raw = row.bin_code;
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

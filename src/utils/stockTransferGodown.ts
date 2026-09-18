/** Optional BE stock-transfer list field. Isolated from OE-139 full F-0031. */
export type StockTransferGodownDisplay = {
    godown_name?: string | null;
    /** Allowed on payloads / tests; never used to invent godown_name. */
    godown?: { id?: number | string | null; name?: string | null } | null;
    godown_id?: number | string | null;
    location_name?: string | null;
    warehouse_name?: string | null;
    from_godown_name?: string | null;
    to_godown_name?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact godown line from top-level `godown_name` only.
 * Absent / undefined / null / blank → do not show. Never derived from nested
 * godown, ids, warehouse, or from/to godown fields.
 */
export function getStockTransferGodownName(row: StockTransferGodownDisplay): string | null {
    return optionalTrimmedText(row.godown_name);
}

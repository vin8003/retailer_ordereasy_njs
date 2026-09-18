/** Optional BE stock-transfer list field. */
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

/** List row from stock-transfer payloads. `godown_name` is optional; never invent it. */
export type StockTransferListItem = StockTransferGodownDisplay & {
    id: number;
    product_name?: string | null;
    quantity?: number | string | null;
    status?: string | null;
    created_at?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact godown line from top-level `godown_name` only.
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getStockTransferGodownName(row: StockTransferGodownDisplay): string | null {
    return optionalTrimmedText(row.godown_name);
}

/** Pass-through list row. Copies `godown_name` only from the payload; never from nested godown. */
export function mapStockTransferListItem(
    raw: StockTransferListItem & { id?: number }
): StockTransferListItem {
    return {
        id: Number(raw.id),
        product_name: raw.product_name,
        quantity: raw.quantity,
        status: raw.status,
        created_at: raw.created_at,
        godown_name: raw.godown_name,
    };
}

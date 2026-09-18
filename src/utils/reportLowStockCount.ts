/** Optional BE daily-summary scalar on reports (isolated from OE-319 expiring-batches). */
export type ReportsLowStockCountDisplay = {
    low_stock_count?: number | string | null;
    /** Allowed on payloads / tests; never used to invent low_stock_count. */
    order_count?: number | string | null;
    total_sales?: number | string | null;
};

function optionalFiniteNumber(raw: number | string | null | undefined): number | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "string" && raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

/**
 * Compact low-stock count from top-level `low_stock_count` only, including 0.
 * Absent / undefined / null / blank / non-numeric → do not show.
 * Never derived from order_count, total_sales, or other summary fields.
 */
export function getLowStockCountLabel(
    summary: ReportsLowStockCountDisplay
): string | null {
    const value = optionalFiniteNumber(summary.low_stock_count);
    if (value === null) return null;
    const compact = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
    return compact === "1" ? "1 low-stock" : `${compact} low-stock`;
}

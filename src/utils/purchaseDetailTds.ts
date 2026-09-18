/** Optional BE purchase-invoice detail field. */
export type PurchaseDetailTdsDisplay = {
    tds_amount?: number | string | null;
    /** Allowed on payloads / tests; never used to invent tds_amount. */
    total_amount?: number | string | null;
    paid_amount?: number | string | null;
    tax_amount?: number | string | null;
    gst_amount?: number | string | null;
    tds?: number | string | null;
    tds_percent?: number | string | null;
};

function optionalFiniteNumber(raw: number | string | null | undefined): number | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "string" && raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

function formatInr(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Compact INR label from top-level `tds_amount` only, including 0.
 * Absent / undefined / null / blank / non-numeric → do not show.
 * Never derived from totals, tax, `tds`, or `tds_percent`.
 */
export function getPurchaseDetailTdsAmountLabel(
    invoice: PurchaseDetailTdsDisplay
): string | null {
    const value = optionalFiniteNumber(invoice.tds_amount);
    if (value === null) return null;
    return formatInr(value);
}

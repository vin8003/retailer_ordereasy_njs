/** Optional BE supplier-list field. Email display is OE-337 — do not retouch. */
export type SupplierListCreditDaysDisplay = {
    credit_days?: number | string | null;
    /** Allowed on payloads / tests; never used to invent credit_days. */
    email?: string | null;
    payment_terms?: string | null;
    gst_number?: string | null;
    balance_due?: number | string | null;
    credit_due_days?: number | string | null;
};

function optionalFiniteNumber(raw: number | string | null | undefined): number | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "string" && raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

/**
 * Compact due-days label from top-level `credit_days` only, including 0.
 * Absent / undefined / null / blank / non-numeric → do not show.
 * Never derived from email, payment_terms, gst, balance, or credit_due_days.
 */
export function getSupplierCreditDaysLabel(
    supplier: SupplierListCreditDaysDisplay
): string | null {
    const value = optionalFiniteNumber(supplier.credit_days);
    if (value === null) return null;
    return value === 1 ? "1 day" : `${value} days`;
}

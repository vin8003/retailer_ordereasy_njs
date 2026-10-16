/** Optional BE purchase-invoice list field. */
export type PurchaseInvoiceDateDisplay = {
    invoice_date?: string | null;
    /** Allowed on payloads / tests; never used to invent invoice_date. */
    created_at?: string | null;
    return_date?: string | null;
    updated_at?: string | null;
    invoice_number?: string | null;
};

const INVOICE_DATE_FORMAT: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
};

/**
 * Compact invoice date from top-level `invoice_date` only.
 * Absent / undefined / null / blank / invalid → do not show.
 * Never derived from created_at, return_date, or other fields.
 */
export function getPurchaseInvoiceDate(
    invoice: PurchaseInvoiceDateDisplay
): string | null {
    const raw = invoice.invoice_date;
    if (raw === undefined || raw === null) return null;
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString("en-IN", INVOICE_DATE_FORMAT);
}

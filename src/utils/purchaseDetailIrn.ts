/** Optional BE purchase-invoice detail field (IRN display). */
export type PurchaseDetailIrnDisplay = {
    irn?: number | string | null;
    /** Allowed on payloads / tests; never used to invent irn. */
    invoice_number?: string | null;
    notes?: string | null;
    bill_image?: string | null;
    payment_status?: string | null;
    supplier_name?: string | null;
    eway_bill?: number | string | null;
    ack_no?: number | string | null;
    ack_dt?: string | null;
    irn_number?: string | null;
    signed_qr?: string | null;
    e_invoice?: { irn?: string | null } | null;
    einvoice?: { irn?: string | null } | null;
};

/**
 * Compact IRN from top-level `irn` only (purchase detail GET).
 * Absent / undefined / null / blank / non-finite → do not show.
 * Never invented from invoice number, notes, ack, e-way, or nested e-invoice.
 */
export function getPurchaseDetailIrn(invoice: PurchaseDetailIrnDisplay): string | null {
    const raw = invoice.irn;
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

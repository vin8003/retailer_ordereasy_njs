/** Optional BE e-invoice acknowledgement date (thin FE display). */
export type EInvoiceAckDateDisplay = {
    ack_date?: string | null;
    /** Allowed on payloads / tests; never used to invent ack_date. */
    created_at?: string | null;
    invoice_date?: string | null;
    AckDt?: string | null;
    ack_dt?: string | null;
    acknowledgement_date?: string | null;
    irn?: string | null;
    ack_no?: string | number | null;
    e_invoice?: { ack_date?: string | null } | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact ack date from top-level `ack_date` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from created_at, invoice_date, GST aliases, irn, ack_no, or nested e_invoice.
 */
export function getEInvoiceAckDateLabel(
    invoice: EInvoiceAckDateDisplay
): string | null {
    return optionalTrimmedText(invoice.ack_date);
}

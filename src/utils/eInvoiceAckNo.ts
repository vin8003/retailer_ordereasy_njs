/** Optional BE e-invoice acknowledgement number (thin FE display). */
export type EInvoiceAckDisplay = {
    ack_no?: number | string | null;
    /** Allowed on payloads / tests; never used to invent ack_no. */
    irn?: string | null;
    invoice_number?: string | null;
    order_number?: string | null;
    ack_dt?: string | null;
    acknowledgement_number?: string | null;
    AckNo?: number | string | null;
    e_invoice?: EInvoiceAckDisplay | string | null;
};

/**
 * Prefer nested `e_invoice` object when BE sent one.
 * Otherwise use the payload itself. Never invent ack_no.
 */
export function resolveEInvoiceAckSource(payload: EInvoiceAckDisplay): EInvoiceAckDisplay {
    const nested = payload.e_invoice;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        return nested;
    }
    return payload;
}

/**
 * Compact ack number from top-level `ack_no` only.
 * Absent / undefined / null / blank → do not show. Never invent from other fields.
 */
export function getEInvoiceAckNoLabel(row: EInvoiceAckDisplay): string | null {
    const raw = row.ack_no;
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

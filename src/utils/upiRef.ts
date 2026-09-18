/** Optional BE payment/order receipt field. Display only — never invent or feed UPI intent. */
export type UpiRefDisplay = {
    upi_ref?: string | number | null;
    /** Allowed on payloads / tests; never used to invent upi_ref. */
    payment_reference_id?: string | number | null;
    order_number?: string | null;
    payment_mode?: string | null;
};

function optionalTrimmedText(raw: string | number | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = String(raw).trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact UPI ref from top-level `upi_ref` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from payment_reference_id, order_number, or payment_mode.
 */
export function getUpiRefLabel(payment: UpiRefDisplay): string | null {
    return optionalTrimmedText(payment.upi_ref);
}

/** Optional BE payment/order receipt field. Display only — never invent or feed payment write. */
export type ChequeNumberDisplay = {
    cheque_number?: string | number | null;
    /** Allowed on payloads / tests; never used to invent cheque_number. */
    cheque?: { number?: string | number | null } | null;
    cheque_no?: string | number | null;
    check_number?: string | number | null;
    payment_reference_id?: string | number | null;
    order_number?: string | null;
    payment_mode?: string | null;
    notes?: string | null;
    upi_ref?: string | number | null;
};

/**
 * Compact cheque number from top-level `cheque_number` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from cheque, cheque_no, check_number, payment_reference_id, notes, or payment_mode.
 */
export function getChequeNumberLabel(payment: ChequeNumberDisplay): string | null {
    const raw = payment.cheque_number;
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

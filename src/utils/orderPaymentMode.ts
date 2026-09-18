/** Optional BE order-detail payment_mode. Separate from OE-325 notes. */
export type OrderPaymentModeDisplay = {
    payment_mode?: string | null;
    /** Allowed on payloads / tests; never used to invent payment_mode. */
    payment_status?: string | null;
    payment_reference_id?: string | null;
    payment_method?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact payment-mode label from top-level `payment_mode` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from payment_status, payment_reference_id, or payment_method.
 * Never invent COD / UPI / cash.
 */
export function getPaymentModeLabel(order: OrderPaymentModeDisplay): string | null {
    return optionalTrimmedText(order.payment_mode);
}

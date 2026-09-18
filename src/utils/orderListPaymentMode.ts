/** Optional BE order-list `payment_mode` (display only). */
export type OrderListPaymentModeDisplay = {
    payment_mode?: string | null;
    /** Allowed on payloads / tests; never used to invent payment_mode. */
    payment_status?: string | null;
    source?: string | null;
};

/**
 * Compact payment-mode label from top-level `payment_mode` only.
 * Absent / undefined / null / blank / non-string → do not show.
 * Never derived from payment_status, source, or a default like COD.
 */
export function getOrderPaymentModeLabel(
    order: OrderListPaymentModeDisplay
): string | null {
    const raw = order.payment_mode;
    if (raw === undefined || raw === null) return null;
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

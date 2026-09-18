/** Optional BE order-detail totals field. Isolated from OE-307 list fees. */
export type OrderRoundOffDisplay = {
    round_off?: number | string | null;
    /** Allowed on payloads / tests; never used to invent round_off. */
    subtotal?: number | string | null;
    delivery_fee?: number | string | null;
    discount_amount?: number | string | null;
    total_amount?: number | string | null;
    net_amount?: number | string | null;
    rounding?: number | string | null;
    roundoff?: number | string | null;
    adjustment?: number | string | null;
};

function optionalFiniteNumber(raw: number | string | null | undefined): number | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "string" && raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

/**
 * Compact rupee label from top-level `round_off` only, including 0.
 * Absent / undefined / null / blank / non-numeric → do not show.
 * Never derived from totals, delivery_fee, discount_amount, or similarly named keys.
 */
export function getOrderRoundOffLabel(order: OrderRoundOffDisplay): string | null {
    const value = optionalFiniteNumber(order.round_off);
    if (value === null) return null;
    return `₹${value.toFixed(2)}`;
}

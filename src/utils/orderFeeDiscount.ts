/** Optional BE order-list fields for fee/discount display (OE-307 / OE-301). */
export type OrderFeeDiscountDisplay = {
    delivery_fee?: number | string | null;
    discount_amount?: number | string | null;
    /** Allowed on payloads / tests; never used to invent fee or discount. */
    total_amount?: number | string | null;
    net_amount?: number | string | null;
    subtotal?: number | string | null;
};

/**
 * Parse a present numeric amount. Missing / null / blank / 0 / non-finite → null.
 * Never derived from other money fields.
 */
function parseNonZeroAmount(raw: number | string | null | undefined): number | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "string" && raw.trim() === "") return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value === 0) return null;
    return value;
}

function formatRupee(value: number): string {
    const compact = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
    return `₹${compact}`;
}

/**
 * Compact muted fee line when BE sent a numeric `delivery_fee` ≠ 0.
 * Missing / null / 0 / non-numeric → do not show. Never invent.
 */
export function getDeliveryFeeLine(order: OrderFeeDiscountDisplay): string | null {
    const value = parseNonZeroAmount(order.delivery_fee);
    return value === null ? null : `Fee ${formatRupee(value)}`;
}

/**
 * Compact muted discount line when BE sent a numeric `discount_amount` ≠ 0.
 * Missing / null / 0 / non-numeric → do not show. Never invent.
 */
export function getDiscountAmountLine(order: OrderFeeDiscountDisplay): string | null {
    const value = parseNonZeroAmount(order.discount_amount);
    return value === null ? null : `Disc ${formatRupee(value)}`;
}

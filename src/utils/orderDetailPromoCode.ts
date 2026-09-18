/** Optional BE retailer order-detail promo code. */
export type OrderDetailPromoCodeDisplay = {
    promo_code?: string | null;
    /** Allowed on payloads / tests; never used to invent promo_code. */
    coupon?: string | null;
    coupon_code?: string | null;
    discount_code?: string | null;
    applied_offers?: { name?: string | null }[] | null;
    notes?: string | null;
    customer_phone?: string | null;
    promo?: { code?: string | null } | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact promo line from top-level `promo_code` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from coupon, offers, notes, phone, or nested promo.
 */
export function getOrderDetailPromoCode(
    order: OrderDetailPromoCodeDisplay
): string | null {
    return optionalTrimmedText(order.promo_code);
}

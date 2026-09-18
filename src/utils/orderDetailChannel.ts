/** Optional BE retailer order-detail field. Isolated from OE-325 notes / OE-330 phone. */
export type OrderDetailChannelDisplay = {
    channel?: string | null;
    /** Allowed on payloads / tests; never used to invent channel. */
    source?: string | null;
    notes?: string | null;
    customer_phone?: string | null;
    phone?: string | null;
    order_number?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact channel label from top-level `channel` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from source, notes, phone, or order_number.
 */
export function getOrderDetailChannelLabel(
    order: OrderDetailChannelDisplay
): string | null {
    return optionalTrimmedText(order.channel);
}

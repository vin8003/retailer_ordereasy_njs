/** Optional BE retailer order-detail customer phone (OE-330). */
export type OrderCustomerPhoneDisplay = {
    customer?: {
        phone?: string | null;
        first_name?: string | null;
        last_name?: string | null;
    } | null;
    phone?: string | null;
    customer_phone?: string | null;
    /** Allowed on payloads / tests; never used to invent phone. */
    customer_name?: string | null;
    customer_email?: string | null;
    notes?: string | null;
    user?: { phone?: string | null } | null;
    customer_mobile?: string | null;
    guest_mobile?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact phone line from `customer.phone`, then top-level `phone`, then `customer_phone`.
 * Absent / undefined / null / blank → do not show.
 * Never derived from name, email, notes, user.phone, customer_mobile, or guest_mobile.
 */
export function getOrderCustomerPhoneLabel(order: OrderCustomerPhoneDisplay): string | null {
    return (
        optionalTrimmedText(order.customer?.phone) ??
        optionalTrimmedText(order.phone) ??
        optionalTrimmedText(order.customer_phone)
    );
}

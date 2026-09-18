/** Optional BE order-list customer_code (thin FE display). */

export type OrderCustomerCodeDisplay = {
    customer_code?: string | null;
    /** Allowed on payloads / tests; never used to invent customer_code. */
    customer_name?: string | null;
    id?: number | string | null;
    customer?: {
        first_name?: string | null;
        last_name?: string | null;
        username?: string | null;
        customer_code?: string | null;
    } | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact customer-code label from top-level `customer_code` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from customer_name, nested customer, or id.
 */
export function getCustomerCodeLabel(order: OrderCustomerCodeDisplay): string | null {
    return optionalTrimmedText(order.customer_code);
}

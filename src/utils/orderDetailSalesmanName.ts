/** Optional BE retailer order-detail salesman (OE-351). */
export type OrderDetailSalesmanNameDisplay = {
    salesman_name?: string | null;
    /** Allowed on payloads / tests; never used to invent salesman_name. */
    salesman?: { name?: string | null } | null;
    salesman_id?: number | string | null;
    customer_name?: string | null;
    notes?: string | null;
    customer_phone?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact salesman line from top-level `salesman_name` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from nested `salesman`, `salesman_id`, customer, notes, or phone.
 */
export function getOrderDetailSalesmanName(
    order: OrderDetailSalesmanNameDisplay
): string | null {
    return optionalTrimmedText(order.salesman_name);
}

/** Optional BE order-list field. Display-only; never invent. */
export type OrderListRouteNameDisplay = {
    route_name?: string | null;
    /** Allowed on payloads / tests; never used to invent route_name. */
    route?: { name?: string | null } | null;
    route_id?: number | string | null;
    beat_name?: string | null;
    delivery_route?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact route line from top-level `route_name` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from nested `route`, `route_id`, `beat_name`, or `delivery_route`.
 */
export function getOrderListRouteNameLabel(
    order: OrderListRouteNameDisplay
): string | null {
    return optionalTrimmedText(order.route_name);
}

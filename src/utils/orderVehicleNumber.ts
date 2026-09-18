/** Optional BE retailer OFD / order-detail `vehicle_number`. */
export type OrderVehicleNumberDisplay = {
    vehicle_number?: string | null;
    /** Allowed on payloads / tests; never used to invent vehicle_number. */
    driver_name?: string | null;
    route_name?: string | null;
    vehicle?: string | null;
    registration_number?: string | null;
    vehicle_no?: string | null;
    order_number?: string | null;
    status?: string | null;
    special_instructions?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact vehicle line from top-level `vehicle_number` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from driver_name, route_name, vehicle, registration_number, or vehicle_no.
 * Display only — does not affect OFD close-out / status transitions.
 */
export function getOrderVehicleNumberLabel(order: OrderVehicleNumberDisplay): string | null {
    return optionalTrimmedText(order.vehicle_number);
}

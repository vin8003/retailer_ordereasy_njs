/** Optional BE OFD / order-list field. Display only. */
export type OfdVehicleNumberDisplay = {
    vehicle_number?: string | null;
    /** Allowed on payloads / tests; never used to invent vehicle_number. */
    vehicle?: string | null;
    vehicle_no?: string | null;
    driver?: string | null;
    delivery?: { vehicle_number?: string | null; plate?: string | null } | null;
    plate?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact vehicle line from top-level `vehicle_number` only.
 * Absent / undefined / null / blank → do not show.
 * Never invent from `vehicle`, `vehicle_no`, `driver`, nested `delivery`, or `plate`.
 */
export function getOfdVehicleNumberLabel(
    order: OfdVehicleNumberDisplay
): string | null {
    return optionalTrimmedText(order.vehicle_number);
}

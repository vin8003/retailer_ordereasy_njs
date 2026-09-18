/** Optional BE OFD-detail field. Display only — never written on close-out. */
export type OfdVehicleTypeDisplay = {
    vehicle_type?: string | number | null;
    status?: string | null;
    /** Allowed on payloads / tests; never used to invent vehicle_type. */
    vehicle?: { type?: string | null } | null;
    delivery_info?: { vehicle_type?: string | null } | null;
    courier_vehicle?: string | null;
    vehicle_name?: string | null;
    delivery_person_name?: string | null;
};

/**
 * True only for retailer OFD detail (`out_for_delivery`).
 * Close-out / other statuses must not use this surface.
 */
export function isOfdDetailStatus(status?: string | null): boolean {
    return (status ?? "").toLowerCase() === "out_for_delivery";
}

function optionalTrimmedText(raw: string | number | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "number") {
        return Number.isFinite(raw) ? String(raw) : null;
    }
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        return trimmed === "" ? null : trimmed;
    }
    return null;
}

/**
 * Compact vehicle type from top-level `vehicle_type` only.
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getOfdVehicleTypeLabel(order: OfdVehicleTypeDisplay): string | null {
    return optionalTrimmedText(order.vehicle_type);
}

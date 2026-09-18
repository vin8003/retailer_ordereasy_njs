/** Optional BE OFD list-row field. Display only — never invent from other distance/geo fields. */
export type OfdDistanceKmDisplay = {
    distance_km?: number | string | null;
    status?: string | null;
    /** Allowed on payloads / tests; never used to invent distance_km. */
    distance?: number | string | null;
    distance_m?: number | string | null;
    eta_minutes?: number | string | null;
    delivery_radius?: number | string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    delivery_info?: {
        distance_km?: number | string | null;
        distance?: number | string | null;
    } | null;
};

function optionalNonNegativeFiniteNumber(
    raw: number | string | null | undefined
): number | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "string" && raw.trim() === "") return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return null;
    return value;
}

function formatKm(value: number): string {
    const compact = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
    return `${compact} km`;
}

/** True only for out-for-delivery rows (OFD list). Close-out actions are out of scope. */
export function isOutForDeliveryRow(row: OfdDistanceKmDisplay): boolean {
    return (row.status ?? "").toLowerCase() === "out_for_delivery";
}

/**
 * Compact km label from top-level `distance_km` only, including 0.
 * Absent / undefined / null / blank / non-numeric / negative → do not show.
 * Never invent from distance, meters, eta, radius, coords, or nested objects.
 */
export function getOfdDistanceKmLabel(row: OfdDistanceKmDisplay): string | null {
    const value = optionalNonNegativeFiniteNumber(row.distance_km);
    if (value === null) return null;
    return formatKm(value);
}

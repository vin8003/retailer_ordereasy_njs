/** Optional BE OFD list-row field. Display only — never invent from courier nested objects. */
export type OfdDriverNameDisplay = {
    driver_name?: string | null;
    status?: string | null;
    /** Allowed on payloads / tests; never used to invent driver_name. */
    delivery_person_name?: string | null;
    delivery_info?: {
        delivery_person_name?: string | null;
        driver_name?: string | null;
    } | null;
    driver?: { name?: string | null } | null;
    courier?: { name?: string | null } | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/** True only for out-for-delivery rows (OFD list). Close-out actions are out of scope. */
export function isOutForDeliveryRow(row: OfdDriverNameDisplay): boolean {
    return (row.status ?? "").toLowerCase() === "out_for_delivery";
}

/**
 * Compact driver name from top-level `driver_name` only.
 * Absent / undefined / null / blank → do not show. Never invent from other fields.
 */
export function getOfdDriverNameLabel(row: OfdDriverNameDisplay): string | null {
    return optionalTrimmedText(row.driver_name);
}

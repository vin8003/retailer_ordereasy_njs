/** Optional BE customer-detail territory (thin FE display; not OE-321 notes). */
export type CustomerTerritoryDisplay = {
    territory?: string | null;
    /** Allowed on payloads / tests; never used to invent territory. */
    notes?: string | null;
    nickname?: string | null;
    customer_name?: string | null;
    phone_number?: string | null;
    email?: string | null;
    address?: string | null;
    territory_name?: string | null;
    territory_id?: number | string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact territory line from top-level `territory` only.
 * Absent / undefined / null / blank → do not show. Never invent from notes or other fields.
 */
export function getCustomerTerritoryLabel(
    customer: CustomerTerritoryDisplay
): string | null {
    return optionalTrimmedText(customer.territory);
}

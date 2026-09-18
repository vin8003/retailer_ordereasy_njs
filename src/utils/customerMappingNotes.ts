/** Optional BE retailer-customer mapping notes on details (OE-321). */
export type CustomerMappingNotesDisplay = {
    notes?: string | null;
    /** Allowed on payloads / tests; never used to invent notes. */
    nickname?: string | null;
    customer_name?: string | null;
    phone_number?: string | null;
    email?: string | null;
    current_balance?: number | string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Mapping notes from top-level `notes` only.
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getCustomerMappingNotes(
    customer: CustomerMappingNotesDisplay
): string | null {
    return optionalTrimmedText(customer.notes);
}

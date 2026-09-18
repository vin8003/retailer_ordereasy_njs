/** Optional BE supplier-list email (OE-337). GST/terms stay on OE-308 — do not add them here. */
export type SupplierListEmailDisplay = {
    email?: string | null;
    /** Allowed on payloads / tests; never used to invent email. */
    company_name?: string | null;
    contact_person?: string | null;
    phone_number?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact email line from top-level `email` only.
 * Absent / undefined / null / blank → do not show. Never derived from name or phone.
 */
export function getSupplierEmailLabel(supplier: SupplierListEmailDisplay): string | null {
    return optionalTrimmedText(supplier.email);
}

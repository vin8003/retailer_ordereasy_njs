/** Optional BE customer-detail GSTIN (probe isolated from OE-321 notes). */
export type CustomerDetailGstinDisplay = {
    gstin?: string | null;
    /** Allowed on payloads / tests; never used to invent gstin. */
    gst_number?: string | null;
    notes?: string | null;
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
 * GSTIN from top-level `gstin` only.
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getCustomerGstin(customer: CustomerDetailGstinDisplay): string | null {
    return optionalTrimmedText(customer.gstin);
}

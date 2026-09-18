/** Optional BE customer-detail SEZ flag (probe isolated from OE-321 notes / gstin). */
export type CustomerDetailSezFlagDisplay = {
    sez_flag?: boolean | null;
    /** Allowed on payloads / tests; never used to invent sez_flag. */
    gstin?: string | null;
    gst_number?: string | null;
    notes?: string | null;
    is_blacklisted?: boolean | null;
    customer_name?: string | null;
    phone_number?: string | null;
    email?: string | null;
    current_balance?: number | string | null;
    is_sez?: boolean | null;
    sez?: boolean | null;
};

/**
 * Compact "SEZ" label when BE sent `sez_flag === true`.
 * false / absent / undefined / null → do not show. Never invent.
 */
export function getCustomerSezFlagLabel(
    customer: CustomerDetailSezFlagDisplay
): string | null {
    return customer.sez_flag === true ? "SEZ" : null;
}

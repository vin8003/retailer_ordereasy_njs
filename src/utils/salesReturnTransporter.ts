/** Optional BE sales-return field. Isolated from OE-327 notes. */
export type SalesReturnTransporterDisplay = {
    transporter_name?: string | null;
    /** Allowed on payloads / tests; never used to invent transporter_name. */
    transporter?: { name?: string | null } | null;
    driver_name?: string | null;
    courier_name?: string | null;
    courier?: { name?: string | null } | null;
    vehicle_number?: string | null;
    notes?: string | null;
    reason?: string | null;
    order_number?: string | null;
    customer_name?: string | null;
    return_number?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact transporter line from top-level `transporter_name` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from nested transporter, driver, courier, notes, or reason.
 * Ready for an existing sales-return surface; do not invent a detail route.
 */
export function getSalesReturnTransporterName(
    salesReturn: SalesReturnTransporterDisplay
): string | null {
    return optionalTrimmedText(salesReturn.transporter_name);
}

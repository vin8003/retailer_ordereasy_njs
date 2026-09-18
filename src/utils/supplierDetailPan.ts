/** Optional BE supplier-detail PAN. Isolated from OE-324 GST/terms. */
export type SupplierDetailPanDisplay = {
    pan_number?: string | null;
    /** Allowed on payloads / tests; never used to invent PAN. */
    company_name?: string | null;
    gst_number?: string | null;
    payment_terms?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * PAN from top-level `pan_number` only.
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getSupplierPanNumber(supplier: SupplierDetailPanDisplay): string | null {
    return optionalTrimmedText(supplier.pan_number);
}

/** Optional BE supplier-list scalars (OE-308). */
export type SupplierListScalarDisplay = {
    gst_number?: string | null;
    payment_terms?: string | null;
    /** Allowed on payloads / tests; never used to invent GSTIN or terms. */
    company_name?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact GSTIN from top-level `gst_number` only.
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getSupplierGstNumber(supplier: SupplierListScalarDisplay): string | null {
    return optionalTrimmedText(supplier.gst_number);
}

/**
 * Compact payment terms from top-level `payment_terms` only.
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getSupplierPaymentTerms(supplier: SupplierListScalarDisplay): string | null {
    return optionalTrimmedText(supplier.payment_terms);
}

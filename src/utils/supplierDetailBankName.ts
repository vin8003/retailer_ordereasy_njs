/** Optional BE supplier-detail bank_name. Isolated from OE-324 gst/payment_terms. */
export type SupplierDetailBankNameDisplay = {
    bank_name?: string | null;
    /** Allowed on payloads / tests; never used to invent bank_name. */
    company_name?: string | null;
    contact_person?: string | null;
    email?: string | null;
    phone_number?: string | null;
    gst_number?: string | null;
    payment_terms?: string | null;
    bank?: { name?: string | null } | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact bank name from top-level `bank_name` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from company, contact, gst, terms, or nested `bank`.
 */
export function getSupplierBankNameLabel(
    supplier: SupplierDetailBankNameDisplay
): string | null {
    return optionalTrimmedText(supplier.bank_name);
}

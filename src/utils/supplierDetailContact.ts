/** Optional BE supplier-detail contact scalars. Isolated from OE-324 gst/payment_terms. */
export type SupplierDetailContactDisplay = {
    email?: string | null;
    phone_number?: string | null;
    /** Allowed on payloads / tests; never used to invent email or phone. */
    company_name?: string | null;
    contact_person?: string | null;
    gst_number?: string | null;
    payment_terms?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact email line from top-level `email` only.
 * Absent / undefined / null / blank → do not show. Never derived from name, phone, gst, or terms.
 */
export function getSupplierEmailLabel(supplier: SupplierDetailContactDisplay): string | null {
    return optionalTrimmedText(supplier.email);
}

/**
 * Compact phone line from top-level `phone_number` only.
 * Absent / undefined / null / blank → do not show. Never derived from name, email, gst, or terms.
 */
export function getSupplierPhoneLabel(supplier: SupplierDetailContactDisplay): string | null {
    return optionalTrimmedText(supplier.phone_number);
}

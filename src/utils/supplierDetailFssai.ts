/** Optional BE supplier-detail fssai_number. Isolated from OE-324 gst/payment_terms. */
export type SupplierDetailFssaiDisplay = {
    fssai_number?: number | string | null;
    /** Allowed on payloads / tests; never used to invent fssai_number. */
    company_name?: string | null;
    contact_person?: string | null;
    email?: string | null;
    phone_number?: string | null;
    gst_number?: string | null;
    payment_terms?: string | null;
    fssai?: { number?: number | string | null } | null;
    fssai_no?: string | null;
    license_number?: string | null;
};

/**
 * Compact FSSAI number from top-level `fssai_number` only.
 * Absent / undefined / null / blank / non-finite → do not show.
 * Never derived from company, contact, gst, terms, aliases, or nested `fssai`.
 */
export function getSupplierFssaiNumberLabel(
    supplier: SupplierDetailFssaiDisplay
): string | null {
    const raw = supplier.fssai_number;
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "number") {
        return Number.isFinite(raw) ? String(raw) : null;
    }
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        return trimmed === "" ? null : trimmed;
    }
    return null;
}

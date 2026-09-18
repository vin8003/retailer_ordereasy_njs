/** Optional BE purchase-invoice detail field. */
export type PurchaseDetailTransporterGstinDisplay = {
    transporter_gstin?: string | null;
    /** Allowed on payloads / tests; never used to invent transporter_gstin. */
    invoice_number?: string | null;
    notes?: string | null;
    supplier_name?: string | null;
    gst_number?: string | null;
    vehicle_number?: string | null;
    transporter_name?: string | null;
    transporter_id?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Transporter GSTIN from top-level `transporter_gstin` only (purchase detail GET).
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getPurchaseDetailTransporterGstin(
    invoice: PurchaseDetailTransporterGstinDisplay
): string | null {
    return optionalTrimmedText(invoice.transporter_gstin);
}

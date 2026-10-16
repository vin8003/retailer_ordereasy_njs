/** Optional BE purchase-return list field (`invoice_number`). */
export type PurchaseReturnInvoiceDisplay = {
    invoice_number?: string | null;
    /** Allowed on payloads / tests; never used to invent invoice_number. */
    return_number?: string | null;
    supplier_name?: string | null;
    id?: number | string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact against-bill label from top-level `invoice_number` only.
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getPurchaseReturnInvoiceNumber(
    purchaseReturn: PurchaseReturnInvoiceDisplay
): string | null {
    return optionalTrimmedText(purchaseReturn.invoice_number);
}

/** Invoice number from a purchase inventory-log reason, e.g. "Purchase Inward: Invoice #INV-7". */
export function parsePurchaseInvoiceNumberFromText(text?: string | null): string | null {
    if (!text) return null;
    // "Purchase Invoice Deleted: #X" is excluded: that invoice no longer exists.
    const match = String(text).match(/^Purchase (?:Inward|Edit \(Reversal\)|Updated):\s*Invoice\s*#\s*(.+?)\s*$/i);
    return match?.[1] ?? null;
}

export function purchaseDetailsHref(opts: {
    id?: number | string | null;
    invoiceNumber?: string | null;
}): string | null {
    if (opts.id != null && opts.id !== "") {
        return `/dashboard/purchases/edit?id=${opts.id}`;
    }
    if (opts.invoiceNumber) {
        return `/dashboard/purchases/edit?number=${encodeURIComponent(opts.invoiceNumber)}`;
    }
    return null;
}

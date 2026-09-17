/** Optional BE catalog/POS identity fields (OE-292 / OE-287 / OE-290). */
export type ProductIdentityDisplay = {
    brand_name?: string | null;
    barcode?: string | null;
    /** Allowed on payloads / tests; never used to invent brand_name. */
    brand?: { name?: string | null } | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact brand line from top-level `brand_name` only.
 * Absent / undefined / null / blank → do not show. Never derived from nested `brand`.
 */
export function getBrandNameLabel(product: ProductIdentityDisplay): string | null {
    return optionalTrimmedText(product.brand_name);
}

/**
 * Compact barcode label from top-level `barcode` only.
 * Absent / undefined / null / blank → do not show.
 */
export function getBarcodeLabel(product: ProductIdentityDisplay): string | null {
    return optionalTrimmedText(product.barcode);
}

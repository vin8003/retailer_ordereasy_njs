/** Optional BE product-detail identity. `asin` is accepted but never displayed. */
export type ProductDetailExternalSkuDisplay = {
    external_sku?: string | null;
    /** Allowed on payloads / tests; never displayed and never used to invent external_sku. */
    asin?: string | null;
    barcode?: string | null;
    name?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact external SKU from top-level `external_sku` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from `asin` (noop), barcode, or name.
 */
export function getExternalSkuLabel(product: ProductDetailExternalSkuDisplay): string | null {
    return optionalTrimmedText(product.external_sku);
}

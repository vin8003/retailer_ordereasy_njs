/** Optional BE catalog/POS fields for availability display (OE-304). */
export type AvailabilityDisplayProduct = {
    is_available?: boolean | null;
    is_in_stock?: boolean | null;
};

/**
 * Compact "Unavailable" label when BE sent `is_available === false`.
 * true / absent / undefined / null → do not show. Never invent.
 */
export function getUnavailableLabel(product: AvailabilityDisplayProduct): string | null {
    return product.is_available === false ? "Unavailable" : null;
}

/**
 * Compact "Out of stock" label when BE sent `is_in_stock === false`.
 * true / absent / undefined / null → do not show. Never invent.
 */
export function getOutOfStockLabel(product: AvailabilityDisplayProduct): string | null {
    return product.is_in_stock === false ? "Out of stock" : null;
}

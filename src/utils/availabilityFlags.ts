import { hasSaleableQuantity, type StockDisplayProduct } from "./saleableQuantity";

/** Optional BE catalog/POS fields for availability display (OE-304). */
export type AvailabilityDisplayProduct = StockDisplayProduct & {
    is_available?: boolean | null;
    is_in_stock?: boolean | null;
    track_inventory?: boolean | null;
};

/**
 * Compact "Unavailable" label when BE sent `is_available === false`.
 * true / absent / undefined / null → do not show. Never invent.
 */
export function getUnavailableLabel(product: AvailabilityDisplayProduct): string | null {
    return product.is_available === false ? "Unavailable" : null;
}

/**
 * Compact "Out of stock" label. When BE sent `saleable_quantity` for a tracked SKU,
 * it decides (the same number shown beside the badge, so expired-only stock reads 0).
 * Otherwise only `is_in_stock === false`; absent / null → do not show. Never invent.
 */
export function getOutOfStockLabel(product: AvailabilityDisplayProduct): string | null {
    if (product.track_inventory !== false && hasSaleableQuantity(product)) {
        return Number(product.saleable_quantity) <= 0 ? "Out of stock" : null;
    }
    return product.is_in_stock === false ? "Out of stock" : null;
}

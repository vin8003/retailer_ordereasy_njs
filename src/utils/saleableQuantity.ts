/** BE list/POS fields used for sellable stock display (OE-288 / OE-132). */
export type StockDisplayProduct = {
    saleable_quantity?: number | string | null;
    quantity?: number | string | null;
};

/**
 * True when BE sent `saleable_quantity`, including 0.
 * Absent / undefined / null (and empty string) fall back to gross `quantity`.
 * No client-side ATP, reservation, or hold math.
 */
export function hasSaleableQuantity(product: StockDisplayProduct): boolean {
    return (
        product.saleable_quantity !== undefined &&
        product.saleable_quantity !== null &&
        product.saleable_quantity !== ""
    );
}

/** Prefer BE `saleable_quantity` when present; otherwise gross `quantity`. */
export function getDisplayStockQuantity(product: StockDisplayProduct): number {
    if (hasSaleableQuantity(product)) {
        return Number(product.saleable_quantity);
    }
    return Number(product.quantity) || 0;
}

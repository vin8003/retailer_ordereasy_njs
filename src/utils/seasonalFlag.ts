/** Optional BE catalog/POS field for seasonal display (OE-296 / OE-294). */
export type SeasonalDisplayProduct = {
    is_seasonal?: boolean | null;
};

/**
 * Compact "Seasonal" label when BE sent `is_seasonal === true`.
 * false / absent / undefined / null → do not show. Never invent.
 */
export function getSeasonalLabel(product: SeasonalDisplayProduct): string | null {
    return product.is_seasonal === true ? "Seasonal" : null;
}

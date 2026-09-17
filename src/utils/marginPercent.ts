/** BE catalog/POS field used for optional margin display (OE-289 / OE-169 / OE-284). */
export type MarginDisplayProduct = {
    margin_percent?: number | string | null;
};

/**
 * True when BE sent `margin_percent`, including 0.
 * Absent / undefined / null / blank string → do not show a badge.
 * Never derived from purchase_price or selling price.
 */
export function hasMarginPercent(product: MarginDisplayProduct): boolean {
    const raw = product.margin_percent;
    if (raw === undefined || raw === null) return false;
    if (typeof raw === "string" && raw.trim() === "") return false;
    return true;
}

/**
 * Compact label for a present, numeric `margin_percent`.
 * Returns null when the field is omitted or not a finite number — no client-side invent.
 */
export function getMarginPercentLabel(product: MarginDisplayProduct): string | null {
    if (!hasMarginPercent(product)) return null;
    const value = Number(product.margin_percent);
    if (!Number.isFinite(value)) return null;
    const compact = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
    return `${compact}%`;
}

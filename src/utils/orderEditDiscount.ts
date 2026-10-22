/**
 * Order edit discount. App offers are already inside the line prices, and the order's
 * `discount_amount` counts them too, so only the part above those savings is a discount
 * the edit form may subtract again. Same rule as BE OrderModificationSerializer.
 */
export type OrderEditLine = {
    product_price?: number | string | null;
    quantity?: number | string | null;
    total_price?: number | string | null;
};

function toAmount(raw: number | string | null | undefined): number | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "string" && raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

/** Savings inside the loaded lines: list price x quantity above each line total. */
export function offerSavingsInLines(lines: OrderEditLine[]): number {
    let saved = 0;
    for (const line of lines) {
        const listPrice = toAmount(line.product_price);
        const quantity = toAmount(line.quantity);
        const lineTotal = toAmount(line.total_price);
        if (listPrice === null || quantity === null || lineTotal === null) continue;
        saved += Math.max(0, listPrice * quantity - lineTotal);
    }
    return round2(saved);
}

/** The order discount above the offer savings: what the "Additional Discount" field shows. */
export function extraOrderDiscount(
    discountAmount: number | string | null | undefined,
    offerSavings: number
): number {
    return Math.max(0, round2((toAmount(discountAmount) ?? 0) - offerSavings));
}

/** `discount_amount` to save: the loaded offer savings plus the extra discount. */
export function discountAmountToSave(offerSavings: number, extraDiscount: number): number {
    return round2(offerSavings + Math.max(0, extraDiscount || 0));
}

/** Unit price BE gives a line added in the edit: app orders sell at the app list (OE-106). */
export function addedLinePrice(
    product: { price?: number | string | null; app_price?: number | string | null },
    orderSource?: string | null
): number {
    const appPrice = orderSource === "app" ? toAmount(product.app_price) : null;
    return appPrice ?? toAmount(product.price) ?? 0;
}

/** POS batch picking. Expired lots stay on the shelf, but BE refuses to sell them (OE-149). */
export type PosBatchRow = {
    barcode?: string | null;
    is_active?: boolean | null;
    is_expired?: boolean | null;
    original_price?: number | string | null;
};

/** Active and not expired. Uses BE `is_expired` only; never derived from expiry_date. */
export function isSellableBatch(batch: PosBatchRow): boolean {
    return batch.is_active !== false && batch.is_expired !== true;
}

export type PosBatchPick<T> =
    | { kind: "batch"; batch: T }
    | { kind: "choose" }
    | { kind: "expired"; batch: T }
    | { kind: "none" };

/**
 * Which batch a POS add uses: one sellable batch is added directly, several open the
 * picker. A scan of a barcode only an expired lot carries is refused; the product's
 * own barcode is not, since a fresh lot may share it.
 */
export function pickPosBatch<T extends PosBatchRow>(
    batches: T[],
    scanBarcode?: string,
    productBarcode?: string | null
): PosBatchPick<T> {
    const sellable = batches.filter(isSellableBatch);
    if (scanBarcode) {
        const matching = sellable.filter((batch) => batch.barcode === scanBarcode);
        if (matching.length === 1) return { kind: "batch", batch: matching[0] };
        if (matching.length > 1) return { kind: "choose" };
        const expired = batches.find(
            (batch) => batch.barcode === scanBarcode && batch.is_active !== false && batch.is_expired === true
        );
        if (expired && scanBarcode !== productBarcode) return { kind: "expired", batch: expired };
    }
    if (sellable.length === 1) return { kind: "batch", batch: sellable[0] };
    if (sellable.length > 1) return { kind: "choose" };
    return { kind: "none" };
}

/** Batch MRP for display, or null when the batch has none (instead of "₹NaN"). */
export function getBatchMrp(batch: PosBatchRow): number | null {
    const raw = batch.original_price;
    if (raw === undefined || raw === null || raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

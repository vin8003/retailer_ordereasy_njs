/**
 * After a POS bill goes through, the POS takes the sold quantities off its cached product list
 * instead of loading every product again. Untracked products keep their stock, and stock may go
 * below zero, as the API allows for an oversell.
 */
export type PosStockBatch = {
    id: number;
    quantity?: number | string | null;
};

export type PosStockProduct = {
    id: number;
    quantity?: number | string | null;
    saleable_quantity?: number | string | null;
    track_inventory?: boolean | null;
    batches?: PosStockBatch[] | null;
};

export type PosSoldLine = {
    id: number;
    batch_id?: number | null;
    cart_quantity: number | string;
    track_inventory?: boolean | null;
};

function toNumber(value: number | string | null | undefined): number | null {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

/** Same 3-decimal rounding the cart uses for loose quantities. */
function minus<T extends number | string | null | undefined>(stock: T, sold: number): T | number {
    const current = toNumber(stock);
    if (current === null) return stock;
    return Math.round((current - sold) * 1000) / 1000;
}

/** A new list with the sold lines taken off; products not on the bill are the same objects. */
export function applySaleToProducts<P extends PosStockProduct>(products: P[], sold: PosSoldLine[]): P[] {
    const soldByProduct = new Map<number, PosSoldLine[]>();
    for (const line of sold) {
        const qty = toNumber(line.cart_quantity);
        if (line.track_inventory === false || qty === null || qty <= 0) continue;
        soldByProduct.set(line.id, [...(soldByProduct.get(line.id) ?? []), line]);
    }
    if (soldByProduct.size === 0) return products;

    return products.map((product) => {
        const lines = soldByProduct.get(product.id);
        if (!lines || product.track_inventory === false) return product;

        const total = lines.reduce((sum, line) => sum + Number(line.cart_quantity), 0);
        const next: P = {
            ...product,
            quantity: minus(product.quantity, total),
            saleable_quantity: minus(product.saleable_quantity, total),
        } as P;
        if (product.batches) {
            next.batches = product.batches.map((batch) => {
                const fromBatch = lines
                    .filter((line) => line.batch_id === batch.id)
                    .reduce((sum, line) => sum + Number(line.cart_quantity), 0);
                return fromBatch > 0 ? { ...batch, quantity: minus(batch.quantity, fromBatch) } : batch;
            });
        }
        return next;
    });
}

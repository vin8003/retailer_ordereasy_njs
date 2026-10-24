/**
 * Rows of a purchase bill, newest on top: a new product is put first, and adding a product that is
 * already on the bill raises its quantity by one and moves it to the top again.
 */
export type PurchaseBillRow = {
    product: { id: number };
    quantity: number;
    purchase_price: number;
    total: number;
};

export function addOrBumpRow<R extends PurchaseBillRow>(rows: R[], productId: number, newRow: () => R): R[] {
    const existing = rows.find((row) => row.product.id === productId);
    if (!existing) return [newRow(), ...rows];
    const quantity = existing.quantity + 1;
    const bumped: R = { ...existing, quantity, total: quantity * existing.purchase_price };
    return [bumped, ...rows.filter((row) => row !== existing)];
}

/** Hits of the search API first (they are ranked), then cached products it did not return. */
export function mergeSuggestions<T extends { id: number }>(remote: T[], local: T[]): T[] {
    const seen = new Set(remote.map((p) => p.id));
    return [...remote, ...local.filter((p) => !seen.has(p.id))];
}

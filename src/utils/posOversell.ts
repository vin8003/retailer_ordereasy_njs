/**
 * The API lets a POS bill take stock below zero only for a role with `orders.oversell`, and it
 * refuses `allow_negative` from any other role (403) before it looks at stock. So a bill asks for
 * it only when a line goes past the stock the POS shows, not on every bill.
 */
export type PosOversellLine = {
    track_inventory?: boolean | null;
    quantity?: number | string | null;
    cart_quantity: number | string;
};

function toNumber(value: number | string | null | undefined): number | null {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

/** True when a stock-tracked line is billed for more than the stock the POS shows for it. */
export function billOversells(cart: PosOversellLine[]): boolean {
    return cart.some((line) => {
        if (line.track_inventory === false) return false;
        const stock = toNumber(line.quantity);
        const billed = toNumber(line.cart_quantity);
        return stock !== null && billed !== null && billed > stock;
    });
}

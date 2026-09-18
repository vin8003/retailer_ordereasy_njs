/** Optional BE order-list salesman_code (thin FE display). */

export type OrderSalesmanCodeDisplay = {
    salesman_code?: number | string | null;
    /** Allowed on payloads / tests; never used to invent salesman_code. */
    salesman_name?: string | null;
    salesman_id?: number | string | null;
    id?: number | string | null;
    customer_name?: string | null;
    notes?: string | null;
    salesman?: {
        id?: number | string | null;
        code?: string | null;
        name?: string | null;
    } | null;
};

/**
 * Compact salesman code from top-level `salesman_code` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from salesman_name, salesman_id, nested salesman, notes, or id.
 */
export function getSalesmanCodeLabel(order: OrderSalesmanCodeDisplay): string | null {
    const raw = order.salesman_code;
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "number") {
        return Number.isFinite(raw) ? String(raw) : null;
    }
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        return trimmed === "" ? null : trimmed;
    }
    return null;
}

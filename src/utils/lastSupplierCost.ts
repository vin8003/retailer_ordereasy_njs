/** Optional BE last-supplier cost scalars from OE-112 (purchase NEW display, OE-317). */
export type LastSupplierCostRow = {
    supplier_id?: number | string | null;
    supplier_name?: string | null;
    last_cost?: number | string | null;
    invoice_id?: number | string | null;
    invoice_date?: string | null;
    /** Allowed on payloads / tests; never used to invent last_cost. */
    purchase_price?: number | string | null;
};

export type LastSupplierCostsPayload = {
    product_id?: number | string | null;
    suppliers?: LastSupplierCostRow[] | null;
    /** Allowed on payloads / tests; never used to invent last_cost. */
    purchase_price?: number | string | null;
    price?: number | string | null;
};

function optionalFiniteNumber(raw: number | string | null | undefined): number | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "string" && raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

function sameId(
    left: number | string | null | undefined,
    right: number | string | null | undefined
): boolean {
    if (left === undefined || left === null || right === undefined || right === null) {
        return false;
    }
    const a = String(left).trim();
    const b = String(right).trim();
    if (a === "" || b === "") return false;
    return a === b;
}

function formatInr(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Keep a well-formed OE-112 payload. Missing / non-list `suppliers` → null (no invent).
 */
export function parseLastSupplierCostsPayload(
    raw: unknown
): LastSupplierCostsPayload | null {
    if (raw === undefined || raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        return null;
    }
    const data = raw as Record<string, unknown>;
    if (!Array.isArray(data.suppliers)) return null;
    return {
        product_id: data.product_id as LastSupplierCostsPayload["product_id"],
        suppliers: data.suppliers as LastSupplierCostRow[],
    };
}

/**
 * Compact muted hint from top-level `last_cost` for the picked supplier only.
 * Absent / undefined / null / blank / non-numeric → do not show.
 * Never derived from purchase_price or selling price.
 */
export function getLastSupplierCostHint(
    payload: LastSupplierCostsPayload | null | undefined,
    supplierId: number | string | null | undefined
): string | null {
    if (supplierId === undefined || supplierId === null) return null;
    if (typeof supplierId === "string" && supplierId.trim() === "") return null;
    if (!payload || !Array.isArray(payload.suppliers)) return null;

    const row = payload.suppliers.find((entry) => sameId(entry?.supplier_id, supplierId));
    if (!row) return null;

    const value = optionalFiniteNumber(row.last_cost);
    if (value === null) return null;
    return `Last ${formatInr(value)}`;
}

/** HTTP 200 + well-formed body only. 403/404/odd shapes → omit. */
export function lastSupplierCostsFromHttp(
    status: number,
    data: unknown
): LastSupplierCostsPayload | null {
    if (status !== 200) return null;
    return parseLastSupplierCostsPayload(data);
}

export function lastSupplierCostsPath(productId: number | string): string {
    return `/products/erp/products/${productId}/last-supplier-costs/`;
}

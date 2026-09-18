/** Shop-scoped expiring/expired batch list (OE-319 display / OE-210 GET). */

export const DEFAULT_EXPIRING_BATCH_DAYS = 30;

export const EXPIRING_BATCHES_PATH = "/products/erp/expiring-batches/";

export type ExpiringBatchRow = {
    product_name?: string | null;
    batch_number?: string | null;
    expiry_date?: string | null;
    quantity?: number | string | null;
    is_expired?: boolean | null;
};

export type ExpiringBatchesView = "hidden" | "empty" | "rows";

export function buildExpiringBatchesRequest(days: number = DEFAULT_EXPIRING_BATCH_DAYS) {
    return {
        url: EXPIRING_BATCHES_PATH,
        params: { days },
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function optionalText(value: unknown): string | null {
    return typeof value === "string" ? value : value == null ? null : String(value);
}

function optionalQuantity(value: unknown): number | string | null {
    if (typeof value === "number" || typeof value === "string") return value;
    return null;
}

export function parseExpiringBatchesPayload(data: unknown): ExpiringBatchRow[] {
    if (!Array.isArray(data)) return [];
    return data.filter(isRecord).map((row) => ({
        product_name: optionalText(row.product_name),
        batch_number: optionalText(row.batch_number),
        expiry_date: optionalText(row.expiry_date),
        quantity: optionalQuantity(row.quantity),
        is_expired: typeof row.is_expired === "boolean" ? row.is_expired : null,
    }));
}

/**
 * Compact "Expired" label when BE sent `is_expired === true`.
 * false / absent / undefined / null → do not show. Never derived from expiry_date.
 */
export function getExpiredBadgeLabel(row: Pick<ExpiringBatchRow, "is_expired">): string | null {
    return row.is_expired === true ? "Expired" : null;
}

export function isExpiringBatchesAuthDenied(status: number | undefined): boolean {
    return status === 401 || status === 403;
}

export function getExpiringBatchesErrorStatus(error: unknown): number | undefined {
    if (!isRecord(error)) return undefined;
    const response = error.response;
    if (!isRecord(response)) return undefined;
    return typeof response.status === "number" ? response.status : undefined;
}

export function resolveExpiringBatchesView(input: {
    errorStatus?: number;
    batches?: ExpiringBatchRow[] | null;
}): ExpiringBatchesView {
    if (typeof input.errorStatus === "number") return "hidden";
    if (!input.batches || input.batches.length === 0) return "empty";
    return "rows";
}

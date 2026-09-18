/** Ledger GET filters for the write-off / damage list (OE-326). */

/** Canonical write-off / damage reason codes. Matches BE write-off POST. */
export const WRITE_OFF_LIST_REASONS = ["damage", "expiry", "spoilage"] as const;

export type WriteOffListReasonCode = (typeof WRITE_OFF_LIST_REASONS)[number];

export type WriteOffListLedgerQuery = {
    reason: WriteOffListReasonCode;
    product_id?: number;
};

/**
 * Product identity for the list GET. Only an explicit `product_id` query.
 * Never invent from ledger-row `id` or other params.
 */
export function parseWriteOffListProductId(
    raw: string | null | undefined
): number | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = String(raw).trim();
    if (trimmed === "" || !/^\d+$/.test(trimmed)) return null;
    const value = Number(trimmed);
    if (!Number.isSafeInteger(value) || value <= 0) return null;
    return value;
}

export function isWriteOffListReason(
    raw: string | null | undefined
): raw is WriteOffListReasonCode {
    if (raw === undefined || raw === null) return false;
    return (WRITE_OFF_LIST_REASONS as readonly string[]).includes(raw.trim());
}

/**
 * Optional URL `reason` passthrough. Unknown / blank → null (do not invent).
 */
export function parseWriteOffListReason(
    raw: string | null | undefined
): WriteOffListReasonCode | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return isWriteOffListReason(trimmed) ? trimmed : null;
}

/** Keep rows whose `reason` is a write-off / damage code. Never infer from log_type. */
export function isWriteOffListRow(row: { reason?: string | null }): boolean {
    return isWriteOffListReason(row.reason ?? null);
}

/**
 * One ledger GET per reason. BE matches a single `reason` exactly and requires
 * `product_id` or `reason`. Always send reason so sale/purchase rows stay out.
 * `product_id` is included only when already parsed — never invented.
 */
export function buildWriteOffListLedgerQueries(input: {
    productId?: number | null;
    reason?: string | null;
}): WriteOffListLedgerQuery[] {
    const reason = parseWriteOffListReason(input.reason);
    const reasons: WriteOffListReasonCode[] = reason
        ? [reason]
        : [...WRITE_OFF_LIST_REASONS];
    const productId =
        input.productId != null &&
        Number.isSafeInteger(input.productId) &&
        input.productId > 0
            ? input.productId
            : null;

    return reasons.map((code) => {
        const query: WriteOffListLedgerQuery = { reason: code };
        if (productId != null) query.product_id = productId;
        return query;
    });
}

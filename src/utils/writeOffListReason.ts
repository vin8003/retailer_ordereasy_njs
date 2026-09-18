/** Optional BE write-off / damage list field (OE-326). */
export type WriteOffListReasonDisplay = {
    reason?: string | null;
    /** Allowed on payloads / tests; never used to invent reason. */
    log_type?: string | null;
    product_name?: string | null;
    quantity_change?: number | string | null;
};

/** List row from write-off / damage payloads. `reason` is optional; never invent it. */
export type WriteOffListItem = WriteOffListReasonDisplay & {
    id: number;
    created_at?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact reason line from top-level `reason` only.
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getWriteOffListReason(row: WriteOffListReasonDisplay): string | null {
    return optionalTrimmedText(row.reason);
}

/** Pass-through list row. Copies `reason` only from the payload; never from log_type. */
export function mapWriteOffListItem(raw: WriteOffListItem & { id?: number }): WriteOffListItem {
    return {
        id: Number(raw.id),
        product_name: raw.product_name,
        quantity_change: raw.quantity_change,
        log_type: raw.log_type,
        created_at: raw.created_at,
        reason: raw.reason,
    };
}

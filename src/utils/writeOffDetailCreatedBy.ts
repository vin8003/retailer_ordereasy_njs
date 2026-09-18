/** Optional BE write-off / damage detail field (sibling of OE-326 list reason). */
export type WriteOffDetailCreatedByDisplay = {
    created_by_name?: string | null;
    /** Allowed on payloads / tests; never used to invent created_by_name. */
    created_by?: string | null;
    reason?: string | null;
    log_type?: string | null;
    product_name?: string | null;
    quantity_change?: number | string | null;
};

/** Write-off / damage detail payload. `created_by_name` is optional; never invent it. */
export type WriteOffDetailItem = WriteOffDetailCreatedByDisplay & {
    id: number;
    created_at?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Created-by label from top-level `created_by_name` only (write-off detail GET).
 * Absent / undefined / null / blank → do not show. Never derived from created_by or other fields.
 */
export function getWriteOffDetailCreatedByName(
    detail: WriteOffDetailCreatedByDisplay
): string | null {
    return optionalTrimmedText(detail.created_by_name);
}

/** Pass-through detail. Copies `created_by_name` only from the payload; never from created_by. */
export function mapWriteOffDetail(
    raw: WriteOffDetailCreatedByDisplay & { id?: number; created_at?: string | null }
): WriteOffDetailItem {
    return {
        id: Number(raw.id),
        product_name: raw.product_name,
        quantity_change: raw.quantity_change,
        log_type: raw.log_type,
        created_at: raw.created_at,
        created_by: raw.created_by,
        created_by_name: raw.created_by_name,
        reason: raw.reason,
    };
}

/** Unwrap a dummy/API detail payload (object, `{ results }`, or list) without inventing fields. */
export function unwrapWriteOffDetail(data: unknown, id: number): WriteOffDetailItem | null {
    if (data == null) return null;
    if (Array.isArray(data)) {
        const row = data.find((item) => Number((item as { id?: number })?.id) === id);
        return row && typeof row === "object" ? mapWriteOffDetail(row as WriteOffDetailItem) : null;
    }
    if (typeof data !== "object") return null;
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.results)) {
        return unwrapWriteOffDetail(record.results, id);
    }
    if (record.id == null && Number.isFinite(id)) {
        return mapWriteOffDetail({ ...(record as WriteOffDetailCreatedByDisplay), id });
    }
    return mapWriteOffDetail(record as WriteOffDetailItem);
}

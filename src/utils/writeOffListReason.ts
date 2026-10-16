import { isWriteOffListRow } from "./writeOffListQuery";

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
    /** Echoed product identity only. Never invented from ledger-row `id`. */
    product_id?: number | null;
    created_at?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Product identity from top-level `product_id` only.
 * Missing / null / blank / non-positive → do not invent from ledger-row `id`.
 */
export function parseWriteOffListItemProductId(
    raw: number | string | null | undefined
): number | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "string" && raw.trim() === "") return null;
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value <= 0) return null;
    return value;
}

function ledgerRowsFromPayload(payload: unknown): unknown[] {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object" && "results" in payload) {
        const results = (payload as { results?: unknown }).results;
        return Array.isArray(results) ? results : [];
    }
    return [];
}

/**
 * Compact reason line from top-level `reason` only.
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getWriteOffListReason(row: WriteOffListReasonDisplay): string | null {
    return optionalTrimmedText(row.reason);
}

/** Pass-through list row. Copies `reason` and `product_id` only from the payload. */
export function mapWriteOffListItem(
    raw: Omit<WriteOffListItem, "product_id"> & {
        id?: number;
        product_id?: number | string | null;
    }
): WriteOffListItem {
    return {
        id: Number(raw.id),
        product_id:
            raw.product_id === undefined
                ? undefined
                : parseWriteOffListItemProductId(raw.product_id),
        product_name: raw.product_name,
        quantity_change: raw.quantity_change,
        log_type: raw.log_type,
        created_at: raw.created_at,
        reason: raw.reason,
    };
}

/** Flatten ledger payloads, keep write-off/damage reason rows, map without inventing product_id. */
export function collectWriteOffListRows(payloads: unknown[]): WriteOffListItem[] {
    const seen = new Set<number>();
    const items: WriteOffListItem[] = [];
    for (const payload of payloads) {
        for (const raw of ledgerRowsFromPayload(payload)) {
            if (!raw || typeof raw !== "object") continue;
            const row = raw as WriteOffListItem & { reason?: string | null };
            if (!isWriteOffListRow(row)) continue;
            const item = mapWriteOffListItem(row);
            if (!Number.isFinite(item.id) || seen.has(item.id)) continue;
            seen.add(item.id);
            items.push(item);
        }
    }
    return items;
}

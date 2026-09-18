/** Optional BE purchase-return detail field. Display only when API sends `collection_center`. */
export type PurchaseReturnCollectionCenterDisplay = {
    collection_center?: number | string | null;
    /** Allowed on payloads / tests; never used to invent collection_center. */
    notes?: string | null;
    warehouse?: string | null;
    warehouse_name?: string | null;
    depot?: string | null;
    collection_center_name?: string | null;
    collection?: { name?: string | null } | null;
    supplier_name?: string | null;
    invoice_number?: string | null;
    return_number?: string | null;
};

/**
 * Compact collection center from top-level `collection_center` only.
 * Absent / undefined / null / blank → do not show. Never invent from other fields.
 */
export function getPurchaseReturnCollectionCenter(
    returnRecord: PurchaseReturnCollectionCenterDisplay
): string | null {
    const raw = returnRecord.collection_center;
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

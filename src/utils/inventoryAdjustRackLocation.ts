/** Optional BE inventory-adjust history row field (OE-349). */
export type InventoryAdjustRackLocationDisplay = {
    rack_location?: number | string | null;
    /** Allowed on payloads / tests; never used to invent rack_location. */
    rack?: string | null;
    bin?: string | null;
    location?: string | null;
    warehouse_name?: string | null;
    warehouse_id?: number | string | null;
    warehouse?: { name?: string | null; rack_location?: string | null } | null;
    reason?: string | null;
    batch_id?: number | string | null;
};

/**
 * Compact rack location from top-level `rack_location` only.
 * Absent / undefined / null / blank → do not show. Never invent from other fields.
 */
export function getInventoryAdjustRackLocationLabel(
    row: InventoryAdjustRackLocationDisplay
): string | null {
    const raw = row.rack_location;
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

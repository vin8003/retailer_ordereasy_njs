/** Optional BE order-list `beat_name` (display only). */
export type OrderListBeatNameDisplay = {
    beat_name?: string | null;
    /** Allowed on payloads / tests; never used to invent beat_name. */
    beat?: { name?: string | null } | null;
    beat_id?: number | string | null;
    route_name?: string | null;
    route?: string | null;
    area?: string | null;
};

/**
 * Compact beat label from top-level `beat_name` only.
 * Absent / undefined / null / blank / non-string → do not show.
 * Never derived from nested `beat`, `beat_id`, route, or area.
 */
export function getOrderBeatNameLabel(
    order: OrderListBeatNameDisplay
): string | null {
    const raw = order.beat_name;
    if (raw === undefined || raw === null) return null;
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

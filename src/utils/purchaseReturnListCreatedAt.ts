/** Optional BE purchase-return list created_at time. */
export type PurchaseReturnListCreatedAtDisplay = {
    created_at?: string | null;
    /** Allowed on payloads / tests; never used to invent created_at time. */
    return_date?: string | null;
    invoice_date?: string | null;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const HAS_DATE_AND_CLOCK = /\d{4}-\d{2}-\d{2}[T ]\d{1,2}:\d{2}/;

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

function formatIstClockTime(date: Date): string {
    return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
    });
}

/**
 * Compact IST clock time from top-level `created_at` only.
 * Absent / undefined / null / blank / invalid / date-only → do not show.
 * Never derived from return_date or invoice_date.
 */
export function getPurchaseReturnCreatedAtTimeLabel(
    item: PurchaseReturnListCreatedAtDisplay
): string | null {
    const raw = optionalTrimmedText(item.created_at);
    if (!raw) return null;
    if (DATE_ONLY.test(raw) || !HAS_DATE_AND_CLOCK.test(raw)) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return formatIstClockTime(date);
}

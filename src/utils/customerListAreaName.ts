/** Optional BE customer-list area field. Isolated from OE-306 email/credit scalars. */
export type CustomerListAreaDisplay = {
    area_name?: string | null;
    /** Allowed on payloads / tests; never used to invent area_name. */
    address?: string | null;
    city?: string | null;
    locality?: string | null;
    area?: string | { name?: string | null } | null;
    area_id?: number | string | null;
    email?: string | null;
    credit_limit?: number | string | null;
    credit_due_days?: number | string | null;
};

/**
 * Compact area line from top-level `area_name` only.
 * Absent / undefined / null / blank → do not show.
 * Never invent from address, city, locality, nested area, or OE-306 scalars.
 */
export function getCustomerAreaNameLabel(customer: CustomerListAreaDisplay): string | null {
    const raw = customer.area_name;
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

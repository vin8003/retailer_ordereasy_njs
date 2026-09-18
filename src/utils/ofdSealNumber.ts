/** Optional BE retailer OFD / order-detail `seal_number`. Display only. */
export type OfdSealNumberDisplay = {
    seal_number?: number | string | null;
    /** Allowed on payloads / tests; never used to invent seal_number. */
    seal?: string | null;
    seal_no?: string | null;
    seal_id?: number | string | null;
    security_seal?: string | null;
    vehicle_number?: string | null;
    driver_name?: string | null;
    tracking_number?: string | null;
    awb?: string | null;
    order_number?: string | null;
    status?: string | null;
    special_instructions?: string | null;
    nested_seal?: { number?: string | null } | null;
};

/**
 * Compact seal line from top-level `seal_number` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from seal, seal_no, seal_id, security_seal, vehicle, driver, or tracking.
 * Display only — does not affect OFD close-out / status transitions.
 */
export function getOfdSealNumberLabel(order: OfdSealNumberDisplay): string | null {
    const raw = order.seal_number;
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

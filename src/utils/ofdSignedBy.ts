/** Optional BE OFD-close field. Display only — never written on close-out. */
export type OfdSignedByDisplay = {
    signed_by?: string | number | null;
    status?: string | null;
    delivery_mode?: string | null;
    /** Allowed on payloads / tests; never used to invent signed_by. */
    signed_by_name?: string | null;
    signer?: string | null;
    signature?: string | null;
    received_by?: string | null;
    receiver_name?: string | null;
    pod_signed_by?: string | null;
    delivery_info?: { signed_by?: string | null } | null;
    customer_name?: string | null;
    driver_name?: string | null;
    delivery_person_name?: string | null;
};

/**
 * True for retailer OFD close display: delivery-mode `out_for_delivery` or `delivered`.
 * Pickup and earlier statuses must not use this surface.
 */
export function isOfdCloseDisplay(
    status?: string | null,
    deliveryMode?: string | null
): boolean {
    const s = (status ?? "").toLowerCase();
    const mode = (deliveryMode ?? "delivery").toLowerCase();
    if (mode !== "delivery") return false;
    return s === "out_for_delivery" || s === "delivered";
}

function optionalTrimmedText(raw: string | number | null | undefined): string | null {
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

/**
 * Compact signer from top-level `signed_by` only.
 * Absent / undefined / null / blank → do not show. Never derived from other fields.
 */
export function getOfdSignedByLabel(order: OfdSignedByDisplay): string | null {
    return optionalTrimmedText(order.signed_by);
}

/** Optional BE retailer OFD / order-detail `awb_number`. */
export type OrderAwbNumberDisplay = {
    awb_number?: string | null;
    /** Allowed on payloads / tests; never used to invent awb_number. */
    tracking_number?: string | null;
    tracking_id?: string | null;
    awb?: string | null;
    waybill?: string | null;
    waybill_number?: string | null;
    consignment_number?: string | null;
    courier_awb?: string | null;
    order_number?: string | null;
    vehicle_number?: string | null;
    driver_name?: string | null;
    status?: string | null;
    delivery_info?: { awb_number?: string | null } | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Compact AWB line from top-level `awb_number` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from tracking, waybill, nested delivery_info, or other shipment fields.
 * Display only — does not affect OFD close-out / status transitions.
 */
export function getOrderAwbNumberLabel(order: OrderAwbNumberDisplay): string | null {
    return optionalTrimmedText(order.awb_number);
}

/** Optional BE OFD list-row field. Display only — never invent from aliases or nested objects. */
export type OfdGatePassDisplay = {
    gate_pass?: number | string | null;
    status?: string | null;
    /** Allowed on payloads / tests; never used to invent gate_pass. */
    gate_pass_number?: string | null;
    gatepass?: string | null;
    pass_number?: string | null;
    challan_no?: string | null;
    vehicle_number?: string | null;
    driver_name?: string | null;
    delivery_info?: { gate_pass?: number | string | null } | null;
    special_instructions?: string | null;
    order_number?: string | null;
};

function optionalTrimmedText(raw: string | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/** True only for out-for-delivery rows (OFD list). Close-out actions are out of scope. */
export function isOutForDeliveryRow(row: OfdGatePassDisplay): boolean {
    return (row.status ?? "").toLowerCase() === "out_for_delivery";
}

/**
 * Compact gate pass from top-level `gate_pass` only.
 * Absent / undefined / null / blank → do not show. Never invent from other fields.
 */
export function getOfdGatePassLabel(row: OfdGatePassDisplay): string | null {
    const raw = row.gate_pass;
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "number") {
        return Number.isFinite(raw) ? String(raw) : null;
    }
    if (typeof raw === "string") {
        return optionalTrimmedText(raw);
    }
    return null;
}

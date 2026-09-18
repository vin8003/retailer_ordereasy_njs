/** Cart-line / product payload that may carry optional top-level `scheme_name`. */
export type PosCartLineSchemeSource = {
    scheme_name?: string | null;
    /** Allowed on payloads / tests; never used to invent scheme_name. */
    name?: string | null;
    brand_name?: string | null;
    offer_name?: string | null;
    scheme_id?: number | string | null;
    scheme?: { name?: string | null } | null;
};

/**
 * Optional scheme copied onto a POS cart line from top-level `scheme_name` only.
 * Absent / undefined / null / blank → do not show.
 * Never derived from nested `scheme`, `scheme_id`, `offer_name`, `brand_name`, or `name`.
 */
export function pickPosCartLineSchemeName(item: PosCartLineSchemeSource): string | null {
    const raw = item.scheme_name;
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * Delivery fee settings for the profile page (flat or distance tiers).
 *
 * The backend (retailers/delivery_pricing.py) prices orders; previewDeliveryFee
 * mirrors it so the retailer can see what a customer at a given distance pays.
 */

export type DeliveryFeeMode = 'flat' | 'distance';

/** One editable band. Strings so half-typed numbers survive re-renders. */
export interface DeliveryFeeTierRow {
    upToKm: string;
    fee: string;
}

export interface DeliveryFeeConfig {
    mode: DeliveryFeeMode;
    tiers: DeliveryFeeTierRow[];
    perKm: number;
    flatCharge: number;
    radiusKm: number;
}

export const MAX_DELIVERY_FEE_TIERS = 10;

export function parseDeliveryFeeMode(raw: unknown): DeliveryFeeMode {
    return raw === 'distance' ? 'distance' : 'flat';
}

/** API tiers ([{up_to_km, fee}], strings or numbers) to editable rows. */
export function tiersFromApi(raw: unknown): DeliveryFeeTierRow[] {
    let list = raw;
    if (typeof list === 'string') {
        try {
            list = JSON.parse(list);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(list)) return [];
    return list
        .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
        .map(t => ({
            upToKm: t.up_to_km == null ? '' : String(Number(t.up_to_km)),
            fee: t.fee == null ? '' : String(Number(t.fee)),
        }));
}

function toNumber(value: string): number | null {
    if (value == null || String(value).trim() === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/**
 * First problem with the distance settings, or null when they can be saved.
 * Same rules as the backend serializer, so most mistakes never leave the page.
 */
export function validateDeliveryFeeSettings(
    mode: DeliveryFeeMode,
    tiers: DeliveryFeeTierRow[],
    perKm: number,
): string | null {
    if (mode !== 'distance') return null;
    if (tiers.length > MAX_DELIVERY_FEE_TIERS) {
        return `At most ${MAX_DELIVERY_FEE_TIERS} distance tiers are allowed.`;
    }
    const seen = new Set<number>();
    for (let i = 0; i < tiers.length; i += 1) {
        const upTo = toNumber(tiers[i].upToKm);
        const fee = toNumber(tiers[i].fee);
        if (upTo == null || upTo <= 0 || upTo > 500) {
            return `Tier ${i + 1}: enter a distance between 0 and 500 km.`;
        }
        if (fee == null || fee < 0) {
            return `Tier ${i + 1}: enter a fee of 0 or more.`;
        }
        const key = Math.round(upTo * 100);
        if (seen.has(key)) return `Two tiers end at ${upTo} km.`;
        seen.add(key);
    }
    if (!Number.isFinite(perKm) || perKm < 0) return 'Per-km rate must be 0 or more.';
    if (tiers.length === 0 && !(perKm > 0)) {
        return 'Add at least one distance tier or a per-km rate.';
    }
    return null;
}

/** Rows sorted by distance, as the JSON string the multipart profile form sends. */
export function tiersToPayload(tiers: DeliveryFeeTierRow[]): string {
    const clean = tiers
        .map(t => ({ up_to_km: toNumber(t.upToKm), fee: toNumber(t.fee) }))
        .filter((t): t is { up_to_km: number; fee: number } => t.up_to_km != null && t.fee != null)
        .sort((a, b) => a.up_to_km - b.up_to_km);
    return JSON.stringify(clean);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Fee before the free-delivery threshold for a customer `km` away, or null
 * when that is beyond the radius. Mirrors quote_delivery on the backend.
 */
export function previewDeliveryFee(config: DeliveryFeeConfig, km: number): number | null {
    const d = round2(km);
    const radius = config.radiusKm > 0 ? config.radiusKm : 5;
    if (d > radius) return null;
    if (config.mode !== 'distance') return round2(config.flatCharge || 0);

    const bands = config.tiers
        .map(t => ({ upTo: toNumber(t.upToKm), fee: toNumber(t.fee) }))
        .filter((t): t is { upTo: number; fee: number } => t.upTo != null && t.upTo > 0 && t.fee != null && t.fee >= 0)
        .sort((a, b) => a.upTo - b.upTo);

    for (const band of bands) {
        if (d <= band.upTo) return round2(band.fee);
    }
    const last = bands.length ? bands[bands.length - 1] : { upTo: 0, fee: config.flatCharge || 0 };
    if (config.perKm > 0) {
        const extraKm = Math.ceil(round2(d - last.upTo));
        return round2(last.fee + extraKm * config.perKm);
    }
    return round2(last.fee);
}

/** Distances worth showing in the preview: each band end plus a couple past the last. */
export function previewDistances(config: DeliveryFeeConfig): number[] {
    const radius = config.radiusKm > 0 ? config.radiusKm : 5;
    const ends = config.tiers
        .map(t => toNumber(t.upToKm))
        .filter((n): n is number => n != null && n > 0 && n <= radius);
    const lastEnd = ends.length ? Math.max(...ends) : 0;
    const extra = [lastEnd + 1, radius].filter(n => n > lastEnd && n <= radius);
    return Array.from(new Set([...ends, ...extra].map(round2))).sort((a, b) => a - b).slice(0, 6);
}

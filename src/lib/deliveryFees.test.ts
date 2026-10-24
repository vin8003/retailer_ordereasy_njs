import { describe, expect, it } from 'vitest';
import {
    DeliveryFeeConfig,
    parseDeliveryFeeMode,
    previewDeliveryFee,
    previewDistances,
    tiersFromApi,
    tiersToPayload,
    validateDeliveryFeeSettings,
} from './deliveryFees';

const config = (over: Partial<DeliveryFeeConfig> = {}): DeliveryFeeConfig => ({
    mode: 'distance',
    tiers: [
        { upToKm: '2', fee: '20' },
        { upToKm: '5', fee: '35' },
    ],
    perKm: 8,
    flatCharge: 25,
    radiusKm: 10,
    ...over,
});

describe('tiersFromApi', () => {
    it('reads backend strings and numbers', () => {
        expect(tiersFromApi([{ up_to_km: '2.00', fee: '20.00' }, { up_to_km: 5, fee: 35 }])).toEqual([
            { upToKm: '2', fee: '20' },
            { upToKm: '5', fee: '35' },
        ]);
    });

    it('tolerates missing or malformed values', () => {
        expect(tiersFromApi(null)).toEqual([]);
        expect(tiersFromApi('not json')).toEqual([]);
        expect(tiersFromApi('[{"up_to_km":"1.50","fee":"10.00"}]')).toEqual([{ upToKm: '1.5', fee: '10' }]);
    });
});

describe('parseDeliveryFeeMode', () => {
    it('defaults to flat', () => {
        expect(parseDeliveryFeeMode('distance')).toBe('distance');
        expect(parseDeliveryFeeMode(undefined)).toBe('flat');
        expect(parseDeliveryFeeMode('weird')).toBe('flat');
    });
});

describe('validateDeliveryFeeSettings', () => {
    it('accepts flat mode whatever the tiers', () => {
        expect(validateDeliveryFeeSettings('flat', [{ upToKm: '', fee: '' }], 0)).toBeNull();
    });

    it('accepts a valid distance setup', () => {
        expect(validateDeliveryFeeSettings('distance', config().tiers, 8)).toBeNull();
        expect(validateDeliveryFeeSettings('distance', [], 5)).toBeNull();
    });

    it('needs a tier or a per-km rate', () => {
        expect(validateDeliveryFeeSettings('distance', [], 0)).toMatch(/at least one/);
    });

    it('flags bad rows', () => {
        expect(validateDeliveryFeeSettings('distance', [{ upToKm: '0', fee: '10' }], 0)).toMatch(/Tier 1/);
        expect(validateDeliveryFeeSettings('distance', [{ upToKm: '3', fee: '-1' }], 0)).toMatch(/Tier 1/);
        expect(validateDeliveryFeeSettings('distance', [{ upToKm: '3', fee: '' }], 0)).toMatch(/Tier 1/);
        expect(
            validateDeliveryFeeSettings('distance', [{ upToKm: '3', fee: '1' }, { upToKm: '3.00', fee: '2' }], 0),
        ).toMatch(/Two tiers/);
        expect(validateDeliveryFeeSettings('distance', [{ upToKm: '3', fee: '1' }], -2)).toMatch(/Per-km/);
    });
});

describe('tiersToPayload', () => {
    it('sorts by distance and sends numbers', () => {
        expect(JSON.parse(tiersToPayload([{ upToKm: '5', fee: '35' }, { upToKm: '1.5', fee: '10' }]))).toEqual([
            { up_to_km: 1.5, fee: 10 },
            { up_to_km: 5, fee: 35 },
        ]);
    });
});

describe('previewDeliveryFee (mirrors the backend quote)', () => {
    it.each([
        [0.5, 20],
        [2, 20],
        [2.01, 35],
        [5, 35],
        [5.2, 43],
        [6, 43],
        [7.5, 59],
        [10, 75],
    ])('%s km costs %s', (km, fee) => {
        expect(previewDeliveryFee(config(), km)).toBe(fee);
    });

    it('is null beyond the radius', () => {
        expect(previewDeliveryFee(config(), 10.01)).toBeNull();
    });

    it('holds the last band without a per-km rate', () => {
        expect(previewDeliveryFee(config({ perKm: 0 }), 8)).toBe(35);
    });

    it('counts per-km from the shop on top of the flat charge without bands', () => {
        expect(previewDeliveryFee(config({ tiers: [], perKm: 5 }), 3.2)).toBe(45);
    });

    it('uses the flat charge in flat mode', () => {
        expect(previewDeliveryFee(config({ mode: 'flat' }), 9)).toBe(25);
    });

    it('treats a zero radius as 5 km', () => {
        expect(previewDeliveryFee(config({ radiusKm: 0 }), 5)).toBe(35);
        expect(previewDeliveryFee(config({ radiusKm: 0 }), 5.5)).toBeNull();
    });
});

describe('previewDistances', () => {
    it('lists band ends, one km past the last and the radius', () => {
        expect(previewDistances(config())).toEqual([2, 5, 6, 10]);
    });
});

import { describe, expect, it } from "vitest";
import { getOfdDistanceKmLabel, isOutForDeliveryRow } from "./ofdDistanceKm";

describe("getOfdDistanceKmLabel", () => {
    it("returns a compact km label when BE sent a present non-negative distance_km", () => {
        expect(getOfdDistanceKmLabel({ distance_km: 2.4 })).toBe("2.4 km");
        expect(getOfdDistanceKmLabel({ distance_km: "3.50" })).toBe("3.5 km");
        expect(getOfdDistanceKmLabel({ distance_km: 12 })).toBe("12 km");
        expect(getOfdDistanceKmLabel({ distance_km: "8" })).toBe("8 km");
        expect(getOfdDistanceKmLabel({ distance_km: 0 })).toBe("0 km");
        expect(getOfdDistanceKmLabel({ distance_km: "0" })).toBe("0 km");
    });

    it("returns null when distance_km is omitted, null, or blank", () => {
        expect(getOfdDistanceKmLabel({})).toBeNull();
        expect(getOfdDistanceKmLabel({ distance_km: undefined })).toBeNull();
        expect(getOfdDistanceKmLabel({ distance_km: null })).toBeNull();
        expect(getOfdDistanceKmLabel({ distance_km: "" })).toBeNull();
        expect(getOfdDistanceKmLabel({ distance_km: "   " })).toBeNull();
    });

    it("does not invent distance_km from distance, meters, eta, radius, coords, or nested delivery_info", () => {
        expect(
            getOfdDistanceKmLabel({
                distance: 4.2,
                distance_m: 4200,
                eta_minutes: 18,
                delivery_radius: 5,
                latitude: 28.61,
                longitude: 77.21,
                delivery_info: { distance_km: 9.9, distance: 9.9 },
                distance_km: null,
            })
        ).toBeNull();
    });

    it("returns null for non-numeric, negative, or non-finite distance_km", () => {
        expect(getOfdDistanceKmLabel({ distance_km: "n/a" })).toBeNull();
        expect(getOfdDistanceKmLabel({ distance_km: -1 })).toBeNull();
        expect(getOfdDistanceKmLabel({ distance_km: Number.NaN })).toBeNull();
        expect(getOfdDistanceKmLabel({ distance_km: Number.POSITIVE_INFINITY })).toBeNull();
    });
});

describe("isOutForDeliveryRow", () => {
    it("is true only for out_for_delivery status (any case)", () => {
        expect(isOutForDeliveryRow({ status: "out_for_delivery" })).toBe(true);
        expect(isOutForDeliveryRow({ status: "OUT_FOR_DELIVERY" })).toBe(true);
    });

    it("is false when status is missing or not OFD", () => {
        expect(isOutForDeliveryRow({})).toBe(false);
        expect(isOutForDeliveryRow({ status: null })).toBe(false);
        expect(isOutForDeliveryRow({ status: "pending" })).toBe(false);
        expect(isOutForDeliveryRow({ status: "delivered" })).toBe(false);
        expect(isOutForDeliveryRow({ status: "packed" })).toBe(false);
    });
});

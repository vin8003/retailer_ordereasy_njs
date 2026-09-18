import { describe, expect, it } from "vitest";
import { getOfdDriverNameLabel, isOutForDeliveryRow } from "./ofdDriverName";

describe("getOfdDriverNameLabel", () => {
    it("returns the trimmed driver_name when BE sent a non-empty string", () => {
        expect(getOfdDriverNameLabel({ driver_name: "Ravi Kumar" })).toBe("Ravi Kumar");
        expect(getOfdDriverNameLabel({ driver_name: "  Anita  " })).toBe("Anita");
    });

    it("returns null when driver_name is omitted, null, or blank", () => {
        expect(getOfdDriverNameLabel({})).toBeNull();
        expect(getOfdDriverNameLabel({ driver_name: undefined })).toBeNull();
        expect(getOfdDriverNameLabel({ driver_name: null })).toBeNull();
        expect(getOfdDriverNameLabel({ driver_name: "" })).toBeNull();
        expect(getOfdDriverNameLabel({ driver_name: "   " })).toBeNull();
    });

    it("does not invent driver_name from delivery_person_name, nested delivery_info, driver, or courier", () => {
        expect(
            getOfdDriverNameLabel({
                delivery_person_name: "Hidden Courier",
                delivery_info: { delivery_person_name: "Nested Courier", driver_name: "Nested Driver" },
                driver: { name: "Nested Driver" },
                courier: { name: "Nested Courier" },
                driver_name: null,
            })
        ).toBeNull();
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

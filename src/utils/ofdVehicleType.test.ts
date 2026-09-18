import { describe, expect, it } from "vitest";
import { getOfdVehicleTypeLabel, isOfdDetailStatus } from "./ofdVehicleType";

describe("isOfdDetailStatus", () => {
    it("is true only for out_for_delivery", () => {
        expect(isOfdDetailStatus("out_for_delivery")).toBe(true);
        expect(isOfdDetailStatus("OUT_FOR_DELIVERY")).toBe(true);
        expect(isOfdDetailStatus("Out_For_Delivery")).toBe(true);
    });

    it("is false for missing, blank, or non-OFD statuses", () => {
        expect(isOfdDetailStatus()).toBe(false);
        expect(isOfdDetailStatus(null)).toBe(false);
        expect(isOfdDetailStatus("")).toBe(false);
        expect(isOfdDetailStatus("packed")).toBe(false);
        expect(isOfdDetailStatus("delivered")).toBe(false);
        expect(isOfdDetailStatus("pending")).toBe(false);
    });
});

describe("getOfdVehicleTypeLabel", () => {
    it("returns the trimmed vehicle_type when BE sent a present non-empty value", () => {
        expect(getOfdVehicleTypeLabel({ vehicle_type: "bike" })).toBe("bike");
        expect(getOfdVehicleTypeLabel({ vehicle_type: "  scooter  " })).toBe("scooter");
        expect(getOfdVehicleTypeLabel({ vehicle_type: "van" })).toBe("van");
        expect(getOfdVehicleTypeLabel({ vehicle_type: 0 })).toBe("0");
        expect(getOfdVehicleTypeLabel({ vehicle_type: "0" })).toBe("0");
    });

    it("returns null when vehicle_type is omitted, null, or blank", () => {
        expect(getOfdVehicleTypeLabel({})).toBeNull();
        expect(getOfdVehicleTypeLabel({ vehicle_type: undefined })).toBeNull();
        expect(getOfdVehicleTypeLabel({ vehicle_type: null })).toBeNull();
        expect(getOfdVehicleTypeLabel({ vehicle_type: "" })).toBeNull();
        expect(getOfdVehicleTypeLabel({ vehicle_type: "   " })).toBeNull();
    });

    it("does not invent vehicle_type from nested vehicle, delivery_info, or courier fields", () => {
        expect(
            getOfdVehicleTypeLabel({
                vehicle: { type: "bike" },
                delivery_info: { vehicle_type: "scooter" },
                courier_vehicle: "van",
                vehicle_name: "Honda Activa",
                delivery_person_name: "Ravi",
                vehicle_type: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric vehicle_type", () => {
        expect(getOfdVehicleTypeLabel({ vehicle_type: Number.NaN })).toBeNull();
        expect(getOfdVehicleTypeLabel({ vehicle_type: Number.POSITIVE_INFINITY })).toBeNull();
    });
});

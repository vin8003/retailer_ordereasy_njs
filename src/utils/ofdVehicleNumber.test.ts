import { describe, expect, it } from "vitest";
import { getOfdVehicleNumberLabel } from "./ofdVehicleNumber";

describe("getOfdVehicleNumberLabel", () => {
    it("returns the trimmed vehicle_number when BE sent a non-empty string", () => {
        expect(getOfdVehicleNumberLabel({ vehicle_number: "MH12AB1234" })).toBe("MH12AB1234");
        expect(getOfdVehicleNumberLabel({ vehicle_number: "  DL01CD5678  " })).toBe("DL01CD5678");
    });

    it("returns null when vehicle_number is omitted, null, or blank", () => {
        expect(getOfdVehicleNumberLabel({})).toBeNull();
        expect(getOfdVehicleNumberLabel({ vehicle_number: undefined })).toBeNull();
        expect(getOfdVehicleNumberLabel({ vehicle_number: null })).toBeNull();
        expect(getOfdVehicleNumberLabel({ vehicle_number: "" })).toBeNull();
        expect(getOfdVehicleNumberLabel({ vehicle_number: "   " })).toBeNull();
    });

    it("does not invent vehicle_number from vehicle, vehicle_no, driver, nested delivery, or plate", () => {
        expect(
            getOfdVehicleNumberLabel({
                vehicle: "MH00XX0000",
                vehicle_no: "KA01AA1111",
                driver: "Ravi",
                delivery: { vehicle_number: "TN09ZZ9999", plate: "WB02YY2222" },
                plate: "GJ03TT3333",
                vehicle_number: null,
            })
        ).toBeNull();
    });
});

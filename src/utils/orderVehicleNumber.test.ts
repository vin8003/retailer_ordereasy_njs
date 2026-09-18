import { describe, expect, it } from "vitest";
import { getOrderVehicleNumberLabel } from "./orderVehicleNumber";

describe("getOrderVehicleNumberLabel", () => {
    it("returns the trimmed vehicle_number when BE sent a non-empty string", () => {
        expect(getOrderVehicleNumberLabel({ vehicle_number: "MH12AB1234" })).toBe("MH12AB1234");
        expect(getOrderVehicleNumberLabel({ vehicle_number: "  DL01C 4455  " })).toBe("DL01C 4455");
    });

    it("returns null when vehicle_number is omitted, null, or blank", () => {
        expect(getOrderVehicleNumberLabel({})).toBeNull();
        expect(getOrderVehicleNumberLabel({ vehicle_number: undefined })).toBeNull();
        expect(getOrderVehicleNumberLabel({ vehicle_number: null })).toBeNull();
        expect(getOrderVehicleNumberLabel({ vehicle_number: "" })).toBeNull();
        expect(getOrderVehicleNumberLabel({ vehicle_number: "   " })).toBeNull();
    });

    it("does not invent vehicle_number from driver, route, or other vehicle-like fields", () => {
        expect(
            getOrderVehicleNumberLabel({
                driver_name: "Ravi",
                route_name: "North-1",
                vehicle: "MH12AB1234",
                registration_number: "KA03D9999",
                vehicle_no: "TN09X1001",
                order_number: "OE-1001",
                status: "out_for_delivery",
                special_instructions: "Use the van",
            })
        ).toBeNull();
    });
});

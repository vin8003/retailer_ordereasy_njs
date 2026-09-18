import { describe, expect, it } from "vitest";
import { getOrderAwbNumberLabel } from "./orderAwbNumber";

describe("getOrderAwbNumberLabel", () => {
    it("returns the trimmed awb_number when BE sent a non-empty string", () => {
        expect(getOrderAwbNumberLabel({ awb_number: "AWB123456789" })).toBe("AWB123456789");
        expect(getOrderAwbNumberLabel({ awb_number: "  BLUEDART-998877  " })).toBe("BLUEDART-998877");
        expect(getOrderAwbNumberLabel({ awb_number: "0" })).toBe("0");
    });

    it("returns null when awb_number is omitted, null, or blank", () => {
        expect(getOrderAwbNumberLabel({})).toBeNull();
        expect(getOrderAwbNumberLabel({ awb_number: undefined })).toBeNull();
        expect(getOrderAwbNumberLabel({ awb_number: null })).toBeNull();
        expect(getOrderAwbNumberLabel({ awb_number: "" })).toBeNull();
        expect(getOrderAwbNumberLabel({ awb_number: "   " })).toBeNull();
    });

    it("does not invent awb_number from tracking, nested delivery_info, or other shipment fields", () => {
        expect(
            getOrderAwbNumberLabel({
                tracking_number: "TRK-999",
                tracking_id: "TID-888",
                awb: "NESTED-AWB",
                waybill: "WB-777",
                waybill_number: "WB-666",
                consignment_number: "CN-555",
                courier_awb: "COURIER-444",
                order_number: "OE-1001",
                vehicle_number: "MH12AB1234",
                driver_name: "Ravi",
                status: "out_for_delivery",
                delivery_info: { awb_number: "NESTED-INFO-AWB" },
            })
        ).toBeNull();
    });
});

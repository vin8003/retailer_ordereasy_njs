import { describe, expect, it } from "vitest";
import { getOfdGatePassLabel, isOutForDeliveryRow } from "./ofdGatePass";

describe("getOfdGatePassLabel", () => {
    it("returns the gate_pass text when BE sent a present non-empty value", () => {
        expect(getOfdGatePassLabel({ gate_pass: "GP-1042" })).toBe("GP-1042");
        expect(getOfdGatePassLabel({ gate_pass: "  GP-88  " })).toBe("GP-88");
        expect(getOfdGatePassLabel({ gate_pass: 42 })).toBe("42");
        expect(getOfdGatePassLabel({ gate_pass: 0 })).toBe("0");
        expect(getOfdGatePassLabel({ gate_pass: "0" })).toBe("0");
    });

    it("returns null when gate_pass is omitted, null, or blank", () => {
        expect(getOfdGatePassLabel({})).toBeNull();
        expect(getOfdGatePassLabel({ gate_pass: undefined })).toBeNull();
        expect(getOfdGatePassLabel({ gate_pass: null })).toBeNull();
        expect(getOfdGatePassLabel({ gate_pass: "" })).toBeNull();
        expect(getOfdGatePassLabel({ gate_pass: "   " })).toBeNull();
    });

    it("does not invent gate_pass from aliases, nested delivery_info, vehicle, or order_number", () => {
        expect(
            getOfdGatePassLabel({
                gate_pass_number: "GP-HIDDEN",
                gatepass: "GP-ALIAS",
                pass_number: "PASS-9",
                challan_no: "CH-1",
                vehicle_number: "MH12AB1234",
                driver_name: "Ravi Kumar",
                delivery_info: { gate_pass: "NESTED-GP" },
                special_instructions: "Show gate pass at booth",
                order_number: "OE-1001",
                gate_pass: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric gate_pass", () => {
        expect(getOfdGatePassLabel({ gate_pass: Number.NaN })).toBeNull();
        expect(getOfdGatePassLabel({ gate_pass: Number.POSITIVE_INFINITY })).toBeNull();
    });

    it("returns null for non-scalar gate_pass values", () => {
        expect(getOfdGatePassLabel({ gate_pass: true as unknown as string })).toBeNull();
        expect(getOfdGatePassLabel({ gate_pass: {} as unknown as string })).toBeNull();
        expect(getOfdGatePassLabel({ gate_pass: [] as unknown as string })).toBeNull();
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

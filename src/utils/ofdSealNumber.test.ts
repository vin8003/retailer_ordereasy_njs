import { describe, expect, it } from "vitest";
import { getOfdSealNumberLabel } from "./ofdSealNumber";

describe("getOfdSealNumberLabel", () => {
    it("returns the seal_number text when BE sent a present non-empty value", () => {
        expect(getOfdSealNumberLabel({ seal_number: "SL-1001" })).toBe("SL-1001");
        expect(getOfdSealNumberLabel({ seal_number: "  SEAL-88  " })).toBe("SEAL-88");
        expect(getOfdSealNumberLabel({ seal_number: 42 })).toBe("42");
        expect(getOfdSealNumberLabel({ seal_number: "0" })).toBe("0");
        expect(getOfdSealNumberLabel({ seal_number: 0 })).toBe("0");
    });

    it("returns null when seal_number is omitted, null, or blank", () => {
        expect(getOfdSealNumberLabel({})).toBeNull();
        expect(getOfdSealNumberLabel({ seal_number: undefined })).toBeNull();
        expect(getOfdSealNumberLabel({ seal_number: null })).toBeNull();
        expect(getOfdSealNumberLabel({ seal_number: "" })).toBeNull();
        expect(getOfdSealNumberLabel({ seal_number: "   " })).toBeNull();
    });

    it("does not invent seal_number from sibling OFD or seal-like fields", () => {
        expect(
            getOfdSealNumberLabel({
                seal: "NESTED",
                seal_no: "SN-9",
                seal_id: 77,
                security_seal: "SEC-1",
                vehicle_number: "MH12AB1234",
                driver_name: "Ravi",
                tracking_number: "TRK-1",
                awb: "AWB-1",
                order_number: "OE-1001",
                status: "out_for_delivery",
                special_instructions: "Seal the crate",
                nested_seal: { number: "NEST-2" },
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric seal_number", () => {
        expect(getOfdSealNumberLabel({ seal_number: Number.NaN })).toBeNull();
        expect(getOfdSealNumberLabel({ seal_number: Number.POSITIVE_INFINITY })).toBeNull();
    });
});

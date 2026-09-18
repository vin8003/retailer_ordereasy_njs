import { describe, expect, it } from "vitest";
import { getUpiRefLabel } from "./upiRef";

describe("getUpiRefLabel", () => {
    it("returns the trimmed upi_ref when BE sent a non-empty value", () => {
        expect(getUpiRefLabel({ upi_ref: "AXIS123456789012" })).toBe("AXIS123456789012");
        expect(getUpiRefLabel({ upi_ref: "  123456789012  " })).toBe("123456789012");
        expect(getUpiRefLabel({ upi_ref: 123456789012 })).toBe("123456789012");
    });

    it("returns null when upi_ref is omitted, null, or blank", () => {
        expect(getUpiRefLabel({})).toBeNull();
        expect(getUpiRefLabel({ upi_ref: undefined })).toBeNull();
        expect(getUpiRefLabel({ upi_ref: null })).toBeNull();
        expect(getUpiRefLabel({ upi_ref: "" })).toBeNull();
        expect(getUpiRefLabel({ upi_ref: "   " })).toBeNull();
    });

    it("does not invent upi_ref from payment_reference_id, order_number, or payment_mode", () => {
        expect(
            getUpiRefLabel({
                payment_reference_id: "HIDDENUTR0001",
                order_number: "OE-POS101",
                payment_mode: "upi",
            })
        ).toBeNull();
        expect(
            getUpiRefLabel({
                payment_reference_id: "HIDDENUTR0001",
                order_number: "OE-POS101",
                payment_mode: "upi",
                upi_ref: null,
            })
        ).toBeNull();
    });
});

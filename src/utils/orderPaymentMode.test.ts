import { describe, expect, it } from "vitest";
import { getPaymentModeLabel } from "./orderPaymentMode";

describe("getPaymentModeLabel", () => {
    it("returns the trimmed payment_mode when BE sent a non-empty string", () => {
        expect(getPaymentModeLabel({ payment_mode: "upi" })).toBe("upi");
        expect(getPaymentModeLabel({ payment_mode: "  cash  " })).toBe("cash");
        expect(getPaymentModeLabel({ payment_mode: "COD" })).toBe("COD");
    });

    it("returns null when payment_mode is omitted, null, or blank", () => {
        expect(getPaymentModeLabel({})).toBeNull();
        expect(getPaymentModeLabel({ payment_mode: undefined })).toBeNull();
        expect(getPaymentModeLabel({ payment_mode: null })).toBeNull();
        expect(getPaymentModeLabel({ payment_mode: "" })).toBeNull();
        expect(getPaymentModeLabel({ payment_mode: "   " })).toBeNull();
    });

    it("does not invent payment_mode from status, reference, or payment_method", () => {
        expect(
            getPaymentModeLabel({
                payment_status: "paid",
                payment_reference_id: "123456789012",
                payment_method: "upi",
                payment_mode: null,
            })
        ).toBeNull();
    });

    it("does not invent COD or UPI when the field is absent", () => {
        expect(getPaymentModeLabel({ payment_status: "pending" })).toBeNull();
    });
});

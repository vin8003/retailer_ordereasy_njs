import { describe, expect, it } from "vitest";
import { getOrderPaymentModeLabel } from "./orderListPaymentMode";

describe("getOrderPaymentModeLabel", () => {
    it("returns the trimmed payment_mode when BE sent a non-empty string", () => {
        expect(getOrderPaymentModeLabel({ payment_mode: "cash" })).toBe("cash");
        expect(getOrderPaymentModeLabel({ payment_mode: "UPI" })).toBe("UPI");
        expect(getOrderPaymentModeLabel({ payment_mode: "  credit  " })).toBe("credit");
    });

    it("returns null when payment_mode is omitted, null, or blank", () => {
        expect(getOrderPaymentModeLabel({})).toBeNull();
        expect(getOrderPaymentModeLabel({ payment_mode: undefined })).toBeNull();
        expect(getOrderPaymentModeLabel({ payment_mode: null })).toBeNull();
        expect(getOrderPaymentModeLabel({ payment_mode: "" })).toBeNull();
        expect(getOrderPaymentModeLabel({ payment_mode: "   " })).toBeNull();
    });

    it("does not invent payment_mode from payment_status or source", () => {
        expect(
            getOrderPaymentModeLabel({
                payment_status: "paid",
                source: "pos",
                payment_mode: null,
            })
        ).toBeNull();
        expect(
            getOrderPaymentModeLabel({
                payment_status: "COD",
                source: "app",
            })
        ).toBeNull();
    });

    it("returns null for non-string present values", () => {
        expect(
            getOrderPaymentModeLabel({
                payment_mode: 0 as unknown as string,
            })
        ).toBeNull();
    });
});

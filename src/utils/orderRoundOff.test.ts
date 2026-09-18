import { describe, expect, it } from "vitest";
import { getOrderRoundOffLabel } from "./orderRoundOff";

describe("getOrderRoundOffLabel", () => {
    it("formats a present numeric round_off as order-total rupees, including 0", () => {
        expect(getOrderRoundOffLabel({ round_off: 0.36 })).toBe("₹0.36");
        expect(getOrderRoundOffLabel({ round_off: "0.40" })).toBe("₹0.40");
        expect(getOrderRoundOffLabel({ round_off: -0.25 })).toBe("₹-0.25");
        expect(getOrderRoundOffLabel({ round_off: 0 })).toBe("₹0.00");
        expect(getOrderRoundOffLabel({ round_off: "0" })).toBe("₹0.00");
    });

    it("returns null when round_off is omitted, null, or blank", () => {
        expect(getOrderRoundOffLabel({})).toBeNull();
        expect(getOrderRoundOffLabel({ round_off: undefined })).toBeNull();
        expect(getOrderRoundOffLabel({ round_off: null })).toBeNull();
        expect(getOrderRoundOffLabel({ round_off: "" })).toBeNull();
        expect(getOrderRoundOffLabel({ round_off: "   " })).toBeNull();
    });

    it("does not invent round_off from totals, fees, or similarly named keys", () => {
        expect(
            getOrderRoundOffLabel({
                subtotal: 99.64,
                delivery_fee: 20,
                discount_amount: 0.4,
                total_amount: 119.24,
                net_amount: 119,
                rounding: 0.36,
                roundoff: 0.36,
                adjustment: 0.36,
                round_off: null,
            })
        ).toBeNull();
    });

    it("returns null for non-numeric present values", () => {
        expect(getOrderRoundOffLabel({ round_off: "n/a" })).toBeNull();
        expect(getOrderRoundOffLabel({ round_off: Number.NaN })).toBeNull();
        expect(getOrderRoundOffLabel({ round_off: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
